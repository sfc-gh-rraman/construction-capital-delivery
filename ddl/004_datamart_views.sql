-- ============================================================================
-- ATLAS Capital Delivery Intelligence Platform
-- CAPITAL_PROJECTS Schema - Analytics Views and Data Mart
-- ============================================================================

USE DATABASE CAPITAL_PROJECTS_DB;
USE SCHEMA CAPITAL_PROJECTS;

-- ============================================================================
-- PORTFOLIO_SUMMARY - Executive dashboard view
-- ============================================================================
CREATE OR REPLACE VIEW PORTFOLIO_SUMMARY AS
SELECT 
    COUNT(DISTINCT PROJECT_ID) AS TOTAL_PROJECTS,
    SUM(ORIGINAL_BUDGET) AS TOTAL_ORIGINAL_BUDGET,
    SUM(CURRENT_BUDGET) AS TOTAL_CURRENT_BUDGET,
    SUM(CONTINGENCY_BUDGET) AS TOTAL_CONTINGENCY,
    SUM(CONTINGENCY_USED) AS TOTAL_CONTINGENCY_USED,
    SUM(CONTINGENCY_BUDGET) - SUM(CONTINGENCY_USED) AS CONTINGENCY_REMAINING,
    ROUND(AVG(CPI), 3) AS AVG_CPI,
    ROUND(AVG(SPI), 3) AS AVG_SPI,
    COUNT(CASE WHEN CPI < 0.95 THEN 1 END) AS PROJECTS_OVER_BUDGET,
    COUNT(CASE WHEN SPI < 0.95 THEN 1 END) AS PROJECTS_BEHIND_SCHEDULE,
    COUNT(CASE WHEN STATUS = 'ACTIVE' THEN 1 END) AS ACTIVE_PROJECTS
FROM ATOMIC.PROJECT;

COMMENT ON VIEW PORTFOLIO_SUMMARY IS 'High-level portfolio KPIs for executive dashboard';

-- ============================================================================
-- PROJECT_HEALTH - Project-level health scorecard
-- ============================================================================
CREATE OR REPLACE VIEW PROJECT_HEALTH AS
SELECT 
    p.PROJECT_ID,
    p.PROJECT_NAME,
    p.PROJECT_TYPE,
    p.STATUS,
    p.CITY,
    p.STATE,
    p.LATITUDE,
    p.LONGITUDE,
    
    -- Budget Health
    p.ORIGINAL_BUDGET,
    p.CURRENT_BUDGET,
    p.CPI,
    p.SPI,
    
    -- Contingency
    p.CONTINGENCY_BUDGET,
    p.CONTINGENCY_USED,
    p.CONTINGENCY_BUDGET - p.CONTINGENCY_USED AS CONTINGENCY_REMAINING,
    ROUND((p.CONTINGENCY_USED / NULLIF(p.CONTINGENCY_BUDGET, 0)) * 100, 1) AS CONTINGENCY_BURN_PCT,
    
    -- EAC (from ML predictions)
    eac.PREDICTED_EAC,
    eac.VARIANCE_FROM_BUDGET AS EAC_VARIANCE,
    
    -- Risk Level
    CASE 
        WHEN p.CPI < 0.9 OR p.SPI < 0.9 THEN 'CRITICAL'
        WHEN p.CPI < 0.95 OR p.SPI < 0.95 THEN 'HIGH'
        WHEN p.CPI < 1.0 OR p.SPI < 1.0 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS RISK_LEVEL,
    
    -- Change Order Metrics
    co.CO_COUNT,
    co.CO_TOTAL_AMOUNT,
    co.AVG_CO_AMOUNT,
    co.SCOPE_GAP_COUNT,
    
    -- Schedule
    p.PLANNED_END_DATE,
    p.ACTUAL_END_DATE,
    DATEDIFF('day', p.PLANNED_END_DATE, COALESCE(p.ACTUAL_END_DATE, CURRENT_DATE())) AS DAYS_VARIANCE

