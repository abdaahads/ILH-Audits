/**
 * High-Fidelity Mock Supabase Client — v6.0
 * 
 * Secure Architect Abstraction Layer:
 *  - ZERO hardcoded or sensitive Completed Audits / Remarks / Evidence in codebase (Confidentiality).
 *  - Dynamically constructs generic formulaic mock data in client LocalStorage at runtime.
 *  - Seeds 3 completed audits for ALL 9 properties to guarantee perfect visual trendline sparklines and full dashboards.
 *  - Pristine asynchronous Radix-style query builder chaining supporting select, update, insert, upsert, delete.
 */

import { toast } from "sonner";

// ============================================================
// Public Enterprise Metadata (Non-Confidential)
// ============================================================

const MOCK_PROFILES = [
  { id: "u1111111-1111-1111-1111-111111111111", full_name: "Abdulahad Sheikh", role: "admin", created_at: new Date().toISOString() },
  { id: "u2222222-2222-2222-2222-222222222222", full_name: "Rahul Sharma", role: "auditor", created_at: new Date().toISOString() }
];

const MOCK_PROPERTIES = [
  { id: "p0000000-0000-0000-0000-000000000001", name: "ILH Pune", location: "Tathawade, Pune, Maharashtra", total_beds: 706, site_manager: "Rajesh Kulkarni", total_employees: 85, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000002", name: "ILH Mumbai", location: "Vile Parle, Mumbai, Maharashtra", total_beds: 450, site_manager: "Priya Nair", total_employees: 62, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000003", name: "ILH Delhi", location: "Kamla Nagar, Delhi", total_beds: 350, site_manager: "Vikram Singh", total_employees: 48, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000004", name: "ILH Dehradun", location: "Rajpur Road, Dehradun, Uttarakhand", total_beds: 400, site_manager: "Ankit Rawat", total_employees: 45, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000005", name: "ILH Durgapur", location: "Durgapur, West Bengal", total_beds: 250, site_manager: "Sourav Das", total_employees: 32, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000006", name: "ILH Bengaluru", location: "Koramangala, Bengaluru, Karnataka", total_beds: 320, site_manager: "Meera Reddy", total_employees: 40, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000007", name: "ILH Hyderabad", location: "Gachibowli, Hyderabad, Telangana", total_beds: 280, site_manager: "Farhan Ahmed", total_employees: 36, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000008", name: "ILH Vizag", location: "Visakhapatnam, Andhra Pradesh", total_beds: 200, site_manager: "Lakshmi Prasad", total_employees: 28, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000009", name: "ILH Ahmedabad", location: "SG Highway, Ahmedabad, Gujarat", total_beds: 520, site_manager: "Harsh Patel", total_employees: 70, created_at: new Date().toISOString() }
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

// Audit dates: Aug 2025, Jan 2026, May 2026
const AUDIT_DATES = [
  new Date("2025-08-15T10:00:00Z"),
  new Date("2026-01-20T10:00:00Z"),
  new Date("2026-05-12T10:00:00Z")
];

// May 2026 specific fail questions map to prevent hardcoding actual text
const PROP_FAIL_QUESTION_IDX = [8, 9, 11, 12, 14, 15, 5, 6, 9];

// ============================================================
// LocalStorage Initialization & Runtime Generator
// ============================================================

function initializeLocalStorageDB() {
  if (typeof window === "undefined") return;

  const currentVersion = "6.1"; // Bump to v6.1 to trigger fresh wipe of old mock seeder and load renamed properties
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

  // Generate 3 completed audits for ALL 9 properties programmatically (runtime, non-confidential formula)
  if (!localStorage.getItem("ilh_audits")) {
    const audits: any[] = [];
    const responses: any[] = [];
    const correctiveActions: any[] = [];
    
    const auditorId = MOCK_PROFILES[0].id;
    const templateId = MOCK_TEMPLATES[0].id;

    MOCK_PROPERTIES.forEach((prop, propIdx) => {
      // Each property gets 3 completed historical audits
      AUDIT_DATES.forEach((date, auditIdx) => {
        const auditId = `audit-${prop.id.substring(2, 6)}-${auditIdx + 1}`;
        const isMostRecent = auditIdx === 2;

        // May 2026 failure question for this property
        const failQIdx = PROP_FAIL_QUESTION_IDX[propIdx % PROP_FAIL_QUESTION_IDX.length];
        const failQuestion = MOCK_QUESTIONS[failQIdx - 1];

        // Dynamic formulaic score assignment:
        // Audit 1 (Aug 2025): baseline mixed (alternate scores 3 and 4)
        // Audit 2 (Jan 2026): improved compliance (alternate scores 4 and 5)
        // Audit 3 (May 2026): high compliance (all 5s, except 1 critical failure of score 1)
        const qScores: Record<string, number> = {};
        MOCK_QUESTIONS.forEach((q, idx) => {
          if (auditIdx === 0) {
            qScores[q.id] = (idx % 2 === 0) ? 3 : 4;
          } else if (auditIdx === 1) {
            qScores[q.id] = (idx % 2 === 0) ? 4 : 5;
          } else {
            qScores[q.id] = (q.id === failQuestion.id) ? 1 : 5;
          }
        });

        // Compute actual weighted score based on categories
        let totalWeightedScore = 0;
        MOCK_CATEGORIES.forEach((cat) => {
          const catQuestions = MOCK_QUESTIONS.filter((q) => q.category_id === cat.id);
          let catScored = 0;
          let catMax = 0;
          catQuestions.forEach((q) => {
            catScored += qScores[q.id];
            catMax += q.max_points;
          });
          const catPct = catMax > 0 ? (catScored / catMax) * 100 : 0;
          totalWeightedScore += catPct * (cat.weight_percentage / 100);
        });

        const finalScore = parseFloat(totalWeightedScore.toFixed(1));

        // Create responses
        let hasFailures = false;
        MOCK_QUESTIONS.forEach((q) => {
          const score = qScores[q.id];
          const isCritical = isMostRecent && (q.id === failQuestion.id);
          
          const notes = score >= 4 ? "Operational baseline maintained as per SOP." : (score === 3 ? "Acceptable operational baseline." : null);
          const remarks = isCritical ? `CRITICAL NON-COMPLIANCE: Safety parameters failed check. Non-compliant with statutory acts.` : null;
          const supportingImages = isCritical 
            ? [
                `https://placehold.co/800x600/dc2626/ffffff?text=Statutory+Violation`,
                `https://placehold.co/800x600/dc2626/ffffff?text=Evidence+Capture`
              ] 
            : null;

          if (isCritical) {
            hasFailures = true;
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

          // Seed Corrective Actions
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
              remediation_notes: isMostRecent ? "" : "Remediated successfully in subsequent inspection cycle.",
              created_at: date.toISOString(),
              updated_at: date.toISOString()
            });
          }
        });

        // Dynamic formulaic Executive Summary texts
        let majorObservations = "No critical compliance failures observed. All operational departments met acceptable compliance standards.";
        let nextSteps = "Continue standard operations. Schedule next routine quarterly compliance audit.";
        let goodPractices = "Excellent organization in core grooming and standard hygiene parameters.";
        let recommendations = "Maintain current standards. Continue standard site training programs.";

        if (hasFailures) {
          majorObservations = `CRITICAL FAILURE: ${failQuestion.question_text} was flagged non-compliant (Score: 1/5). Immediate corrective action required.`;
          nextSteps = "1. Immediate escalation to Site Manager.\n2. Rectify critical safety issue within 24 hours.\n3. Conduct verification check.";
          goodPractices = "Strong overall operational records. Excellent FSSAI compliance and worker PPE compliance.";
          recommendations = "Prioritize immediate mitigation of flagged statutory gaps. Conduct emergency refresher training.";
        }

        audits.push({
          id: auditId,
          property_id: prop.id,
          template_id: templateId,
          auditor_id: auditorId,
          status: "completed",
          total_score: finalScore,
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

    localStorage.setItem("ilh_audits", JSON.stringify(audits));
    localStorage.setItem("ilh_audit_responses", JSON.stringify(responses));
    localStorage.setItem("ilh_corrective_actions", JSON.stringify(correctiveActions));
  }
}

// Ensure mock tables are setup in LocalStorage at runtime
if (typeof window !== "undefined") {
  initializeLocalStorageDB();
}

// ============================================================
// Professional Chaining Mock Query Builder
// ============================================================

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;

  private op: 'select' | 'update' | 'insert' | 'upsert' | 'delete' = 'select';
  private opData: any = null;

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
    this.op = 'select';
    return this;
  }

  update(updates: any) {
    this.op = 'update';
    this.opData = updates;
    return this;
  }

  insert(records: any | any[]) {
    this.op = 'insert';
    this.opData = records;
    return this;
  }

  upsert(records: any | any[]) {
    this.op = 'upsert';
    this.opData = records;
    return this;
  }

  delete() {
    this.op = 'delete';
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

  // Execute actual database operations when Awaited (then method)
  async then(resolve: (result: any) => void) {
    const list = this.getData();
    let resultData: any = null;
    let error: any = null;

    // Apply filters
    let filteredList = [...list];
    this.filters.forEach((filter) => {
      filteredList = filteredList.filter(filter);
    });

    if (this.op === 'select') {
      if (this.orderCol) {
        filteredList.sort((a, b) => {
          const valA = a[this.orderCol!];
          const valB = b[this.orderCol!];
          if (valA < valB) return this.orderAsc ? -1 : 1;
          if (valA > valB) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }
      
      const rawCount = filteredList.length;
      if (this.limitCount !== null) {
        filteredList = filteredList.slice(0, this.limitCount);
      }

      resultData = (this.isSingle || this.isMaybeSingle) ? (filteredList[0] || null) : filteredList;
    } 
    
    else if (this.op === 'update') {
      let updated: any[] = [];
      const updatedList = list.map((item) => {
        let matches = true;
        this.filters.forEach((f) => {
          if (!f(item)) matches = false;
        });

        if (matches) {
          const updatedItem = {
            ...item,
            ...this.opData,
            updated_at: new Date().toISOString()
          };
          updated.push(updatedItem);
          return updatedItem;
        }
        return item;
      });

      this.saveData(updatedList);
      resultData = updated;
    } 
    
    else if (this.op === 'insert') {
      const isArray = Array.isArray(this.opData);
      const toInsert = isArray ? this.opData : [this.opData];
      const inserted = toInsert.map((rec: any) => {
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
      resultData = isArray ? inserted : inserted[0];
    } 
    
    else if (this.op === 'upsert') {
      const isArray = Array.isArray(this.opData);
      const toUpsert = isArray ? this.opData : [this.opData];
      const upserted = toUpsert.map((rec: any) => {
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
      resultData = isArray ? upserted : upserted[0];
    } 
    
    else if (this.op === 'delete') {
      const deletedList = list.filter((item) => {
        let matches = true;
        this.filters.forEach((f) => {
          if (!f(item)) matches = false;
        });
        return !matches;
      });

      this.saveData(deletedList);
      resultData = filteredList;
    }

    resolve({
      data: resultData,
      error
    });
  }

  // Dynamic Corrective Action Auto-generation
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
