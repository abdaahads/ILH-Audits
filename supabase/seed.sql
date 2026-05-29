-- ============================================================
-- ILH Audits — Seed Data
-- EHS & PGHP Comprehensive Audit Framework v2.0
-- 5 Categories · 16 Parameters · Legal References
-- ============================================================

-- ============================================================
-- 1. PROPERTIES (ILH Portfolio + Student Village Ahmedabad)
-- ============================================================
INSERT INTO properties (id, name, location, total_beds, site_manager, total_employees) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'ILH Pune Pilot',           'Tathawade, Pune, Maharashtra',            706, 'Rajesh Kulkarni',    85),
  ('p0000000-0000-0000-0000-000000000002', 'ILH Mumbai',               'Vile Parle, Mumbai, Maharashtra',         450, 'Priya Nair',         62),
  ('p0000000-0000-0000-0000-000000000003', 'ILH Delhi',                'Kamla Nagar, Delhi',                      350, 'Vikram Singh',       48),
  ('p0000000-0000-0000-0000-000000000004', 'ILH Dehradun',             'Rajpur Road, Dehradun, Uttarakhand',      400, 'Ankit Rawat',        45),
  ('p0000000-0000-0000-0000-000000000005', 'ILH Durgapur',             'Durgapur, West Bengal',                   250, 'Sourav Das',         32),
  ('p0000000-0000-0000-0000-000000000006', 'ILH Bengaluru',            'Koramangala, Bengaluru, Karnataka',       320, 'Meera Reddy',        40),
  ('p0000000-0000-0000-0000-000000000007', 'ILH Hyderabad',            'Gachibowli, Hyderabad, Telangana',        280, 'Farhan Ahmed',       36),
  ('p0000000-0000-0000-0000-000000000008', 'ILH Vizag',                'Visakhapatnam, Andhra Pradesh',           200, 'Lakshmi Prasad',     28),
  ('p0000000-0000-0000-0000-000000000009', 'Student Village Ahmedabad','SG Highway, Ahmedabad, Gujarat',          520, 'Harsh Patel',        70)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  total_beds = EXCLUDED.total_beds,
  site_manager = EXCLUDED.site_manager,
  total_employees = EXCLUDED.total_employees;

-- ============================================================
-- 2. DEFAULT AUDIT TEMPLATE (EHS & PGHP v2.0)
-- ============================================================
INSERT INTO audit_templates (id, title, description, max_score) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'EHS & PGHP Comprehensive Audit',
   'Environment, Health & Safety and Process-Grooming-Hygiene-Product audit framework for ILH properties. Covers statutory compliance, mechanical/electrical safety, chemical management, and emergency preparedness.',
   100)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  max_score = EXCLUDED.max_score;

-- ============================================================
-- 3. AUDIT CATEGORIES (5 EHS-weighted departments = 100%)
-- ============================================================
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PGHP & Core Operations',                     25, 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'EHS Documentation & Legal Compliance',       25, 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mechanical, Electrical & Lift Safety',       20, 3),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Chemical, Waste & Material Management',      15, 4),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Emergency Preparedness & Subcontractor Safety', 15, 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight_percentage = EXCLUDED.weight_percentage,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 4. AUDIT QUESTIONS (16 parameters across 5 categories)
-- ============================================================

-- Category 1: PGHP & Core Operations (25%, 4 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order, legal_reference, compliance_type) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Staff Grooming & Uniform Compliance: Are all on-duty staff wearing clean, standard-issue uniforms with appropriate PPE (gloves, hairnets, safety shoes) as per site SOP?',
   5, 1, 'Internal PPE & Grooming SOP', 'score'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Food Product Quality vs. Published Menu: Does the daily meal service match the published weekly menu in terms of items, portion size, and presentation quality?',
   5, 2, 'FSSAI Act 2006', 'score'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
   'Process Adherence (SOP Compliance): Are cleaning, turn-down, and sanitization SOPs being followed with documented checklists signed off by shift supervisors?',
   5, 3, 'Internal SOP Framework', 'score'),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001',
   'Vendor SLA Adherence: Are all third-party vendor deliverables (laundry, pest control, waste disposal) being tracked against contracted SLAs with documented proof?',
   5, 4, 'Vendor Contract Terms', 'score')
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order,
  legal_reference = EXCLUDED.legal_reference,
  compliance_type = EXCLUDED.compliance_type;

