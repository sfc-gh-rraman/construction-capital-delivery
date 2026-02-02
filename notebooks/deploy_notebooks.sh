#!/bin/bash
###############################################################################
# ATLAS Capital Delivery - Deploy ML Notebooks to Snowflake
###############################################################################

set -e

CONNECTION="${1:-demo}"
DATABASE="CAPITAL_PROJECTS_DB"
SCHEMA="ML"
WAREHOUSE="CAPITAL_ML_WH"
STAGE="${DATABASE}.${SCHEMA}.NOTEBOOKS_STAGE"

echo ""
echo "=============================================="
echo "  Deploying ATLAS ML Notebooks to Snowflake"
echo "=============================================="
echo "Connection: $CONNECTION"
echo "Database: $DATABASE"
echo "Schema: $SCHEMA"
echo ""

# Create stage for notebooks
echo "Creating notebooks stage..."
snow sql -c "$CONNECTION" -q "
USE DATABASE ${DATABASE};
USE SCHEMA ${SCHEMA};

CREATE STAGE IF NOT EXISTS NOTEBOOKS_STAGE
    DIRECTORY = (ENABLE = TRUE);
"

# Upload notebooks and environment file
echo ""
echo "Uploading notebooks..."

if [ -f "01_eac_forecaster.ipynb" ]; then
    snow stage copy 01_eac_forecaster.ipynb "@${STAGE}/" --overwrite -c "$CONNECTION"
fi

if [ -f "02_co_classifier.ipynb" ]; then
    snow stage copy 02_co_classifier.ipynb "@${STAGE}/" --overwrite -c "$CONNECTION"
fi

if [ -f "03_schedule_slip_predictor.ipynb" ]; then
    snow stage copy 03_schedule_slip_predictor.ipynb "@${STAGE}/" --overwrite -c "$CONNECTION"
fi

if [ -f "04_vendor_risk_scorer.ipynb" ]; then
    snow stage copy 04_vendor_risk_scorer.ipynb "@${STAGE}/" --overwrite -c "$CONNECTION"
fi

if [ -f "environment.yml" ]; then
    snow stage copy environment.yml "@${STAGE}/" --overwrite -c "$CONNECTION"
fi

# Refresh stage
snow sql -c "$CONNECTION" -q "ALTER STAGE ${STAGE} REFRESH;" > /dev/null

# Create notebooks in Snowflake
echo ""
echo "Creating Snowflake notebooks..."
snow sql -c "$CONNECTION" -q "
USE DATABASE ${DATABASE};
USE SCHEMA ${SCHEMA};

-- EAC Forecaster Notebook
CREATE OR REPLACE NOTEBOOK EAC_FORECASTER_NB
  FROM '@${STAGE}/'
  MAIN_FILE = '01_eac_forecaster.ipynb'
  QUERY_WAREHOUSE = '${WAREHOUSE}'
  COMMENT = 'Gradient Boosting model to predict Estimate at Completion (EAC)';

-- CO Classifier Notebook (Hidden Discovery)
CREATE OR REPLACE NOTEBOOK CO_CLASSIFIER_NB
  FROM '@${STAGE}/'
  MAIN_FILE = '02_co_classifier.ipynb'
  QUERY_WAREHOUSE = '${WAREHOUSE}'
  COMMENT = 'XGBoost classifier for change order categorization and pattern detection';

-- Schedule Slip Predictor Notebook
CREATE OR REPLACE NOTEBOOK SCHEDULE_SLIP_NB
  FROM '@${STAGE}/'
  MAIN_FILE = '03_schedule_slip_predictor.ipynb'
  QUERY_WAREHOUSE = '${WAREHOUSE}'
  COMMENT = 'Random Forest model to predict activity schedule delays';

-- Vendor Risk Scorer Notebook
CREATE OR REPLACE NOTEBOOK VENDOR_RISK_NB
  FROM '@${STAGE}/'
  MAIN_FILE = '04_vendor_risk_scorer.ipynb'
  QUERY_WAREHOUSE = '${WAREHOUSE}'
  COMMENT = 'XGBoost model to score subcontractor risk';

SELECT 'Notebooks created successfully' as status;
"

echo ""
echo "=============================================="
echo "✅ Notebook deployment complete!"
echo "=============================================="
echo ""
echo "📓 Notebooks available in Snowsight:"
echo "  - ${DATABASE}.${SCHEMA}.EAC_FORECASTER_NB"
echo "  - ${DATABASE}.${SCHEMA}.CO_CLASSIFIER_NB"
echo "  - ${DATABASE}.${SCHEMA}.SCHEDULE_SLIP_NB"
echo "  - ${DATABASE}.${SCHEMA}.VENDOR_RISK_NB"
echo ""
echo "To run in Snowsight:"
echo "  1. Go to Snowsight > Projects > Notebooks"
echo "  2. Select a notebook and click 'Run All'"
echo "  3. Predictions will be saved to ML.* tables"
echo ""