FROM ATOMIC.PROJECT p
LEFT JOIN (
    SELECT 
        PROJECT_ID,
        PREDICTED_EAC,
        VARIANCE_FROM_BUDGET
    FROM ML.EAC_PREDICTIONS
    WHERE PREDICTION_DATE = (SELECT MAX(PREDICTION_DATE) FROM ML.EAC_PREDICTIONS)
) eac ON p.PROJECT_ID = eac.PROJECT_ID
LEFT JOIN (
    SELECT 
        PROJECT_ID,
        COUNT(*) AS CO_COUNT,
        SUM(APPROVED_AMOUNT) AS CO_TOTAL_AMOUNT,
        AVG(APPROVED_AMOUNT) AS AVG_CO_AMOUNT,
        SUM(CASE WHEN ML_CATEGORY = 'SCOPE_GAP' THEN 1 ELSE 0 END) AS SCOPE_GAP_COUNT
    FROM ATOMIC.CHANGE_ORDER
    WHERE STATUS = 'APPROVED'
    GROUP BY PROJECT_ID
) co ON p.PROJECT_ID = co.PROJECT_ID;

COMMENT ON VIEW PROJECT_HEALTH IS 'Comprehensive project health view with ML predictions';

-- ============================================================================
-- CHANGE_ORDER_ANALYTICS - CO analysis for pattern detection
-- ============================================================================
CREATE OR REPLACE VIEW CHANGE_ORDER_ANALYTICS AS
SELECT 
    co.CO_ID,
    co.PROJECT_ID,
    p.PROJECT_NAME,
    co.VENDOR_ID,
    v.VENDOR_NAME,
    v.TRADE_CATEGORY,
    
    co.CO_NUMBER,
    co.CO_TITLE,
    co.REASON_TEXT,
    
    co.APPROVED_AMOUNT,
    co.STATUS,
    co.APPROVAL_LEVEL,
    co.SUBMIT_DATE,
    co.APPROVAL_DATE,
    
    -- ML Classifications
    co.ML_CATEGORY,
    co.ML_CONFIDENCE,
    co.ML_SCOPE_GAP_PROB,
    
    -- Cluster info (for pattern detection)
    cls.CLUSTER_ID,
    cls.CLUSTER_LABEL,
    cls.TOP_KEYWORDS,
    cls.SHAP_CONTRIBUTIONS,
    
    -- Flags
    CASE WHEN co.APPROVED_AMOUNT < 5000 THEN TRUE ELSE FALSE END AS IS_SMALL_CO,
    CASE WHEN co.APPROVAL_LEVEL = 'AUTO' THEN TRUE ELSE FALSE END AS IS_AUTO_APPROVED,
    CASE WHEN co.ML_SCOPE_GAP_PROB > 0.7 THEN TRUE ELSE FALSE END AS IS_LIKELY_SCOPE_GAP

FROM ATOMIC.CHANGE_ORDER co
JOIN ATOMIC.PROJECT p ON co.PROJECT_ID = p.PROJECT_ID
LEFT JOIN ATOMIC.VENDOR v ON co.VENDOR_ID = v.VENDOR_ID
LEFT JOIN ML.CO_CLASSIFICATIONS cls ON co.CO_ID = cls.CO_ID;

COMMENT ON VIEW CHANGE_ORDER_ANALYTICS IS 'Change Orders enriched with ML classification and cluster data';

