-- =============================================================================
-- 🏗️ ATLAS Capital Delivery: Cortex Access & Governance Demo
-- =============================================================================
-- This worksheet demonstrates Snowflake Cortex governance best practices
-- using the ATLAS Capital Delivery project as a real-world example.
--
-- Run each section sequentially to see how access control, LLM functions,
-- Search, Analyst, and Agents work together under unified governance.
-- =============================================================================

-- =============================================================================
-- ⚠️ PREREQUISITES - Run these checks first!
-- =============================================================================

-- Check 1: Does the database exist?
SHOW DATABASES LIKE 'CAPITAL_PROJECTS_DB';
-- If empty, run: deploy.sh or ddl/*.sql files first

-- Check 2: Does the data exist?
-- SELECT COUNT(*) FROM CAPITAL_PROJECTS_DB.ATOMIC.CHANGE_ORDER;
-- If 0, run: deploy.sh to load synthetic data

-- Check 3: Do the Cortex Search services exist?
-- SHOW CORTEX SEARCH SERVICES IN DATABASE CAPITAL_PROJECTS_DB;
-- If empty, run: cortex/deploy_search.sql

-- Check 4: Is Cortex enabled on your account?
-- SHOW PARAMETERS LIKE 'ENABLE_CORTEX%' IN ACCOUNT;

-- =============================================================================

-- Set context
USE ROLE ACCOUNTADMIN;
USE DATABASE CAPITAL_PROJECTS_DB;
USE WAREHOUSE CAPITAL_COMPUTE_WH;

-- =============================================================================
-- 📋 SECTION 1: Core Cortex Access Control
-- =============================================================================
-- The SNOWFLAKE.CORTEX_USER database role is the foundation for all Cortex access.
-- By default, it's granted to PUBLIC (everyone). Best practice: restrict it.

-- 1.1 Check current grants on CORTEX_USER role
SHOW GRANTS OF DATABASE ROLE SNOWFLAKE.CORTEX_USER;

-- 1.2 (DEMO ONLY - Don't run in prod without planning)
-- Revoke from PUBLIC and create a controlled role hierarchy
/*
-- Revoke default public access
REVOKE DATABASE ROLE SNOWFLAKE.CORTEX_USER FROM ROLE PUBLIC;

-- Create a custom role for ATLAS users
CREATE ROLE IF NOT EXISTS ATLAS_CORTEX_USER_ROLE;

-- Grant Cortex access to the custom role
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE ATLAS_CORTEX_USER_ROLE;

-- Grant the role to specific functional roles
GRANT ROLE ATLAS_CORTEX_USER_ROLE TO ROLE ATLAS_APP_ROLE;
GRANT ROLE ATLAS_CORTEX_USER_ROLE TO ROLE DATA_ENGINEER;
*/

-- 1.3 View available Cortex-related roles
SHOW DATABASE ROLES IN DATABASE SNOWFLAKE LIKE '%CORTEX%';


-- =============================================================================
-- 📋 SECTION 2: Cortex LLM Functions
-- =============================================================================
-- Direct access to LLMs for text generation, summarization, embeddings.
-- These run WITH THE USER'S ROLE - full RBAC respected.

-- 2.1 Check which models are allowed at account level
SHOW PARAMETERS LIKE 'CORTEX_MODELS_ALLOWLIST' IN ACCOUNT;

-- 2.2 Example: Summarize a change order reason
SELECT 
    CO_ID,
    CO_TITLE,
    REASON_TEXT,
    SNOWFLAKE.CORTEX.SUMMARIZE(REASON_TEXT) AS AI_SUMMARY
FROM ATOMIC.CHANGE_ORDER
WHERE REASON_TEXT IS NOT NULL
LIMIT 3;

