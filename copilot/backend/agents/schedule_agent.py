"""
ATLAS Capital Delivery - Schedule Optimizer Agent

Analyzes schedule risk, critical path, and predicts delays.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class ScheduleOptimizer:
    """
    Agent responsible for schedule analysis and risk prediction.
    
    Capabilities:
    - Critical path analysis
    - Slip probability assessment
    - Milestone tracking
    - Schedule compression recommendations
    """
    
    def __init__(self, snowflake_service):
        self.sf = snowflake_service
    
    async def analyze_schedule(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Analyze schedule health and risk."""
        activities = self.sf.get_activities(project_id=project_id)
        at_risk = self.sf.get_at_risk_activities(threshold=0.5)
        
        # Summary stats
        total = len(activities)
        critical = [a for a in activities if a.get("IS_CRITICAL")]
        high_risk = [a for a in activities if (a.get("SLIP_PROBABILITY") or 0) > 0.5]
        
        # Calculate average completion
        avg_complete = sum(a.get("PERCENT_COMPLETE", 0) or 0 for a in activities) / total if total > 0 else 0
        
        # Group by phase
        by_phase = {}
        for a in activities:
            phase = a.get("PHASE") or "UNKNOWN"
            if phase not in by_phase:
                by_phase[phase] = {"count": 0, "complete": 0, "at_risk": 0}
            by_phase[phase]["count"] += 1
            if (a.get("PERCENT_COMPLETE") or 0) == 100:
                by_phase[phase]["complete"] += 1
            if (a.get("SLIP_PROBABILITY") or 0) > 0.5:
                by_phase[phase]["at_risk"] += 1
        
        scope_title = f"Project {project_id}" if project_id else "Portfolio"
        
        narrative = f"""## 📅 Schedule Analysis - {scope_title}

### Overall Status
- **Total Activities**: {total}
- **Critical Path Activities**: {len(critical)}
- **Average Completion**: {avg_complete:.1f}%
- **High-Risk Activities**: {len(high_risk)} (>50% slip probability)

### By Phase
| Phase | Activities | Complete | At Risk |
|-------|------------|----------|---------|
"""
        
        phase_order = ["DESIGN", "PROCUREMENT", "CONSTRUCTION", "COMMISSIONING"]
        for phase in phase_order:
            if phase in by_phase:
                data = by_phase[phase]
                pct = (data['complete'] / data['count'] * 100) if data['count'] > 0 else 0
                narrative += f"| {phase} | {data['count']} | {data['complete']} ({pct:.0f}%) | {data['at_risk']} |\n"
        
        if high_risk:
            narrative += "\n### ⚠️ Activities at Risk of Delay\n"
            for a in high_risk[:5]:
                slip_prob = a.get("SLIP_PROBABILITY", 0) or 0
                slip_days = a.get("PREDICTED_SLIP_DAYS", 0) or 0
                narrative += f"- **{a.get('ACTIVITY_NAME')}** ({a.get('PROJECT_NAME', 'Unknown')})\n"
                narrative += f"  - Slip Probability: {slip_prob*100:.0f}%, Predicted Delay: {slip_days} days\n"
                narrative += f"  - Current Progress: {a.get('PERCENT_COMPLETE', 0):.0f}%\n"
        
        return {
            "narrative": narrative,
            "data": {
                "activities": activities[:50],
                "at_risk": at_risk,
                "by_phase": by_phase,
                "total": total,
                "critical_count": len(critical),
                "high_risk_count": len(high_risk),
                "avg_completion": avg_complete
            },
            "sources": ["ATOMIC.PROJECT_ACTIVITY", "ML.SCHEDULE_RISK_PREDICTIONS"]
        }
    
    async def get_critical_path(self, project_id: str) -> Dict[str, Any]:
        """Get critical path activities for a project."""
        activities = self.sf.get_activities(project_id=project_id, critical_only=True)
        
        if not activities:
            return {
                "narrative": f"No critical path activities found for project {project_id}.",
                "data": {},
                "sources": []
            }
        
        # Sort by planned finish
        activities.sort(key=lambda x: x.get("PLANNED_FINISH") or "9999-99-99")
        
        # Calculate total critical path risk
        high_risk = [a for a in activities if (a.get("SLIP_PROBABILITY") or 0) > 0.5]
        max_slip = max((a.get("PREDICTED_SLIP_DAYS") or 0 for a in activities), default=0)
        
        narrative = f"""## 🎯 Critical Path Analysis - {project_id}

### Overview
- **Critical Activities**: {len(activities)}
- **At High Risk**: {len(high_risk)}
- **Maximum Predicted Slip**: {max_slip} days

### Critical Path Sequence
"""
        
        for i, a in enumerate(activities[:15]):
            status = "✅" if (a.get("PERCENT_COMPLETE") or 0) == 100 else \
                     "🔴" if (a.get("SLIP_PROBABILITY") or 0) > 0.7 else \
                     "🟡" if (a.get("SLIP_PROBABILITY") or 0) > 0.3 else "🟢"
            
            narrative += f"{i+1}. {status} **{a.get('ACTIVITY_NAME')}**\n"
            narrative += f"   - Finish: {a.get('PLANNED_FINISH')}, Progress: {a.get('PERCENT_COMPLETE', 0):.0f}%\n"
            if (a.get("SLIP_PROBABILITY") or 0) > 0.3:
                narrative += f"   - ⚠️ Slip Risk: {a.get('SLIP_PROBABILITY', 0)*100:.0f}%\n"
        
        return {
            "narrative": narrative,
            "data": {
                "activities": activities,
                "high_risk_count": len(high_risk),
                "max_predicted_slip": max_slip
            },
            "sources": ["ATOMIC.PROJECT_ACTIVITY"]
        }
    
    async def get_milestone_status(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Get milestone status and predictions."""
        activities = self.sf.get_activities(project_id=project_id)
        
        # Filter to milestones (activities with 0 duration or type MILESTONE)
        milestones = [a for a in activities 
                      if a.get("ACTIVITY_TYPE") == "MILESTONE" 
                      or "milestone" in (a.get("ACTIVITY_NAME") or "").lower()
                      or "completion" in (a.get("ACTIVITY_NAME") or "").lower()]
        
        narrative = """## 🏁 Milestone Status

| Project | Milestone | Planned | Progress | Risk |
|---------|-----------|---------|----------|------|
"""
        
        for m in milestones[:20]:
            risk = "🔴" if (m.get("SLIP_PROBABILITY") or 0) > 0.5 else "🟡" if (m.get("SLIP_PROBABILITY") or 0) > 0.2 else "🟢"
            narrative += f"| {m.get('PROJECT_NAME', 'N/A')[:20]} | {m.get('ACTIVITY_NAME', 'N/A')[:30]} | {m.get('PLANNED_FINISH')} | {m.get('PERCENT_COMPLETE', 0):.0f}% | {risk} |\n"
        
        return {
            "narrative": narrative,
            "data": {
                "milestones": milestones
            },
            "sources": ["ATOMIC.PROJECT_ACTIVITY"]
        }