-- ============================================================================
-- SCOPE_LEAKAGE_SUMMARY - Pattern detection summary
-- ============================================================================
CREATE OR REPLACE VIEW SCOPE_LEAKAGE_SUMMARY AS
WITH co_patterns AS (
    SELECT 
        cls.CLUSTER_ID,
        cls.CLUSTER_LABEL,
        COUNT(DISTINCT co.CO_ID) AS CO_COUNT,
        COUNT(DISTINCT co.PROJECT_ID) AS PROJECT_COUNT,
        SUM(co.APPROVED_AMOUNT) AS TOTAL_AMOUNT,
        AVG(co.APPROVED_AMOUNT) AS AVG_AMOUNT,
        MODE(v.VENDOR_NAME) AS COMMON_VENDOR,
        MODE(v.TRADE_CATEGORY) AS COMMON_TRADE,
        LISTAGG(DISTINCT p.PROJECT_NAME, ', ') WITHIN GROUP (ORDER BY p.PROJECT_NAME) AS AFFECTED_PROJECTS
    FROM ATOMIC.CHANGE_ORDER co
    JOIN ML.CO_CLASSIFICATIONS cls ON co.CO_ID = cls.CO_ID
    JOIN ATOMIC.PROJECT p ON co.PROJECT_ID = p.PROJECT_ID
    LEFT JOIN ATOMIC.VENDOR v ON co.VENDOR_ID = v.VENDOR_ID
    WHERE cls.CLUSTER_ID IS NOT NULL
      AND cls.PREDICTED_CLASS = 'SCOPE_GAP'
    GROUP BY cls.CLUSTER_ID, cls.CLUSTER_LABEL
)
SELECT 
    CLUSTER_ID,
    CLUSTER_LABEL AS PATTERN_NAME,
    CO_COUNT,
    PROJECT_COUNT,
    TOTAL_AMOUNT,
    AVG_AMOUNT,
    COMMON_VENDOR,
    COMMON_TRADE,
    AFFECTED_PROJECTS,
    -- Risk Score: More projects + more COs + higher amount = higher risk
    ROUND((PROJECT_COUNT * 10 + CO_COUNT * 2 + (TOTAL_AMOUNT / 100000)), 0) AS PATTERN_RISK_SCORE
FROM co_patterns
WHERE CO_COUNT >= 5  -- Only show patterns with 5+ COs
ORDER BY TOTAL_AMOUNT DESC;

COMMENT ON VIEW SCOPE_LEAKAGE_SUMMARY IS 'Aggregated scope leakage patterns - THE HIDDEN DISCOVERY VIEW';

-- ============================================================================
-- VENDOR_PERFORMANCE - Vendor scorecard
-- ============================================================================
CREATE OR REPLACE VIEW VENDOR_PERFORMANCE AS
SELECT 
    v.VENDOR_ID,
    v.VENDOR_NAME,
    v.TRADE_CATEGORY,
    v.VENDOR_TYPE,
    
    -- Contract Metrics
    COUNT(DISTINCT co.PROJECT_ID) AS PROJECTS_ACTIVE,
    SUM(b.COMMITTED_VALUE) AS TOTAL_CONTRACT_VALUE,
    
    -- CO Performance
    COUNT(co.CO_ID) AS CO_COUNT,
    SUM(co.APPROVED_AMOUNT) AS CO_TOTAL_AMOUNT,
    ROUND(SUM(co.APPROVED_AMOUNT) / NULLIF(SUM(b.COMMITTED_VALUE), 0) * 100, 2) AS CO_RATE_PCT,
    
    -- ML Risk Score
    rs.RISK_SCORE,
    rs.RISK_TIER,
    rs.CO_RATE_PERCENTILE,
    rs.ONTIME_PERCENTILE,
    
    -- Performance
    v.ONTIME_DELIVERY_RATE,
    v.QUALITY_SCORE,
    v.SAFETY_INCIDENT_RATE

FROM ATOMIC.VENDOR v
LEFT JOIN ATOMIC.CHANGE_ORDER co ON v.VENDOR_ID = co.VENDOR_ID AND co.STATUS = 'APPROVED'
LEFT JOIN ATOMIC.PROJECT_BUDGET b ON v.VENDOR_ID = b.PROJECT_ID  -- Simplified; would need contract table
LEFT JOIN (
    SELECT VENDOR_ID, RISK_SCORE, RISK_TIER, CO_RATE_PERCENTILE, ONTIME_PERCENTILE
    FROM ML.VENDOR_RISK_SCORES
    WHERE SCORE_DATE = (SELECT MAX(SCORE_DATE) FROM ML.VENDOR_RISK_SCORES)
) rs ON v.VENDOR_ID = rs.VENDOR_ID
WHERE v.ACTIVE_FLAG = TRUE
GROUP BY v.VENDOR_ID, v.VENDOR_NAME, v.TRADE_CATEGORY, v.VENDOR_TYPE,
         rs.RISK_SCORE, rs.RISK_TIER, rs.CO_RATE_PERCENTILE, rs.ONTIME_PERCENTILE,
         v.ONTIME_DELIVERY_RATE, v.QUALITY_SCORE, v.SAFETY_INCIDENT_RATE;

