-- ============================================================================
-- ATLAS Capital Delivery Intelligence Platform
-- ATOMIC Schema - Normalized Entity Tables
-- ============================================================================

USE DATABASE CAPITAL_PROJECTS_DB;
USE SCHEMA ATOMIC;

-- ============================================================================
-- PROJECT - Master project entity
-- ============================================================================
CREATE OR REPLACE TABLE PROJECT (
    PROJECT_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_NAME VARCHAR(255) NOT NULL,
    PROJECT_CODE VARCHAR(20),
    PROJECT_TYPE VARCHAR(50),           -- 'TRANSIT', 'HIGHWAY', 'UTILITY', 'FACILITY'
    STATUS VARCHAR(30),                  -- 'ACTIVE', 'ON_HOLD', 'COMPLETE', 'CANCELLED'
    
    -- Location
    CITY VARCHAR(100),
    STATE VARCHAR(50),
    LATITUDE FLOAT,
    LONGITUDE FLOAT,
    
    -- Dates
    PLANNED_START_DATE DATE,
    PLANNED_END_DATE DATE,
    ACTUAL_START_DATE DATE,
    ACTUAL_END_DATE DATE,
    
    -- Budget
    ORIGINAL_BUDGET FLOAT,
    CURRENT_BUDGET FLOAT,               -- After approved changes
    CONTINGENCY_BUDGET FLOAT,
    CONTINGENCY_USED FLOAT DEFAULT 0,
    
    -- Performance Indices
    CPI FLOAT,                          -- Cost Performance Index (EV/AC)
    SPI FLOAT,                          -- Schedule Performance Index (EV/PV)
    
    -- Metadata
    PROGRAM_ID VARCHAR(50),
    OWNER_NAME VARCHAR(255),
    PRIME_CONTRACTOR VARCHAR(255),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE PROJECT IS 'Master table of capital projects in the portfolio';

-- ============================================================================
-- VENDOR - Contractor/Subcontractor entity
-- ============================================================================
CREATE OR REPLACE TABLE VENDOR (
    VENDOR_ID VARCHAR(50) PRIMARY KEY,
    VENDOR_NAME VARCHAR(255) NOT NULL,
    VENDOR_CODE VARCHAR(20),
    TRADE_CATEGORY VARCHAR(100),        -- 'ELECTRICAL', 'MECHANICAL', 'CIVIL', 'STRUCTURAL'
    VENDOR_TYPE VARCHAR(50),            -- 'PRIME', 'SUBCONTRACTOR', 'SUPPLIER'
    
    -- Contact
    CONTACT_NAME VARCHAR(255),
    CONTACT_EMAIL VARCHAR(255),
    CONTACT_PHONE VARCHAR(50),
    ADDRESS VARCHAR(500),
    
    -- Performance Metrics (calculated)
    AVG_CO_RATE FLOAT,                  -- COs per $100K contracted
    ONTIME_DELIVERY_RATE FLOAT,         -- % of milestones on time
    SAFETY_INCIDENT_RATE FLOAT,
    QUALITY_SCORE FLOAT,
    
    -- Risk Score (ML-calculated)
    RISK_SCORE INT,                     -- 0-100, higher = more risk
    RISK_SCORE_DATE DATE,
    
    -- Metadata
    ACTIVE_FLAG BOOLEAN DEFAULT TRUE,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE VENDOR IS 'Contractors and subcontractors with performance metrics';

-- ============================================================================
-- PROJECT_BUDGET - Budget line items by cost code
-- ============================================================================
CREATE OR REPLACE TABLE PROJECT_BUDGET (
    BUDGET_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL REFERENCES PROJECT(PROJECT_ID),
    
    COST_CODE VARCHAR(20) NOT NULL,
    COST_CODE_NAME VARCHAR(255),
    COST_CATEGORY VARCHAR(100),         -- 'LABOR', 'MATERIALS', 'EQUIPMENT', 'SUBCONTRACT'
    
    -- Values
    ORIGINAL_VALUE FLOAT,
    APPROVED_CHANGES FLOAT DEFAULT 0,
    CURRENT_VALUE FLOAT,                -- Original + Approved Changes
    COMMITTED_VALUE FLOAT DEFAULT 0,    -- Contracts awarded
    ACTUAL_VALUE FLOAT DEFAULT 0,       -- Actual spend to date
    FORECAST_VALUE FLOAT,               -- Predicted final cost
    
    -- Variance
    VARIANCE_VALUE FLOAT,               -- Current - Forecast
    VARIANCE_PCT FLOAT,
    
    -- Metadata
    PERIOD_DATE DATE,                   -- Reporting period
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE PROJECT_BUDGET IS 'Budget breakdown by cost code with actuals and forecasts';

-- ============================================================================
-- CHANGE_ORDER - The heart of the "Hidden Discovery"
-- ============================================================================
CREATE OR REPLACE TABLE CHANGE_ORDER (
    CO_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL REFERENCES PROJECT(PROJECT_ID),
    VENDOR_ID VARCHAR(50) REFERENCES VENDOR(VENDOR_ID),
    
    -- Identification
    CO_NUMBER VARCHAR(30),
    CO_TITLE VARCHAR(500),
    
    -- Classification
    CO_TYPE VARCHAR(50),                -- 'SCOPE_CHANGE', 'DESIGN_ERROR', 'FIELD_CONDITION', 'OWNER_REQUEST'
    CO_CATEGORY VARCHAR(100),           -- Trade category affected
    COST_CODE VARCHAR(20),
    
    -- Amounts
    ORIGINAL_AMOUNT FLOAT,
    APPROVED_AMOUNT FLOAT,
    
    -- Status
    STATUS VARCHAR(30),                 -- 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'VOID'
    APPROVAL_LEVEL VARCHAR(30),         -- 'AUTO', 'PM', 'DIRECTOR', 'EXECUTIVE'
    
    -- Dates
    SUBMIT_DATE DATE,
    APPROVAL_DATE DATE,
    EFFECTIVE_DATE DATE,
    
    -- THE KEY FIELD FOR HIDDEN DISCOVERY
    REASON_TEXT VARCHAR(4000),          -- Free-text reason for change
    JUSTIFICATION VARCHAR(4000),
    
    -- ML Classifications (populated by CO_CLASSIFIER model)
    ML_CATEGORY VARCHAR(50),            -- 'SCOPE_GAP', 'DESIGN_ERROR', 'FIELD_CONDITION', etc.
    ML_CONFIDENCE FLOAT,
    ML_SCOPE_GAP_PROB FLOAT,
    ML_DESIGN_ERROR_PROB FLOAT,
    ML_FIELD_CONDITION_PROB FLOAT,
    
    -- Note: Text embedding for clustering can be added with:
    -- ALTER TABLE CHANGE_ORDER ADD COLUMN REASON_EMBEDDING VECTOR(FLOAT, 768);
    
    -- Metadata
    CREATED_BY VARCHAR(100),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CHANGE_ORDER IS 'Change orders with ML classification and text embeddings for pattern detection';

-- Enable search optimization for efficient filtering
-- Note: Uncomment after data is loaded
-- ALTER TABLE CHANGE_ORDER ADD SEARCH OPTIMIZATION ON EQUALITY(PROJECT_ID, VENDOR_ID, STATUS, ML_CATEGORY);

-- ============================================================================
-- PROJECT_ACTIVITY - Schedule activities (Gantt data)
-- ============================================================================
CREATE OR REPLACE TABLE PROJECT_ACTIVITY (
    ACTIVITY_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL REFERENCES PROJECT(PROJECT_ID),
    
    -- Identification
    ACTIVITY_CODE VARCHAR(50),
    ACTIVITY_NAME VARCHAR(500),
    WBS_CODE VARCHAR(50),               -- Work Breakdown Structure
    
    -- Hierarchy
    PARENT_ACTIVITY_ID VARCHAR(50),
    LEVEL_NUMBER INT,
    
    -- Classification
    ACTIVITY_TYPE VARCHAR(50),          -- 'TASK', 'MILESTONE', 'SUMMARY', 'LOE'
    PHASE VARCHAR(50),                  -- 'DESIGN', 'PROCUREMENT', 'CONSTRUCTION', 'COMMISSIONING'
    DISCIPLINE VARCHAR(50),             -- 'CIVIL', 'STRUCTURAL', 'ELECTRICAL', 'MECHANICAL'
    
    -- Planned Dates
    PLANNED_START DATE,
    PLANNED_FINISH DATE,
    PLANNED_DURATION INT,               -- Days
    
    -- Actual/Forecast Dates
    ACTUAL_START DATE,
    ACTUAL_FINISH DATE,
    FORECAST_START DATE,
    FORECAST_FINISH DATE,
    
    -- Progress
    PERCENT_COMPLETE FLOAT DEFAULT 0,
    
    -- Schedule Analysis
    TOTAL_FLOAT INT,                    -- Days of float
    FREE_FLOAT INT,
    IS_CRITICAL BOOLEAN DEFAULT FALSE,  -- On critical path
    
    -- Predecessor/Successor relationships stored in separate table
    
    -- ML Risk Prediction
    SLIP_PROBABILITY FLOAT,             -- 0-1, probability of missing planned finish
    PREDICTED_SLIP_DAYS INT,
    RISK_DRIVERS VARIANT,               -- JSON of contributing factors
    
    -- Resources
    ASSIGNED_VENDOR_ID VARCHAR(50) REFERENCES VENDOR(VENDOR_ID),
    BUDGETED_HOURS FLOAT,
    ACTUAL_HOURS FLOAT,
    
    -- Metadata
    DATA_DATE DATE,                     -- P6 data date
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    UPDATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE PROJECT_ACTIVITY IS 'Schedule activities with ML-based slip risk predictions';

-- ============================================================================
-- ACTIVITY_DEPENDENCY - Predecessor/Successor relationships
-- ============================================================================
CREATE OR REPLACE TABLE ACTIVITY_DEPENDENCY (
    DEPENDENCY_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL,
    PREDECESSOR_ID VARCHAR(50) NOT NULL REFERENCES PROJECT_ACTIVITY(ACTIVITY_ID),
    SUCCESSOR_ID VARCHAR(50) NOT NULL REFERENCES PROJECT_ACTIVITY(ACTIVITY_ID),
    
    DEPENDENCY_TYPE VARCHAR(10),        -- 'FS', 'SS', 'FF', 'SF'
    LAG_DAYS INT DEFAULT 0,
    
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE ACTIVITY_DEPENDENCY IS 'Activity predecessor/successor relationships';

-- ============================================================================
-- RFI - Request for Information (correlates with Change Orders)
-- ============================================================================
CREATE OR REPLACE TABLE RFI (
    RFI_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL REFERENCES PROJECT(PROJECT_ID),
    
    RFI_NUMBER VARCHAR(30),
    SUBJECT VARCHAR(500),
    DESCRIPTION VARCHAR(4000),
    
    -- Classification
    DISCIPLINE VARCHAR(50),
    PRIORITY VARCHAR(20),               -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    
    -- Status
    STATUS VARCHAR(30),                 -- 'OPEN', 'ANSWERED', 'CLOSED'
    
    -- Dates
    SUBMIT_DATE DATE,
    REQUIRED_DATE DATE,
    RESPONSE_DATE DATE,
    DAYS_OPEN INT,
    
    -- Related CO (if RFI led to a change)
    RELATED_CO_ID VARCHAR(50) REFERENCES CHANGE_ORDER(CO_ID),
    
    -- Metadata
    SUBMITTED_BY VARCHAR(100),
    ANSWERED_BY VARCHAR(100),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE RFI IS 'Requests for Information - leading indicator for Change Orders';

-- ============================================================================
-- MONTHLY_SNAPSHOT - Point-in-time portfolio snapshots for trending
-- ============================================================================
CREATE OR REPLACE TABLE MONTHLY_SNAPSHOT (
    SNAPSHOT_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL REFERENCES PROJECT(PROJECT_ID),
    SNAPSHOT_DATE DATE NOT NULL,
    
    -- Budget Metrics
    ORIGINAL_BUDGET FLOAT,
    CURRENT_BUDGET FLOAT,
    ACTUAL_COST FLOAT,
    FORECAST_COST FLOAT,
    EAC FLOAT,                          -- Estimate at Completion
    
    -- Earned Value
    BCWS FLOAT,                         -- Budgeted Cost of Work Scheduled (PV)
    BCWP FLOAT,                         -- Budgeted Cost of Work Performed (EV)
    ACWP FLOAT,                         -- Actual Cost of Work Performed (AC)
    
    -- Indices
    CPI FLOAT,
    SPI FLOAT,
    TCPI FLOAT,                         -- To-Complete Performance Index
    
    -- Contingency
    CONTINGENCY_REMAINING FLOAT,
    CONTINGENCY_BURN_RATE FLOAT,        -- Monthly burn
    
    -- Change Orders
    CO_COUNT_MTD INT,
    CO_AMOUNT_MTD FLOAT,
    CO_COUNT_CUMULATIVE INT,
    CO_AMOUNT_CUMULATIVE FLOAT,
    
    -- Schedule
    PERCENT_COMPLETE FLOAT,
    DAYS_AHEAD_BEHIND INT,              -- Positive = ahead, negative = behind
    
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE MONTHLY_SNAPSHOT IS 'Monthly point-in-time snapshots for trend analysis';

-- ============================================================================
-- CLUSTERING KEYS (Snowflake's optimization mechanism)
-- ============================================================================
-- Note: Clustering is automatically managed in Snowflake
-- For large tables, consider adding clustering keys:
-- ALTER TABLE PROJECT CLUSTER BY (STATUS, PROJECT_TYPE);
-- ALTER TABLE CHANGE_ORDER CLUSTER BY (PROJECT_ID, STATUS);
-- ALTER TABLE PROJECT_ACTIVITY CLUSTER BY (PROJECT_ID, PHASE);
-- ALTER TABLE MONTHLY_SNAPSHOT CLUSTER BY (PROJECT_ID, SNAPSHOT_DATE);
