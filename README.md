# 🏗️ ATLAS - Capital Delivery Intelligence Platform

> **A**utomated **T**otal **L**ifecycle **A**nalysis **S**ystem

An AI-powered co-pilot for mega-project capital delivery, built on Snowflake Cortex.

## Overview

ATLAS transforms capital project management from reactive reporting to proactive intelligence. It combines:

- **$2.3B synthetic portfolio** across 12 infrastructure mega-projects
- **4 ML models** for predictive analytics with full explainability
- **Multi-agent AI architecture** for intelligent decision support
- **Real-time monitoring** of EAC, CPI, SPI, and contingency burn

---

## 🎯 The "Wow" Moment

A Program Director sees a **"Scope Leakage"** alert. ATLAS has:
1. Analyzed 500 small Change Orders (<$5k each, all auto-approved)
2. Identified they share a common root cause via text analysis
3. Discovered: **"Missing Grounding Specs"** in original design package
4. Calculated aggregate risk: **$2.1M** across 12 project sites
5. Recommended: **Global design update** to stop the bleeding

**Surface Appearance**: Budget looks fine (small COs auto-approved)  
**Revealed Reality**: Systemic design flaw causing portfolio-wide bleed

---

## 📁 Folder Structure

```
construction_capital_delivery/
├── copilot/
│   ├── frontend/               # React 18 + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Application pages
│   │   │   └── styles/         # Global CSS
│   │   └── package.json
│   │
│   ├── backend/                # FastAPI + Python
│   │   ├── api/main.py         # API routes
│   │   ├── agents/             # Multi-agent system
│   │   └── services/           # Snowflake service
│   │
│   └── deploy/                 # SPCS deployment
│       ├── Dockerfile
│       ├── nginx.conf
│       └── service_spec.yaml
│
├── cortex/
│   ├── capital_semantic_model.yaml
│   └── deploy_search.sql
│
├── ddl/
│   ├── 001_database.sql
│   ├── 002_atomic_tables.sql
│   ├── 003_ml_tables.sql
│   └── 004_datamart_views.sql
│
├── notebooks/
│   ├── 01_eac_forecaster.ipynb
│   ├── 02_co_classifier.ipynb
│   ├── 03_schedule_slip_predictor.ipynb
│   └── 04_vendor_risk_scorer.ipynb
│
├── data/
│   └── synthetic/
│
├── scripts/
│   └── generate_synthetic_data.py
│
├── DRD.md
└── README.md
```

---

## 🤖 Multi-Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ATLAS CO-PILOT                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  PORTFOLIO  │  │   SCOPE     │  │  SCHEDULE   │  │   RISK     │ │
│  │  WATCHDOG   │  │  ANALYST    │  │  OPTIMIZER  │  │  PREDICTOR │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │               │         │
│   Monitors         Analyzes CO      Critical Path    ML-based       │
│   EAC/CPI/SPI     text patterns    impact analysis  forecasting    │
│         │                │                │               │         │
│         └────────────────┴────────────────┴───────────────┘         │
│                                   │                                  │
│                          ┌───────▼───────┐                          │
│                          │  ORCHESTRATOR  │                         │
│                          └───────┬───────┘                          │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              ┌──────────┐                  ┌──────────┐
              │  REACT   │                  │SNOWFLAKE │
              │ FRONTEND │◄────────────────►│ CORTEX   │
              └──────────┘                  └──────────┘
```

---

## 🧠 ML Models

| Model | Type | Explainability | Business Value |
|-------|------|----------------|----------------|
| **EAC Forecaster** | Gradient Boosting | PDP curves | Predict final cost |
| **CO Classifier** | XGBoost | SHAP values | Auto-categorize COs |
| **Slip Predictor** | Random Forest | Calibration | Schedule risk alerts |
| **Vendor Risk** | XGBoost | Feature importance | Subcontractor scoring |

---

## 📊 Data Assets

| Dataset | Records | Description |
|---------|---------|-------------|
| Projects | 12 | Infrastructure mega-projects |
| Change Orders | 500+ | With "Hidden Discovery" pattern |
| Activities | 2,000+ | Schedule with dependencies |
| Vendors | 50+ | Subcontractors with risk profiles |
| Budget Lines | 1,000+ | Cost codes and forecasts |

---

## 🎨 Pages

1. **Landing** - Animated intro, portfolio stats
2. **Mission Control** - Real-time EAC gauges, AI chat, proactive alerts
3. **Portfolio Map** - Geographic view with risk coloring
4. **Project Deep Dive** - Gantt chart, driver tree, milestone tracker
5. **Scope Forensics** - CO cluster map, "Hidden Discovery" reveal
6. **Morning Brief** - AI-generated daily portfolio summary
7. **Knowledge Base** - Search contracts, specs, CO narratives
8. **Architecture** - Interactive system diagram

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Snowflake account with Cortex enabled

### Local Development

```bash
# Backend
cd copilot/backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Frontend (new terminal)
cd copilot/frontend
npm install
npm run dev
```

### SPCS Deployment

```bash
cd copilot/deploy
./deploy.sh
```

---

## 📚 Documentation

- [Solution Overview](./solution_presentation/Capital_Delivery_Overview.md)
- [Deployment Guide](./copilot/deploy/DEPLOYMENT_GUIDE.md)

---

*Built on Snowflake • Cortex AI • React • FastAPI*
*Part of the Snowflake Solutions Demo Suite*