COMMENT ON VIEW VENDOR_PERFORMANCE IS 'Vendor performance scorecard with ML risk scores';

-- ============================================================================
-- SCHEDULE_RISK_DASHBOARD - Activities at risk
-- ============================================================================
CREATE OR REPLACE VIEW SCHEDULE_RISK_DASHBOARD AS
SELECT 
    a.ACTIVITY_ID,
    a.PROJECT_ID,
    p.PROJECT_NAME,
    a.ACTIVITY_NAME,
    a.PHASE,
    a.DISCIPLINE,
    a.IS_CRITICAL,
    
    -- Dates
    a.PLANNED_START,
    a.PLANNED_FINISH,
    a.FORECAST_FINISH,
    a.PERCENT_COMPLETE,
    a.TOTAL_FLOAT,
    
    -- Risk Prediction
    r.SLIP_PROBABILITY,
    r.PREDICTED_SLIP_DAYS,
    r.RISK_LEVEL,
    r.RISK_DRIVERS,
    
    -- Assigned Vendor
    v.VENDOR_NAME,
    vs.RISK_SCORE AS VENDOR_RISK_SCORE

FROM ATOMIC.PROJECT_ACTIVITY a
JOIN ATOMIC.PROJECT p ON a.PROJECT_ID = p.PROJECT_ID
LEFT JOIN ML.SCHEDULE_RISK_PREDICTIONS r ON a.ACTIVITY_ID = r.ACTIVITY_ID
    AND r.PREDICTION_DATE = (SELECT MAX(PREDICTION_DATE) FROM ML.SCHEDULE_RISK_PREDICTIONS)
LEFT JOIN ATOMIC.VENDOR v ON a.ASSIGNED_VENDOR_ID = v.VENDOR_ID
LEFT JOIN ML.VENDOR_RISK_SCORES vs ON v.VENDOR_ID = vs.VENDOR_ID
WHERE a.PERCENT_COMPLETE < 100
  AND a.PLANNED_FINISH >= CURRENT_DATE()
ORDER BY r.SLIP_PROBABILITY DESC NULLS LAST;

COMMENT ON VIEW SCHEDULE_RISK_DASHBOARD IS 'Activities at risk of schedule slip with ML predictions';

-- ============================================================================
-- CONTINGENCY_BURN_ANALYSIS - Contingency health
-- ============================================================================
CREATE OR REPLACE VIEW CONTINGENCY_BURN_ANALYSIS AS
SELECT 
    p.PROJECT_ID,
    p.PROJECT_NAME,
    p.CONTINGENCY_BUDGET,
    p.CONTINGENCY_USED,
    p.CONTINGENCY_BUDGET - p.CONTINGENCY_USED AS CONTINGENCY_REMAINING,
    ROUND((p.CONTINGENCY_USED / NULLIF(p.CONTINGENCY_BUDGET, 0)) * 100, 1) AS BURN_PCT,
    
    -- Percent Complete
    COALESCE(
        (SELECT AVG(PERCENT_COMPLETE) FROM ATOMIC.PROJECT_ACTIVITY WHERE PROJECT_ID = p.PROJECT_ID),
        0
    ) AS PROJECT_PCT_COMPLETE,
    
    -- Burn Rate vs Progress (should be roughly equal)
    ROUND((p.CONTINGENCY_USED / NULLIF(p.CONTINGENCY_BUDGET, 0)) * 100, 1) - 
        COALESCE((SELECT AVG(PERCENT_COMPLETE) FROM ATOMIC.PROJECT_ACTIVITY WHERE PROJECT_ID = p.PROJECT_ID), 0) 
        AS BURN_VS_PROGRESS_DELTA,
    
    -- Forecast
    f.PREDICTED_DEPLETION_DATE,
    f.PREDICTED_FINAL_REMAINING,
    
    -- Status
    CASE 
        WHEN p.CONTINGENCY_USED / NULLIF(p.CONTINGENCY_BUDGET, 0) > 0.9 THEN 'CRITICAL'
        WHEN p.CONTINGENCY_USED / NULLIF(p.CONTINGENCY_BUDGET, 0) > 0.75 THEN 'HIGH'
        WHEN p.CONTINGENCY_USED / NULLIF(p.CONTINGENCY_BUDGET, 0) > 0.5 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS BURN_STATUS

