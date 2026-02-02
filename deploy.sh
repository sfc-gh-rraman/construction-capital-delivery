#!/bin/bash
# =============================================================================
# ATLAS Capital Delivery - Snowflake Deployment Script
# =============================================================================
set -e
set -o pipefail

# Configuration
CONNECTION="${SNOWFLAKE_CONNECTION:-demo}"
DATABASE="${SNOWFLAKE_DATABASE:-CAPITAL_PROJECTS_DB}"
WAREHOUSE="${SNOWFLAKE_WAREHOUSE:-COMPUTE_WH}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
DEPLOY_DDL=true
DEPLOY_DATA=true
DEPLOY_CORTEX=true
DEPLOY_NOTEBOOKS=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--connection) CONNECTION="$2"; shift 2 ;;
        --only-ddl) DEPLOY_DATA=false; DEPLOY_CORTEX=false; DEPLOY_NOTEBOOKS=false; shift ;;
        --only-data) DEPLOY_DDL=false; DEPLOY_CORTEX=false; DEPLOY_NOTEBOOKS=false; shift ;;
        --only-cortex) DEPLOY_DDL=false; DEPLOY_DATA=false; DEPLOY_NOTEBOOKS=false; shift ;;
        --only-notebooks) DEPLOY_DDL=false; DEPLOY_DATA=false; DEPLOY_CORTEX=false; shift ;;
        *) shift ;;
    esac
done

print_message "$CYAN" "
 █████╗ ████████╗██╗      █████╗ ███████╗
██╔══██╗╚══██╔══╝██║     ██╔══██╗██╔════╝
███████║   ██║   ██║     ███████║███████╗
██╔══██║   ██║   ██║     ██╔══██║╚════██║
██║  ██║   ██║   ███████╗██║  ██║███████║
╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝
Capital Delivery Intelligence Platform
"

print_message "$BLUE" "=============================================="
print_message "$BLUE" "  Snowflake Deployment"
print_message "$BLUE" "=============================================="
print_message "$YELLOW" "Connection: $CONNECTION"
print_message "$YELLOW" "Database: $DATABASE"
echo ""

