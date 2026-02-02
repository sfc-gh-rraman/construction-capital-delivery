"""
ATLAS Capital Delivery - Synthetic Data Generator

Generates realistic synthetic data for 12 mega-projects with:
- Real latitude/longitude for map visualization
- ML-friendly patterns for the "Hidden Discovery" feature
- Historical trends for S-curve analysis
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import json
import uuid

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# =============================================================================
# PROJECT DATA - Real locations for map visualization
# =============================================================================

PROJECTS = [
    {
        "project_id": "PRJ-001",
        "project_name": "Downtown Transit Hub",
        "project_type": "TRANSIT",
        "city": "San Francisco",
        "state": "CA",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "original_budget": 450_000_000,
        "contingency_pct": 0.10,
        "duration_months": 36,
        "prime_contractor": "Walsh Construction"
    },
    {
        "project_id": "PRJ-002",
        "project_name": "Riverside Substation",
        "project_type": "UTILITY",
        "city": "Portland",
        "state": "OR",
        "latitude": 45.5152,
        "longitude": -122.6784,
        "original_budget": 125_000_000,
        "contingency_pct": 0.12,
        "duration_months": 24,
        "prime_contractor": "Kiewit Power"
    },
    {
        "project_id": "PRJ-003",
        "project_name": "Airport Terminal Expansion",
        "project_type": "FACILITY",
        "city": "Seattle",
        "state": "WA",
        "latitude": 47.4502,
        "longitude": -122.3088,
        "original_budget": 380_000_000,
        "contingency_pct": 0.10,
        "duration_months": 48,
        "prime_contractor": "Turner Construction"
    },
    {
        "project_id": "PRJ-004",
        "project_name": "Highway 101 Widening",
        "project_type": "HIGHWAY",
        "city": "San Jose",
        "state": "CA",
        "latitude": 37.3382,
        "longitude": -121.8863,
        "original_budget": 290_000_000,
        "contingency_pct": 0.15,
        "duration_months": 30,
        "prime_contractor": "Flatiron West"
    },
    {
        "project_id": "PRJ-005",
        "project_name": "Metro Blue Line Extension",
        "project_type": "TRANSIT",
        "city": "Los Angeles",
        "state": "CA",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "original_budget": 520_000_000,
        "contingency_pct": 0.10,
        "duration_months": 60,
        "prime_contractor": "Skanska USA"
    },
    {
        "project_id": "PRJ-006",
        "project_name": "Harbor Bridge Replacement",
        "project_type": "HIGHWAY",
        "city": "San Diego",
        "state": "CA",
        "latitude": 32.7157,
        "longitude": -117.1611,
        "original_budget": 180_000_000,
        "contingency_pct": 0.12,
        "duration_months": 36,
        "prime_contractor": "PCL Construction"
    },
    {
        "project_id": "PRJ-007",
        "project_name": "Central Utility Plant",
        "project_type": "UTILITY",
        "city": "Phoenix",
        "state": "AZ",
        "latitude": 33.4484,
        "longitude": -112.0740,
        "original_budget": 95_000_000,
        "contingency_pct": 0.10,
        "duration_months": 18,
        "prime_contractor": "McCarthy Building"
    },
    {
        "project_id": "PRJ-008",
        "project_name": "Rail Yard Expansion",
        "project_type": "TRANSIT",
        "city": "Denver",
        "state": "CO",
        "latitude": 39.7392,
        "longitude": -104.9903,
        "original_budget": 210_000_000,
        "contingency_pct": 0.12,
        "duration_months": 30,
        "prime_contractor": "Hensel Phelps"
    },
    {
        "project_id": "PRJ-009",
        "project_name": "Water Treatment Upgrade",
        "project_type": "UTILITY",
        "city": "Las Vegas",
        "state": "NV",
        "latitude": 36.1699,
        "longitude": -115.1398,
        "original_budget": 145_000_000,
        "contingency_pct": 0.10,
        "duration_months": 24,
        "prime_contractor": "Black & Veatch"
    },
    {
        "project_id": "PRJ-010",
        "project_name": "Power Substation North",
        "project_type": "UTILITY",
        "city": "Salt Lake City",
        "state": "UT",
        "latitude": 40.7608,
        "longitude": -111.8910,
        "original_budget": 88_000_000,
        "contingency_pct": 0.12,
        "duration_months": 20,
        "prime_contractor": "Quanta Services"
    },
    {
        "project_id": "PRJ-011",
        "project_name": "Transit Center West",
        "project_type": "TRANSIT",
        "city": "Sacramento",
        "state": "CA",
        "latitude": 38.5816,
        "longitude": -121.4944,
        "original_budget": 175_000_000,
        "contingency_pct": 0.10,
        "duration_months": 28,
        "prime_contractor": "Clark Construction"
    },
    {
        "project_id": "PRJ-012",
        "project_name": "Tunnel Boring Operations",
        "project_type": "TRANSIT",
        "city": "Oakland",
        "state": "CA",
        "latitude": 37.8044,
        "longitude": -122.2712,
        "original_budget": 620_000_000,
        "contingency_pct": 0.15,
        "duration_months": 72,
        "prime_contractor": "Tutor Perini"
    }
]

# =============================================================================
# VENDOR DATA - Including the "bad actor" for Hidden Discovery
# =============================================================================

VENDORS = [
    # THE KEY VENDOR for Hidden Discovery - causes the grounding spec issue
    {"vendor_id": "VND-001", "vendor_name": "Apex Electrical Services", "trade_category": "ELECTRICAL", 
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "HIGH"},
    
    # Other electrical vendors (for comparison)
    {"vendor_id": "VND-002", "vendor_name": "Volt Electric Inc", "trade_category": "ELECTRICAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    {"vendor_id": "VND-003", "vendor_name": "PowerLine Systems", "trade_category": "ELECTRICAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "MEDIUM"},
    
    # Mechanical
    {"vendor_id": "VND-004", "vendor_name": "Delta Mechanical", "trade_category": "MECHANICAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    {"vendor_id": "VND-005", "vendor_name": "HVAC Solutions LLC", "trade_category": "MECHANICAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "MEDIUM"},
    
    # Civil
    {"vendor_id": "VND-006", "vendor_name": "Granite Civil Contractors", "trade_category": "CIVIL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    {"vendor_id": "VND-007", "vendor_name": "Earthworks Inc", "trade_category": "CIVIL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    
    # Structural
    {"vendor_id": "VND-008", "vendor_name": "Steel Dynamics", "trade_category": "STRUCTURAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "MEDIUM"},
    {"vendor_id": "VND-009", "vendor_name": "IronWorks Fabrication", "trade_category": "STRUCTURAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    
    # Concrete
    {"vendor_id": "VND-010", "vendor_name": "Pacific Concrete", "trade_category": "CONCRETE",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    
    # Plumbing
    {"vendor_id": "VND-011", "vendor_name": "FlowMaster Plumbing", "trade_category": "PLUMBING",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    
    # Fire Protection
    {"vendor_id": "VND-012", "vendor_name": "FireSafe Systems", "trade_category": "FIRE_PROTECTION",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    
    # General/Other
    {"vendor_id": "VND-013", "vendor_name": "SafetyFirst Scaffolding", "trade_category": "GENERAL",
     "vendor_type": "SUBCONTRACTOR", "risk_profile": "LOW"},
    {"vendor_id": "VND-014", "vendor_name": "QualityCheck Inspections", "trade_category": "GENERAL",
     "vendor_type": "SUPPLIER", "risk_profile": "LOW"},
    {"vendor_id": "VND-015", "vendor_name": "MaterialsPlus Supply", "trade_category": "GENERAL",
     "vendor_type": "SUPPLIER", "risk_profile": "LOW"},
]

# =============================================================================
# CHANGE ORDER PATTERNS - The "Hidden Discovery" data
# =============================================================================

# Grounding-related phrases for the Apex Electrical COs (THE PATTERN)
GROUNDING_PHRASES = [
    "Grounding not specified in original drawings",
    "Electrical grounding system not included in contract scope",
    "Add grounding conductors - not shown on plans",
    "Ground wire installation - missing from specs",
    "Equipment grounding per NEC not in contract",
    "Grounding electrode system omitted from design",
    "Install ground rods - not in original scope",
    "Grounding bus bar addition - design omission",
    "Ground fault protection not specified",
    "Bonding and grounding per code - extra work",
    "Grounding grid not included in bid documents",
    "Add grounding to electrical panels - spec gap",
    "Equipment bonding conductors - missing specification",
    "Grounding retrofit required - original design incomplete",
    "Install ground ring - not in contract documents",
]

# Normal CO reasons (for other vendors/COs)
NORMAL_CO_REASONS = {
    "FIELD_CONDITION": [
        "Unforeseen rock encountered during excavation",
        "Underground utilities not shown on drawings",
        "Soil conditions differ from geotechnical report",
        "Existing structure conflicts with design",
        "Hazardous materials discovered - abatement required",
        "Water table higher than expected",
        "Archaeological findings requiring mitigation",
    ],
    "DESIGN_ERROR": [
        "Structural calculations require revision",
        "Coordination conflict between mechanical and electrical",
        "Dimension error on architectural drawings",
        "Missing details on construction documents",
        "Specification conflicts with drawings",
    ],
    "OWNER_REQUEST": [
        "Owner requested additional security features",
        "Upgrade finish materials per owner direction",
        "Add electric vehicle charging stations",
        "Expand scope to include adjacent area",
        "Accelerate schedule per owner requirement",
    ],
    "REWORK": [
        "Rework required due to failed inspection",
        "Material substitution needed - originally specified unavailable",
        "Correct installation per manufacturer requirements",
        "Repair damage from adjacent work",
    ]
}

def generate_projects_df():
    """Generate project master data."""
    projects_data = []
    base_date = datetime(2024, 1, 1)
    
    for p in PROJECTS:
        start_date = base_date + timedelta(days=random.randint(-180, 0))
        end_date = start_date + timedelta(days=p["duration_months"] * 30)
        
        # Calculate current state (partially complete)
        days_elapsed = (datetime.now() - start_date).days
        total_days = (end_date - start_date).days
        pct_time_elapsed = min(days_elapsed / total_days, 1.0) if total_days > 0 else 0
        
        # Add some variance to CPI/SPI
        cpi = round(np.random.normal(0.97, 0.05), 3)  # Slightly over budget on average
        spi = round(np.random.normal(0.98, 0.04), 3)  # Slightly behind schedule
        
        contingency = p["original_budget"] * p["contingency_pct"]
        contingency_used = contingency * pct_time_elapsed * random.uniform(0.8, 1.3)
        
        projects_data.append({
            "PROJECT_ID": p["project_id"],
            "PROJECT_NAME": p["project_name"],
            "PROJECT_CODE": p["project_id"].replace("PRJ-", ""),
            "PROJECT_TYPE": p["project_type"],
            "STATUS": "ACTIVE",
            "CITY": p["city"],
            "STATE": p["state"],
            "LATITUDE": p["latitude"],
            "LONGITUDE": p["longitude"],
            "PLANNED_START_DATE": start_date.date(),
            "PLANNED_END_DATE": end_date.date(),
            "ACTUAL_START_DATE": start_date.date(),
            "ACTUAL_END_DATE": None,
            "ORIGINAL_BUDGET": p["original_budget"],
            "CURRENT_BUDGET": p["original_budget"] * random.uniform(1.02, 1.08),
            "CONTINGENCY_BUDGET": contingency,
            "CONTINGENCY_USED": min(contingency_used, contingency * 0.95),
            "CPI": max(0.85, min(1.15, cpi)),
            "SPI": max(0.85, min(1.15, spi)),
            "PROGRAM_ID": "INFRA-2024",
            "OWNER_NAME": "State Transportation Authority",
            "PRIME_CONTRACTOR": p["prime_contractor"],
        })
    
    return pd.DataFrame(projects_data)


def generate_vendors_df():
    """Generate vendor master data."""
    vendors_data = []
    
    for v in VENDORS:
        # Risk profile affects metrics
        if v["risk_profile"] == "HIGH":
            co_rate = random.uniform(3.5, 5.0)  # High CO rate
            ontime_rate = random.uniform(0.65, 0.80)
            quality_score = random.uniform(60, 75)
            risk_score = random.randint(70, 90)
        elif v["risk_profile"] == "MEDIUM":
            co_rate = random.uniform(1.5, 3.0)
            ontime_rate = random.uniform(0.80, 0.90)
            quality_score = random.uniform(75, 85)
            risk_score = random.randint(40, 60)
        else:  # LOW
            co_rate = random.uniform(0.5, 1.5)
            ontime_rate = random.uniform(0.90, 0.98)
            quality_score = random.uniform(85, 95)
            risk_score = random.randint(15, 35)
        
        vendors_data.append({
            "VENDOR_ID": v["vendor_id"],
            "VENDOR_NAME": v["vendor_name"],
            "VENDOR_CODE": v["vendor_id"].replace("VND-", "V"),
            "TRADE_CATEGORY": v["trade_category"],
            "VENDOR_TYPE": v["vendor_type"],
            "CONTACT_NAME": f"Contact for {v['vendor_name']}",
            "CONTACT_EMAIL": f"contact@{v['vendor_name'].lower().replace(' ', '')}.com",
            "CONTACT_PHONE": f"555-{random.randint(100,999)}-{random.randint(1000,9999)}",
            "ADDRESS": f"{random.randint(100,9999)} Industrial Blvd",
            "AVG_CO_RATE": round(co_rate, 2),
            "ONTIME_DELIVERY_RATE": round(ontime_rate, 2),
            "SAFETY_INCIDENT_RATE": round(random.uniform(0, 0.05), 3),
            "QUALITY_SCORE": round(quality_score, 1),
            "RISK_SCORE": risk_score,
            "RISK_SCORE_DATE": datetime.now().date(),
            "ACTIVE_FLAG": True,
        })
    
    return pd.DataFrame(vendors_data)


def generate_change_orders_df(projects_df):
    """
    Generate change orders with the "Hidden Discovery" pattern.
    
    KEY PATTERN: ~150 small COs from Apex Electrical across all projects,
    all related to grounding specifications missing from original design.
    """
    change_orders = []
    co_counter = 1
    
    # THE HIDDEN DISCOVERY: Generate grounding-related COs from Apex Electrical
    # These will be small (<$5k), auto-approved, spread across multiple projects
    
    apex_vendor_id = "VND-001"  # Apex Electrical
    
    for project in PROJECTS:
        project_id = project["project_id"]
        
        # Generate 10-15 small grounding COs per project from Apex
        num_grounding_cos = random.randint(10, 15)
        
        for i in range(num_grounding_cos):
            co_id = f"CO-{co_counter:05d}"
            co_counter += 1
            
            # Small amounts - below auto-approval threshold
            amount = random.uniform(1500, 4800)
            
            # Pick a grounding-related reason
            reason = random.choice(GROUNDING_PHRASES)
            
            # Dates spread over project duration
            submit_date = datetime(2024, 1, 1) + timedelta(days=random.randint(30, 300))
            approval_date = submit_date + timedelta(days=random.randint(1, 5))
            
            change_orders.append({
                "CO_ID": co_id,
                "PROJECT_ID": project_id,
                "VENDOR_ID": apex_vendor_id,
                "CO_NUMBER": f"{project_id[-3:]}-CO-{i+1:03d}",
                "CO_TITLE": f"Grounding Addition - {project['project_name'][:20]}",
                "CO_TYPE": "SCOPE_CHANGE",
                "CO_CATEGORY": "ELECTRICAL",
                "COST_CODE": "26 05 00",  # Electrical cost code
                "ORIGINAL_AMOUNT": amount,
                "APPROVED_AMOUNT": amount,
                "STATUS": "APPROVED",
                "APPROVAL_LEVEL": "AUTO",  # Auto-approved because small
                "SUBMIT_DATE": submit_date.date(),
                "APPROVAL_DATE": approval_date.date(),
                "EFFECTIVE_DATE": approval_date.date(),
                "REASON_TEXT": reason,
                "JUSTIFICATION": f"Required for code compliance. {reason}",
                "ML_CATEGORY": "SCOPE_GAP",  # Will be classified by ML
                "ML_CONFIDENCE": random.uniform(0.85, 0.98),
                "ML_SCOPE_GAP_PROB": random.uniform(0.88, 0.99),
                "ML_DESIGN_ERROR_PROB": random.uniform(0.01, 0.08),
                "ML_FIELD_CONDITION_PROB": random.uniform(0.01, 0.05),
                "CREATED_BY": "system_import",
            })
    
    # Generate normal COs from other vendors
    for project in PROJECTS:
        project_id = project["project_id"]
        
        # Generate 20-40 normal COs per project
        num_normal_cos = random.randint(20, 40)
        
        for i in range(num_normal_cos):
            co_id = f"CO-{co_counter:05d}"
            co_counter += 1
            
            # Pick a random vendor (not Apex for variety)
            vendor = random.choice([v for v in VENDORS if v["vendor_id"] != apex_vendor_id])
            
            # Pick a category and reason
            category = random.choice(list(NORMAL_CO_REASONS.keys()))
            reason = random.choice(NORMAL_CO_REASONS[category])
            
            # Varying amounts
            if random.random() < 0.6:
                amount = random.uniform(5000, 50000)  # Most COs
            else:
                amount = random.uniform(50000, 250000)  # Larger COs
            
            # Approval level based on amount
            if amount < 5000:
                approval_level = "AUTO"
            elif amount < 25000:
                approval_level = "PM"
            elif amount < 100000:
                approval_level = "DIRECTOR"
            else:
                approval_level = "EXECUTIVE"
            
            submit_date = datetime(2024, 1, 1) + timedelta(days=random.randint(30, 350))
            approval_date = submit_date + timedelta(days=random.randint(3, 21))
            
            # ML classification based on category
            ml_probs = {
                "FIELD_CONDITION": (0.1, 0.1, 0.75),
                "DESIGN_ERROR": (0.15, 0.70, 0.10),
                "OWNER_REQUEST": (0.05, 0.05, 0.05),
                "REWORK": (0.10, 0.60, 0.10),
            }
            sg_prob, de_prob, fc_prob = ml_probs.get(category, (0.2, 0.2, 0.2))
            
            change_orders.append({
                "CO_ID": co_id,
                "PROJECT_ID": project_id,
                "VENDOR_ID": vendor["vendor_id"],
                "CO_NUMBER": f"{project_id[-3:]}-CO-{num_grounding_cos + i + 1:03d}",
                "CO_TITLE": reason[:50],
                "CO_TYPE": category,
                "CO_CATEGORY": vendor["trade_category"],
                "COST_CODE": f"{random.randint(1,50):02d} {random.randint(0,99):02d} 00",
                "ORIGINAL_AMOUNT": amount,
                "APPROVED_AMOUNT": amount * random.uniform(0.9, 1.0),
                "STATUS": random.choices(["APPROVED", "SUBMITTED", "DRAFT"], weights=[0.7, 0.2, 0.1])[0],
                "APPROVAL_LEVEL": approval_level,
                "SUBMIT_DATE": submit_date.date(),
                "APPROVAL_DATE": approval_date.date() if random.random() > 0.3 else None,
                "EFFECTIVE_DATE": approval_date.date() if random.random() > 0.3 else None,
                "REASON_TEXT": reason,
                "JUSTIFICATION": f"Justification: {reason}",
                "ML_CATEGORY": category.replace("_", " ").title().replace(" ", "_"),
                "ML_CONFIDENCE": random.uniform(0.60, 0.95),
                "ML_SCOPE_GAP_PROB": sg_prob + random.uniform(-0.05, 0.05),
                "ML_DESIGN_ERROR_PROB": de_prob + random.uniform(-0.05, 0.05),
                "ML_FIELD_CONDITION_PROB": fc_prob + random.uniform(-0.05, 0.05),
                "CREATED_BY": "system_import",
            })
    
    return pd.DataFrame(change_orders)


def generate_activities_df(projects_df):
    """Generate schedule activities with realistic dependencies."""
    activities = []
    activity_counter = 1
    
    # Phases and typical activities
    PHASES = {
        "DESIGN": [
            ("Preliminary Engineering", 60),
            ("Final Design", 90),
            ("Permit Applications", 45),
            ("Design Reviews", 30),
        ],
        "PROCUREMENT": [
            ("Long Lead Equipment", 120),
            ("Subcontractor Bidding", 45),
            ("Material Procurement", 60),
            ("Contract Awards", 30),
        ],
        "CONSTRUCTION": [
            ("Site Preparation", 45),
            ("Foundations", 60),
            ("Structural Steel", 90),
            ("Building Envelope", 75),
            ("MEP Rough-In", 90),
            ("Interior Finishes", 60),
            ("Testing & Commissioning", 45),
        ],
        "COMMISSIONING": [
            ("Systems Testing", 30),
            ("Training", 15),
            ("Substantial Completion", 1),
            ("Final Completion", 30),
        ]
    }
    
    for project in PROJECTS:
        project_id = project["project_id"]
        project_start = datetime(2024, 1, 1) + timedelta(days=random.randint(-180, 0))
        current_date = project_start
        
        for phase_name, activities_list in PHASES.items():
            for activity_name, base_duration in activities_list:
                activity_id = f"ACT-{activity_counter:05d}"
                activity_counter += 1
                
                # Add some variance to duration
                duration = int(base_duration * random.uniform(0.8, 1.2))
                
                planned_start = current_date
                planned_finish = planned_start + timedelta(days=duration)
                
                # Progress based on current date
                today = datetime.now()
                if planned_finish < today:
                    pct_complete = 100
                    actual_start = planned_start
                    actual_finish = planned_finish + timedelta(days=random.randint(-5, 10))
                elif planned_start < today:
                    days_into = (today - planned_start).days
                    pct_complete = min(95, int((days_into / duration) * 100 * random.uniform(0.8, 1.1)))
                    actual_start = planned_start + timedelta(days=random.randint(-2, 5))
                    actual_finish = None
                else:
                    pct_complete = 0
                    actual_start = None
                    actual_finish = None
                
                # Calculate float and critical path
                total_float = random.randint(0, 30)
                is_critical = total_float <= 5
                
                # ML risk prediction
                slip_prob = 0.1 + (0.3 if is_critical else 0) + random.uniform(0, 0.3)
                slip_prob = min(0.95, slip_prob)
                
                activities.append({
                    "ACTIVITY_ID": activity_id,
                    "PROJECT_ID": project_id,
                    "ACTIVITY_CODE": f"{phase_name[:3]}-{activity_counter}",
                    "ACTIVITY_NAME": activity_name,
                    "WBS_CODE": f"{project_id[-3:]}.{list(PHASES.keys()).index(phase_name)+1}",
                    "PARENT_ACTIVITY_ID": None,
                    "LEVEL_NUMBER": 2,
                    "ACTIVITY_TYPE": "TASK",
                    "PHASE": phase_name,
                    "DISCIPLINE": random.choice(["CIVIL", "STRUCTURAL", "ELECTRICAL", "MECHANICAL"]),
                    "PLANNED_START": planned_start.date(),
                    "PLANNED_FINISH": planned_finish.date(),
                    "PLANNED_DURATION": duration,
                    "ACTUAL_START": actual_start.date() if actual_start else None,
                    "ACTUAL_FINISH": actual_finish.date() if actual_finish else None,
                    "FORECAST_START": planned_start.date(),
                    "FORECAST_FINISH": (planned_finish + timedelta(days=random.randint(-5, 15))).date(),
                    "PERCENT_COMPLETE": pct_complete,
                    "TOTAL_FLOAT": total_float,
                    "FREE_FLOAT": max(0, total_float - 5),
                    "IS_CRITICAL": is_critical,
                    "SLIP_PROBABILITY": round(slip_prob, 3),
                    "PREDICTED_SLIP_DAYS": random.randint(0, 15) if slip_prob > 0.5 else 0,
                    "RISK_DRIVERS": json.dumps({"resource_constraint": 0.3, "predecessor_delay": 0.2}),
                    "ASSIGNED_VENDOR_ID": random.choice(VENDORS)["vendor_id"],
                    "BUDGETED_HOURS": duration * 8 * random.randint(2, 10),
                    "ACTUAL_HOURS": None,
                    "DATA_DATE": datetime.now().date(),
                })
                
                # Move to next activity start
                current_date = planned_finish
    
    return pd.DataFrame(activities)


def generate_monthly_snapshots_df(projects_df):
    """Generate monthly trend data for S-curves."""
    snapshots = []
    snapshot_counter = 1
    
    for _, project in projects_df.iterrows():
        project_id = project["PROJECT_ID"]
        budget = project["ORIGINAL_BUDGET"]
        
        # Generate 12 months of snapshots
        for month_offset in range(12):
            snapshot_date = datetime(2024, 1, 1) + timedelta(days=month_offset * 30)
            
            # S-curve progression
            pct_time = (month_offset + 1) / 12
            # S-curve formula: more spend in middle phases
            planned_pct = 0.5 * (1 + np.tanh(5 * (pct_time - 0.5)))
            actual_pct = planned_pct * random.uniform(0.92, 1.02)  # Slight variance
            
            bcws = budget * planned_pct
            bcwp = budget * actual_pct * random.uniform(0.95, 1.0)
            acwp = bcwp * random.uniform(1.0, 1.08)  # Typically slightly over
            
            cpi = bcwp / acwp if acwp > 0 else 1.0
            spi = bcwp / bcws if bcws > 0 else 1.0
            
            snapshots.append({
                "SNAPSHOT_ID": f"SNAP-{snapshot_counter:06d}",
                "PROJECT_ID": project_id,
                "SNAPSHOT_DATE": snapshot_date.date(),
                "ORIGINAL_BUDGET": budget,
                "CURRENT_BUDGET": budget * 1.05,
                "ACTUAL_COST": acwp,
                "FORECAST_COST": budget * random.uniform(1.02, 1.10),
                "EAC": budget * random.uniform(1.03, 1.12),
                "BCWS": bcws,
                "BCWP": bcwp,
                "ACWP": acwp,
                "CPI": round(cpi, 3),
                "SPI": round(spi, 3),
                "TCPI": round(1.0 + (1.0 - cpi) * 0.5, 3),
                "CONTINGENCY_REMAINING": project["CONTINGENCY_BUDGET"] * (1 - actual_pct * 0.8),
                "CONTINGENCY_BURN_RATE": project["CONTINGENCY_BUDGET"] * 0.05,
                "CO_COUNT_MTD": random.randint(2, 8),
                "CO_AMOUNT_MTD": random.uniform(20000, 150000),
                "CO_COUNT_CUMULATIVE": int(month_offset * random.uniform(3, 6)),
                "CO_AMOUNT_CUMULATIVE": month_offset * random.uniform(50000, 200000),
                "PERCENT_COMPLETE": round(actual_pct * 100, 1),
                "DAYS_AHEAD_BEHIND": random.randint(-15, 5),
            })
            snapshot_counter += 1
    
    return pd.DataFrame(snapshots)


def main():
    """Generate all synthetic data and save to parquet files."""
    print("🏗️  ATLAS Capital Delivery - Synthetic Data Generator")
    print("=" * 60)
    
    # Generate data
    print("\n📊 Generating Projects...")
    projects_df = generate_projects_df()
    print(f"   ✓ {len(projects_df)} projects created")
    
    print("\n🏢 Generating Vendors...")
    vendors_df = generate_vendors_df()
    print(f"   ✓ {len(vendors_df)} vendors created")
    
    print("\n📝 Generating Change Orders (with Hidden Discovery pattern)...")
    change_orders_df = generate_change_orders_df(projects_df)
    
    # Count the grounding-related COs
    grounding_cos = change_orders_df[
        change_orders_df["REASON_TEXT"].str.contains("ground", case=False, na=False)
    ]
    print(f"   ✓ {len(change_orders_df)} change orders created")
    print(f"   ✓ {len(grounding_cos)} grounding-related COs (Hidden Discovery pattern)")
    print(f"   ✓ Total aggregate amount: ${grounding_cos['APPROVED_AMOUNT'].sum():,.0f}")
    
    print("\n📅 Generating Schedule Activities...")
    activities_df = generate_activities_df(projects_df)
    print(f"   ✓ {len(activities_df)} activities created")
    
    print("\n📈 Generating Monthly Snapshots...")
    snapshots_df = generate_monthly_snapshots_df(projects_df)
    print(f"   ✓ {len(snapshots_df)} monthly snapshots created")
    
    # Save to parquet
    output_dir = "../data/synthetic"
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\n💾 Saving to {output_dir}/...")
    projects_df.to_parquet(f"{output_dir}/projects.parquet", index=False)
    vendors_df.to_parquet(f"{output_dir}/vendors.parquet", index=False)
    change_orders_df.to_parquet(f"{output_dir}/change_orders.parquet", index=False)
    activities_df.to_parquet(f"{output_dir}/activities.parquet", index=False)
    snapshots_df.to_parquet(f"{output_dir}/monthly_snapshots.parquet", index=False)
    
    print("\n✅ Data generation complete!")
    print("\n📊 Summary:")
    print(f"   • Total Portfolio Budget: ${projects_df['ORIGINAL_BUDGET'].sum():,.0f}")
    print(f"   • Projects: {len(projects_df)}")
    print(f"   • Vendors: {len(vendors_df)}")
    print(f"   • Change Orders: {len(change_orders_df)}")
    print(f"   • Schedule Activities: {len(activities_df)}")
    print(f"   • Monthly Snapshots: {len(snapshots_df)}")
    print(f"\n🎯 Hidden Discovery Pattern:")
    print(f"   • Vendor: Apex Electrical Services (VND-001)")
    print(f"   • Pattern: Missing grounding specifications")
    print(f"   • COs in pattern: {len(grounding_cos)}")
    print(f"   • Aggregate risk: ${grounding_cos['APPROVED_AMOUNT'].sum():,.0f}")


if __name__ == "__main__":
    main()
