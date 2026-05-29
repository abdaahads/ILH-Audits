/**
 * High-Fidelity Mock Supabase Client — v5.0
 * 
 * EHS & PGHP Comprehensive Audit Framework
 * 5 Categories · 16 Parameters · Legal References
 * 
 * Implements complete local-storage database state for:
 *  - properties (9 locations incl. Student Village Ahmedabad)
 *  - profiles
 *  - audits (3 historical per target property)
 *  - audit_responses (with supporting_images, remarks)
 *  - corrective_actions (CAP board)
 *  - audit_templates
 *  - audit_categories (5 EHS departments)
 *  - audit_questions (16 parameters with legal_reference, compliance_type)
 * 
 * Supports query builders: from().select(), .insert(), .update(), .eq(), .in(), .order(), .limit(), .maybeSingle(), .single()
 */

import { toast } from "sonner";

// ============================================================
// Static Seed Data — EHS v2.0
// ============================================================

const MOCK_PROFILES = [
  { id: "u1111111-1111-1111-1111-111111111111", full_name: "Abdulahad Sheikh", role: "admin", created_at: new Date().toISOString() },
  { id: "u2222222-2222-2222-2222-222222222222", full_name: "Rahul Sharma", role: "auditor", created_at: new Date().toISOString() }
];

const MOCK_PROPERTIES = [
  { id: "p0000000-0000-0000-0000-000000000001", name: "ILH Pune Pilot", location: "Tathawade, Pune, Maharashtra", total_beds: 706, site_manager: "Rajesh Kulkarni", total_employees: 85, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000002", name: "ILH Mumbai", location: "Vile Parle, Mumbai, Maharashtra", total_beds: 450, site_manager: "Priya Nair", total_employees: 62, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000003", name: "ILH Delhi", location: "Kamla Nagar, Delhi", total_beds: 350, site_manager: "Vikram Singh", total_employees: 48, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000004", name: "ILH Dehradun", location: "Rajpur Road, Dehradun, Uttarakhand", total_beds: 400, site_manager: "Ankit Rawat", total_employees: 45, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000005", name: "ILH Durgapur", location: "Durgapur, West Bengal", total_beds: 250, site_manager: "Sourav Das", total_employees: 32, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000006", name: "ILH Bengaluru", location: "Koramangala, Bengaluru, Karnataka", total_beds: 320, site_manager: "Meera Reddy", total_employees: 40, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000007", name: "ILH Hyderabad", location: "Gachibowli, Hyderabad, Telangana", total_beds: 280, site_manager: "Farhan Ahmed", total_employees: 36, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000008", name: "ILH Vizag", location: "Visakhapatnam, Andhra Pradesh", total_beds: 200, site_manager: "Lakshmi Prasad", total_employees: 28, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000009", name: "Student Village Ahmedabad", location: "SG Highway, Ahmedabad, Gujarat", total_beds: 520, site_manager: "Harsh Patel", total_employees: 70, created_at: new Date().toISOString() }
];

const MOCK_TEMPLATES = [
  { id: "a0000000-0000-0000-0000-000000000001", title: "EHS & PGHP Comprehensive Audit", description: "Environment, Health & Safety and Process-Grooming-Hygiene-Product audit framework for ILH properties.", max_score: 100 }
];

const MOCK_CATEGORIES = [
  { id: "c0000000-0000-0000-0000-000000000001", template_id: "a0000000-0000-0000-0000-000000000001", name: "PGHP & Core Operations", weight_percentage: 25, sort_order: 1 },
  { id: "c0000000-0000-0000-0000-000000000002", template_id: "a0000000-0000-0000-0000-000000000001", name: "EHS Documentation & Legal Compliance", weight_percentage: 25, sort_order: 2 },
  { id: "c0000000-0000-0000-0000-000000000003", template_id: "a0000000-0000-0000-0000-000000000001", name: "Mechanical, Electrical & Lift Safety", weight_percentage: 20, sort_order: 3 },
  { id: "c0000000-0000-0000-0000-000000000004", template_id: "a0000000-0000-0000-0000-000000000001", name: "Chemical, Waste & Material Management", weight_percentage: 15, sort_order: 4 },
  { id: "c0000000-0000-0000-0000-000000000005", template_id: "a0000000-0000-0000-0000-000000000001", name: "Emergency Preparedness & Subcontractor Safety", weight_percentage: 15, sort_order: 5 }
];

