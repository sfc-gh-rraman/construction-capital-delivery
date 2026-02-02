# Demo Requirements Document (DRD): Capital Delivery Optimization

## 1. Strategic Overview

*   **Problem Statement:** Mega-projects die by a thousand cuts. Cost overruns aren't usually caused by one big disaster, but by thousands of disconnected Change Orders, RFIs, and schedule slips that remain invisible until the "Estimate at Completion" (EAC) explodes. Data silos between P6 (Schedule) and SAP (Cost) prevent holistic risk management.
*   **Target Business Goals (KPIs):**
    *   **Budget:** Reduce Cost Overruns by 10% via early detection of scope creep.
    *   **Schedule:** Improve Schedule Performance Index (SPI) by 0.15.
    *   **Risk:** Identify 100% of "Systemic Scope Gaps" before they affect the entire portfolio.
*   **The "Wow" Moment:** A Program Director sees a "Scope Leakage" alert. Cortex has analyzed 500 small Change Orders (<$5k each) across 12 project sites and identified a common root cause: "Missing Grounding Specs" in the original design package. The system calculates a $2M aggregate risk and recommends a global design update.
*   **Hidden Discovery:**
    *   **Discovery Statement:** "A pattern of small, approved Change Orders (<$5k) from a specific subcontractor aggregates to a $2M overrun, detected only by analyzing the unstructured 'Reason for Change' text fields which revealed a systemic scope gap in the original bid documents."
    *   **Surface Appearance:** Individual COs are small and auto-approved; budget looks fine.
    *   **Revealed Reality:** A systemic design error is causing bleed across every project site.
    *   **Business Impact:** Stops the "Death by 1000 Cuts" dynamic by fixing the root cause upstream.

## 2. User Personas & Stories

| Persona Level | Role | User Story | Key Visuals |
| :--- | :--- | :--- | :--- |
| **Strategic** | **Program Director** | "As a Director, I want to see the aggregated EAC (Estimate at Completion) vs. Budget across the portfolio to report accurate financials." | Portfolio S-Curve, "At Risk" Contingency Fund, Systemic Risk Radar. |
| **Operational** | **Project Manager** | "As a PM, I want to know if a schedule slip in 'Engineering' will delay 'Construction' so I can mitigate the critical path." | Critical Path Gantt, Milestone Tracker, "Lookahead" Risk List. |
| **Technical** | **Project Controls** | "As an Engineer, I want to correlate RFI volume with Change Order cost to predict future overruns." | RFI vs. Cost Scatter Plot, Trend Analysis, Vendor Performance Scorecard. |

## 3. Data Architecture

### 3.1 Schema Structure
All data resides in `CAPITAL_PROJECTS_DB` with the following schemas:

*   **`RAW`**: Landing zone for P6/MS Project files, ERP dumps, and PDFs.
*   **`ATOMIC`**: Normalized Enterprise Data Model.
*   **`CAPITAL_PROJECTS`**: Data Mart for consumption.

### 3.2 RAW Layer
*   `RAW.P6_XML`: Schedule data (Activities, Logic, Resources).
*   `RAW.COST_LEDGER`: ERP transactions (Commitments, Actuals).
*   `RAW.CHANGE_LOGS`: Excel/System dumps of change requests.

### 3.3 ATOMIC Layer (Core & Extensions)
*   **Core Entities** (Mapped from Data Dictionary):
    *   `ATOMIC.PROJECT`:
        *   *Columns*: `PROJECT_ID`, `PROJECT_NAME`, `TOTAL_BUDGET`, `START_DATE`.
    *   `ATOMIC.VENDOR` (Contractor):
        *   *Columns*: `VENDOR_ID`, `VENDOR_NAME`, `TRADE_CATEGORY`.
*   **Extension Entities** (Project Specific):
    *   `ATOMIC.PROJECT_BUDGET` (Extension):
        *   *Columns*: `BUDGET_ID`, `PROJECT_ID`, `COST_CODE`, `ORIGINAL_VALUE`, `CURRENT_VALUE`, `FORECAST_VALUE`.
    *   `ATOMIC.CHANGE_ORDER` (Extension):
        *   *Columns*: `CO_ID`, `PROJECT_ID`, `VENDOR_ID`, `AMOUNT`, `REASON_TEXT`, `STATUS`, `APPROVAL_DATE`.
    *   `ATOMIC.PROJECT_ACTIVITY` (Extension):
        *   *Columns*: `ACTIVITY_ID`, `PROJECT_ID`, `START_DATE`, `END_DATE`, `PERCENT_COMPLETE`.

### 3.4 Data Mart Layer (`CAPITAL_PROJECTS`)
*   `CAPITAL_PROJECTS.PORTFOLIO_PERFORMANCE` (View): KPI rollups (CPI, SPI).
*   `CAPITAL_PROJECTS.RISK_PREDICTION` (Table): ML Forecast of EAC.
*   `CAPITAL_PROJECTS.TEXT_ANALYTICS` (Table): Extracted concepts from COs/RFIs.

## 4. Cortex Intelligence Specifications

### 4.1 Cortex Analyst (Structured)
*   **Semantic Model Scope**:
    *   **Measures**: `Cost_Variance`, `Schedule_Variance`, `RFI_Count`, `Change_Order_Total`.
    *   **Dimensions**: `Project_Phase`, `Contractor`, `Cost_Code`, `Risk_Level`.
*   **Golden Query**: "Show me the total Change Order amount categorized by 'Reason Code' for the 'West Line Extension' project."

### 4.2 Cortex Search (Unstructured)
*   **Service Name**: `CONTRACT_DOCS_SEARCH`
*   **Source Data**: Prime Contracts, Technical Specs, Change Order Narratives.
*   **Indexing Strategy**: Index by `Project` and `Clause_Type`.
*   **Sample Prompt**: "What is the allowable overhead markup for Change Orders under the General Conditions?"

## 5. Streamlit Application UX/UI

### Page 1: Portfolio Executive (Strategic)
*   **Situation**: "Are we burning contingency too fast?"
*   **Visuals**:
    *   **Contingency Burn-down**: Actual vs. Planned usage.
    *   **Map View**: Projects sized by Budget, colored by Risk.

### Page 2: Project Health (Operational)
*   **Task**: "Diagnose the schedule slip."
*   **Visuals**:
    *   **Interactive Gantt**: "Planned" vs "Actual" bars.
    *   **Driver Tree**: "Engineering Delay" -> "Procurement Delay" -> "Construction Delay".
    *   **Cortex Chat**: "Show me the email thread regarding the steel delay."

### Page 3: Scope Analytics (Technical)
*   **Action**: "Find the hidden scope gap."
*   **Visuals**:
    *   **Cluster Map**: Grouping Change Orders by semantic similarity.
    *   **Hidden Discovery**: The "Missing Grounding Specs" insight.

## 6. Success Criteria

*   **Technical**:
    *   Ingest and link P6 Schedule + SAP Cost data in < 5 mins.
    *   Cluster 10,000 Change Order descriptions to find patterns in < 30 seconds.
*   **Business**:
    *   Identify 5% of "Avoidable" Change Orders.
    *   Reduce monthly reporting cycle from 2 weeks to Real-Time.
