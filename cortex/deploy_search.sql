-- ============================================================================
-- ATLAS Capital Delivery - Cortex Search Service Deployment
-- ============================================================================

USE DATABASE CAPITAL_PROJECTS_DB;
USE SCHEMA DOCS;

-- ============================================================================
-- DOCUMENT TABLES
-- ============================================================================

-- Contract documents and specifications
CREATE OR REPLACE TABLE CONTRACT_DOCUMENTS (
    DOC_ID VARCHAR(50) PRIMARY KEY,
    DOCUMENT_TITLE VARCHAR(500),
    DOCUMENT_TYPE VARCHAR(100),         -- 'CONTRACT', 'SPECIFICATION', 'DRAWING', 'SUBMITTAL'
    PROJECT_ID VARCHAR(50),
    SECTION_TITLE VARCHAR(500),
    CONTENT TEXT,
    PAGE_NUMBER INT,
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CONTRACT_DOCUMENTS IS 'Contract documents, specifications, and project documentation';

-- Change Order narratives for semantic search
CREATE OR REPLACE TABLE CO_NARRATIVES (
    NARRATIVE_ID VARCHAR(50) PRIMARY KEY,
    CO_ID VARCHAR(50),
    PROJECT_ID VARCHAR(50),
    VENDOR_ID VARCHAR(50),
    CO_NUMBER VARCHAR(30),
    CO_TITLE VARCHAR(500),
    REASON_TEXT VARCHAR(4000),
    JUSTIFICATION VARCHAR(4000),
    COMBINED_TEXT TEXT,                 -- Concatenated searchable text
    APPROVED_AMOUNT FLOAT,
    APPROVAL_DATE DATE,
    ML_CATEGORY VARCHAR(50),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);

COMMENT ON TABLE CO_NARRATIVES IS 'Change order text for Cortex Search - key for pattern detection';

-- ============================================================================
-- POPULATE CO_NARRATIVES FROM ATOMIC.CHANGE_ORDER
-- ============================================================================

INSERT INTO CO_NARRATIVES (
    NARRATIVE_ID, CO_ID, PROJECT_ID, VENDOR_ID, CO_NUMBER, CO_TITLE,
    REASON_TEXT, JUSTIFICATION, COMBINED_TEXT, APPROVED_AMOUNT, 
    APPROVAL_DATE, ML_CATEGORY
)
SELECT 
    'NAR-' || co.CO_ID AS NARRATIVE_ID,
    co.CO_ID,
    co.PROJECT_ID,
    co.VENDOR_ID,
    co.CO_NUMBER,
    co.CO_TITLE,
    co.REASON_TEXT,
    co.JUSTIFICATION,
    co.CO_TITLE || '. ' || COALESCE(co.REASON_TEXT, '') || ' ' || COALESCE(co.JUSTIFICATION, '') AS COMBINED_TEXT,
    co.APPROVED_AMOUNT,
    co.APPROVAL_DATE,
    co.ML_CATEGORY
FROM ATOMIC.CHANGE_ORDER co
WHERE co.REASON_TEXT IS NOT NULL;

-- ============================================================================
-- CREATE CORTEX SEARCH SERVICE FOR CO NARRATIVES
-- ============================================================================

CREATE OR REPLACE CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE
ON COMBINED_TEXT
ATTRIBUTES PROJECT_ID, VENDOR_ID, ML_CATEGORY, APPROVED_AMOUNT
WAREHOUSE = CAPITAL_COMPUTE_WH
TARGET_LAG = '1 hour'
AS (
    SELECT 
        NARRATIVE_ID,
        CO_ID,
        PROJECT_ID,
        VENDOR_ID,
        CO_NUMBER,
        CO_TITLE,
        REASON_TEXT,
        COMBINED_TEXT,
        APPROVED_AMOUNT,
        APPROVAL_DATE,
        ML_CATEGORY
    FROM CAPITAL_PROJECTS_DB.DOCS.CO_NARRATIVES
);

COMMENT ON CORTEX SEARCH SERVICE CO_SEARCH_SERVICE IS 
'Semantic search on change order narratives for pattern detection';

-- ============================================================================
-- CREATE CORTEX SEARCH SERVICE FOR CONTRACT DOCUMENTS
-- ============================================================================

-- First, insert some sample contract documents
INSERT INTO CONTRACT_DOCUMENTS (DOC_ID, DOCUMENT_TITLE, DOCUMENT_TYPE, SECTION_TITLE, CONTENT)
VALUES
    ('DOC-001', 'General Conditions', 'CONTRACT', 'Article 7 - Changes in the Work',
     'The Owner may order Changes in the Work within the general scope of the Contract consisting of additions, deletions, or other revisions. A Change Order requires agreement by the Owner, Contractor, and Architect, and shall become effective only when executed by all three parties. Changes in the Work shall be performed under applicable provisions of the Contract Documents.'),
    
    ('DOC-002', 'General Conditions', 'CONTRACT', 'Article 7.2 - Change Order Pricing',
     'The Contractor shall submit itemized cost and pricing data for Change Orders. Overhead and profit markup shall not exceed 15% for Contractor work and 10% for subcontractor work. Equipment rates shall follow the latest edition of the Associated Equipment Distributors rental rate book.'),
    
    ('DOC-003', 'Division 26 - Electrical', 'SPECIFICATION', 'Section 26 05 26 - Grounding and Bonding',
     'This section specifies requirements for grounding and bonding of electrical systems. Provide grounding electrode system compliant with NEC Article 250. All equipment grounding conductors shall be copper. Ground rods shall be copper-clad steel, minimum 5/8 inch diameter by 10 feet long.'),
    
    ('DOC-004', 'Division 26 - Electrical', 'SPECIFICATION', 'Section 26 05 26.1 - Equipment Grounding',
     'Provide equipment grounding conductors sized per NEC Table 250.122. Connect all metallic raceways, cable trays, and equipment enclosures to equipment grounding system. Provide ground bushings at service entrance and all panel locations.'),
    
    ('DOC-005', 'Project Requirements', 'SPECIFICATION', 'Section 01 00 00 - General Requirements',
     'Contractor shall be responsible for providing complete and operational systems regardless of whether every item is specifically detailed on the drawings. Include all labor, materials, equipment, and services necessary for a complete installation per industry standards and applicable codes.'),
    
    ('DOC-006', 'General Conditions', 'CONTRACT', 'Article 3.2 - Contract Documents',
     'The Contract Documents form the Contract for Construction. The Contract Documents consist of the Agreement, Conditions of the Contract, Drawings, Specifications, Addenda, and Modifications. The Contract Documents shall not be construed to create a contractual relationship of any kind between parties other than the Owner and Contractor.');

-- Create the search service for contract documents
CREATE OR REPLACE CORTEX SEARCH SERVICE CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE
ON CONTENT
ATTRIBUTES DOCUMENT_TYPE, SECTION_TITLE
WAREHOUSE = CAPITAL_COMPUTE_WH
TARGET_LAG = '1 hour'
AS (
    SELECT 
        DOC_ID,
        DOCUMENT_TITLE,
        DOCUMENT_TYPE,
        SECTION_TITLE,
        CONTENT
    FROM CAPITAL_PROJECTS_DB.DOCS.CONTRACT_DOCUMENTS
);

COMMENT ON CORTEX SEARCH SERVICE CONTRACT_SEARCH_SERVICE IS 
'Semantic search on contract documents and specifications';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON ALL TABLES IN SCHEMA DOCS TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE CO_SEARCH_SERVICE TO ROLE ATLAS_APP_ROLE;
GRANT USAGE ON CORTEX SEARCH SERVICE CONTRACT_SEARCH_SERVICE TO ROLE ATLAS_APP_ROLE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test CO Search
-- SELECT * FROM TABLE(
--     CAPITAL_PROJECTS_DB.DOCS.CO_SEARCH_SERVICE(
--         QUERY => 'grounding electrical specifications missing',
--         LIMIT => 10
--     )
-- );

-- Test Contract Search
-- SELECT * FROM TABLE(
--     CAPITAL_PROJECTS_DB.DOCS.CONTRACT_SEARCH_SERVICE(
--         QUERY => 'change order pricing overhead markup',
--         LIMIT => 5
--     )
-- );
