-- =====================================================
-- ATLAS Capital Delivery - Cortex Agent Deployment
-- =====================================================
-- 
-- IMPORTANT: Cortex Agents are deployed via the Snowsight UI or Python API.
-- This SQL file provides setup and verification steps.
--
-- To deploy the agent:
-- 1. Go to Snowsight → AI & ML → Cortex Agents
-- 2. Click "Create Agent"
-- 3. Configure with the settings from atlas_agent.json
-- 4. Or use the Python utility script below
-- =====================================================

USE DATABASE CAPITAL_PROJECTS_DB;
USE SCHEMA CAPITAL_PROJECTS;
USE WAREHOUSE CAPITAL_COMPUTE_WH;

-- =====================================================
-- Prerequisites Check
-- =====================================================

SELECT '🔍 Step 1: Checking semantic model stage...' as STEP;
LIST @CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS;

SELECT '🔍 Step 2: Checking Cortex Search services...' as STEP;
SHOW CORTEX SEARCH SERVICES IN DATABASE CAPITAL_PROJECTS_DB;

SELECT '🔍 Step 3: Verifying data exists...' as STEP;
SELECT 
    (SELECT COUNT(*) FROM ATOMIC.PROJECT) as projects,
    (SELECT COUNT(*) FROM ATOMIC.CHANGE_ORDER) as change_orders,
    (SELECT COUNT(*) FROM ATOMIC.VENDOR) as vendors;

-- =====================================================
-- Agent Configuration Summary (for UI deployment)
-- =====================================================

/*
Agent Name: ATLAS_CAPITAL_AGENT

Description: 
AI agent for capital project portfolio intelligence. Combines data queries 
with ML insights, document search, and pattern detection for the Hidden Discovery feature.

Model: mistral-large (or llama3.1-70b)

Tools:
1. data_analyst (Cortex Analyst)
   - Semantic Model: @CAPITAL_PROJECTS.SEMANTIC_MODELS/capital_semantic_model.yaml
   - Description: Query capital project data

2. co_search (Cortex Search)
   - Service: DOCS.CO_SEARCH_SERVICE
   - Description: Search change order narratives

3. contract_search (Cortex Search)
   - Service: DOCS.CONTRACT_SEARCH_SERVICE
   - Description: Search contract documents

Sample Questions:
- What is the portfolio health summary?
- Show me projects that are over budget
- Search for change orders related to grounding
- What is the Hidden Discovery pattern?
- What does the contract say about change order pricing?
*/

-- =====================================================
-- Python Deployment Script
-- =====================================================
-- 
-- Save this as deploy_agent.py and run with snowpark session:
--
-- ```python
-- from snowflake.core import Root
-- from snowflake.core.cortex.agent import CortexAgent, CortexAgentTool
-- 
-- def deploy_atlas_agent(session):
--     """Deploy ATLAS Capital Agent to Cortex."""
--     
--     agent = CortexAgent(
--         name="ATLAS_CAPITAL_AGENT",
--         description="AI agent for capital project portfolio intelligence with Hidden Discovery pattern detection",
--         model="mistral-large",
--         instructions="""You are ATLAS, an AI assistant for capital project portfolio management.
-- You help project managers, executives, and analysts understand project health, cost performance, and risk.
-- 
-- IMPORTANT: For 'Hidden Discovery' questions, search for 'grounding' related change orders - 
-- there's a systemic issue with 150+ small COs totaling $1.45M across all 12 projects!
-- 
-- Always provide context about aggregate portfolio impact, not just individual items.""",
--         tools=[
--             CortexAgentTool(
--                 tool_type="cortex_analyst_text_to_sql",
--                 name="data_analyst",
--                 spec={
--                     "semantic_model": "@CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS/capital_semantic_model.yaml",
--                     "description": "Query capital project data including budgets, schedules, change orders, and ML predictions"
--                 }
--             ),
--             CortexAgentTool(
--                 tool_type="cortex_search",
--                 name="co_search",
--                 spec={
--                     "service": "CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE",
--                     "max_results": 10,
--                     "description": "Semantic search on change order narratives for pattern detection"
--                 }
--             ),
--             CortexAgentTool(
--                 tool_type="cortex_search",
--                 name="contract_search",
--                 spec={
--                     "service": "CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE",
--                     "max_results": 5,
--                     "description": "Search contract documents and specifications"
--                 }
--             )
--         ]
--     )
--     
--     root = Root(session)
--     agents = root.databases["CAPITAL_PROJECTS_DB"].schemas["CAPITAL_PROJECTS"].cortex_agents
--     agents.create(agent, mode="or_replace")
--     
--     print("✅ ATLAS_CAPITAL_AGENT deployed successfully!")
--     return agent
-- 
-- # Usage:
-- # from snowflake.snowpark import Session
-- # session = Session.builder.configs({"connection_name": "demo"}).create()
-- # deploy_atlas_agent(session)
-- ```

-- =====================================================
-- Test Queries (run after agent is deployed)
-- =====================================================

-- Test the semantic model directly
-- SELECT SNOWFLAKE.CORTEX.COMPLETE(
--     'mistral-large',
--     'You are a helpful data analyst. Based on this data, summarize the portfolio health: ' ||
--     (SELECT OBJECT_CONSTRUCT(*) FROM CAPITAL_PROJECTS.PORTFOLIO_SUMMARY)::VARCHAR
-- );

-- Test CO Search
-- SELECT * FROM TABLE(
--     CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE(
--         QUERY => 'grounding electrical specifications missing',
--         LIMIT => 10
--     )
-- );

-- =====================================================
-- Verification
-- =====================================================

SELECT '✅ Agent configuration ready!' as STATUS;
SELECT 'To deploy: Snowsight → AI & ML → Cortex Agents → Create Agent' as INSTRUCTIONS;
SELECT 'Or run the Python script above with a Snowpark session' as ALTERNATIVE;

-- Show Hidden Discovery preview (the "wow" moment)
SELECT 
    '🔍 HIDDEN DISCOVERY PREVIEW' as SECTION,
    'Missing Grounding Specifications' as PATTERN,
    COUNT(*) as CO_COUNT,
    COUNT(DISTINCT PROJECT_ID) as PROJECTS_AFFECTED,
    '$' || TO_CHAR(ROUND(SUM(APPROVED_AMOUNT), 0), '999,999,999') as TOTAL_IMPACT
FROM ATOMIC.CHANGE_ORDER
WHERE LOWER(REASON_TEXT) LIKE '%ground%'
  AND STATUS = 'APPROVED';
