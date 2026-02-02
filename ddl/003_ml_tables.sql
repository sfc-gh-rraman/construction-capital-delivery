-- ============================================================================
-- ATLAS Capital Delivery Intelligence Platform
-- ML Schema - Model Artifacts and Explainability Tables
-- ============================================================================

USE DATABASE CAPITAL_PROJECTS_DB;
USE SCHEMA ML;

-- ============================================================================
-- GLOBAL_FEATURE_IMPORTANCE - SHAP importance rankings per model
-- ============================================================================
CREATE OR REPLACE TABLE GLOBAL_FEATURE_IMPORTANCE (
    IMPORTANCE_ID NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_NAME VARCHAR(100) NOT NULL,
    MODEL_VERSION VARCHAR(20),
    FEATURE_NAME VARCHAR(100) NOT NULL,
    SHAP_IMPORTANCE FLOAT NOT NULL,
    SHAP_IMPORTANCE_STD FLOAT,
    IMPORTANCE_RANK INT,
    FEATURE_DIRECTION VARCHAR(20),      -- 'positive' or 'negative'
    TRAINING_SAMPLES INT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE GLOBAL_FEATURE_IMPORTANCE IS 
'SHAP-based global feature importance for each ML model';

-- ============================================================================
-- PARTIAL_DEPENDENCE_CURVES - PDP data for feature effect visualization
-- ============================================================================
CREATE OR REPLACE TABLE PARTIAL_DEPENDENCE_CURVES (
    PDP_ID NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_NAME VARCHAR(100) NOT NULL,
    MODEL_VERSION VARCHAR(20),
    FEATURE_NAME VARCHAR(100) NOT NULL,
    FEATURE_VALUE FLOAT NOT NULL,
    PREDICTED_VALUE FLOAT NOT NULL,
    LOWER_BOUND FLOAT,                  -- 10th percentile ICE
    UPPER_BOUND FLOAT,                  -- 90th percentile ICE
    ICE_STD FLOAT,
    SAMPLE_COUNT INT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE PARTIAL_DEPENDENCE_CURVES IS 
'Partial Dependence Plot data showing marginal effect of features on predictions';

-- ============================================================================
-- MODEL_METRICS - Accuracy, precision, recall, F1, AUC per model
-- ============================================================================
CREATE OR REPLACE TABLE MODEL_METRICS (
    METRIC_ID NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_NAME VARCHAR(100) NOT NULL,
    MODEL_VERSION VARCHAR(20),
    METRIC_NAME VARCHAR(50) NOT NULL,   -- 'accuracy', 'precision', 'recall', 'f1', 'auc', 'rmse', 'mae', 'r2'
    METRIC_VALUE FLOAT NOT NULL,
    METRIC_CONTEXT VARCHAR(50),         -- 'train', 'test', 'validation'
    SAMPLE_COUNT INT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE MODEL_METRICS IS 'Performance metrics for all ML models';

-- ============================================================================
-- CONFUSION_MATRIX - Classification results
-- ============================================================================
CREATE OR REPLACE TABLE CONFUSION_MATRIX (
    CM_ID NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_NAME VARCHAR(100) NOT NULL,
    MODEL_VERSION VARCHAR(20),
    ACTUAL_CLASS VARCHAR(100) NOT NULL,
    PREDICTED_CLASS VARCHAR(100) NOT NULL,
    COUNT INT NOT NULL,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CONFUSION_MATRIX IS 'Confusion matrix data for classification models';

-- ============================================================================
-- CALIBRATION_CURVES - Probability calibration for classifiers
-- ============================================================================
CREATE OR REPLACE TABLE CALIBRATION_CURVES (
    CALIBRATION_ID NUMBER AUTOINCREMENT PRIMARY KEY,
    MODEL_NAME VARCHAR(100) NOT NULL,
    MODEL_VERSION VARCHAR(20),
    PREDICTED_PROB_BIN FLOAT NOT NULL,  -- e.g., 0.1, 0.2, ... 1.0
    ACTUAL_FREQUENCY FLOAT NOT NULL,    -- Observed frequency in that bin
    BIN_COUNT INT,
    COMPUTED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CALIBRATION_CURVES IS 
'Calibration data for probability models - shows reliability of predictions';

-- ============================================================================
-- EAC_PREDICTIONS - Estimate at Completion forecasts
-- ============================================================================
CREATE OR REPLACE TABLE EAC_PREDICTIONS (
    PREDICTION_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL,
    PREDICTION_DATE DATE NOT NULL,
    
    -- Current State
    CURRENT_BUDGET FLOAT,
    ACTUAL_TO_DATE FLOAT,
    PERCENT_COMPLETE FLOAT,
    
    -- Predictions
    PREDICTED_EAC FLOAT NOT NULL,
    CONFIDENCE_INTERVAL_LOW FLOAT,
    CONFIDENCE_INTERVAL_HIGH FLOAT,
    
    -- Comparison to Budget
    VARIANCE_FROM_BUDGET FLOAT,
    VARIANCE_PCT FLOAT,
    
    -- Top Contributing Features
    TOP_DRIVERS VARIANT,                -- JSON: [{"feature": "co_count", "contribution": 0.32}, ...]
    
    -- Model Info
    MODEL_NAME VARCHAR(100),
    MODEL_VERSION VARCHAR(20),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE EAC_PREDICTIONS IS 
'ML-predicted Estimate at Completion with feature contributions';

-- ============================================================================
-- CO_CLASSIFICATIONS - Change Order auto-categorization
-- ============================================================================
CREATE OR REPLACE TABLE CO_CLASSIFICATIONS (
    CLASSIFICATION_ID VARCHAR(50) PRIMARY KEY,
    CO_ID VARCHAR(50) NOT NULL,
    PROJECT_ID VARCHAR(50),
    
    -- Classification Results
    PREDICTED_CLASS VARCHAR(50) NOT NULL,
    CONFIDENCE FLOAT,
    
    -- Class Probabilities
    SCOPE_GAP_PROB FLOAT,
    DESIGN_ERROR_PROB FLOAT,
    FIELD_CONDITION_PROB FLOAT,
    OWNER_REQUEST_PROB FLOAT,
    REWORK_PROB FLOAT,
    
    -- SHAP Explanations
    SHAP_CONTRIBUTIONS VARIANT,         -- JSON: {"keyword_grounding": 0.42, "vendor_history": 0.15, ...}
    TOP_KEYWORDS ARRAY,                 -- Keywords that influenced classification
    
    -- Clustering
    CLUSTER_ID INT,                     -- For grouping similar COs
    CLUSTER_LABEL VARCHAR(100),         -- Human-readable cluster name
    
    -- Model Info
    MODEL_NAME VARCHAR(100),
    MODEL_VERSION VARCHAR(20),
    CLASSIFIED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CO_CLASSIFICATIONS IS 
'ML-classified Change Orders with SHAP explanations - key to Hidden Discovery';

-- ============================================================================
-- SCHEDULE_RISK_PREDICTIONS - Activity slip predictions
-- ============================================================================
CREATE OR REPLACE TABLE SCHEDULE_RISK_PREDICTIONS (
    PREDICTION_ID VARCHAR(50) PRIMARY KEY,
    ACTIVITY_ID VARCHAR(50) NOT NULL,
    PROJECT_ID VARCHAR(50) NOT NULL,
    PREDICTION_DATE DATE NOT NULL,
    
    -- Risk Prediction
    SLIP_PROBABILITY FLOAT NOT NULL,    -- 0-1
    PREDICTED_SLIP_DAYS INT,
    RISK_LEVEL VARCHAR(20),             -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    -- Feature Contributions
    RISK_DRIVERS VARIANT,               -- JSON: {"predecessor_delay": 0.35, "resource_constraint": 0.25, ...}
    
    -- Calibrated Probability
    CALIBRATED_PROBABILITY FLOAT,       -- After calibration adjustment
    
    -- Model Info
    MODEL_NAME VARCHAR(100),
    MODEL_VERSION VARCHAR(20),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE SCHEDULE_RISK_PREDICTIONS IS 
'ML predictions for activity schedule slip risk with contributing factors';

-- ============================================================================
-- VENDOR_RISK_SCORES - Subcontractor risk assessment
-- ============================================================================
CREATE OR REPLACE TABLE VENDOR_RISK_SCORES (
    SCORE_ID VARCHAR(50) PRIMARY KEY,
    VENDOR_ID VARCHAR(50) NOT NULL,
    SCORE_DATE DATE NOT NULL,
    
    -- Risk Score
    RISK_SCORE INT NOT NULL,            -- 0-100, higher = more risk
    RISK_TIER VARCHAR(20),              -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    -- Component Scores
    CO_RATE_SCORE INT,                  -- Based on historical CO frequency
    ONTIME_SCORE INT,                   -- Based on schedule performance
    QUALITY_SCORE INT,                  -- Based on rework rate
    SAFETY_SCORE INT,                   -- Based on incident rate
    
    -- Benchmarks
    CO_RATE_PERCENTILE FLOAT,           -- vs. trade category average
    ONTIME_PERCENTILE FLOAT,
    
    -- Feature Importance for this vendor
    SCORE_DRIVERS VARIANT,              -- JSON explaining the score
    
    -- Model Info
    MODEL_NAME VARCHAR(100),
    MODEL_VERSION VARCHAR(20),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE VENDOR_RISK_SCORES IS 
'ML-calculated vendor risk scores for subcontractor evaluation';

-- ============================================================================
-- CONTINGENCY_FORECASTS - Contingency depletion predictions
-- ============================================================================
CREATE OR REPLACE TABLE CONTINGENCY_FORECASTS (
    FORECAST_ID VARCHAR(50) PRIMARY KEY,
    PROJECT_ID VARCHAR(50) NOT NULL,
    FORECAST_DATE DATE NOT NULL,
    
    -- Current State
    CONTINGENCY_TOTAL FLOAT,
    CONTINGENCY_USED FLOAT,
    CONTINGENCY_REMAINING FLOAT,
    
    -- Burn Rate
    BURN_RATE_30D FLOAT,                -- Last 30 days
    BURN_RATE_60D FLOAT,                -- Last 60 days
    BURN_RATE_90D FLOAT,                -- Last 90 days
    
    -- Predictions
    PREDICTED_DEPLETION_DATE DATE,      -- When will it run out?
    PREDICTED_FINAL_REMAINING FLOAT,    -- At project completion
    
    -- Confidence
    DEPLETION_DATE_LOW DATE,            -- Optimistic
    DEPLETION_DATE_HIGH DATE,           -- Pessimistic
    
    -- Model Info
    MODEL_NAME VARCHAR(100),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CONTINGENCY_FORECASTS IS 
'ML predictions for contingency fund depletion timing';

-- ============================================================================
-- SCOPE_LEAKAGE_ALERTS - The "Hidden Discovery" alerts
-- ============================================================================
CREATE OR REPLACE TABLE SCOPE_LEAKAGE_ALERTS (
    ALERT_ID VARCHAR(50) PRIMARY KEY,
    ALERT_DATE DATE NOT NULL,
    
    -- Pattern Detection
    PATTERN_TYPE VARCHAR(100),          -- 'MISSING_SPEC', 'DESIGN_GAP', 'BID_OMISSION'
    PATTERN_DESCRIPTION VARCHAR(1000),
    
    -- Affected Scope
    AFFECTED_PROJECTS ARRAY,            -- List of project IDs
    PROJECT_COUNT INT,
    
    -- Change Orders in Pattern
    CO_IDS ARRAY,                       -- List of related CO IDs
    CO_COUNT INT,
    
    -- Financial Impact
    INDIVIDUAL_CO_AVG FLOAT,            -- Average individual CO amount
    AGGREGATE_AMOUNT FLOAT,             -- Total pattern impact
    
    -- Root Cause Analysis
    COMMON_KEYWORDS ARRAY,              -- Shared keywords in CO text
    COMMON_VENDOR_ID VARCHAR(50),       -- If pattern is vendor-specific
    COMMON_TRADE VARCHAR(100),
    
    -- Recommendation
    RECOMMENDED_ACTION VARCHAR(2000),
    ESTIMATED_SAVINGS FLOAT,            -- If fixed upstream
    
    -- Status
    STATUS VARCHAR(30),                 -- 'NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'
    ACKNOWLEDGED_BY VARCHAR(100),
    RESOLVED_DATE DATE,
    
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE SCOPE_LEAKAGE_ALERTS IS 
'AI-detected scope leakage patterns - the Hidden Discovery feature';

-- ============================================================================
-- CLUSTERING KEYS (for large tables)
-- ============================================================================
-- Snowflake uses micro-partitioning and automatic clustering
-- For tables that grow large, consider:
-- ALTER TABLE EAC_PREDICTIONS CLUSTER BY (PROJECT_ID, PREDICTION_DATE);
-- ALTER TABLE CO_CLASSIFICATIONS CLUSTER BY (CO_ID, CLUSTER_ID);
-- ALTER TABLE SCHEDULE_RISK_PREDICTIONS CLUSTER BY (PROJECT_ID, ACTIVITY_ID);
-- ALTER TABLE VENDOR_RISK_SCORES CLUSTER BY (VENDOR_ID, SCORE_DATE);