-- 2.3 Example: Classify change order sentiment
SELECT 
    CO_ID,
    CO_TITLE,
    SNOWFLAKE.CORTEX.SENTIMENT(REASON_TEXT) AS SENTIMENT_SCORE,
    CASE 
        WHEN SNOWFLAKE.CORTEX.SENTIMENT(REASON_TEXT) > 0.3 THEN 'Positive'
        WHEN SNOWFLAKE.CORTEX.SENTIMENT(REASON_TEXT) < -0.3 THEN 'Negative'
        ELSE 'Neutral'
    END AS SENTIMENT_LABEL
FROM ATOMIC.CHANGE_ORDER
WHERE REASON_TEXT IS NOT NULL
LIMIT 5;

-- 2.4 Example: Generate embeddings for semantic similarity
-- Note: EMBED_TEXT returns a vector - useful for similarity search
SELECT 
    CO_ID,
    LEFT(REASON_TEXT, 50) AS REASON_PREVIEW,
    VECTOR_L2_DISTANCE(
        SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', REASON_TEXT),
        SNOWFLAKE.CORTEX.EMBED_TEXT_768('e5-base-v2', 'electrical grounding missing')
    ) AS SIMILARITY_TO_GROUNDING
FROM ATOMIC.CHANGE_ORDER
WHERE REASON_TEXT IS NOT NULL
ORDER BY SIMILARITY_TO_GROUNDING ASC
LIMIT 5;

-- 2.5 Example: Ask a question about change orders using COMPLETE
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mistral-large',
    'You are a construction project analyst. Based on this change order reason, identify the root cause category (scope gap, design error, field condition, or owner request): "Additional grounding conductors required per NEC code update not reflected in original electrical specifications"'
) AS LLM_CLASSIFICATION;

-- 2.6 Monitor LLM usage (requires ACCOUNTADMIN or USAGE_VIEWER)
-- SELECT * FROM SNOWFLAKE.ACCOUNT_USAGE.METERING_DAILY_HISTORY 
-- WHERE SERVICE_TYPE = 'AI_SERVICES'
-- ORDER BY USAGE_DATE DESC
-- LIMIT 10;


-- =============================================================================
-- 📋 SECTION 3: Cortex Search
-- =============================================================================
-- Semantic search on unstructured data. IMPORTANT: Runs with OWNER'S rights,
-- not caller's rights. Anyone with USAGE can search ALL indexed data.

-- 3.1 View existing Cortex Search services
SHOW CORTEX SEARCH SERVICES IN DATABASE CAPITAL_PROJECTS_DB;

-- 3.2 Describe the Change Order search service
DESCRIBE CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE;

-- 3.3 Search for change orders related to grounding (Hidden Discovery!)
-- Uses SEARCH_PREVIEW function with JSON parameters
SELECT PARSE_JSON(
    SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
        'CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE',
        '{
            "query": "electrical grounding specifications missing",
            "columns": ["CO_ID", "CO_TITLE", "REASON_TEXT", "APPROVED_AMOUNT"],
            "limit": 10
        }'
    )
) AS SEARCH_RESULTS;

-- 3.4 Flatten results for easier viewing
SELECT 
    r.value:CO_ID::STRING AS CO_ID,
    r.value:CO_TITLE::STRING AS CO_TITLE,
    r.value:REASON_TEXT::STRING AS REASON,
    r.value:APPROVED_AMOUNT::NUMBER AS AMOUNT,
    r.value:"@scores":cosine_similarity::FLOAT AS SIMILARITY
FROM TABLE(FLATTEN(
    PARSE_JSON(
        SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
            'CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE',
            '{"query": "grounding electrical panels spec gap", "columns": ["CO_ID", "CO_TITLE", "REASON_TEXT", "APPROVED_AMOUNT"], "limit": 5}'
        )
    ):results
)) r;

-- 3.5 Search contract documents
SELECT 
    r.value:DOC_ID::STRING AS DOC_ID,
    r.value:SECTION_TITLE::STRING AS SECTION,
    LEFT(r.value:CONTENT::STRING, 200) AS CONTENT_PREVIEW
