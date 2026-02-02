"""
ATLAS Capital Delivery - FastAPI Main Application

Agentic AI system for capital project delivery intelligence.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import sys
import os
import json
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Lazy load services to handle SPCS environment
_snowflake_service = None
_orchestrator = None


def get_sf():
    """Get Snowflake service with lazy initialization."""
    global _snowflake_service
    if _snowflake_service is None:
        try:
            from services.snowflake_service_spcs import get_snowflake_service
            _snowflake_service = get_snowflake_service
        except Exception as e:
            logger.error(f"Failed to init Snowflake service: {e}")
            raise HTTPException(status_code=503, detail="Snowflake service not available")
    return _snowflake_service()


def get_orchestrator():
    """Get Agent Orchestrator with lazy initialization."""
    global _orchestrator
    if _orchestrator is None:
        try:
            from agents.orchestrator import AgentOrchestrator
            sf = get_sf()
            _orchestrator = AgentOrchestrator(sf)
        except Exception as e:
            logger.error(f"Failed to init Orchestrator: {e}")
            raise HTTPException(status_code=503, detail="Orchestrator not available")
    return _orchestrator


# Create FastAPI app
app = FastAPI(
    title="ATLAS Capital Delivery API",
    description="Agentic AI system for capital project delivery intelligence",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Pydantic Models
# =============================================================================


class ChatMessage(BaseModel):
    message: str
    project_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []
    context: Dict[str, Any] = {}
    intent: Optional[str] = None
    visualization: Optional[str] = None
    alert_level: Optional[str] = None


class ProjectFilter(BaseModel):
    project_id: Optional[str] = None
    project_type: Optional[str] = None
    status: Optional[str] = None


class SearchQuery(BaseModel):
    query: str
    limit: int = 10


# =============================================================================
# Health & Info Endpoints
# =============================================================================


@app.get("/health")
async def health():
    """Health check endpoint for SPCS."""
    return {"status": "healthy", "service": "atlas-capital-delivery"}


@app.get("/api/info")
async def api_info():
    """API information."""
    return {
        "name": "ATLAS Capital Delivery API",
        "version": "1.0.0",
        "description": "Agentic AI for capital project intelligence",
        "agents": [
            "Portfolio Watchdog",
            "Scope Analyst",
            "Schedule Optimizer",
            "Risk Predictor"
        ]
    }


# =============================================================================
# Chat Endpoint - Main AI Interface
# =============================================================================


@app.post("/api/chat", response_model=ChatResponse)
async def chat(message: ChatMessage):
    """
    Send message to ATLAS Co-Pilot.
    
    The orchestrator will:
    1. Classify the intent
    2. Route to appropriate agent(s)
    3. Return aggregated response with sources
    """
    try:
        orchestrator = get_orchestrator()
        result = await orchestrator.process_message(
            message=message.message,
            project_id=message.project_id
        )
        
        return ChatResponse(
            response=result.get("response", ""),
            sources=result.get("sources", []),
            context=result.get("context", {}),
            intent=result.get("intent"),
            visualization=result.get("visualization"),
            alert_level=result.get("alert_level")
        )
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream(message: ChatMessage):
    """
    Stream chat response from Cortex Agent via SSE.
    
    Returns Server-Sent Events with:
    - type: "thinking" - Agent planning/reasoning steps
    - type: "text" - Response text chunks
    - type: "tool_use" - SQL execution info
    - type: "done" - Stream complete
    - type: "error" - Error occurred
    """
    async def event_generator():
        try:
            from services.cortex_agent_client import get_cortex_agent_client
            agent = get_cortex_agent_client()
            
            # Yield initial thinking step
            yield f"data: {json.dumps({'type': 'thinking', 'title': 'Planning', 'content': 'Analyzing your question...'})}\n\n"
            
            async for event in agent.run_agent(message.message):
                # Format as SSE
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0.01)  # Small delay for smooth streaming
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            logger.error(f"Chat stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


# Fallback endpoint using local orchestrator (for when Agent API isn't available)
@app.post("/api/chat/local", response_model=ChatResponse)
async def chat_local(message: ChatMessage):
    """
    Local chat using our Python orchestrator (fallback).
    Use /api/chat/stream for full Cortex Agent experience.
    """
    try:
        orchestrator = get_orchestrator()
        result = await orchestrator.process_message(
            message=message.message,
            project_id=message.project_id
        )
        
        return ChatResponse(
            response=result.get("response", ""),
            sources=result.get("sources", []),
            context=result.get("context", {}),
            intent=result.get("intent"),
            visualization=result.get("visualization"),
            alert_level=result.get("alert_level")
        )
    except Exception as e:
        logger.error(f"Local chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Portfolio Endpoints
# =============================================================================


@app.get("/api/portfolio/summary")
async def get_portfolio_summary():
    """Get portfolio-level KPI summary."""
    try:
        sf = get_sf()
        summary = sf.get_portfolio_summary()
        logger.info(f"Portfolio summary raw: {summary}")
        
        # Ensure proper type conversion for frontend
        return {
            "total_projects": int(summary.get("TOTAL_PROJECTS") or summary.get("total_projects") or 0),
            "total_budget": float(summary.get("TOTAL_BUDGET") or summary.get("total_budget") or 0),
            "current_budget": float(summary.get("CURRENT_BUDGET") or summary.get("current_budget") or 0),
            "total_contingency": float(summary.get("TOTAL_CONTINGENCY") or summary.get("total_contingency") or 0),
            "contingency_used": float(summary.get("CONTINGENCY_USED") or summary.get("contingency_used") or 0),
            "avg_cpi": float(summary.get("AVG_CPI") or summary.get("avg_cpi") or 0),
            "avg_spi": float(summary.get("AVG_SPI") or summary.get("avg_spi") or 0),
            "projects_over_budget": int(summary.get("PROJECTS_OVER_BUDGET") or summary.get("projects_over_budget") or 0),
            "projects_behind_schedule": int(summary.get("PROJECTS_BEHIND_SCHEDULE") or summary.get("projects_behind_schedule") or 0)
        }
    except Exception as e:
        logger.error(f"Portfolio summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects")
async def get_projects():
    """Get all projects with health indicators."""
    try:
        sf = get_sf()
        return sf.get_projects()
    except Exception as e:
        logger.error(f"Get projects error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# IMPORTANT: This route MUST come before /api/projects/{project_id}
# to avoid "map" being interpreted as a project_id
@app.get("/api/projects/map")
async def get_projects_for_map():
    """Get project data optimized for map visualization."""
    try:
        sf = get_sf()
        projects = sf.get_projects()
        logger.info(f"Map endpoint: got {len(projects)} projects")
        # Return only map-relevant fields
        result = [
            {
                "id": p.get("PROJECT_ID"),
                "name": p.get("PROJECT_NAME"),
                "type": p.get("PROJECT_TYPE"),
                "city": p.get("CITY"),
                "state": p.get("STATE"),
                "lat": float(p.get("LATITUDE") or 0),
                "lng": float(p.get("LONGITUDE") or 0),
                "budget": float(p.get("ORIGINAL_BUDGET") or 0),
                "cpi": float(p.get("CPI") or 0),
                "spi": float(p.get("SPI") or 0),
                "riskLevel": p.get("RISK_LEVEL") or "low"
            }
            for p in projects
            if p.get("LATITUDE") and p.get("LONGITUDE")
        ]
        logger.info(f"Map endpoint: returning {len(result)} projects with coordinates")
        return result
    except Exception as e:
        logger.error(f"Map data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """Get detailed project information."""
    try:
        sf = get_sf()
        project = sf.get_project_detail(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get project error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Change Order Endpoints
# =============================================================================


@app.get("/api/change-orders")
async def get_change_orders(project_id: Optional[str] = None, limit: int = 100):
    """Get change orders with optional project filter."""
    try:
        sf = get_sf()
        return sf.get_change_orders(project_id=project_id, limit=limit)
    except Exception as e:
        logger.error(f"Get COs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/change-orders/scope-gaps")
async def get_scope_gap_analysis():
    """Get scope gap pattern analysis."""
    try:
        sf = get_sf()
        return sf.get_scope_gap_analysis()
    except Exception as e:
        logger.error(f"Scope gap error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/change-orders/hidden-pattern")
async def get_hidden_pattern():
    """Get the 'Hidden Discovery' - grounding pattern analysis."""
    try:
        sf = get_sf()
        return sf.get_grounding_pattern()
    except Exception as e:
        logger.error(f"Hidden pattern error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/change-orders/search")
async def search_change_orders(query: SearchQuery):
    """Semantic search on change order narratives."""
    try:
        sf = get_sf()
        results = sf.search_change_orders(query.query, query.limit)
        
        # Normalize column names to lowercase for frontend
        normalized = []
        for r in results:
            normalized.append({
                "co_id": r.get("CO_ID") or r.get("co_id"),
                "project_id": r.get("PROJECT_ID") or r.get("project_id"),
                "project_name": r.get("PROJECT_NAME") or r.get("project_name"),
                "vendor_id": r.get("VENDOR_ID") or r.get("vendor_id"),
                "vendor_name": r.get("VENDOR_NAME") or r.get("vendor_name"),
                "co_number": r.get("CO_NUMBER") or r.get("co_number"),
                "co_title": r.get("CO_TITLE") or r.get("co_title"),
                "reason_text": r.get("REASON_TEXT") or r.get("reason_text"),
                "approved_amount": float(r.get("APPROVED_AMOUNT") or r.get("approved_amount") or 0),
                "ml_category": r.get("ML_CATEGORY") or r.get("ml_category"),
                "approval_date": str(r.get("APPROVAL_DATE") or r.get("approval_date") or "")
            })
        
        logger.info(f"Search returned {len(normalized)} results for query: {query.query[:30]}")
        return normalized
    except Exception as e:
        logger.error(f"CO search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Vendor Endpoints
# =============================================================================


@app.get("/api/vendors")
async def get_vendors():
    """Get all vendors with risk scores."""
    try:
        sf = get_sf()
        return sf.get_vendors()
    except Exception as e:
        logger.error(f"Get vendors error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# ML Insights Endpoints
# =============================================================================


@app.get("/api/ml/classification-summary")
async def get_ml_classification_summary():
    """Get ML classification summary for change orders."""
    try:
        sf = get_sf()
        sql = f"""
        SELECT 
            ML_CATEGORY,
            COUNT(*) as co_count,
            ROUND(SUM(APPROVED_AMOUNT), 0) as total_amount,
            ROUND(AVG(ML_CONFIDENCE), 3) as avg_confidence,
            ROUND(AVG(APPROVED_AMOUNT), 0) as avg_co_amount
        FROM {sf.database}.ATOMIC.CHANGE_ORDER
        WHERE ML_CATEGORY IS NOT NULL AND STATUS = 'APPROVED'
        GROUP BY ML_CATEGORY
        ORDER BY total_amount DESC
        """
        results = sf.execute_query(sql)
        
        # Normalize to lowercase
        return [{
            "category": r.get("ML_CATEGORY"),
            "co_count": int(r.get("CO_COUNT") or 0),
            "total_amount": float(r.get("TOTAL_AMOUNT") or 0),
            "avg_confidence": float(r.get("AVG_CONFIDENCE") or 0),
            "avg_co_amount": float(r.get("AVG_CO_AMOUNT") or 0)
        } for r in results]
    except Exception as e:
        logger.error(f"ML classification summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/hidden-pattern-analysis")
async def get_ml_hidden_pattern():
    """Get ML analysis of the hidden grounding pattern."""
    try:
        sf = get_sf()
        
        # Get grounding pattern COs with ML classifications
        sql = f"""
        SELECT 
            co.CO_ID,
            co.PROJECT_ID,
            p.PROJECT_NAME,
            co.VENDOR_ID,
            v.VENDOR_NAME,
            co.REASON_TEXT,
            co.APPROVED_AMOUNT,
            co.ML_CATEGORY,
            co.ML_CONFIDENCE,
            co.ML_SCOPE_GAP_PROB
        FROM {sf.database}.ATOMIC.CHANGE_ORDER co
        JOIN {sf.database}.ATOMIC.PROJECT p ON co.PROJECT_ID = p.PROJECT_ID
        LEFT JOIN {sf.database}.ATOMIC.VENDOR v ON co.VENDOR_ID = v.VENDOR_ID
        WHERE LOWER(co.REASON_TEXT) LIKE '%ground%'
          AND co.STATUS = 'APPROVED'
        ORDER BY co.ML_CONFIDENCE DESC
        LIMIT 50
        """
        cos = sf.execute_query(sql)
        
        # Summary stats
        total_cos = len(cos)
        total_amount = sum(r.get("APPROVED_AMOUNT", 0) or 0 for r in cos)
        avg_confidence = sum(r.get("ML_CONFIDENCE", 0) or 0 for r in cos) / total_cos if total_cos > 0 else 0
        projects_affected = len(set(r.get("PROJECT_ID") for r in cos))
        
        # Category distribution
        categories = {}
        for co in cos:
            cat = co.get("ML_CATEGORY") or "UNKNOWN"
            if cat not in categories:
                categories[cat] = {"count": 0, "amount": 0}
            categories[cat]["count"] += 1
            categories[cat]["amount"] += co.get("APPROVED_AMOUNT", 0) or 0
        
        return {
            "pattern_name": "Missing Grounding Specifications",
            "description": "ML classifier detected 156+ change orders with high probability of scope gap related to electrical grounding specifications",
            "summary": {
                "total_cos": total_cos,
                "total_amount": total_amount,
                "avg_ml_confidence": avg_confidence,
                "projects_affected": projects_affected
            },
            "category_distribution": categories,
            "sample_cos": [{
                "co_id": r.get("CO_ID"),
                "project_name": r.get("PROJECT_NAME"),
                "vendor_name": r.get("VENDOR_NAME"),
                "reason_text": r.get("REASON_TEXT"),
                "approved_amount": r.get("APPROVED_AMOUNT"),
                "ml_category": r.get("ML_CATEGORY"),
                "ml_confidence": r.get("ML_CONFIDENCE"),
                "scope_gap_prob": r.get("ML_SCOPE_GAP_PROB")
            } for r in cos[:20]],
            "insight": f"The ML classifier identified this pattern with {avg_confidence*100:.1f}% average confidence. These COs were individually small (avg ${total_amount/total_cos:,.0f}) but aggregate to ${total_amount:,.0f} across {projects_affected} projects."
        }
    except Exception as e:
        logger.error(f"ML hidden pattern error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Schedule Endpoints
# =============================================================================


@app.get("/api/activities")
async def get_activities(project_id: Optional[str] = None, critical_only: bool = False):
    """Get schedule activities."""
    try:
        sf = get_sf()
        return sf.get_activities(project_id=project_id, critical_only=critical_only)
    except Exception as e:
        logger.error(f"Get activities error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/activities/at-risk")
async def get_at_risk_activities(threshold: float = 0.5):
    """Get activities at risk of schedule slip."""
    try:
        sf = get_sf()
        return sf.get_at_risk_activities(threshold=threshold)
    except Exception as e:
        logger.error(f"At risk activities error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Trend & Analytics Endpoints
# =============================================================================


@app.get("/api/trends/monthly")
async def get_monthly_trend(project_id: Optional[str] = None):
    """Get monthly snapshot data for S-curves."""
    try:
        sf = get_sf()
        return sf.get_monthly_trend(project_id=project_id)
    except Exception as e:
        logger.error(f"Monthly trend error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Morning Brief Endpoint
# =============================================================================


@app.get("/api/morning-brief")
async def get_morning_brief():
    """Generate AI-powered morning brief for the portfolio."""
    try:
        orchestrator = get_orchestrator()
        
        # Get portfolio overview
        portfolio_result = await orchestrator.portfolio_agent.get_portfolio_overview()
        
        # Check for alerts
        alerts = await orchestrator.portfolio_agent.check_alerts()
        
        # Get hidden patterns if any
        hidden = await orchestrator.scope_agent.find_hidden_patterns()
        
        # Get at-risk activities
        schedule_result = await orchestrator.schedule_agent.analyze_schedule()
        
        # Normalize portfolio data (Snowflake returns UPPERCASE, frontend expects lowercase)
        raw_summary = portfolio_result.get("data", {}).get("summary", {})
        portfolio = {
            "total_projects": int(raw_summary.get("TOTAL_PROJECTS") or raw_summary.get("total_projects") or 0),
            "total_budget": float(raw_summary.get("TOTAL_BUDGET") or raw_summary.get("total_budget") or 0),
            "avg_cpi": float(raw_summary.get("AVG_CPI") or raw_summary.get("avg_cpi") or 0),
            "avg_spi": float(raw_summary.get("AVG_SPI") or raw_summary.get("avg_spi") or 0),
            "projects_over_budget": int(raw_summary.get("PROJECTS_OVER_BUDGET") or raw_summary.get("projects_over_budget") or 0),
            "projects_behind_schedule": int(raw_summary.get("PROJECTS_BEHIND_SCHEDULE") or raw_summary.get("projects_behind_schedule") or 0)
        }
        
        return {
            "date": "2024-01-15",  # Would be dynamic
            "portfolio": portfolio,
            "alerts": alerts.get("alerts", [])[:5],
            "critical_alert_count": alerts.get("critical_count", 0),
            "hidden_pattern": hidden.get("data", {}) if hidden.get("data", {}).get("co_count", 0) > 0 else None,
            "schedule_risk_count": schedule_result.get("data", {}).get("high_risk_count", 0),
            "narrative": portfolio_result.get("narrative", "")
        }
    except Exception as e:
        logger.error(f"Morning brief error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# WebSocket for Real-time Updates
# =============================================================================


@app.websocket("/ws/portfolio")
async def websocket_portfolio(websocket: WebSocket):
    """WebSocket for real-time portfolio updates."""
    await websocket.accept()
    
    try:
        while True:
            # Wait for any message (can be used for subscribe/unsubscribe)
            data = await websocket.receive_text()
            
            # Send portfolio update
            sf = get_sf()
            summary = sf.get_portfolio_summary()
            await websocket.send_json({
                "type": "portfolio_update",
                "data": summary
            })
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")


# =============================================================================
# Run with uvicorn
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
