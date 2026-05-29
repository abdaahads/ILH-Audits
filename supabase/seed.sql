-- ============================================================
-- ILH Audits — Seed Data
-- Real property data and official ILH 26-Question Quality Framework
-- ============================================================

-- ============================================================
-- 1. PROPERTIES (Single ILH locations across India)
-- ============================================================
INSERT INTO properties (id, name, location, total_beds) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'ILH Pune',         'Tathawade, Pune, Maharashtra',            706),
  ('p0000000-0000-0000-0000-000000000002', 'ILH Mumbai',       'Vile Parle, Mumbai, Maharashtra',         450),
  ('p0000000-0000-0000-0000-000000000003', 'ILH Delhi',        'Kamla Nagar, Delhi',                      350),
  ('p0000000-0000-0000-0000-000000000004', 'ILH Dehradun',     'Rajpur Road, Dehradun, Uttarakhand',      400),
  ('p0000000-0000-0000-0000-000000000005', 'ILH Durgapur',     'Durgapur, West Bengal',                   250),
  ('p0000000-0000-0000-0000-000000000006', 'ILH Bengaluru',    'Koramangala, Bengaluru, Karnataka',       320),
  ('p0000000-0000-0000-0000-000000000007', 'ILH Hyderabad',    'Gachibowli, Hyderabad, Telangana',       280),
  ('p0000000-0000-0000-0000-000000000008', 'ILH Vizag',        'Visakhapatnam, Andhra Pradesh',           200)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  total_beds = EXCLUDED.total_beds;

-- ============================================================
-- 2. DEFAULT AUDIT TEMPLATE
-- ============================================================
INSERT INTO audit_templates (id, title, description, max_score) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Standard Property Audit',
   'Comprehensive quality audit covering all aspects of ILH property operations including housekeeping, food, maintenance, safety, and community standards.',
   100)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  max_score = EXCLUDED.max_score;

-- ============================================================
-- 3. AUDIT CATEGORIES (weighted scoring — totals exactly 100%)
-- ============================================================
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Housekeeping & Hygiene', 20, 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Food & Kitchen Operations', 20, 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Maintenance & Infrastructure', 15, 3),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Safety, Security & Compliance', 15, 4),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Community & Resident Experience', 10, 5),
  ('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Resident Feedback Proxy', 20, 6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  weight_percentage = EXCLUDED.weight_percentage,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 4. AUDIT QUESTIONS (26 total across 6 categories)
-- ============================================================

-- Category 1: Housekeeping & Hygiene (5 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Room Turn-Down Quality: Are scheduled room cleaning SOPs followed with zero visible dust/grime on surfaces and fixtures?', 5, 1),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Common Area Cleanliness: Are lobbies, study zones, and corridors free of debris, with floors visibly mopped and vacuumed?', 5, 2),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Washroom Sanitation: Are all communal and en-suite washrooms sanitized, odor-free, and fully stocked with consumables?', 5, 3),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Laundry Turnaround: Is the laundry processing operating within the mandated <24-hour turnaround SLA?', 5, 4),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Staff Hygiene (People): Are housekeeping staff wearing clean, standard-issue uniforms with appropriate personal protective equipment (gloves, hairnets where applicable)?', 5, 5)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order;

-- Category 2: Food & Kitchen Operations (5 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Kitchen Sanitation: Are all prep stations, industrial equipment, and floors sanitized according to daily checklists?', 5, 1),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'Temperature Control: Are cold storage units holding at correct temperatures, and is hot food served at standard safety temperatures?', 5, 2),
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000002', 'Inventory Accuracy: Does the physical stock of high-value consumables match the ERP digital records?', 5, 3),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000002', 'Food Quality & Presentation (Product): Does the daily meal match the published menu, and is it presented well in the dining hall?', 5, 4),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000002', 'Waste Management: Is wet and dry waste properly segregated, sealed, and disposed of according to local municipal guidelines?', 5, 5)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order;

-- Category 3: Maintenance & Infrastructure (5 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000003', 'HVAC & Air Quality: Are all air conditioning units functioning without unusual noise or leaks, with filters cleaned on schedule?', 5, 1),
  ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000003', 'Water Filtration (RO Systems): Are central RO water purifiers functioning optimally, with recent TDS logs within acceptable limits?', 5, 2),
  ('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000003', 'Power Redundancy: Has the backup generator (DG set) been tested, and is the fuel level sufficient for emergency outages?', 5, 3),
  ('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000003', 'Elevator Functionality: Are all lifts operational, well-lit, and displaying up-to-date service certificates?', 5, 4),
  ('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000003', 'Plumbing Integrity: Are there zero active leaks, blockages, or pressure issues in shared and private bathroom lines?', 5, 5)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order;

-- Category 4: Safety, Security & Compliance (5 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000004', 'Entry/Exit Movement Tracker: Are Gate Passes (G.P.) strictly enforced and logged for all external vendors and non-resident guests?', 5, 1),
  ('e0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000004', 'Biometric & Turnstile Functionality: Are all access control systems functioning with zero lag or bypass vulnerabilities?', 5, 2),
  ('e0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000004', 'Fire Safety Readiness: Are all fire extinguishers fully pressurized (in the green), and are fire exits completely unobstructed?', 5, 3),
  ('e0000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000004', 'Statutory Records: Are physical/digital records for Labour Licenses, local police verifications, and food safety certificates up-to-date and accessible?', 5, 4),
  ('e0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000004', 'CCTV Coverage: Are all security cameras online, recording properly, and providing clear visibility of all critical choke points?', 5, 5)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order;

-- Category 5: Community & Resident Experience (3 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000005', 'Event Readiness: Are communal spaces set up correctly for any upcoming daily/weekly flagship events or micro-mixers?', 5, 1),
  ('e0000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000005', 'Notice Boards & Digital Displays: Is all community communication (menus, event calendars, emergency contacts) current and visually aligned with the brand?', 5, 2),
  ('e0000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000005', 'Amenity Functionality: Are all community assets (gaming consoles, pool tables, study desks, library books) in perfect working condition?', 5, 3)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order;

-- Category 6: Resident Feedback Proxy (3 questions)
INSERT INTO audit_questions (id, category_id, question_text, max_points, sort_order) VALUES
  ('e0000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000006', 'Helpdesk Ticket Closure: Are 100% of resident grievance tickets from the last 72 hours successfully closed or actively being worked on within SLA?', 5, 1),
  ('e0000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000006', 'First-Response Compliance: Did all tickets raised in the last week receive a logged first-response within the target <2-hour window?', 5, 2),
  ('e0000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000006', 'On-Floor Vibe Check: Based on random interactions during the audit, is the general resident sentiment positive regarding recent food and facility services?', 5, 3)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  max_points = EXCLUDED.max_points,
  sort_order = EXCLUDED.sort_order;