FROM ATOMIC.PROJECT p
LEFT JOIN ML.CONTINGENCY_FORECASTS f ON p.PROJECT_ID = f.PROJECT_ID
    AND f.FORECAST_DATE = (SELECT MAX(FORECAST_DATE) FROM ML.CONTINGENCY_FORECASTS)
WHERE p.STATUS = 'ACTIVE';

COMMENT ON VIEW CONTINGENCY_BURN_ANALYSIS IS 'Contingency fund burn rate analysis with ML forecasts';

-- ============================================================================
-- MONTHLY_TREND - Time series for S-curves
-- ============================================================================
CREATE OR REPLACE VIEW MONTHLY_TREND AS
SELECT 
    s.PROJECT_ID,
    p.PROJECT_NAME,
    s.SNAPSHOT_DATE,
    
    -- Budget
    s.ORIGINAL_BUDGET,
    s.CURRENT_BUDGET,
    s.ACTUAL_COST,
    s.FORECAST_COST,
    s.EAC,
    
    -- Earned Value
    s.BCWS AS PLANNED_VALUE,
    s.BCWP AS EARNED_VALUE,
    s.ACWP AS ACTUAL_COST_EV,
    
    -- Indices
    s.CPI,
    s.SPI,
    
    -- Progress
    s.PERCENT_COMPLETE,
    s.DAYS_AHEAD_BEHIND,
    
    -- Change Orders
    s.CO_COUNT_MTD,
    s.CO_AMOUNT_MTD,
    s.CO_COUNT_CUMULATIVE,
    s.CO_AMOUNT_CUMULATIVE,
    
    -- Contingency
    s.CONTINGENCY_REMAINING,
    s.CONTINGENCY_BURN_RATE

FROM ATOMIC.MONTHLY_SNAPSHOT s
JOIN ATOMIC.PROJECT p ON s.PROJECT_ID = p.PROJECT_ID
ORDER BY s.PROJECT_ID, s.SNAPSHOT_DATE;

COMMENT ON VIEW MONTHLY_TREND IS 'Monthly time series data for S-curve and trend analysis';

-- ============================================================================
-- MAP_DATA - Geospatial view for map visualization
-- ============================================================================
CREATE OR REPLACE VIEW MAP_DATA AS
SELECT 
    PROJECT_ID,
    PROJECT_NAME,
    PROJECT_TYPE,
    STATUS,
    CITY,
    STATE,
    LATITUDE,
    LONGITUDE,
    CURRENT_BUDGET,
    CPI,
    SPI,
    CASE 
        WHEN CPI < 0.9 OR SPI < 0.9 THEN 'critical'
        WHEN CPI < 0.95 OR SPI < 0.95 THEN 'high'
        WHEN CPI < 1.0 OR SPI < 1.0 THEN 'medium'
        ELSE 'low'
    END AS RISK_LEVEL,
    -- For map marker sizing
    CURRENT_BUDGET / 1000000 AS BUDGET_MILLIONS
FROM ATOMIC.PROJECT
WHERE LATITUDE IS NOT NULL AND LONGITUDE IS NOT NULL;

COMMENT ON VIEW MAP_DATA IS 'Project data optimized for map visualization';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON ALL VIEWS IN SCHEMA CAPITAL_PROJECTS TO ROLE ATLAS_APP_ROLE;
