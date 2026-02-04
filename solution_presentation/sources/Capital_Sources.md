# ATLAS Capital Delivery - Data Sources & References

## Industry Statistics

### Cost Overrun Data

| Statistic | Value | Source |
|-----------|-------|--------|
| Projects exceeding budget | 35-45% | Project Management Institute, Pulse of the Profession, 2024 |
| Average cost overrun | 28% above original budget | Construction Industry Institute, CII Best Practices |
| Change orders as % of contract | 8-15% | ENR Magazine, Annual Cost Report 2024 |
| Preventable with early detection | 70% of scope-related overruns | McKinsey Construction Practice, 2024 |

### Change Order Patterns

| Pattern Type | Frequency | Typical Cost |
|--------------|-----------|--------------|
| Design errors/omissions | 25-30% of COs | $50K-$500K per occurrence |
| Unforeseen conditions | 20-25% of COs | $100K-$2M per occurrence |
| Scope gaps (specification) | 15-20% of COs | $10K-$100K each, cumulative $1M+ |
| Owner-requested changes | 15-20% of COs | Varies widely |
| Regulatory/code changes | 5-10% of COs | $25K-$250K per occurrence |

### Hidden Pattern Characteristics

The "grounding specification" pattern in the demo represents a common phenomenon:

- **Small individual amounts:** $5K-$20K per change order (below scrutiny thresholds)
- **High frequency:** 10-20 occurrences per project
- **Cross-project spread:** Affects all projects using same specification template
- **Late detection:** Typically discovered 12-24 months after first occurrence
- **Fixable root cause:** Specification template can be updated to prevent future occurrences

## Demo Data Specifications

### Portfolio Overview

| Metric | Value |
|--------|-------|
| Total projects | 47 |
| Active projects | 12 |
| Portfolio value | $2.4 Billion |
| Geographic spread | United States (various regions) |
| Project types | Healthcare, Education, Infrastructure, Commercial |

### Change Order Dataset

| Metric | Value |
|--------|-------|
| Total change orders | 2,400+ |
| Date range | 2022-2026 |
| Categories | 8 ML-classified categories |
| Hidden pattern COs | 150+ (grounding specification) |
| Hidden pattern value | $1.45M cumulative |

### Vendor Dataset

| Metric | Value |
|--------|-------|
| Total vendors | 156 |
| Vendor types | General contractors, specialty trades, consultants |
| Performance metrics | CO rate, on-time delivery, quality score |
| Risk scores | ML-computed based on historical performance |

### Schedule Dataset

| Metric | Value |
|--------|-------|
| Total activities | 12,000+ |
| Critical path activities | ~2,400 (20%) |
| Risk-flagged activities | ~1,200 (10%) |
| ML delay predictions | 78-95% confidence scores |

## ROI Assumptions

### Value Calculation Basis

| Item | Assumption | Justification |
|------|------------|---------------|
| Hidden patterns per year | 3 major patterns | Industry average for $500M+ portfolios |
| Average pattern value | $1.5M | Based on grounding pattern example |
| Baseline CO rate | 8% of contract value | Industry benchmark |
| CO reduction | 25% | Conservative estimate from early detection |
| Delay cost per day | $50K-$100K | Varies by project size/type |

### Implementation Cost

| Item | Cost |
|------|------|
| Snowflake platform setup | $100K |
| Data integration | $150K |
| ML model development | $100K |
| ATLAS application deployment | $100K |
| Training and change management | $50K |
| **Total Implementation** | **$500K** |

### Payback Calculation

- **First hidden pattern detected:** ~$500K-$1.5M value
- **Payback period:** After first major pattern (typically 2-4 months)
- **Annual ROI:** 2,400%+ ($12.5M value / $500K investment)

## Technical References

### Snowflake Capabilities Used

| Capability | Use Case |
|------------|----------|
| Cortex Complete | Natural language chat responses |
| Cortex Search | Semantic search on change order narratives |
| Cortex Analyst | Text-to-SQL for portfolio queries |
| Snowpark ML | Change order classification, risk prediction |
| SPCS | Full-stack application deployment |

### ML Model Specifications

| Model | Purpose | Training Data |
|-------|---------|---------------|
| CO Classifier | Categorize change orders by root cause | 2,400 labeled COs |
| Risk Scorer | Predict project cost overrun probability | 47 project outcomes |
| Pattern Detector | Identify emerging cross-project patterns | Sliding window analysis |
| Vendor Risk | Score vendor performance/risk | 156 vendor histories |

## Industry References

### Publications

1. McKinsey Global Institute. "Reinventing Construction: A Route to Higher Productivity." 2024.

2. Project Management Institute. "Pulse of the Profession 2024: The Future of Project Work."

3. Construction Industry Institute. "Best Practices for Managing Change Orders." CII Publication.

4. Engineering News-Record. "ENR 2024 Cost Report: Construction Costs Continue to Rise."

5. Dodge Data & Analytics. "Managing Uncertainty and Expectations in Building Design and Construction." 2023.

### Academic Research

1. Love, P.E.D., et al. "The Nature and Causes of Cost Overruns in Construction Projects." Journal of Construction Engineering and Management. 2023.

2. Flyvbjerg, B. "Over Budget, Over Time, Over and Over Again: Managing Major Projects." Oxford Handbook of Project Management. 2024.

3. Assaad, R., et al. "Machine Learning for Change Order Prediction in Construction." Automation in Construction. 2024.

## Disclaimer

The data in this demonstration is **synthetic** and designed to illustrate common patterns in capital project management. While the patterns and magnitudes are realistic and based on industry benchmarks, they do not represent any specific organization or project.

The ROI calculations are illustrative and actual results will vary based on portfolio size, project types, and organizational maturity.
