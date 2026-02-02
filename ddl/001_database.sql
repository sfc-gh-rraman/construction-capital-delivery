-- ============================================================================
-- ATLAS Capital Delivery Intelligence Platform
-- Database and Schema Setup
-- ============================================================================

-- Create the main database
CREATE DATABASE IF NOT EXISTS CAPITAL_PROJECTS_DB;

USE DATABASE CAPITAL_PROJECTS_DB;

-- ============================================================================
-- SCHEMAS
-- ============================================================================

-- RAW: Landing zone for source system data
CREATE SCHEMA IF NOT EXISTS RAW;
COMMENT ON SCHEMA RAW IS 'Landing zone for P6, SAP, and document ingestion';

-- ATOMIC: Normalized enterprise data model
CREATE SCHEMA IF NOT EXISTS ATOMIC;
COMMENT ON SCHEMA ATOMIC IS 'Normalized entities following data dictionary standards';

-- CAPITAL_PROJECTS: Data mart for analytics and reporting
CREATE SCHEMA IF NOT EXISTS CAPITAL_PROJECTS;
COMMENT ON SCHEMA CAPITAL_PROJECTS IS 'Analytics-ready data mart with KPI calculations';

-- ML: Machine learning models, predictions, and explainability
CREATE SCHEMA IF NOT EXISTS ML;
COMMENT ON SCHEMA ML IS 'ML model artifacts, predictions, and SHAP/PDP explainability data';

-- DOCS: Document storage for Cortex Search
CREATE SCHEMA IF NOT EXISTS DOCS;
COMMENT ON SCHEMA DOCS IS 'Contract documents, specs, and CO narratives for Cortex Search';

-- SPCS: Snowpark Container Services
CREATE SCHEMA IF NOT EXISTS SPCS;
COMMENT ON SCHEMA SPCS IS 'Container services, image repositories, and compute pools';

-- ============================================================================
-- WAREHOUSES
-- ============================================================================

-- Compute warehouse for general queries
CREATE WAREHOUSE IF NOT EXISTS CAPITAL_COMPUTE_WH
    WAREHOUSE_SIZE = 'SMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE
    COMMENT = 'General compute for ATLAS queries';

-- ML warehouse for model training
CREATE WAREHOUSE IF NOT EXISTS CAPITAL_ML_WH
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 120
    AUTO_RESUME = TRUE
    COMMENT = 'ML training and inference workloads';

-- ============================================================================
-- STAGES
-- ============================================================================

USE SCHEMA RAW;

-- Stage for data file uploads
CREATE STAGE IF NOT EXISTS DATA_STAGE
    COMMENT = 'Stage for uploading parquet and CSV files';

-- Stage for document uploads
CREATE STAGE IF NOT EXISTS DOCS_STAGE
    COMMENT = 'Stage for contract documents and specs';

-- ============================================================================
-- FILE FORMATS
-- ============================================================================

CREATE FILE FORMAT IF NOT EXISTS PARQUET_FORMAT
    TYPE = 'PARQUET'
    COMPRESSION = 'SNAPPY';

CREATE FILE FORMAT IF NOT EXISTS CSV_FORMAT
    TYPE = 'CSV'
    FIELD_DELIMITER = ','
    SKIP_HEADER = 1
    FIELD_OPTIONALLY_ENCLOSED_BY = '"'
    NULL_IF = ('NULL', 'null', '');

CREATE FILE FORMAT IF NOT EXISTS JSON_FORMAT
    TYPE = 'JSON'
    STRIP_OUTER_ARRAY = TRUE;

-- ============================================================================
-- GRANTS (for SPCS service role)
-- ============================================================================

-- Create role for ATLAS application
CREATE ROLE IF NOT EXISTS ATLAS_APP_ROLE;

-- Grant database access
GRANT USAGE ON DATABASE CAPITAL_PROJECTS_DB TO ROLE ATLAS_APP_ROLE;

-- Grant schema access
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.RAW TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.ATOMIC TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.ML TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.DOCS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON SCHEMA CAPITAL_PROJECTS_DB.SPCS TO ROLE ATLAS_APP_ROLE;

-- Grant warehouse access
GRANT USAGE ON WAREHOUSE CAPITAL_COMPUTE_WH TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON WAREHOUSE CAPITAL_ML_WH TO ROLE ATLAS_APP_ROLE;

COMMENT ON DATABASE CAPITAL_PROJECTS_DB IS 
'ATLAS Capital Delivery Intelligence Platform - Mega-project portfolio management with ML-powered insights';
