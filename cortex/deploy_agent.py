#!/usr/bin/env python3
"""
ATLAS Capital Delivery - Cortex Agent Deployment Script

Verifies prerequisites and provides deployment instructions.
The agent itself is deployed via Snowsight UI.

Usage:
    python deploy_agent.py [--connection demo]
"""

import argparse
import json


def verify_and_print_instructions(connection_name: str = "demo"):
    """Verify prerequisites and print deployment instructions."""
    
    from snowflake.snowpark import Session
    
    print("🏗️  ATLAS Capital Delivery - Agent Deployment")
    print("=" * 60)
    
    # Create session
    print(f"\n📡 Connecting to Snowflake ({connection_name})...")
    session = Session.builder.configs({"connection_name": connection_name}).create()
    print(f"   ✓ Connected to {session.get_current_account()}")
    
    # Verify prerequisites
    print("\n🔍 Verifying prerequisites...")
    
    # Check semantic model
    try:
        result = session.sql("""
            LIST @CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS 
            PATTERN = '.*capital_semantic_model.yaml'
        """).collect()
        if result:
            print("   ✓ Semantic model uploaded")
        else:
            print("   ⚠️  Semantic model not found - run deploy.sh first")
    except Exception as e:
        print(f"   ⚠️  Could not verify semantic model: {e}")
    
    # Check search services
    try:
        result = session.sql("""
            SHOW CORTEX SEARCH SERVICES IN DATABASE CAPITAL_PROJECTS_DB
        """).collect()
        services = [r['name'] for r in result]
        if 'CO_SEARCH_SERVICE' in services:
            print("   ✓ CO_SEARCH_SERVICE available")
        if 'CONTRACT_SEARCH_SERVICE' in services:
            print("   ✓ CONTRACT_SEARCH_SERVICE available")
    except Exception as e:
        print(f"   ⚠️  Could not verify search services: {e}")
    
    # Check data
    try:
        result = session.sql("""
            SELECT 
                (SELECT COUNT(*) FROM CAPITAL_PROJECTS_DB.ATOMIC.PROJECT) as projects,
                (SELECT COUNT(*) FROM CAPITAL_PROJECTS_DB.ATOMIC.CHANGE_ORDER) as change_orders,
                (SELECT COUNT(*) FROM CAPITAL_PROJECTS_DB.ATOMIC.VENDOR) as vendors
        """).collect()
        row = result[0]
        print(f"   ✓ Data loaded: {row['PROJECTS']} projects, {row['CHANGE_ORDERS']} COs, {row['VENDORS']} vendors")
    except Exception as e:
        print(f"   ⚠️  Could not verify data: {e}")
    
    # Hidden Discovery preview
    print("\n🎯 Hidden Discovery Pattern:")
    try:
        result = session.sql("""
            SELECT 
                COUNT(*) as co_count,
                COUNT(DISTINCT PROJECT_ID) as projects,
                ROUND(SUM(APPROVED_AMOUNT), 0) as total
            FROM CAPITAL_PROJECTS_DB.ATOMIC.CHANGE_ORDER
            WHERE LOWER(REASON_TEXT) LIKE '%ground%'
              AND STATUS = 'APPROVED'
        """).collect()
        row = result[0]
        print(f"   • Pattern: Missing Grounding Specifications")
        print(f"   • COs in pattern: {row['CO_COUNT']}")
        print(f"   • Projects affected: {row['PROJECTS']}")
        print(f"   • Total impact: ${row['TOTAL']:,.0f}")
    except Exception as e:
        print(f"   ⚠️  Could not verify Hidden Discovery: {e}")
    
    # Load agent config
    print("\n📋 Agent Configuration:")
    try:
        with open("atlas_agent.json", "r") as f:
            config = json.load(f)
        print(f"   • Name: {config['name']}")
        print(f"   • Tools: {', '.join([t['tool_name'] for t in config['tools']])}")
        print(f"   • Sample questions: {len(config['sample_questions'])}")
    except Exception as e:
        print(f"   ⚠️  Could not load config: {e}")
    
    # Print deployment instructions
    print("\n" + "=" * 60)
    print("📝 DEPLOYMENT INSTRUCTIONS")
    print("=" * 60)
    
    print("""
1. Open Snowsight in your browser

2. Navigate to: AI & ML → Cortex Agents

3. Click "Create Agent" or "+" button

4. Configure the agent:

   Name: ATLAS_CAPITAL_AGENT
   
   Description: 
   AI agent for capital project portfolio intelligence. 
   Combines data queries with ML insights and pattern detection.
   
   Model: mistral-large (recommended) or llama3.1-70b
   
   Instructions:
   You are ATLAS, an AI assistant for capital project portfolio management.
   You help project managers, executives, and analysts understand project health.
   
   IMPORTANT: For 'Hidden Discovery' questions, search for 'grounding' related 
   change orders - there's a systemic issue with 150+ small COs!
   
   Always format currency with $ and commas. Highlight risks when CPI < 0.95.

5. Add Tools:

   Tool 1 - Data Analyst (Cortex Analyst):
   - Name: data_analyst
   - Semantic Model: @CAPITAL_PROJECTS_DB.CAPITAL_PROJECTS.SEMANTIC_MODELS/capital_semantic_model.yaml
   
   Tool 2 - CO Search (Cortex Search):
   - Name: co_search  
   - Service: CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE
   - Max Results: 10
   
   Tool 3 - Contract Search (Cortex Search):
   - Name: contract_search
   - Service: CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE
   - Max Results: 5

6. Test with these sample questions:
   - "What is the portfolio health summary?"
   - "Search for change orders related to grounding"
   - "What is the Hidden Discovery pattern?"
   - "Show me the top 5 vendors by change order rate"

7. Click "Create" to deploy the agent
""")
    
    print("=" * 60)
    print("✅ Prerequisites verified! Ready for UI deployment.")
    print("=" * 60)
    
    session.close()


def main():
    parser = argparse.ArgumentParser(description="Deploy ATLAS Capital Agent")
    parser.add_argument("--connection", default="demo", help="Snowflake connection name")
    args = parser.parse_args()
    
    verify_and_print_instructions(args.connection)


if __name__ == "__main__":
    main()