-- Category 2: EHS Documentation & Legal Compliance (25%, 3 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order, legal_reference, compliance_type) VALUES
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002',
   'Workmen Compensation & Labour Registration: Are all workers registered under BOCWA Section 44? Is the Workmen Compensation insurance policy current and accessible?',
   5, 1, 'BOCWA Section 44', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002',
   'Safety Manual, HIRA & Risk Registers: Is the site Safety Manual available and up-to-date? Are Hazard Identification and Risk Assessment (HIRA) registers maintained with quarterly reviews?',
   5, 2, 'HIRA Standards / ISO 45001', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002',
   'PTW (Permit to Work) Systems: Are Permit to Work systems in place for high-risk activities (hot work, confined space, electrical work)? Are closure checklists completed post-work?',
   5, 3, 'PTW Regulations / OISD 105', 'yes_no')
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order,
  legal_reference = EXCLUDED.legal_reference,
  compliance_type = EXCLUDED.compliance_type;

-- Category 3: Mechanical, Electrical & Lift Safety (20%, 3 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order, legal_reference, compliance_type) VALUES
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003',
   'Lift/Hoist Installation Certificates & Door Interlocking: Are all lift installation certificates current? Is the door interlocking mechanism functioning correctly with zero bypass capability?',
   5, 1, 'Factories Act 1948, Section 28-29', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000003',
   'Electrical Earthing & Equipment Calibration: Is the electrical earthing system tested and certified within the last 12 months? Are all critical instruments calibrated per schedule?',
   5, 2, 'Indian Electricity Rules 1956', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003',
   'HVAC and Plumbing Utility Health: Are all HVAC units operational with filters cleaned on schedule? Are there zero active leaks, blockages, or pressure issues in plumbing systems?',
   5, 3, NULL, 'score')
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order,
  legal_reference = EXCLUDED.legal_reference,
  compliance_type = EXCLUDED.compliance_type;

-- Category 4: Chemical, Waste & Material Management (15%, 3 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order, legal_reference, compliance_type) VALUES
  ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000004',
   'MSDS Availability: Are Material Safety Data Sheets (MSDS) available, current, and displayed at all chemical storage locations for every chemical used on site?',
   5, 1, 'MSDS / GHS Regulations', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000004',
   'Safe Storage & Disposal Protocols: Are all chemicals stored in approved, labeled containers with secondary containment? Is liquid/chemical waste disposed per local environmental norms?',
   5, 2, 'Hazardous Waste Management Rules 2016', 'score'),
  ('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000004',
   'Material Handling Equipment (MHE) Fitness: Are all MHE units (forklifts, trolleys, hoists) within valid fitness certification? Are operators holding valid competency certificates?',
   5, 3, 'Factories Act 1948', 'yes_no')
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order,
  legal_reference = EXCLUDED.legal_reference,
  compliance_type = EXCLUDED.compliance_type;

-- Category 5: Emergency Preparedness & Subcontractor Safety (15%, 3 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order, legal_reference, compliance_type) VALUES
  ('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000005',
   'Mock Drill Records (Fire & Evacuation): Have fire and evacuation mock drills been conducted in the last quarter? Are drill records, participant lists, and improvement notes documented?',
   5, 1, 'Fire Safety Act / NBC 2016', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000005',
   'First Aid Box Availability & Staff Training: Are first aid boxes fully stocked at all designated locations? Have at least 2 trained first-aiders been identified per shift?',
   5, 2, 'Factories Act 1948, Section 45', 'yes_no'),
  ('e0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000005',
   'Subcontractor Pre-Engagement Reviews & Medical Records: Are all subcontractor workers medically examined before site entry? Are pre-engagement safety inductions documented?',
   5, 3, 'BOCWA / Contract Labour Act 1970', 'yes_no')
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order,
  legal_reference = EXCLUDED.legal_reference,
  compliance_type = EXCLUDED.compliance_type;