FROM TABLE(FLATTEN(
    PARSE_JSON(
        SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
            'CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE',
            '{"query": "change order pricing overhead markup", "columns": ["DOC_ID", "SECTION_TITLE", "CONTENT"], "limit": 5}'
        )
    ):results
)) r;

-- 3.6 Grant access to search service (for new roles)
-- GRANT USAGE ON CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE 
--     TO ROLE ATLAS_APP_ROLE;

-- 3.7 ⚠️ SECURITY NOTE: Search runs with OWNER rights
-- Use explicit filters for row-level security when needed:
/*
SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
    'CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE',
    '{
        "query": "grounding",
        "columns": ["CO_ID", "CO_TITLE"],
        "filter": {"@eq": {"PROJECT_ID": "PRJ-001"}},
        "limit": 10
    }'
);
*/


-- =============================================================================
-- 📋 SECTION 4: Cortex Analyst
-- =============================================================================
-- Natural language to SQL. Fully respects RBAC - generated SQL runs
-- with the USER's role. Users can only query data they have access to.

-- 4.1 Verify semantic model is uploaded
LIST @CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS;

-- 4.2 Test Cortex Analyst with a simple question
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mistral-large',
    CONCAT(
        'You are a SQL expert. Given this schema context, generate a SQL query to answer the question.\n\n',
        'Tables: ATOMIC.PROJECT (PROJECT_ID, PROJECT_NAME, ORIGINAL_BUDGET, CURRENT_BUDGET, CPI, SPI, STATUS)\n',
        'ATOMIC.CHANGE_ORDER (CO_ID, PROJECT_ID, APPROVED_AMOUNT, ML_CATEGORY, REASON_TEXT)\n\n',
        'Question: What is the total approved change order amount by ML category?\n\n',
        'Return ONLY the SQL query, no explanation.'
    )
) AS GENERATED_SQL;

-- 4.3 Demonstrate that Analyst respects RBAC
-- If a user doesn't have SELECT on a table, Analyst can't query it for them

-- 4.4 Check who has access to the semantic model stage
SHOW GRANTS ON STAGE CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS;

-- 4.5 Grant access to semantic model (for new roles)
-- GRANT READ ON STAGE CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS 
--     TO ROLE ATLAS_APP_ROLE;


-- =============================================================================
-- 📋 SECTION 5: Cortex Agents
-- =============================================================================
-- Orchestrate multiple tools (Analyst + Search) in a single conversation.
-- Agents run with USER's role - unified governance across all tools.

-- 5.1 View existing agents
SHOW CORTEX AGENTS IN SCHEMA CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS;

-- 5.2 Describe the ATLAS agent
-- Note: Full agent details are accessed via REST API
-- DESCRIBE CORTEX AGENT CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.ATLAS_CAPITAL_AGENT;

-- 5.3 Grant agent usage to roles
-- GRANT USAGE ON CORTEX AGENT CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.ATLAS_CAPITAL_AGENT 
--     TO ROLE ATLAS_APP_ROLE;

-- 5.4 Agent requires access to ALL underlying tools:
-- ✅ SNOWFLAKE.CORTEX_USER or SNOWFLAKE.CORTEX_AGENT_USER role
-- ✅ USAGE on Cortex Search services the agent uses
-- ✅ READ on semantic model stage
-- ✅ SELECT on tables referenced in semantic model

-- 5.5 Example: Check agent tool permissions for a role
/*
-- Role needs these for ATLAS agent to work:
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON DATABASE CAPITAL_PROJECTS_DB TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.DOCS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.ATOMIC TO ROLE ATLAS_APP_ROLE;
GRANT SELECT ON ALL TABLES IN SCHEMA CAPITAL_PROJECTS_DB.ATOMIC TO ROLE ATLAS_APP_ROLE;
GRANT READ ON STAGE CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX AGENT CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.ATLAS_CAPITAL_AGENT TO ROLE ATLAS_APP_ROLE;
*/