const MOCK_QUESTIONS = [
  // Cat 1: PGHP & Core Operations (25%)
  { id: "e0000000-0000-0000-0000-000000000001", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Staff Grooming & Uniform Compliance", max_points: 5, sort_order: 1, legal_reference: "Internal PPE & Grooming SOP", compliance_type: "score" },
  { id: "e0000000-0000-0000-0000-000000000002", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Food Product Quality vs. Published Menu", max_points: 5, sort_order: 2, legal_reference: "FSSAI Act 2006", compliance_type: "score" },
  { id: "e0000000-0000-0000-0000-000000000003", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Process Adherence (SOP Compliance)", max_points: 5, sort_order: 3, legal_reference: "Internal SOP Framework", compliance_type: "score" },
  { id: "e0000000-0000-0000-0000-000000000004", category_id: "c0000000-0000-0000-0000-000000000001", question_text: "Vendor SLA Adherence", max_points: 5, sort_order: 4, legal_reference: "Vendor Contract Terms", compliance_type: "score" },
  // Cat 2: EHS Documentation & Legal Compliance (25%)
  { id: "e0000000-0000-0000-0000-000000000005", category_id: "c0000000-0000-0000-0000-000000000002", question_text: "Workmen Compensation & Labour Registration", max_points: 5, sort_order: 1, legal_reference: "BOCWA Section 44", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000006", category_id: "c0000000-0000-0000-0000-000000000002", question_text: "Safety Manual, HIRA & Risk Registers", max_points: 5, sort_order: 2, legal_reference: "HIRA Standards / ISO 45001", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000007", category_id: "c0000000-0000-0000-0000-000000000002", question_text: "PTW (Permit to Work) Systems", max_points: 5, sort_order: 3, legal_reference: "PTW Regulations / OISD 105", compliance_type: "yes_no" },
  // Cat 3: Mechanical, Electrical & Lift Safety (20%)
  { id: "e0000000-0000-0000-0000-000000000008", category_id: "c0000000-0000-0000-0000-000000000003", question_text: "Lift/Hoist Installation Certificates & Door Interlocking", max_points: 5, sort_order: 1, legal_reference: "Factories Act 1948, Section 28-29", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000009", category_id: "c0000000-0000-0000-0000-000000000003", question_text: "Electrical Earthing & Equipment Calibration", max_points: 5, sort_order: 2, legal_reference: "Indian Electricity Rules 1956", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000010", category_id: "c0000000-0000-0000-0000-000000000003", question_text: "HVAC and Plumbing Utility Health", max_points: 5, sort_order: 3, legal_reference: null, compliance_type: "score" },
  // Cat 4: Chemical, Waste & Material Management (15%)
  { id: "e0000000-0000-0000-0000-000000000011", category_id: "c0000000-0000-0000-0000-000000000004", question_text: "MSDS Availability", max_points: 5, sort_order: 1, legal_reference: "MSDS / GHS Regulations", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000012", category_id: "c0000000-0000-0000-0000-000000000004", question_text: "Safe Storage & Disposal Protocols", max_points: 5, sort_order: 2, legal_reference: "Hazardous Waste Management Rules 2016", compliance_type: "score" },
  { id: "e0000000-0000-0000-0000-000000000013", category_id: "c0000000-0000-0000-0000-000000000004", question_text: "Material Handling Equipment (MHE) Fitness", max_points: 5, sort_order: 3, legal_reference: "Factories Act 1948", compliance_type: "yes_no" },
  // Cat 5: Emergency Preparedness & Subcontractor Safety (15%)
  { id: "e0000000-0000-0000-0000-000000000014", category_id: "c0000000-0000-0000-0000-000000000005", question_text: "Mock Drill Records (Fire & Evacuation)", max_points: 5, sort_order: 1, legal_reference: "Fire Safety Act / NBC 2016", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000015", category_id: "c0000000-0000-0000-0000-000000000005", question_text: "First Aid Box Availability & Staff Training", max_points: 5, sort_order: 2, legal_reference: "Factories Act 1948, Section 45", compliance_type: "yes_no" },
  { id: "e0000000-0000-0000-0000-000000000016", category_id: "c0000000-0000-0000-0000-000000000005", question_text: "Subcontractor Pre-Engagement Reviews & Medical Records", max_points: 5, sort_order: 3, legal_reference: "BOCWA / Contract Labour Act 1970", compliance_type: "yes_no" }
];

// ============================================================
// Historical Audit Data Generation
// ============================================================

/** Target property indices (ILH Pune Pilot = 0, Student Village Ahmedabad = 8) */
const TARGET_PROPS = [0, 8];

/** Audit dates: Aug 2025, Jan 2026, May 2026 */
const AUDIT_DATES = [
  new Date("2025-08-15T10:00:00Z"),
  new Date("2026-01-20T10:00:00Z"),
  new Date("2026-05-12T10:00:00Z")
];

/** Score profiles per (property, audit) combination */
type ScoreProfile = Record<string, number>;

function getScoreProfiles(): Record<string, ScoreProfile[]> {
  // ILH Pune Pilot: Mixed → Improved → High with 2 critical failures
  const pune: ScoreProfile[] = [
    // Aug 2025 — baseline mixed (target ~68%)
    { "e0000000-0000-0000-0000-000000000001": 3, "e0000000-0000-0000-0000-000000000002": 4, "e0000000-0000-0000-0000-000000000003": 3, "e0000000-0000-0000-0000-000000000004": 3,
      "e0000000-0000-0000-0000-000000000005": 3, "e0000000-0000-0000-0000-000000000006": 4, "e0000000-0000-0000-0000-000000000007": 3,
      "e0000000-0000-0000-0000-000000000008": 4, "e0000000-0000-0000-0000-000000000009": 3, "e0000000-0000-0000-0000-000000000010": 4,
      "e0000000-0000-0000-0000-000000000011": 3, "e0000000-0000-0000-0000-000000000012": 3, "e0000000-0000-0000-0000-000000000013": 4,
      "e0000000-0000-0000-0000-000000000014": 3, "e0000000-0000-0000-0000-000000000015": 4, "e0000000-0000-0000-0000-000000000016": 3 },
    // Jan 2026 — improved (target ~82%)
    { "e0000000-0000-0000-0000-000000000001": 4, "e0000000-0000-0000-0000-000000000002": 5, "e0000000-0000-0000-0000-000000000003": 4, "e0000000-0000-0000-0000-000000000004": 4,
      "e0000000-0000-0000-0000-000000000005": 4, "e0000000-0000-0000-0000-000000000006": 5, "e0000000-0000-0000-0000-000000000007": 4,
      "e0000000-0000-0000-0000-000000000008": 5, "e0000000-0000-0000-0000-000000000009": 4, "e0000000-0000-0000-0000-000000000010": 4,
      "e0000000-0000-0000-0000-000000000011": 4, "e0000000-0000-0000-0000-000000000012": 4, "e0000000-0000-0000-0000-000000000013": 3,
      "e0000000-0000-0000-0000-000000000014": 4, "e0000000-0000-0000-0000-000000000015": 5, "e0000000-0000-0000-0000-000000000016": 4 },
    // May 2026 — high but 2 critical failures (target ~88% with 2 failures)
    { "e0000000-0000-0000-0000-000000000001": 5, "e0000000-0000-0000-0000-000000000002": 5, "e0000000-0000-0000-0000-000000000003": 5, "e0000000-0000-0000-0000-000000000004": 4,
      "e0000000-0000-0000-0000-000000000005": 5, "e0000000-0000-0000-0000-000000000006": 5, "e0000000-0000-0000-0000-000000000007": 5,
      "e0000000-0000-0000-0000-000000000008": 1, "e0000000-0000-0000-0000-000000000009": 5, "e0000000-0000-0000-0000-000000000010": 5,
      "e0000000-0000-0000-0000-000000000011": 1, "e0000000-0000-0000-0000-000000000012": 5, "e0000000-0000-0000-0000-000000000013": 5,
      "e0000000-0000-0000-0000-000000000014": 5, "e0000000-0000-0000-0000-000000000015": 5, "e0000000-0000-0000-0000-000000000016": 5 }
  ];

  // Student Village Ahmedabad: Mixed → Improved → High with 2 critical failures
  const ahmedabad: ScoreProfile[] = [
    // Aug 2025 — baseline (target ~62%)
    { "e0000000-0000-0000-0000-000000000001": 3, "e0000000-0000-0000-0000-000000000002": 3, "e0000000-0000-0000-0000-000000000003": 3, "e0000000-0000-0000-0000-000000000004": 3,
      "e0000000-0000-0000-0000-000000000005": 3, "e0000000-0000-0000-0000-000000000006": 3, "e0000000-0000-0000-0000-000000000007": 4,
      "e0000000-0000-0000-0000-000000000008": 3, "e0000000-0000-0000-0000-000000000009": 3, "e0000000-0000-0000-0000-000000000010": 3,
      "e0000000-0000-0000-0000-000000000011": 3, "e0000000-0000-0000-0000-000000000012": 3, "e0000000-0000-0000-0000-000000000013": 3,
      "e0000000-0000-0000-0000-000000000014": 3, "e0000000-0000-0000-0000-000000000015": 3, "e0000000-0000-0000-0000-000000000016": 4 },
    // Jan 2026 — improved (target ~76%)
    { "e0000000-0000-0000-0000-000000000001": 4, "e0000000-0000-0000-0000-000000000002": 4, "e0000000-0000-0000-0000-000000000003": 4, "e0000000-0000-0000-0000-000000000004": 3,
      "e0000000-0000-0000-0000-000000000005": 4, "e0000000-0000-0000-0000-000000000006": 4, "e0000000-0000-0000-0000-000000000007": 3,
      "e0000000-0000-0000-0000-000000000008": 4, "e0000000-0000-0000-0000-000000000009": 3, "e0000000-0000-0000-0000-000000000010": 4,
      "e0000000-0000-0000-0000-000000000011": 4, "e0000000-0000-0000-0000-000000000012": 3, "e0000000-0000-0000-0000-000000000013": 4,
      "e0000000-0000-0000-0000-000000000014": 4, "e0000000-0000-0000-0000-000000000015": 4, "e0000000-0000-0000-0000-000000000016": 3 },
    // May 2026 — high but 2 critical failures
    { "e0000000-0000-0000-0000-000000000001": 5, "e0000000-0000-0000-0000-000000000002": 5, "e0000000-0000-0000-0000-000000000003": 4, "e0000000-0000-0000-0000-000000000004": 5,
      "e0000000-0000-0000-0000-000000000005": 5, "e0000000-0000-0000-0000-000000000006": 5, "e0000000-0000-0000-0000-000000000007": 4,
      "e0000000-0000-0000-0000-000000000008": 5, "e0000000-0000-0000-0000-000000000009": 1, "e0000000-0000-0000-0000-000000000010": 5,
      "e0000000-0000-0000-0000-000000000011": 5, "e0000000-0000-0000-0000-000000000012": 1, "e0000000-0000-0000-0000-000000000013": 5,
      "e0000000-0000-0000-0000-000000000014": 5, "e0000000-0000-0000-0000-000000000015": 5, "e0000000-0000-0000-0000-000000000016": 5 }
  ];

  return {
    "p0000000-0000-0000-0000-000000000001": pune,
    "p0000000-0000-0000-0000-000000000009": ahmedabad
  };
}

/** Remarks for critical failures */
const CRITICAL_REMARKS: Record<string, string> = {
  "e0000000-0000-0000-0000-000000000008": "CRITICAL: Lift inspection certificate expired 3 months ago. Door interlocking mechanism found bypassed on Floor 4. Immediate shutdown required per Factories Act 1948 Section 29.",
  "e0000000-0000-0000-0000-000000000009": "CRITICAL: Electrical earthing test overdue by 6 months. Phase imbalance detected in main DB panel. Non-compliant per Indian Electricity Rules 1956.",
  "e0000000-0000-0000-0000-000000000011": "CRITICAL: MSDS sheets missing for 4 out of 7 chemicals in housekeeping store. Chemical spill containment kit not available. Violation of GHS Regulations.",
  "e0000000-0000-0000-0000-000000000012": "CRITICAL: Chemical waste disposal log not maintained for past 2 months. Unlabeled containers found in storage. Non-compliant with Hazardous Waste Management Rules 2016."
};

/** Dummy supporting image URLs */
const EVIDENCE_IMAGES: Record<string, string[]> = {
  "e0000000-0000-0000-0000-000000000008": [
    "https://placehold.co/800x600/dc2626/ffffff?text=Expired+Lift+Certificate",
    "https://placehold.co/800x600/dc2626/ffffff?text=Door+Interlock+Bypass"
  ],
  "e0000000-0000-0000-0000-000000000009": [
    "https://placehold.co/800x600/dc2626/ffffff?text=Earthing+Test+Overdue",
    "https://placehold.co/800x600/dc2626/ffffff?text=Phase+Imbalance+Panel"
  ],
  "e0000000-0000-0000-0000-000000000011": [
    "https://placehold.co/800x600/dc2626/ffffff?text=Missing+MSDS+Sheets",
    "https://placehold.co/800x600/dc2626/ffffff?text=No+Spill+Kit"
  ],
  "e0000000-0000-0000-0000-000000000012": [
    "https://placehold.co/800x600/dc2626/ffffff?text=Unlabeled+Containers",
    "https://placehold.co/800x600/dc2626/ffffff?text=Waste+Log+Missing"
  ]
};

// ============================================================
// LocalStorage Initialization
// ============================================================

function initializeLocalStorageDB() {
  if (typeof window === "undefined") return;

  const currentVersion = "5.0";
  const storedVersion = localStorage.getItem("ilh_seeder_version");

  if (storedVersion !== currentVersion) {
    localStorage.removeItem("ilh_profiles");
    localStorage.removeItem("ilh_properties");
    localStorage.removeItem("ilh_audit_templates");
    localStorage.removeItem("ilh_audit_categories");
    localStorage.removeItem("ilh_audit_questions");
    localStorage.removeItem("ilh_audits");
    localStorage.removeItem("ilh_audit_responses");
    localStorage.removeItem("ilh_corrective_actions");
    localStorage.setItem("ilh_seeder_version", currentVersion);
  }

  if (!localStorage.getItem("ilh_profiles")) {
    localStorage.setItem("ilh_profiles", JSON.stringify(MOCK_PROFILES));
  }
  if (!localStorage.getItem("ilh_properties")) {
    localStorage.setItem("ilh_properties", JSON.stringify(MOCK_PROPERTIES));
  }
  if (!localStorage.getItem("ilh_audit_templates")) {
    localStorage.setItem("ilh_audit_templates", JSON.stringify(MOCK_TEMPLATES));
  }
  if (!localStorage.getItem("ilh_audit_categories")) {
    localStorage.setItem("ilh_audit_categories", JSON.stringify(MOCK_CATEGORIES));
  }
  if (!localStorage.getItem("ilh_audit_questions")) {
    localStorage.setItem("ilh_audit_questions", JSON.stringify(MOCK_QUESTIONS));
  }

  // Pre-seed historical audits for target properties
  if (!localStorage.getItem("ilh_audits")) {
    const audits: any[] = [];
    const responses: any[] = [];
    const correctiveActions: any[] = [];
    const auditorId = MOCK_PROFILES[0].id;
    const templateId = MOCK_TEMPLATES[0].id;
    const scoreProfiles = getScoreProfiles();

    TARGET_PROPS.forEach((propIdx) => {
      const prop = MOCK_PROPERTIES[propIdx];
      const profiles = scoreProfiles[prop.id];
      if (!profiles) return;

      profiles.forEach((profile, auditIdx) => {
        const date = AUDIT_DATES[auditIdx];
        const auditId = `audit-${prop.id.substring(2, 6)}-${auditIdx + 1}`;
        const isMostRecent = auditIdx === 2;

        // Calculate weighted score
        let totalWeightedScore = 0;
        MOCK_CATEGORIES.forEach((cat) => {
          const catQuestions = MOCK_QUESTIONS.filter((q) => q.category_id === cat.id);
          let catScored = 0;
          let catMax = 0;
          catQuestions.forEach((q) => {
            catScored += profile[q.id] || 3;
            catMax += q.max_points;
          });
          const catPct = catMax > 0 ? (catScored / catMax) * 100 : 0;
          totalWeightedScore += catPct * (cat.weight_percentage / 100);
        });

        // Build responses
        const failures: string[] = [];
        MOCK_QUESTIONS.forEach((q) => {
          const score = profile[q.id] || 3;
          const isCritical = isMostRecent && score <= 1;
          const notes = score >= 4 ? "Maintained as per operational standards." : (score === 3 ? "Acceptable but room for improvement." : null);
          const remarks = isCritical ? (CRITICAL_REMARKS[q.id] || `Non-compliance flagged. Score: ${score}/5.`) : null;
          const supportingImages = isCritical ? (EVIDENCE_IMAGES[q.id] || null) : null;

          if (isCritical) {
            failures.push(`${q.question_text}: ${remarks}`);
          }

          responses.push({
            id: `resp-${auditId}-${q.id}`,
            audit_id: auditId,
            question_id: q.id,
            score_awarded: score,
            notes: notes || remarks,
            remarks,
            image_url: supportingImages ? supportingImages[0] : null,
            supporting_images: supportingImages,
            created_at: date.toISOString()
          });

          if (score <= 2) {
            const cat = MOCK_CATEGORIES.find((c) => c.id === q.category_id);
            correctiveActions.push({
              id: `cap-${auditId}-${q.id}`,
              audit_id: auditId,
              property_id: prop.id,
              question_id: q.id,
              issue_description: `${cat?.name || "General"}: ${q.question_text} (Score: ${score}/5)`,
              status: isMostRecent ? "open" : "resolved",
              assigned_to: auditorId,
              remediation_notes: isMostRecent ? "" : "Issue resolved in subsequent inspection cycle.",
              created_at: date.toISOString(),
              updated_at: date.toISOString()
            });
          }
        });

        // Executive summary auto-generation
        const majorObservations = failures.length > 0
          ? failures.map((f, i) => `${i + 1}. ${f}`).join("\n")
          : "No critical non-compliances observed. All parameters within acceptable limits.";

        const nextSteps = failures.length > 0
          ? `1. Immediate corrective action required for ${failures.length} critical finding(s).\n2. Re-audit within 15 days to verify closure.\n3. Escalate to Regional EHS Head if not resolved within 7 days.`
          : "Continue monitoring. Next scheduled audit in 90 days.";

        const goodPractices = auditIdx >= 1
          ? "Strong SOP adherence observed in PGHP operations. Staff grooming compliance improved significantly."
          : "Basic compliance maintained. Staff cooperation during audit noted.";

        const recommendations = failures.length > 0
          ? "Prioritize statutory compliance gaps. Conduct refresher training for site teams on EHS documentation requirements."
          : "Maintain current standards. Consider sharing best practices across properties.";

        audits.push({
          id: auditId,
          property_id: prop.id,
          template_id: templateId,
          auditor_id: auditorId,
          status: "completed",
          total_score: parseFloat(totalWeightedScore.toFixed(1)),
          max_possible_score: 100,
          conducted_at: date.toISOString(),
          completed_at: date.toISOString(),
          major_observations: majorObservations,
          good_practices: goodPractices,
          recommendations,
          next_steps: nextSteps,
          created_at: date.toISOString()
        });
      });
    });

    // Also generate audits for other properties (just 1 each for leaderboard/bar chart data)
    MOCK_PROPERTIES.forEach((prop, propIdx) => {
      if (TARGET_PROPS.includes(propIdx)) return; // Already handled
      const auditId = `audit-other-${prop.id.substring(2, 6)}`;
      const date = new Date("2026-04-10T10:00:00Z");
      let totalWeightedScore = 0;

      MOCK_CATEGORIES.forEach((cat) => {
        const catQuestions = MOCK_QUESTIONS.filter((q) => q.category_id === cat.id);
        let catScored = 0;
        let catMax = 0;
        const baseScore = 3 + (propIdx % 2); // alternating 3-4 baseline
        catQuestions.forEach((q) => {
          const score = baseScore;
          catScored += score;
          catMax += q.max_points;
          responses.push({
            id: `resp-${auditId}-${q.id}`,
            audit_id: auditId,
            question_id: q.id,
            score_awarded: score,
            notes: "Operational baseline maintained.",
            remarks: null,
            image_url: null,
            supporting_images: null,
            created_at: date.toISOString()
          });
        });
        const catPct = catMax > 0 ? (catScored / catMax) * 100 : 0;
        totalWeightedScore += catPct * (cat.weight_percentage / 100);
      });

      audits.push({
        id: auditId,
        property_id: prop.id,
        template_id: templateId,
        auditor_id: MOCK_PROFILES[0].id,
        status: "completed",
        total_score: parseFloat(totalWeightedScore.toFixed(1)),
        max_possible_score: 100,
        conducted_at: date.toISOString(),
        completed_at: date.toISOString(),
        major_observations: null,
        good_practices: null,
        recommendations: null,
        next_steps: null,
        created_at: date.toISOString()
      });
    });

    localStorage.setItem("ilh_audits", JSON.stringify(audits));
    localStorage.setItem("ilh_audit_responses", JSON.stringify(responses));
    localStorage.setItem("ilh_corrective_actions", JSON.stringify(correctiveActions));
  }
}

// Ensure mock tables are setup in LocalStorage
if (typeof window !== "undefined") {
  initializeLocalStorageDB();
}

// ============================================================
// Mock Query Builder
// ============================================================

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(tableName: string) {
    this.tableName = `ilh_${tableName}`;
  }

  private getData(): any[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(this.tableName);
    return raw ? JSON.parse(raw) : [];
  }

  private saveData(data: any[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.tableName, JSON.stringify(data));
  }

  select(columns = "*", { count }: { count?: "exact" | "planned" | "estimated" } = {}) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.orderCol = column;
    this.orderAsc = ascending;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    this.limitCount = 1;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    this.limitCount = 1;
    return this;
  }

  // Execute Select Query
  async then(resolve: (result: any) => void) {
    let list = this.getData();

    this.filters.forEach((filter) => {
      list = list.filter(filter);
    });

    if (this.orderCol) {
      list.sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderAsc ? -1 : 1;
        if (valA > valB) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }

    const rawCount = list.length;
    if (this.limitCount !== null) {
      list = list.slice(0, this.limitCount);
    }

    if (this.isSingle || this.isMaybeSingle) {
      resolve({
        data: list[0] || null,
        error: null,
        count: rawCount
      });
    } else {
      resolve({
        data: list,
        error: null,
        count: rawCount
      });
    }
  }

  // Insert Record
  async insert(records: any | any[]) {
    const list = this.getData();
    const isArray = Array.isArray(records);
    const toInsert = isArray ? records : [records];

    const inserted = toInsert.map((rec) => {
      const newRec = {
        id: rec.id || `mock-${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...rec
      };
      list.push(newRec);

      if (this.tableName === "ilh_audit_responses" && Number(rec.score_awarded) <= 2) {
        this.autoCreateCAP(newRec);
      }

      return newRec;
    });

    this.saveData(list);
    return {
      data: isArray ? inserted : inserted[0],
      error: null
    };
  }

  // Update Record
  async update(updates: any) {
    const list = this.getData();
    let updated: any[] = [];

    const updatedList = list.map((item) => {
      let matches = true;
      this.filters.forEach((f) => {
        if (!f(item)) matches = false;
      });

      if (matches) {
        const updatedItem = {
          ...item,
          ...updates,
          updated_at: new Date().toISOString()
        };
        updated.push(updatedItem);
        return updatedItem;
      }
      return item;
    });

    this.saveData(updatedList);
    return {
      data: updated,
      error: null
    };
  }

  // Upsert Record
  async upsert(records: any | any[]) {
    const list = this.getData();
    const toUpsert = Array.isArray(records) ? records : [records];
    const upserted = toUpsert.map((rec) => {
      const idx = list.findIndex((item) => item.id === rec.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...rec, updated_at: new Date().toISOString() };
        return list[idx];
      } else {
        const newRec = {
          id: rec.id || `mock-${Math.random().toString(36).substring(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...rec
        };
        list.push(newRec);
        return newRec;
      }
    });

    this.saveData(list);
    return {
      data: Array.isArray(records) ? upserted : upserted[0],
      error: null
    };
  }

  // Auto-create Corrective Action Plan items
  private autoCreateCAP(response: any) {
    try {
      const audits = JSON.parse(localStorage.getItem("ilh_audits") || "[]");
      const audit = audits.find((a: any) => a.id === response.audit_id);
      if (!audit) return;

      const questions = JSON.parse(localStorage.getItem("ilh_audit_questions") || "[]");
      const q = questions.find((item: any) => item.id === response.question_id);
      const catId = q ? q.category_id : "";
      const categories = JSON.parse(localStorage.getItem("ilh_audit_categories") || "[]");
      const cat = categories.find((c: any) => c.id === catId);

      const correctiveActions = JSON.parse(localStorage.getItem("ilh_corrective_actions") || "[]");
      
      const newAction = {
        id: `cap-${Math.random().toString(36).substring(2, 9)}`,
        audit_id: response.audit_id,
        property_id: audit.property_id,
        question_id: response.question_id,
        issue_description: `${cat ? cat.name : "General"}: ${q ? q.question_text : "Review Flag"} (Score: ${response.score_awarded}/5)`,
        status: "open",
        assigned_to: audit.auditor_id,
        remediation_notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      correctiveActions.push(newAction);
      localStorage.setItem("ilh_corrective_actions", JSON.stringify(correctiveActions));
      toast.warning(`Corrective Action triggered for ${q ? q.question_text.substring(0, 30) : "Issue"}...`);
    } catch (e) {
      console.error("Auto CAP trigger failure:", e);
    }
  }
}

// ============================================================
// Complete Mock Client API
// ============================================================

export const mockSupabase = {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },

  auth: {
    async getUser() {
      if (typeof window === "undefined") return { data: { user: null }, error: null };
      const session = localStorage.getItem("ilh_mock_session");
      if (session) {
        const user = JSON.parse(session);
        return { data: { user }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    async signInWithPassword({ email, password }: any) {
      const user = {
        id: "u1111111-1111-1111-1111-111111111111",
        email: email || "admin@ivyleaguehouse.com",
        full_name: "Abdulahad Sheikh",
        role: "admin",
        user_metadata: { full_name: "Abdulahad Sheikh" }
      };
      localStorage.setItem("ilh_mock_session", JSON.stringify(user));
      toast.success("Successfully logged in!");
      return { data: { user }, error: null };
    },

    async signUp({ email, password, options }: any) {
      const user = {
        id: `u-${Math.random().toString(36).substring(2, 9)}`,
        email,
        full_name: options?.data?.full_name || "New Auditor",
        role: "auditor",
        user_metadata: { full_name: options?.data?.full_name || "New Auditor" }
      };

      const raw = localStorage.getItem("ilh_profiles");
      const profiles = raw ? JSON.parse(raw) : [];
      profiles.push({
        id: user.id,
        full_name: user.full_name,
        role: "auditor",
        created_at: new Date().toISOString()
      });
      localStorage.setItem("ilh_profiles", JSON.stringify(profiles));

      localStorage.setItem("ilh_mock_session", JSON.stringify(user));
      toast.success("Account created successfully!");
      return { data: { user }, error: null };
    },

    async signOut() {
      localStorage.removeItem("ilh_mock_session");
      toast.success("Logged out.");
      return { error: null };
    }
  },

  storage: {
    from(bucketName: string) {
      return {
        async upload(filePath: string, file: any) {
          toast.success("File uploaded to audit-images bucket.");
          return { data: { path: filePath }, error: null };
        },
        getPublicUrl(filePath: string) {
          return { data: { publicUrl: `https://placehold.co/800x600/003366/ffffff?text=Audit+Evidence` } };
        }
      };
    }
  }
};
