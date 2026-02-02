"""
ATLAS Capital Delivery - Agent Orchestrator

The Orchestrator classifies user intent and routes to specialized agents:
- Portfolio Watchdog: Monitors KPIs, alerts, portfolio health
- Scope Analyst: Analyzes change orders, detects patterns (Hidden Discovery)
- Schedule Optimizer: Critical path, slip risk, milestone tracking
- Risk Predictor: ML predictions, EAC forecasts, vendor risk
"""

import re
import logging
from typing import Any, Dict, List, Optional

from .portfolio_agent import PortfolioWatchdog
from .scope_agent import ScopeAnalyst
from .schedule_agent import ScheduleOptimizer
from .risk_agent import RiskPredictor

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates multi-agent system for capital delivery intelligence.
    
    Flow:
    1. Classify user intent from message
    2. Route to appropriate agent(s)
    3. Aggregate responses with sources
    4. Maintain conversation context
    """
    
    def __init__(self, snowflake_service):
        self.sf = snowflake_service
        
        # Initialize specialized agents
        self.portfolio_agent = PortfolioWatchdog(snowflake_service)
        self.scope_agent = ScopeAnalyst(snowflake_service)
        self.schedule_agent = ScheduleOptimizer(snowflake_service)
        self.risk_agent = RiskPredictor(snowflake_service)
        
        # Conversation context
        self.context = {
            "current_project": None,
            "last_intent": None,
            "last_results": None
        }
        
        logger.info("AgentOrchestrator initialized with 4 specialized agents")
    
    async def process_message(
        self,
        message: str,
        project_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and return appropriate response.
        """
        # Update context
        if project_id:
            self.context["current_project"] = project_id
        
        # Classify intent
        intent = self._classify_intent(message)
        self.context["last_intent"] = intent
        
        logger.info(f"Classified intent: {intent}")
        
        # Route to appropriate handler
        # Most queries go to Cortex Analyst for true text-to-SQL
        try:
            if intent == "hidden_discovery":
                # Special handler for the "wow moment"
                result = await self._handle_hidden_discovery(message)
            else:
                # ALL other queries go to Cortex Analyst
                result = await self._handle_cortex_analyst(message)
            
            self.context["last_results"] = result
            return result
            
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            return {
                "response": f"I encountered an error: {str(e)}. Please try rephrasing your question.",
                "sources": [],
                "context": {},
                "intent": intent
            }
    
    def _classify_intent(self, message: str) -> str:
        """Classify user intent - simplified to route most to Cortex Analyst."""
        message_lower = message.lower()
        
        # Hidden Discovery / Pattern Detection - ONLY special case
        pattern_keywords = [
            r"hidden", r"pattern", r"scope\s*leakage", r"scope\s*gap",
            r"grounding", r"systemic", r"recurring"
        ]
        for pattern in pattern_keywords:
            if re.search(pattern, message_lower):
                return "hidden_discovery"
        
        # Everything else goes to Cortex Analyst
        return "data_query"
    
    # =========================================================================
    # Intent Handlers
    # =========================================================================
    
    async def _handle_portfolio(self, message: str) -> Dict[str, Any]:
        """Handle portfolio overview requests."""
        response = await self.portfolio_agent.get_portfolio_overview()
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ATOMIC.PROJECT"]),
            "context": response.get("data", {}),
            "intent": "portfolio",
            "visualization": "portfolio_summary"
        }
    
    async def _handle_scope(self, message: str) -> Dict[str, Any]:
        """Handle change order analysis requests."""
        response = await self.scope_agent.analyze_change_orders(
            project_id=self.context.get("current_project")
        )
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ATOMIC.CHANGE_ORDER"]),
            "context": response.get("data", {}),
            "intent": "scope_analysis",
            "visualization": "co_analysis"
        }
    
    async def _handle_hidden_discovery(self, message: str) -> Dict[str, Any]:
        """Handle the Hidden Discovery - scope leakage pattern detection."""
        response = await self.scope_agent.find_hidden_patterns()
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ATOMIC.CHANGE_ORDER", "ML.CO_CLASSIFICATIONS"]),
            "context": response.get("data", {}),
            "intent": "hidden_discovery",
            "visualization": "scope_leakage",
            "alert_level": "high"
        }
    
    async def _handle_schedule(self, message: str) -> Dict[str, Any]:
        """Handle schedule analysis requests."""
        response = await self.schedule_agent.analyze_schedule(
            project_id=self.context.get("current_project")
        )
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ATOMIC.PROJECT_ACTIVITY"]),
            "context": response.get("data", {}),
            "intent": "schedule",
            "visualization": "schedule_risk"
        }
    
    async def _handle_risk(self, message: str) -> Dict[str, Any]:
        """Handle risk and ML prediction requests."""
        response = await self.risk_agent.get_risk_overview(
            project_id=self.context.get("current_project")
        )
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ML.EAC_PREDICTIONS", "ML.SCHEDULE_RISK_PREDICTIONS"]),
            "context": response.get("data", {}),
            "intent": "risk",
            "visualization": "risk_dashboard"
        }
    
    async def _handle_vendor(self, message: str) -> Dict[str, Any]:
        """Handle vendor analysis requests."""
        # Check if asking about specific vendor (e.g., Apex)
        if "apex" in message.lower():
            response = await self.scope_agent.analyze_vendor("VND-001")
        else:
            response = await self.risk_agent.get_vendor_risk_summary()
        
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ATOMIC.VENDOR", "ML.VENDOR_RISK_SCORES"]),
            "context": response.get("data", {}),
            "intent": "vendor",
            "visualization": "vendor_scorecard"
        }
    
    async def _handle_project_detail(self, message: str) -> Dict[str, Any]:
        """Handle specific project detail requests."""
        # Try to extract project ID from message
        project_id = self._extract_project_id(message) or self.context.get("current_project")
        
        if project_id:
            response = await self.portfolio_agent.get_project_detail(project_id)
        else:
            response = {
                "narrative": "Please specify a project. You can say something like 'Tell me about the Downtown Transit Hub project' or use a project ID like PRJ-001.",
                "data": {}
            }
        
        return {
            "response": response["narrative"],
            "sources": response.get("sources", ["ATOMIC.PROJECT"]),
            "context": response.get("data", {}),
            "intent": "project_detail",
            "visualization": "project_detail"
        }
    
    async def _handle_cortex_analyst(self, message: str) -> Dict[str, Any]:
        """
        Handle data queries using pattern matching first, then LLM text-to-SQL.
        
        Two-tier approach like drilling_ops:
        1. Try direct_sql_query (pattern matching - RELIABLE)
        2. Fall back to LLM text-to-SQL if patterns don't match
        """
        logger.info(f"Processing query: {message}")
        
        # TIER 1: Try direct SQL with pattern matching (reliable)
        try:
            result = self.sf.direct_sql_query(message)
            
            if result.get("results") and len(result["results"]) > 0:
                return self._format_query_response(
                    results=result["results"],
                    sql=result.get("sql", ""),
                    explanation=result.get("explanation", ""),
                    source="Direct SQL"
                )
        except Exception as e:
            logger.warning(f"Direct SQL query failed: {e}")
        
        # TIER 2: Try LLM text-to-SQL
        try:
            result = self.sf.cortex_analyst(message)
            
            if result.get("data") and len(result["data"]) > 0:
                return self._format_query_response(
                    results=result["data"],
                    sql=result.get("sql", ""),
                    explanation=result.get("answer", ""),
                    source="Cortex LLM"
                )
            elif result.get("error"):
                logger.warning(f"LLM text-to-SQL error: {result['error']}")
        except Exception as e:
            logger.warning(f"LLM text-to-SQL failed: {e}")
        
        # If both fail, show helpful suggestions
        return {
            "response": (
                "I couldn't process that query. Here are some things I can answer:\n\n"
                "📊 **Projects**\n"
                "• \"List all projects\" or \"Show me the project names\"\n"
                "• \"Show me the portfolio summary\"\n"
                "• \"Which projects are over budget?\"\n"
                "• \"Which projects are behind schedule?\"\n\n"
                "💰 **Budget**\n"
                "• \"What is the total budget by project?\"\n"
                "• \"Show me the total spend per project\"\n\n"
                "👷 **Vendors**\n"
                "• \"List all vendors\"\n"
                "• \"Which vendor has the most change orders?\"\n\n"
                "📝 **Change Orders**\n"
                "• \"How many change orders are there?\"\n"
                "• \"Show change orders by category\""
            ),
            "sources": ["ATLAS System"],
            "context": {},
            "intent": "data_query"
        }
    
    def _format_query_response(
        self, 
        results: List[Dict], 
        sql: str, 
        explanation: str,
        source: str
    ) -> Dict[str, Any]:
        """Format query results nicely - like drilling_ops does."""
        response_parts = ["📊 **Query Results**\n"]
        
        if explanation:
            response_parts.append(f"_{explanation}_\n")
        
        # Format based on result type
        if len(results) == 1 and len(results[0]) == 1:
            # Single value result
            key, value = list(results[0].items())[0]
            response_parts.append(f"**{key.replace('_', ' ').title()}**: {value}")
        elif len(results) <= 20:
            # Show as table
            columns = list(results[0].keys())
            response_parts.append("| " + " | ".join(col.replace('_', ' ').title() for col in columns) + " |")
            response_parts.append("|" + "|".join(["---"] * len(columns)) + "|")
            
            for row in results:
                values = []
                for col in columns:
                    val = row.get(col)
                    if val is None:
                        values.append("-")
                    elif isinstance(val, float):
                        if abs(val) >= 1e6:
                            values.append(f"${val/1e6:.1f}M")
                        elif abs(val) >= 1e3:
                            values.append(f"${val/1e3:.0f}K")
                        elif abs(val) < 2:
                            values.append(f"{val:.3f}")
                        else:
                            values.append(f"{val:.0f}")
                    else:
                        values.append(str(val)[:35])
                response_parts.append("| " + " | ".join(values) + " |")
        else:
            response_parts.append(f"Found {len(results)} results. Showing first 20:\n")
            for row in results[:20]:
                response_parts.append(f"• {row}")
        
        # Add SQL info
        response_parts.append(f"\n✅ **Query Executed** | {len(results)} rows")
        if sql:
            # Show truncated SQL
            clean_sql = ' '.join(sql.split())[:100]
            response_parts.append(f"`{clean_sql}...`")
        
        return {
            "response": "\n".join(response_parts),
            "sources": [source, "CAPITAL_PROJECTS_DB"],
            "context": {"sql": sql, "row_count": len(results)},
            "intent": "data_query"
        }
    
    def _extract_project_id(self, message: str) -> Optional[str]:
        """Extract project ID from message."""
        # Check for explicit project ID
        match = re.search(r"PRJ-(\d+)", message, re.IGNORECASE)
        if match:
            return f"PRJ-{match.group(1)}"
        
        # Check for project names
        project_names = {
            "downtown transit": "PRJ-001",
            "riverside substation": "PRJ-002",
            "airport terminal": "PRJ-003",
            "highway 101": "PRJ-004",
            "metro blue line": "PRJ-005",
            "harbor bridge": "PRJ-006",
            "central utility": "PRJ-007",
            "rail yard": "PRJ-008",
            "water treatment": "PRJ-009",
            "power substation": "PRJ-010",
            "transit center west": "PRJ-011",
            "tunnel boring": "PRJ-012"
        }
        
        message_lower = message.lower()
        for name, pid in project_names.items():
            if name in message_lower:
                return pid
        
        return None


# Singleton
_orchestrator: Optional[AgentOrchestrator] = None


def get_orchestrator(snowflake_service=None) -> AgentOrchestrator:
    """Get or create orchestrator singleton."""
    global _orchestrator
    if _orchestrator is None:
        if snowflake_service is None:
            from ..services import get_snowflake_service
            snowflake_service = get_snowflake_service()
        _orchestrator = AgentOrchestrator(snowflake_service)
    return _orchestrator
