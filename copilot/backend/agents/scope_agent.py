"""
ATLAS Capital Delivery - Scope Analyst Agent

Analyzes change orders, detects patterns, and reveals the "Hidden Discovery".
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class ScopeAnalyst:
    """
    Agent responsible for change order analysis and pattern detection.
    
    This is the KEY AGENT for the "Hidden Discovery" - finding systemic
    scope gaps hidden in many small, auto-approved change orders.
    """
    
    def __init__(self, snowflake_service):
        self.sf = snowflake_service
    
    async def analyze_change_orders(self, project_id: Optional[str] = None) -> Dict[str, Any]:
        """Analyze change orders for a project or the entire portfolio."""
        change_orders = self.sf.get_change_orders(project_id=project_id, limit=200)
        
        # Calculate summary stats
        approved = [co for co in change_orders if co.get("STATUS") == "APPROVED"]
        total_amount = sum(co.get("APPROVED_AMOUNT", 0) or 0 for co in approved)
        
        # Group by category
        by_category = {}
        for co in approved:
            cat = co.get("ML_CATEGORY") or "UNKNOWN"
            if cat not in by_category:
                by_category[cat] = {"count": 0, "amount": 0}
            by_category[cat]["count"] += 1
            by_category[cat]["amount"] += co.get("APPROVED_AMOUNT", 0) or 0
        
        # Group by vendor
        by_vendor = {}
        for co in approved:
            vendor = co.get("VENDOR_NAME") or "Unknown"
            if vendor not in by_vendor:
                by_vendor[vendor] = {"count": 0, "amount": 0}
            by_vendor[vendor]["count"] += 1
            by_vendor[vendor]["amount"] += co.get("APPROVED_AMOUNT", 0) or 0
        
        # Sort vendors by amount
        top_vendors = sorted(by_vendor.items(), key=lambda x: x[1]["amount"], reverse=True)[:5]
        
        scope_title = f"Project {project_id}" if project_id else "Portfolio"
        
        narrative = f"""## 📝 Change Order Analysis - {scope_title}

### Summary
- **Total COs**: {len(approved)} approved (${total_amount/1e6:.2f}M)
- **Average CO Size**: ${total_amount/len(approved)/1e3:.1f}K

### By Classification (ML)
| Category | Count | Amount |
|----------|-------|--------|
"""
        
        for cat, data in sorted(by_category.items(), key=lambda x: x[1]["amount"], reverse=True):
            narrative += f"| {cat} | {data['count']} | ${data['amount']/1e6:.2f}M |\n"
        
        narrative += "\n### Top Vendors by CO Value\n"
        for vendor, data in top_vendors:
            narrative += f"- **{vendor}**: {data['count']} COs, ${data['amount']/1e6:.2f}M\n"
        
        # Check for scope gap alert
        scope_gaps = by_category.get("SCOPE_GAP", {"count": 0, "amount": 0})
        if scope_gaps["count"] > 20:
            narrative += f"\n### ⚠️ Alert: Scope Gap Pattern Detected\n"
            narrative += f"Found **{scope_gaps['count']} scope gap COs** totaling **${scope_gaps['amount']/1e6:.2f}M**.\n"
            narrative += "Consider asking: *'Show me the hidden patterns in scope gaps'*"
        
        return {
            "narrative": narrative,
            "data": {
                "change_orders": approved[:20],  # Return top 20
                "by_category": by_category,
                "by_vendor": dict(top_vendors),
                "total_amount": total_amount
            },
            "sources": ["ATOMIC.CHANGE_ORDER"]
        }
    
    async def find_hidden_patterns(self) -> Dict[str, Any]:
        """
        THE HIDDEN DISCOVERY: Find systemic scope gaps in small, auto-approved COs.
        
        This is the "wow moment" - revealing that many small COs share a common
        root cause (missing grounding specs) and aggregate to significant impact.
        """
        # Get the grounding pattern specifically
        grounding_data = self.sf.get_grounding_pattern()
        scope_gaps = self.sf.get_scope_gap_analysis()
        
        if not grounding_data:
            return {
                "narrative": "No significant scope leakage patterns detected at this time.",
                "data": {},
                "sources": []
            }
        
        co_count = grounding_data.get("co_count", 0)
        project_count = grounding_data.get("project_count", 0)
        total_amount = grounding_data.get("total_amount", 0)
        vendor = grounding_data.get("common_vendor", "Unknown")
        change_orders = grounding_data.get("change_orders", [])
        
        # Calculate average individual CO amount
        avg_amount = total_amount / co_count if co_count > 0 else 0
        
        narrative = f"""## 🔍 HIDDEN DISCOVERY: Scope Leakage Pattern Detected

### 🚨 Alert: Systemic Design Gap Identified

ATLAS has detected a **significant pattern** across your portfolio that requires immediate attention:

---

### Pattern: "Missing Grounding Specifications"