# =============================================================================
# STEP 1: Deploy DDL (Database, Schemas, Tables)
# =============================================================================
if [ "$DEPLOY_DDL" = true ]; then
    print_message "$BLUE" "📦 Step 1: Deploying DDL..."
    
    for sql_file in "$SCRIPT_DIR"/ddl/*.sql; do
        if [ -f "$sql_file" ]; then
            filename=$(basename "$sql_file")
            print_message "$GREEN" "  Executing: $filename"
            snow sql -f "$sql_file" -c "$CONNECTION" > /dev/null 2>&1 || {
                print_message "$YELLOW" "  Warning: Some statements in $filename may have failed (continuing...)"
            }
        fi
    done
    
    print_message "$GREEN" "✓ DDL deployment complete"
    echo ""
fi

# =============================================================================
# STEP 2: Generate and Load Synthetic Data
# =============================================================================
if [ "$DEPLOY_DATA" = true ]; then
    print_message "$BLUE" "📊 Step 2: Deploying Data..."
    
    # Create data directory
    mkdir -p "$SCRIPT_DIR/data/synthetic"
    
    # Generate synthetic data if not exists
    if [ ! -f "$SCRIPT_DIR/data/synthetic/projects.parquet" ]; then
        print_message "$GREEN" "  Generating synthetic data..."
        cd "$SCRIPT_DIR/scripts"
        python3 generate_synthetic_data.py
        cd "$SCRIPT_DIR"
    fi
    
    # Create stage
    print_message "$GREEN" "  Creating data stage..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    CREATE OR REPLACE STAGE RAW.DATA_STAGE 
        DIRECTORY = (ENABLE = TRUE);
    " > /dev/null
    
    # Upload parquet files
    print_message "$GREEN" "  Uploading projects.parquet..."
    snow stage copy "$SCRIPT_DIR/data/synthetic/projects.parquet" "@${DATABASE}.RAW.DATA_STAGE" --overwrite -c "$CONNECTION" > /dev/null
    
    print_message "$GREEN" "  Uploading vendors.parquet..."
    snow stage copy "$SCRIPT_DIR/data/synthetic/vendors.parquet" "@${DATABASE}.RAW.DATA_STAGE" --overwrite -c "$CONNECTION" > /dev/null
    
    print_message "$GREEN" "  Uploading change_orders.parquet..."
    snow stage copy "$SCRIPT_DIR/data/synthetic/change_orders.parquet" "@${DATABASE}.RAW.DATA_STAGE" --overwrite -c "$CONNECTION" > /dev/null
    
    print_message "$GREEN" "  Uploading activities.parquet..."
    snow stage copy "$SCRIPT_DIR/data/synthetic/activities.parquet" "@${DATABASE}.RAW.DATA_STAGE" --overwrite -c "$CONNECTION" > /dev/null
    
    print_message "$GREEN" "  Uploading monthly_snapshots.parquet..."
    snow stage copy "$SCRIPT_DIR/data/synthetic/monthly_snapshots.parquet" "@${DATABASE}.RAW.DATA_STAGE" --overwrite -c "$CONNECTION" > /dev/null
    
    # Refresh stage
    snow sql -c "$CONNECTION" -q "ALTER STAGE ${DATABASE}.RAW.DATA_STAGE REFRESH;" > /dev/null
    
    # Load data from parquet using INSERT from SELECT with lateral flatten
    print_message "$GREEN" "  Loading PROJECT table..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    USE SCHEMA ATOMIC;
    
    INSERT INTO PROJECT (
        PROJECT_ID, PROJECT_NAME, PROJECT_CODE, PROJECT_TYPE, STATUS,
        CITY, STATE, LATITUDE, LONGITUDE,
        PLANNED_START_DATE, PLANNED_END_DATE, ACTUAL_START_DATE, ACTUAL_END_DATE,
        ORIGINAL_BUDGET, CURRENT_BUDGET, CONTINGENCY_BUDGET, CONTINGENCY_USED,
        CPI, SPI, PROGRAM_ID, OWNER_NAME, PRIME_CONTRACTOR
    )
    SELECT 
        \$1:PROJECT_ID::VARCHAR,
        \$1:PROJECT_NAME::VARCHAR,
        \$1:PROJECT_CODE::VARCHAR,
        \$1:PROJECT_TYPE::VARCHAR,
        \$1:STATUS::VARCHAR,
        \$1:CITY::VARCHAR,
        \$1:STATE::VARCHAR,
        \$1:LATITUDE::FLOAT,
        \$1:LONGITUDE::FLOAT,
        \$1:PLANNED_START_DATE::DATE,
        \$1:PLANNED_END_DATE::DATE,
        \$1:ACTUAL_START_DATE::DATE,
        \$1:ACTUAL_END_DATE::DATE,
        \$1:ORIGINAL_BUDGET::FLOAT,
        \$1:CURRENT_BUDGET::FLOAT,
        \$1:CONTINGENCY_BUDGET::FLOAT,
        \$1:CONTINGENCY_USED::FLOAT,
        \$1:CPI::FLOAT,
        \$1:SPI::FLOAT,
        \$1:PROGRAM_ID::VARCHAR,
        \$1:OWNER_NAME::VARCHAR,
        \$1:PRIME_CONTRACTOR::VARCHAR
    FROM @RAW.DATA_STAGE/projects.parquet (FILE_FORMAT => 'RAW.PARQUET_FORMAT');
    " > /dev/null
    
    print_message "$GREEN" "  Loading VENDOR table..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    USE SCHEMA ATOMIC;
    
    INSERT INTO VENDOR (
        VENDOR_ID, VENDOR_NAME, VENDOR_CODE, TRADE_CATEGORY, VENDOR_TYPE,
        CONTACT_NAME, CONTACT_EMAIL, CONTACT_PHONE, ADDRESS,
        AVG_CO_RATE, ONTIME_DELIVERY_RATE, SAFETY_INCIDENT_RATE, QUALITY_SCORE,
        RISK_SCORE, RISK_SCORE_DATE, ACTIVE_FLAG
    )
    SELECT 
        \$1:VENDOR_ID::VARCHAR,
        \$1:VENDOR_NAME::VARCHAR,
        \$1:VENDOR_CODE::VARCHAR,
        \$1:TRADE_CATEGORY::VARCHAR,
        \$1:VENDOR_TYPE::VARCHAR,
        \$1:CONTACT_NAME::VARCHAR,
        \$1:CONTACT_EMAIL::VARCHAR,
        \$1:CONTACT_PHONE::VARCHAR,
        \$1:ADDRESS::VARCHAR,
        \$1:AVG_CO_RATE::FLOAT,
        \$1:ONTIME_DELIVERY_RATE::FLOAT,
        \$1:SAFETY_INCIDENT_RATE::FLOAT,
        \$1:QUALITY_SCORE::FLOAT,
        \$1:RISK_SCORE::INT,
        \$1:RISK_SCORE_DATE::DATE,
        \$1:ACTIVE_FLAG::BOOLEAN
    FROM @RAW.DATA_STAGE/vendors.parquet (FILE_FORMAT => 'RAW.PARQUET_FORMAT');
    " > /dev/null
    
    print_message "$GREEN" "  Loading CHANGE_ORDER table..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    USE SCHEMA ATOMIC;
    
    INSERT INTO CHANGE_ORDER (
        CO_ID, PROJECT_ID, VENDOR_ID, CO_NUMBER, CO_TITLE,
        CO_TYPE, CO_CATEGORY, COST_CODE, ORIGINAL_AMOUNT, APPROVED_AMOUNT,
        STATUS, APPROVAL_LEVEL, SUBMIT_DATE, APPROVAL_DATE, EFFECTIVE_DATE,
        REASON_TEXT, JUSTIFICATION, ML_CATEGORY, ML_CONFIDENCE,
        ML_SCOPE_GAP_PROB, ML_DESIGN_ERROR_PROB, ML_FIELD_CONDITION_PROB,
        CREATED_BY
    )
    SELECT 
        \$1:CO_ID::VARCHAR,
        \$1:PROJECT_ID::VARCHAR,
        \$1:VENDOR_ID::VARCHAR,
        \$1:CO_NUMBER::VARCHAR,
        \$1:CO_TITLE::VARCHAR,
        \$1:CO_TYPE::VARCHAR,
        \$1:CO_CATEGORY::VARCHAR,
        \$1:COST_CODE::VARCHAR,
        \$1:ORIGINAL_AMOUNT::FLOAT,
        \$1:APPROVED_AMOUNT::FLOAT,
        \$1:STATUS::VARCHAR,
        \$1:APPROVAL_LEVEL::VARCHAR,
        \$1:SUBMIT_DATE::DATE,
        \$1:APPROVAL_DATE::DATE,
        \$1:EFFECTIVE_DATE::DATE,
        \$1:REASON_TEXT::VARCHAR,
        \$1:JUSTIFICATION::VARCHAR,
        \$1:ML_CATEGORY::VARCHAR,
        \$1:ML_CONFIDENCE::FLOAT,
        \$1:ML_SCOPE_GAP_PROB::FLOAT,
        \$1:ML_DESIGN_ERROR_PROB::FLOAT,
        \$1:ML_FIELD_CONDITION_PROB::FLOAT,
        \$1:CREATED_BY::VARCHAR
    FROM @RAW.DATA_STAGE/change_orders.parquet (FILE_FORMAT => 'RAW.PARQUET_FORMAT');
    " > /dev/null
    
    print_message "$GREEN" "  Loading PROJECT_ACTIVITY table..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    USE SCHEMA ATOMIC;
    
    INSERT INTO PROJECT_ACTIVITY (
        ACTIVITY_ID, PROJECT_ID, ACTIVITY_CODE, ACTIVITY_NAME, WBS_CODE,
        PARENT_ACTIVITY_ID, LEVEL_NUMBER, ACTIVITY_TYPE, PHASE, DISCIPLINE,
        PLANNED_START, PLANNED_FINISH, PLANNED_DURATION,
        ACTUAL_START, ACTUAL_FINISH, FORECAST_START, FORECAST_FINISH,
        PERCENT_COMPLETE, TOTAL_FLOAT, FREE_FLOAT, IS_CRITICAL,
        SLIP_PROBABILITY, PREDICTED_SLIP_DAYS, RISK_DRIVERS,
        ASSIGNED_VENDOR_ID, BUDGETED_HOURS, ACTUAL_HOURS, DATA_DATE
    )
    SELECT 
        \$1:ACTIVITY_ID::VARCHAR,
        \$1:PROJECT_ID::VARCHAR,
        \$1:ACTIVITY_CODE::VARCHAR,
        \$1:ACTIVITY_NAME::VARCHAR,
        \$1:WBS_CODE::VARCHAR,
        \$1:PARENT_ACTIVITY_ID::VARCHAR,
        \$1:LEVEL_NUMBER::INT,
        \$1:ACTIVITY_TYPE::VARCHAR,
        \$1:PHASE::VARCHAR,
        \$1:DISCIPLINE::VARCHAR,
        \$1:PLANNED_START::DATE,
        \$1:PLANNED_FINISH::DATE,
        \$1:PLANNED_DURATION::INT,
        \$1:ACTUAL_START::DATE,
        \$1:ACTUAL_FINISH::DATE,
        \$1:FORECAST_START::DATE,
        \$1:FORECAST_FINISH::DATE,
        \$1:PERCENT_COMPLETE::FLOAT,
        \$1:TOTAL_FLOAT::INT,
        \$1:FREE_FLOAT::INT,
        \$1:IS_CRITICAL::BOOLEAN,
        \$1:SLIP_PROBABILITY::FLOAT,
        \$1:PREDICTED_SLIP_DAYS::INT,
        TRY_PARSE_JSON(\$1:RISK_DRIVERS),
        \$1:ASSIGNED_VENDOR_ID::VARCHAR,
        \$1:BUDGETED_HOURS::FLOAT,
        \$1:ACTUAL_HOURS::FLOAT,
        \$1:DATA_DATE::DATE
    FROM @RAW.DATA_STAGE/activities.parquet (FILE_FORMAT => 'RAW.PARQUET_FORMAT');
    " > /dev/null
    
    print_message "$GREEN" "  Loading MONTHLY_SNAPSHOT table..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    USE SCHEMA ATOMIC;
    
    INSERT INTO MONTHLY_SNAPSHOT (
        SNAPSHOT_ID, PROJECT_ID, SNAPSHOT_DATE,
        ORIGINAL_BUDGET, CURRENT_BUDGET, ACTUAL_COST, FORECAST_COST, EAC,
        BCWS, BCWP, ACWP, CPI, SPI, TCPI,
        CONTINGENCY_REMAINING, CONTINGENCY_BURN_RATE,
        CO_COUNT_MTD, CO_AMOUNT_MTD, CO_COUNT_CUMULATIVE, CO_AMOUNT_CUMULATIVE,
        PERCENT_COMPLETE, DAYS_AHEAD_BEHIND
    )
    SELECT 
        \$1:SNAPSHOT_ID::VARCHAR,
        \$1:PROJECT_ID::VARCHAR,
        \$1:SNAPSHOT_DATE::DATE,
        \$1:ORIGINAL_BUDGET::FLOAT,
        \$1:CURRENT_BUDGET::FLOAT,
        \$1:ACTUAL_COST::FLOAT,
        \$1:FORECAST_COST::FLOAT,
        \$1:EAC::FLOAT,
        \$1:BCWS::FLOAT,
        \$1:BCWP::FLOAT,
        \$1:ACWP::FLOAT,
        \$1:CPI::FLOAT,
        \$1:SPI::FLOAT,
        \$1:TCPI::FLOAT,
        \$1:CONTINGENCY_REMAINING::FLOAT,
        \$1:CONTINGENCY_BURN_RATE::FLOAT,
        \$1:CO_COUNT_MTD::INT,
        \$1:CO_AMOUNT_MTD::FLOAT,
        \$1:CO_COUNT_CUMULATIVE::INT,
        \$1:CO_AMOUNT_CUMULATIVE::FLOAT,
        \$1:PERCENT_COMPLETE::FLOAT,
        \$1:DAYS_AHEAD_BEHIND::INT
    FROM @RAW.DATA_STAGE/monthly_snapshots.parquet (FILE_FORMAT => 'RAW.PARQUET_FORMAT');
    " > /dev/null
    
    print_message "$GREEN" "✓ Data deployment complete"
    echo ""
fi

# =============================================================================
# STEP 3: Deploy Cortex (Semantic Model + Search Service)
# =============================================================================
if [ "$DEPLOY_CORTEX" = true ]; then
    print_message "$BLUE" "🧠 Step 3: Deploying Cortex..."
    
    # Create semantic models stage with DIRECTORY enabled
    print_message "$GREEN" "  Creating semantic models stage..."
    snow sql -c "$CONNECTION" -q "
    USE DATABASE ${DATABASE};
    CREATE STAGE IF NOT EXISTS CAPITAL_PROJECTS.SEMANTIC_MODELS
        DIRECTORY = (ENABLE = TRUE);
    " > /dev/null
    
    # Upload semantic model
    if [ -f "$SCRIPT_DIR/cortex/capital_semantic_model.yaml" ]; then
        print_message "$GREEN" "  Uploading semantic model..."
        snow stage copy "$SCRIPT_DIR/cortex/capital_semantic_model.yaml" "@${DATABASE}.CAPITAL_PROJECTS.SEMANTIC_MODELS" --overwrite -c "$CONNECTION" > /dev/null
        snow sql -c "$CONNECTION" -q "ALTER STAGE ${DATABASE}.CAPITAL_PROJECTS.SEMANTIC_MODELS REFRESH;" > /dev/null
    fi
    
    # Deploy Cortex Search
    print_message "$GREEN" "  Deploying Cortex Search service..."
    snow sql -f "$SCRIPT_DIR/cortex/deploy_search.sql" -c "$CONNECTION" > /dev/null 2>&1 || {
        print_message "$YELLOW" "  Note: Cortex Search may require additional setup"
    }
    
    print_message "$GREEN" "✓ Cortex deployment complete"
    echo ""
fi

# =============================================================================
# STEP 4: Deploy ML Notebooks
# =============================================================================
if [ "$DEPLOY_NOTEBOOKS" = true ]; then
    print_message "$BLUE" "📓 Step 4: Deploying ML Notebooks..."
    
    cd "$SCRIPT_DIR/notebooks"
    bash deploy_notebooks.sh "$CONNECTION"
    cd "$SCRIPT_DIR"
    
    print_message "$GREEN" "✓ Notebooks deployment complete"
    echo ""
fi

# =============================================================================
# SUMMARY
# =============================================================================
print_message "$CYAN" "=============================================="
print_message "$GREEN" "  🎉 Deployment Complete!"
print_message "$CYAN" "=============================================="

echo ""
print_message "$YELLOW" "📊 Data Summary:"
snow sql -c "$CONNECTION" -q "
SELECT 'PROJECT' as table_name, COUNT(*) as row_count FROM ${DATABASE}.ATOMIC.PROJECT
UNION ALL SELECT 'VENDOR', COUNT(*) FROM ${DATABASE}.ATOMIC.VENDOR
UNION ALL SELECT 'CHANGE_ORDER', COUNT(*) FROM ${DATABASE}.ATOMIC.CHANGE_ORDER
UNION ALL SELECT 'PROJECT_ACTIVITY', COUNT(*) FROM ${DATABASE}.ATOMIC.PROJECT_ACTIVITY
UNION ALL SELECT 'MONTHLY_SNAPSHOT', COUNT(*) FROM ${DATABASE}.ATOMIC.MONTHLY_SNAPSHOT
ORDER BY table_name;
"

echo ""
print_message "$YELLOW" "🔍 Hidden Discovery Check:"
snow sql -c "$CONNECTION" -q "
SELECT 
    COUNT(*) as grounding_cos,
    COUNT(DISTINCT PROJECT_ID) as affected_projects,
    ROUND(SUM(APPROVED_AMOUNT), 0) as total_amount
FROM ${DATABASE}.ATOMIC.CHANGE_ORDER
WHERE LOWER(REASON_TEXT) LIKE '%ground%'
  AND STATUS = 'APPROVED';
"

echo ""
print_message "$BLUE" "Next Steps:"
echo "  1. Open Snowsight and navigate to Notebooks"
echo "  2. Run the ML notebooks to generate predictions"
echo "  3. Check Cortex Analyst: SELECT * FROM TABLE(${DATABASE}.CAPITAL_PROJECTS.SEMANTIC_MODELS)"
echo ""
