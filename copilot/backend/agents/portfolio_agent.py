"""
ATLAS Capital Delivery - Portfolio Watchdog Agent

Monitors portfolio health, KPIs, and project status.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class PortfolioWatchdog:
    """
    Agent responsible for portfolio-level monitoring and insights.
    
    Capabilities:
    - Portfolio KPI summary
    - Project health assessment
    - Contingency tracking
    - Alert generation
    """
    
    def __init__(self, snowflake_service):
        self.sf = snowflake_service
    
    async def get_portfolio_overview(self) -> Dict[str, Any]:
        """Get comprehensive portfolio overview."""
        summary = self.sf.get_portfolio_summary()
        projects = self.sf.get_projects()
        
        # Calculate alerts
        critical_projects = [p for p in projects if p.get("RISK_LEVEL") == "critical"]
        high_risk_projects = [p for p in projects if p.get("RISK_LEVEL") == "high"]
        
        # Format budget for display
        total_budget = summary.get("TOTAL_BUDGET", 0) or 0
        contingency_used = summary.get("CONTINGENCY_USED", 0) or 0
        total_contingency = summary.get("TOTAL_CONTINGENCY", 0) or 0
        
        narrative = f"""## 📊 Portfolio Status

### Overall Health
- **{summary.get('TOTAL_PROJECTS', 12)} active projects** with total value of **${total_budget/1e9:.2f}B**
- **Average CPI**: {summary.get('AVG_CPI', 0):.3f} {'✅' if summary.get('AVG_CPI', 0) >= 0.95 else '⚠️'}
- **Average SPI**: {summary.get('AVG_SPI', 0):.3f} {'✅' if summary.get('AVG_SPI', 0) >= 0.95 else '⚠️'}

### Contingency Status
- **Contingency Remaining**: ${(total_contingency - contingency_used)/1e6:.1f}M of ${total_contingency/1e6:.1f}M
- **Burn Rate**: {(contingency_used/total_contingency*100) if total_contingency > 0 else 0:.1f}%

### Risk Summary
- **{len(critical_projects)} critical** projects requiring immediate attention
- **{len(high_risk_projects)} high-risk** projects on watch list
- **{summary.get('PROJECTS_OVER_BUDGET', 0)} projects over budget** (CPI < 0.95)
- **{summary.get('PROJECTS_BEHIND_SCHEDULE', 0)} projects behind schedule** (SPI < 0.95)
"""
        
        if critical_projects:
            narrative += "\n### ⚠️ Critical Projects\n"
            for p in critical_projects[:3]:
                narrative += f"- **{p.get('PROJECT_NAME')}**: CPI {p.get('CPI', 0):.2f}, SPI {p.get('SPI', 0):.2f}\n"
        
        return {
            "narrative": narrative,
            "data": {
                "summary": summary,
                "projects": projects,
                "critical_count": len(critical_projects),
                "high_risk_count": len(high_risk_projects)
            },
            "sources": ["ATOMIC.PROJECT"]
        }
    
    async def get_project_detail(self, project_id: str) -> Dict[str, Any]:
        """Get detailed information for a specific project."""
        project = self.sf.get_project_detail(project_id)
        
        if not project:
            return {
                "narrative": f"Project {project_id} not found.",
                "data": {},
                "sources": []
            }
        
        # Get related change orders
        change_orders = self.sf.get_change_orders(project_id=project_id, limit=10)
        co_total = sum(co.get("APPROVED_AMOUNT", 0) or 0 for co in change_orders if co.get("STATUS") == "APPROVED")
        
        budget = project.get("ORIGINAL_BUDGET", 0) or 0
        current_budget = project.get("CURRENT_BUDGET", 0) or 0
        contingency = project.get("CONTINGENCY_BUDGET", 0) or 0
        contingency_used = project.get("CONTINGENCY_USED", 0) or 0
        
        risk_level = "🔴 CRITICAL" if project.get("CPI", 1) < 0.9 or project.get("SPI", 1) < 0.9 else \
                     "🟠 HIGH" if project.get("CPI", 1) < 0.95 or project.get("SPI", 1) < 0.95 else \
                     "🟡 MEDIUM" if project.get("CPI", 1) < 1.0 or project.get("SPI", 1) < 1.0 else "🟢 LOW"
        
        narrative = f"""## 🏗️ {project.get('PROJECT_NAME')}

### Project Overview
- **Type**: {project.get('PROJECT_TYPE')}
- **Location**: {project.get('CITY')}, {project.get('STATE')}
- **Prime Contractor**: {project.get('PRIME_CONTRACTOR')}
- **Status**: {project.get('STATUS')}

### Financial Health {risk_level}
| Metric | Value |
|--------|-------|
| Original Budget | ${budget/1e6:.1f}M |
| Current Budget | ${current_budget/1e6:.1f}M |
| Variance | ${(current_budget-budget)/1e6:.1f}M ({(current_budget-budget)/budget*100:.1f}%) |
| CPI | {project.get('CPI', 0):.3f} |
| SPI | {project.get('SPI', 0):.3f} |

### Contingency
- **Allocated**: ${contingency/1e6:.1f}M
- **Used**: ${contingency_used/1e6:.1f}M ({contingency_used/contingency*100 if contingency > 0 else 0:.1f}%)
- **Remaining**: ${(contingency-contingency_used)/1e6:.1f}M

### Change Orders
- **Total CO Value**: ${co_total/1e6:.2f}M across {len(change_orders)} recent COs
"""
        
        return {
            "narrative": narrative,
            "data": {
                "project": project,
                "change_orders": change_orders,
                "co_total": co_total
            },
            "sources": ["ATOMIC.PROJECT", "ATOMIC.CHANGE_ORDER"]
        }
    
    async def check_alerts(self) -> Dict[str, Any]:
        """Check for portfolio alerts and warnings."""
        projects = self.sf.get_projects()
        
        alerts = []
        
        for p in projects:
            # CPI alerts
            if p.get("CPI", 1) < 0.9:
                alerts.append({
                    "level": "critical",
                    "type": "cost",
                    "project": p.get("PROJECT_NAME"),
                    "message": f"CPI at {p.get('CPI'):.2f} - severe cost overrun"
                })
            elif p.get("CPI", 1) < 0.95:
                alerts.append({
                    "level": "warning",
                    "type": "cost",
                    "project": p.get("PROJECT_NAME"),
                    "message": f"CPI at {p.get('CPI'):.2f} - trending over budget"
                })
            
            # SPI alerts
            if p.get("SPI", 1) < 0.9:
                alerts.append({
                    "level": "critical",
                    "type": "schedule",
                    "project": p.get("PROJECT_NAME"),
                    "message": f"SPI at {p.get('SPI'):.2f} - severe schedule delay"
                })
            
            # Contingency alerts
            contingency = p.get("CONTINGENCY_BUDGET", 0) or 0
            used = p.get("CONTINGENCY_USED", 0) or 0
            if contingency > 0 and (used / contingency) > 0.8:
                alerts.append({
                    "level": "critical",
                    "type": "contingency",
                    "project": p.get("PROJECT_NAME"),
                    "message": f"Contingency at {(used/contingency)*100:.0f}% - nearly depleted"
                })
        
        return {
            "alerts": alerts,
            "critical_count": len([a for a in alerts if a["level"] == "critical"]),
            "warning_count": len([a for a in alerts if a["level"] == "warning"])
        }