-- 5.6 Monitor agent activity via query history
SELECT 
    QUERY_ID,
    QUERY_TEXT,
    USER_NAME,
    ROLE_NAME,
    START_TIME,
    TOTAL_ELAPSED_TIME
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE QUERY_TEXT ILIKE '%CORTEX%'
  AND START_TIME > DATEADD('hour', -24, CURRENT_TIMESTAMP())
ORDER BY START_TIME DESC
LIMIT 20;


-- =============================================================================
-- 📋 SECTION 6: Complete RBAC Setup for ATLAS
-- =============================================================================
-- This section shows the complete role hierarchy for production deployment.

-- 6.1 Create the ATLAS role hierarchy
/*
-- Functional roles
CREATE ROLE IF NOT EXISTS ATLAS_VIEWER;      -- Read-only access
CREATE ROLE IF NOT EXISTS ATLAS_ANALYST;     -- Can use Cortex functions
CREATE ROLE IF NOT EXISTS ATLAS_APP_ROLE;    -- Full app access (SPCS service)
CREATE ROLE IF NOT EXISTS ATLAS_ADMIN;       -- Administrative access

-- Hierarchy
GRANT ROLE ATLAS_VIEWER TO ROLE ATLAS_ANALYST;
GRANT ROLE ATLAS_ANALYST TO ROLE ATLAS_APP_ROLE;
GRANT ROLE ATLAS_APP_ROLE TO ROLE ATLAS_ADMIN;
GRANT ROLE ATLAS_ADMIN TO ROLE SYSADMIN;
*/

-- 6.2 ATLAS_VIEWER: Read-only, no Cortex
/*
GRANT USAGE ON DATABASE CAPITAL_PROJECTS_DB TO ROLE ATLAS_VIEWER;
GRANT USAGE ON ALL SCHEMAS IN DATABASE CAPITAL_PROJECTS_DB TO ROLE ATLAS_VIEWER;
GRANT SELECT ON ALL TABLES IN SCHEMA CAPITAL_PROJECTS_DB.ATOMIC TO ROLE ATLAS_VIEWER;
GRANT SELECT ON ALL VIEWS IN SCHEMA CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS TO ROLE ATLAS_VIEWER;
*/

-- 6.3 ATLAS_ANALYST: Viewer + Cortex LLM functions
/*
GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE ATLAS_ANALYST;
GRANT USAGE ON WAREHOUSE CAPITAL_COMPUTE_WH TO ROLE ATLAS_ANALYST;
*/

-- 6.4 ATLAS_APP_ROLE: Analyst + Search + Agents
/*
GRANT READ ON STAGE CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX AGENT CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.ATLAS_CAPITAL_AGENT TO ROLE ATLAS_APP_ROLE;
*/


-- =============================================================================
-- 📋 SECTION 7: Cost Monitoring & Governance
-- =============================================================================
-- Track Cortex usage for cost management and audit.

-- 7.1 LLM token usage (last 7 days)
-- Note: Requires ACCOUNTADMIN or SNOWFLAKE.USAGE_VIEWER role
/*
SELECT 
    DATE_TRUNC('day', START_TIME) AS USAGE_DATE,
    MODEL_NAME,
    SUM(TOKENS) AS TOTAL_TOKENS
FROM SNOWFLAKE.ACCOUNT_USAGE.METERING_HISTORY
WHERE SERVICE_TYPE = 'AI_SERVICES'
  AND START_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP())
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;
*/

-- 7.2 Overall credit consumption by service type
-- Note: Run this to see AI/Cortex costs
SELECT 
    DATE_TRUNC('day', START_TIME) AS DATE,
    SERVICE_TYPE,
    SUM(CREDITS_USED) AS TOTAL_CREDITS
FROM SNOWFLAKE.ACCOUNT_USAGE.METERING_HISTORY
WHERE SERVICE_TYPE IN ('AI_SERVICES', 'SERVERLESS_TASK')
  AND START_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP())
GROUP BY 1, 2
ORDER BY 1 DESC, 3 DESC;