| Metric | Value |
|--------|-------|
| **Affected Projects** | {project_count} of 12 ({project_count/12*100:.0f}%) |
| **Total Change Orders** | {co_count} |
| **Average CO Size** | ${avg_amount:,.0f} |
| **Aggregate Impact** | **${total_amount:,.0f}** |
| **Primary Vendor** | {vendor} |

---

### Why This Matters

1. **Surface Appearance**: Each CO appears small (${avg_amount:,.0f} average) and was auto-approved
2. **Hidden Reality**: These COs share a common root cause - electrical grounding was not specified in the original design package
3. **Systemic Issue**: The same gap exists across **{project_count} projects** because they used the same design template

### Sample Change Order Reasons
"""
        
        # Show a few example CO reasons
        for co in change_orders[:5]:
            narrative += f"- *\"{co.get('REASON_TEXT', 'N/A')[:80]}...\"*\n"
        
        narrative += f"""
### Recommended Actions

1. **Immediate**: Issue Global Design Bulletin to add grounding specifications
2. **Preventive**: Update bid documents to include NEC Article 250 requirements
3. **Financial**: Reserve additional ${total_amount * 0.1:,.0f} for remaining projects

### Business Impact

- **If not addressed**: Additional ${total_amount * 0.3:,.0f} exposure on future phases
- **If fixed upstream**: Prevent ${total_amount * 1.5:,.0f} in future change orders

---

*This insight was generated by analyzing {co_count} change orders using ML text classification and clustering. The pattern was detected by identifying semantic similarity in "reason for change" text fields.*
"""
        
        return {
            "narrative": narrative,
            "data": {
                "pattern_name": "Missing Grounding Specifications",
                "co_count": co_count,
                "project_count": project_count,
                "total_amount": total_amount,
                "avg_amount": avg_amount,
                "vendor": vendor,
                "change_orders": change_orders[:20],
                "scope_gaps": scope_gaps
            },
            "sources": ["ATOMIC.CHANGE_ORDER", "ML.CO_CLASSIFICATIONS", "DOCS.CO_SEARCH_SERVICE"]
        }
    
    async def analyze_vendor(self, vendor_id: str) -> Dict[str, Any]:
        """Analyze a specific vendor's change order history."""
        change_orders = self.sf.get_change_orders(limit=500)
        
        # Filter to this vendor
        vendor_cos = [co for co in change_orders if co.get("VENDOR_ID") == vendor_id]
        approved = [co for co in vendor_cos if co.get("STATUS") == "APPROVED"]
        
        if not vendor_cos:
            return {
                "narrative": f"No change orders found for vendor {vendor_id}.",
                "data": {},
                "sources": []
            }
        
        vendor_name = vendor_cos[0].get("VENDOR_NAME", vendor_id)
        trade = vendor_cos[0].get("TRADE_CATEGORY", "Unknown")
        
        total_amount = sum(co.get("APPROVED_AMOUNT", 0) or 0 for co in approved)
        projects = set(co.get("PROJECT_NAME") for co in approved)
        
        # Group by ML category
        by_category = {}
        for co in approved:
            cat = co.get("ML_CATEGORY") or "UNKNOWN"
            if cat not in by_category:
                by_category[cat] = {"count": 0, "amount": 0}
            by_category[cat]["count"] += 1
            by_category[cat]["amount"] += co.get("APPROVED_AMOUNT", 0) or 0
        
        narrative = f"""## 🏢 Vendor Analysis: {vendor_name}

### Overview
- **Trade**: {trade}
- **Total COs**: {len(approved)} approved
- **Total Amount**: ${total_amount:,.0f}
- **Projects Affected**: {len(projects)}

### Change Orders by Category
| Category | Count | Amount |
|----------|-------|--------|
"""
        
        for cat, data in sorted(by_category.items(), key=lambda x: x[1]["amount"], reverse=True):
            narrative += f"| {cat} | {data['count']} | ${data['amount']:,.0f} |\n"
        
        # Check if this is the "problem vendor"
        scope_gaps = by_category.get("SCOPE_GAP", {"count": 0, "amount": 0})
        if scope_gaps["count"] > 50:
            narrative += f"""
### ⚠️ Alert: High Scope Gap Rate

This vendor has **{scope_gaps['count']} scope gap COs** - significantly higher than peers.
This may indicate:
- Aggressive interpretation of scope
- Or systemic issues in original specifications affecting this trade

**Recommendation**: Review contract language and original specifications for {trade} work.
"""
        
        return {
            "narrative": narrative,
            "data": {
                "vendor_name": vendor_name,
                "vendor_id": vendor_id,
                "trade": trade,
                "co_count": len(approved),
                "total_amount": total_amount,
                "project_count": len(projects),
                "by_category": by_category,
                "change_orders": approved[:10]
            },
            "sources": ["ATOMIC.CHANGE_ORDER", "ATOMIC.VENDOR"]
        }
