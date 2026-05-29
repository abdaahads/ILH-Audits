-- ============================================================
-- ILH Audits — Seed Data
-- Real property data extracted from ivyleaguehouse.com
-- ============================================================

-- ============================================================
-- 1. PROPERTIES (Single ILH locations across India)
-- ============================================================
INSERT INTO properties (name, location, total_beds) VALUES
  ('ILH Pune',         'Tathawade, Pune, Maharashtra',            706),
  ('ILH Mumbai',       'Vile Parle, Mumbai, Maharashtra',         450),
  ('ILH Delhi',        'Kamla Nagar, Delhi',                      350),
  ('ILH Dehradun',     'Rajpur Road, Dehradun, Uttarakhand',      400),
  ('ILH Durgapur',     'Durgapur, West Bengal',                   250),
  ('ILH Bengaluru',    'Koramangala, Bengaluru, Karnataka',       320),
  ('ILH Hyderabad',    'Gachibowli, Hyderabad, Telangana',       280),
  ('ILH Vizag',        'Visakhapatnam, Andhra Pradesh',           200);

-- ============================================================
-- 2. DEFAULT AUDIT TEMPLATE
-- ============================================================
INSERT INTO audit_templates (id, title, description, max_score) VALUES
  ('a0000000-0000-0000-0000-000000000001',
   'Standard Property Audit',
   'Comprehensive quality audit covering all aspects of ILH property operations including housekeeping, food, maintenance, safety, and community standards.',
   100);

-- ============================================================
-- 3. AUDIT CATEGORIES (weighted scoring — totals 100%)
-- ============================================================

-- Housekeeping — 25%
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Housekeeping', 25, 1);

-- Food & Dining — 20%
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'Food & Dining', 20, 2);

-- Maintenance — 25%
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'Maintenance', 25, 3);

-- Safety & Security — 15%
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'Safety & Security', 15, 4);

-- Community & Wellbeing — 15%
INSERT INTO audit_categories (id, template_id, name, weight_percentage, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'Community & Wellbeing', 15, 5);

-- ============================================================
-- 4. AUDIT QUESTIONS (4 per category = 20 total)
-- ============================================================

-- === HOUSEKEEPING (4 questions, max 5 pts each = 20 pts raw) ===
INSERT INTO audit_questions (category_id, question_text, max_points, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'Are all common areas (lobbies, corridors, staircases) clean and well-maintained?', 5, 1),
  ('b0000000-0000-0000-0000-000000000001',
   'Are washrooms and restrooms sanitized with adequate supplies (soap, tissues, bins)?', 5, 2),
  ('b0000000-0000-0000-0000-000000000001',
   'Are resident rooms dusted, mopped, and beds made as per schedule?', 5, 3),
  ('b0000000-0000-0000-0000-000000000001',
   'Is waste segregation and disposal being handled properly and on time?', 5, 4);

-- === FOOD & DINING (4 questions, max 5 pts each = 20 pts raw) ===
INSERT INTO audit_questions (category_id, question_text, max_points, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000002',
   'Is the kitchen area clean, organized, and free of pests?', 5, 1),
  ('b0000000-0000-0000-0000-000000000002',
   'Are meals served on time and as per the published weekly menu?', 5, 2),
  ('b0000000-0000-0000-0000-000000000002',
   'Is food quality satisfactory (taste, freshness, temperature)?', 5, 3),
  ('b0000000-0000-0000-0000-000000000002',
   'Are food safety and hygiene standards maintained (gloves, hairnets, storage)?', 5, 4);

-- === MAINTENANCE (4 questions, max 5 pts each = 20 pts raw) ===
INSERT INTO audit_questions (category_id, question_text, max_points, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000003',
   'Are all electrical fittings (lights, fans, switches, sockets) functional?', 5, 1),
  ('b0000000-0000-0000-0000-000000000003',
   'Is plumbing in proper working order (no leaks, drains clear, hot water functional)?', 5, 2),
  ('b0000000-0000-0000-0000-000000000003',
   'Are furniture and fixtures in good condition (beds, desks, wardrobes, doors)?', 5, 3),
  ('b0000000-0000-0000-0000-000000000003',
   'Is the Wi-Fi network stable and providing adequate speed across the property?', 5, 4);

-- === SAFETY & SECURITY (4 questions, max 5 pts each = 20 pts raw) ===
INSERT INTO audit_questions (category_id, question_text, max_points, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000004',
   'Are CCTV cameras operational and covering all critical areas?', 5, 1),
  ('b0000000-0000-0000-0000-000000000004',
   'Are fire extinguishers present, accessible, and within service date?', 5, 2),
  ('b0000000-0000-0000-0000-000000000004',
   'Is the entry/exit register being maintained with proper visitor logs?', 5, 3),
  ('b0000000-0000-0000-0000-000000000004',
   'Are emergency exits clearly marked and unobstructed?', 5, 4);

-- === COMMUNITY & WELLBEING (4 questions, max 5 pts each = 20 pts raw) ===
INSERT INTO audit_questions (category_id, question_text, max_points, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000005',
   'Are common recreational areas (lounge, gym, study room) well-maintained and accessible?', 5, 1),
  ('b0000000-0000-0000-0000-000000000005',
   'Is the staff courteous, responsive, and available during operational hours?', 5, 2),
  ('b0000000-0000-0000-0000-000000000005',
   'Are notice boards updated with relevant information and emergency contacts?', 5, 3),
  ('b0000000-0000-0000-0000-000000000005',
   'Are community events or engagement activities being organized regularly?', 5, 4);