-- 7.3 Query history showing Cortex function calls
SELECT 
    DATE_TRUNC('hour', START_TIME) AS HOUR,
    COUNT(*) AS CORTEX_QUERIES,
    SUM(CREDITS_USED_CLOUD_SERVICES) AS CREDITS
FROM SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY
WHERE QUERY_TEXT ILIKE '%SNOWFLAKE.CORTEX%'
  AND START_TIME > DATEADD('day', -7, CURRENT_TIMESTAMP())
GROUP BY 1
ORDER BY 1 DESC;


-- =============================================================================
-- 📋 SECTION 8: Security Best Practices Checklist
-- =============================================================================
/*
✅ CORTEX_USER role restricted (not granted to PUBLIC)
✅ Custom role hierarchy created (VIEWER → ANALYST → APP_ROLE → ADMIN)
✅ Semantic model stage secured (only authorized roles can READ)
✅ Search services have appropriate USAGE grants
✅ Agent access granted only to roles that need it
✅ Query history monitoring enabled for audit trail
✅ Cost monitoring dashboards configured
✅ Row-level security filters used in Search queries where needed

⚠️ REMEMBER:
- Cortex Search runs with OWNER's rights, not caller's
- Anyone with USAGE on a Search service can query ALL indexed data
- Use explicit filters for row-level access control
- Semantic model access ≠ table access (both required)
*/


-- =============================================================================
-- 🎯 DEMO SCRIPT: "Hidden Discovery" Showcase
-- =============================================================================
-- Run this sequence to demonstrate the full Cortex stack working together.

-- Step 1: Show the data (traditional view)
SELECT 
    ML_CATEGORY,
    COUNT(*) AS CO_COUNT,
    ROUND(SUM(APPROVED_AMOUNT), 0) AS TOTAL_AMOUNT
FROM ATOMIC.CHANGE_ORDER
WHERE STATUS = 'APPROVED'
GROUP BY 1
ORDER BY 3 DESC;

-- Step 2: Use Cortex Search to find the hidden pattern
SELECT * FROM TABLE(
    CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE(
        QUERY => 'grounding electrical specifications missing NEC code',
        LIMIT => 10
    )
);

-- Step 3: Quantify the pattern impact
SELECT 
    'HIDDEN PATTERN: Electrical Grounding' AS DISCOVERY,
    COUNT(*) AS CO_COUNT,
    COUNT(DISTINCT PROJECT_ID) AS PROJECTS_AFFECTED,
    ROUND(SUM(APPROVED_AMOUNT), 0) AS TOTAL_IMPACT,
    ROUND(AVG(APPROVED_AMOUNT), 0) AS AVG_CO_SIZE
FROM ATOMIC.CHANGE_ORDER
WHERE LOWER(REASON_TEXT) LIKE '%ground%'
  AND STATUS = 'APPROVED';

-- Step 4: Use LLM to explain the pattern
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'mistral-large',
    CONCAT(
        'You are a construction cost analyst. Explain why this pattern is significant:\n\n',
        'Finding: 150+ change orders across 12 projects mention "grounding" with total cost $1.45M.\n',
        'Average CO size: $9,500 (below typical review thresholds).\n',
        'Root cause appears to be a gap in the electrical specification template.\n\n',
        'Explain in 3 sentences why this is a "Hidden Discovery" that traditional reporting misses.'
    )
) AS PATTERN_EXPLANATION;

-- =============================================================================
-- 🏁 END OF DEMO
-- =============================================================================
-- This worksheet demonstrated:
-- 1. Core access control with CORTEX_USER role
-- 2. LLM functions (COMPLETE, SUMMARIZE, SENTIMENT, EMBED)
-- 3. Cortex Search for semantic document retrieval
-- 4. Cortex Analyst for natural language to SQL
-- 5. Cortex Agents for orchestrated AI workflows
-- 6. Complete RBAC setup for production
-- 7. Cost monitoring and governance
-- 8. The "Hidden Discovery" pattern that makes ATLAS valuable
-- =============================================================================
