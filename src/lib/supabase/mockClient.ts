/**
 * High-Fidelity Mock Supabase Client
 * 
 * Implements complete local-storage database state for:
 *  - properties
 *  - profiles
 *  - audits
 *  - audit_responses
 *  - corrective_actions (CAP board)
 *  - audit_templates
 *  - audit_categories
 *  - audit_questions
 * 
 * Supports query builders: from().select(), .insert(), .update(), .eq(), .in(), .order(), .limit()
 */

import { toast } from "sonner";

// Static Seed Data
const MOCK_PROFILES = [
  { id: "u1111111-1111-1111-1111-111111111111", full_name: "Abdulahad Sheikh", role: "admin", created_at: new Date().toISOString() },
  { id: "u2222222-2222-2222-2222-222222222222", full_name: "Rahul Sharma", role: "auditor", created_at: new Date().toISOString() }
];

const MOCK_PROPERTIES = [
  { id: "p0000000-0000-0000-0000-000000000001", name: "ILH Pune", location: "Tathawade, Pune, Maharashtra", total_beds: 706, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000002", name: "ILH Mumbai", location: "Vile Parle, Mumbai, Maharashtra", total_beds: 450, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000003", name: "ILH Delhi", location: "Kamla Nagar, Delhi", total_beds: 350, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000004", name: "ILH Dehradun", location: "Rajpur Road, Dehradun, Uttarakhand", total_beds: 400, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000005", name: "ILH Durgapur", location: "Durgapur, West Bengal", total_beds: 250, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000006", name: "ILH Bengaluru", location: "Koramangala, Bengaluru, Karnataka", total_beds: 320, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000007", name: "ILH Hyderabad", location: "Gachibowli, Hyderabad, Telangana", total_beds: 280, created_at: new Date().toISOString() },
  { id: "p0000000-0000-0000-0000-000000000008", name: "ILH Vizag", location: "Visakhapatnam, Andhra Pradesh", total_beds: 200, created_at: new Date().toISOString() }
];

const MOCK_TEMPLATES = [
  { id: "a0000000-0000-0000-0000-000000000001", title: "Standard Property Audit", description: "Comprehensive quality audit covering all aspects of ILH property operations including housekeeping, food, maintenance, safety, and community standards.", max_score: 100 }
];

const MOCK_CATEGORIES = [
  { id: "cat1", template_id: "a0000000-0000-0000-0000-000000000001", name: "Housekeeping", weight_percentage: 25, sort_order: 1 },
  { id: "cat2", template_id: "a0000000-0000-0000-0000-000000000001", name: "Food & Dining", weight_percentage: 20, sort_order: 2 },
  { id: "cat3", template_id: "a0000000-0000-0000-0000-000000000001", name: "Maintenance", weight_percentage: 25, sort_order: 3 },
  { id: "cat4", template_id: "a0000000-0000-0000-0000-000000000001", name: "Safety & Security", weight_percentage: 15, sort_order: 4 },
  { id: "cat5", template_id: "a0000000-0000-0000-0000-000000000001", name: "Community & Wellbeing", weight_percentage: 15, sort_order: 5 }
];

const MOCK_QUESTIONS = [
  // Housekeeping
  { id: "q1", category_id: "cat1", question_text: "Are all common areas (lobbies, corridors, staircases) clean and well-maintained?", max_points: 5, sort_order: 1 },
  { id: "q2", category_id: "cat1", question_text: "Are washrooms sanitized with adequate supplies (soap, tissues, bins)?", max_points: 5, sort_order: 2 },
  { id: "q3", category_id: "cat1", question_text: "Are resident rooms dusted, mopped, and beds made as per schedule?", max_points: 5, sort_order: 3 },
  { id: "q4", category_id: "cat1", question_text: "Is waste segregation and disposal being handled properly and on time?", max_points: 5, sort_order: 4 },
  // Food & Dining
  { id: "q5", category_id: "cat2", question_text: "Is the kitchen area clean, organized, and free of pests?", max_points: 5, sort_order: 1 },
  { id: "q6", category_id: "cat2", question_text: "Are meals served on time and as per the published weekly menu?", max_points: 5, sort_order: 2 },
  { id: "q7", category_id: "cat2", question_text: "Is food quality satisfactory (taste, freshness, temperature)?", max_points: 5, sort_order: 3 },
  { id: "q8", category_id: "cat2", question_text: "Are food safety and hygiene standards maintained (gloves, hairnets, storage)?", max_points: 5, sort_order: 4 },
  // Maintenance
  { id: "q9", category_id: "cat3", question_text: "Are all electrical fittings (lights, fans, switches, sockets) functional?", max_points: 5, sort_order: 1 },
  { id: "q10", category_id: "cat3", question_text: "Is plumbing in proper working order (no leaks, drains clear, hot water functional)?", max_points: 5, sort_order: 2 },
  { id: "q11", category_id: "cat3", question_text: "Are furniture and fixtures in good condition (beds, desks, wardrobes, doors)?", max_points: 5, sort_order: 3 },
  { id: "q12", category_id: "cat3", question_text: "Is the Wi-Fi network stable and providing adequate speed across the property?", max_points: 5, sort_order: 4 },
  // Safety
  { id: "q13", category_id: "cat4", question_text: "Are CCTV cameras operational and covering all critical areas?", max_points: 5, sort_order: 1 },
  { id: "q14", category_id: "cat4", question_text: "Are fire extinguishers present, accessible, and within service date?", max_points: 5, sort_order: 2 },
  { id: "q15", category_id: "cat4", question_text: "Is the entry/exit register being maintained with visitor logs?", max_points: 5, sort_order: 3 },
  { id: "q16", category_id: "cat4", question_text: "Are emergency exits clearly marked and unobstructed?", max_points: 5, sort_order: 4 },
  // Community
  { id: "q17", category_id: "cat5", question_text: "Are common recreational areas (lounge, gym, study room) well-maintained?", max_points: 5, sort_order: 1 },
  { id: "q18", category_id: "cat5", question_text: "Is the staff courteous, responsive, and available during hours?", max_points: 5, sort_order: 2 },
  { id: "q19", category_id: "cat5", question_text: "Are notice boards updated with emergency contacts?", max_points: 5, sort_order: 3 },
  { id: "q20", category_id: "cat5", question_text: "Are community events or engagement activities being organized?", max_points: 5, sort_order: 4 }
];

// Helper to seed localStorage databases if empty
function initializeLocalStorageDB() {
  if (typeof window === "undefined") return;

  const currentVersion = "2.0";
  const storedVersion = localStorage.getItem("ilh_seeder_version");

  if (storedVersion !== currentVersion) {
    // Clear all previous mock tables to force reload the upgraded, premium dataset
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

  // Pre-seed mock historical audits & corrective actions to make the charts/sparklines gorgeous!
  if (!localStorage.getItem("ilh_audits")) {
    const audits: any[] = [];
    const responses: any[] = [];
    const correctiveActions: any[] = [];

    const auditorId = MOCK_PROFILES[0].id;
    const templateId = MOCK_TEMPLATES[0].id;

    // Seed 3 historic audits per property (differing dates, scores, and departments)
    MOCK_PROPERTIES.forEach((prop, propIdx) => {
      const count = 3;
      for (let i = 1; i <= count; i++) {
        const auditId = `audit-${prop.id.substring(2, 6)}-${i}`;
        const daysAgo = (count - i) * 10 + 2;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        let totalPoints = 0;
        let maxPoints = 100;

        MOCK_QUESTIONS.forEach((q) => {
          // Default: standard good score
          let score = 4;
          let notes = "Maintained as per operational standards.";
          let imageUrl = null;

          if (propIdx === 0) { // Pune (Climbing: 90.0% -> 92.5% -> 96.0%) - Operational Excellence
            if (i === 1) {
              score = q.id === "q9" ? 2 : (q.id === "q3" || q.id === "q15" ? 5 : 4);
              if (q.id === "q9") notes = "Minor electrical fluctuation in lobby main distributor box joint.";
            } else if (i === 2) {
              score = q.id === "q1" || q.id === "q5" || q.id === "q17" ? 5 : 4;
            } else {
              score = q.id === "q12" ? 4 : 5;
            }
          }
          else if (propIdx === 1) { // Mumbai (Stable high: 84.5% -> 86.0% -> 88.5%) - Operational Excellence
            if (i === 1) {
              score = q.id === "q1" || q.id === "q13" ? 5 : 4;
            } else if (i === 2) {
              score = q.id === "q5" || q.id === "q9" || q.id === "q17" ? 5 : 4;
            } else {
              score = q.id === "q12" || q.id === "q20" ? 4 : 5;
            }
          }
          else if (propIdx === 5) { // Bengaluru (Recovering: 66.0% -> 74.0% -> 84.5%) - Operational Excellence
            if (i === 1) {
              score = q.id === "q14" ? 2 : (q.id === "q3" || q.id === "q7" ? 4 : 3);
              if (q.id === "q14") notes = "Fire exit sign illumination bulb in Block-C lobby is fused.";
            } else if (i === 2) {
              score = q.id === "q1" || q.id === "q9" || q.id === "q13" ? 4 : 3;
            } else {
              score = q.id === "q12" ? 4 : 5;
            }
          }
          else if (propIdx === 2) { // Delhi (Warning/Satisfactory: 76.5% -> 70.0% -> 73.5%) - Warning
            if (i === 1) {
              score = q.id === "q3" || q.id === "q11" ? 4 : 3;
            } else if (i === 2) {
              score = 3;
            } else {
              score = q.id === "q10" ? 2 : 4;
              if (q.id === "q10") {
                notes = "Plumbing check: Restroom B-Block has an active slow drip leak under the main washing basin.";
                imageUrl = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400";
              }
            }
          }
          else if (propIdx === 3) { // Dehradun (Stable warning: 72.0% -> 66.5% -> 68.0%) - Warning
            if (i === 1) {
              score = q.id === "q15" || q.id === "q19" ? 4 : 3;
            } else if (i === 2) {
              score = 3;
            } else {
              score = q.id === "q5" ? 2 : 3;
              if (q.id === "q5") {
                notes = "Pest Control warning: Minor signs of pest evidence spotted near dry storage racks.";
                imageUrl = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400";
              }
            }
          }
          else if (propIdx === 7) { // Vizag (Stable: 64.0% -> 68.0% -> 65.5%) - Warning
            score = q.id === "q1" || q.id === "q7" ? 4 : 3;
          }
          else if (propIdx === 6) { // Hyderabad (Risk/Dropping: 66.5% -> 60.0% -> 58.0%) - Failing / Risk
            if (i === 1) {
              score = q.id === "q3" || q.id === "q15" ? 4 : 3;
            } else if (i === 2) {
              score = 3;
            } else {
              score = q.id === "q13" ? 2 : (q.id === "q14" ? 1 : 3);
              if (q.id === "q13") {
                notes = "Two CCTV cameras in the main lobby and rear parking exit are completely inactive.";
                imageUrl = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400";
              }
              if (q.id === "q14") {
                notes = "Urgent: 3 fire extinguishers located on the 2nd and 3rd floors are past their annual service inspection dates by 4 months.";
              }
            }
          }
          else if (propIdx === 4) { // Durgapur (Risk/Crash: 68.0% -> 58.0% -> 54.0%) - Failing / Risk
            if (i === 1) {
              score = q.id === "q3" || q.id === "q11" ? 4 : 3;
            } else if (i === 2) {
              score = q.id === "q8" ? 2 : 3;
            } else {
              score = 3;
              if (q.id === "q8") {
                score = 1;
                notes = "Food Safety Failure: Kitchen chef was found cooking without hairnet or gloves. Prep counters had visible grease buildup.";
                imageUrl = "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400";
              }
              if (q.id === "q2") {
                score = 2;
                notes = "Housekeeping failure: Common toilets sanitization sheet was blank, soap dispensers were empty and there was a heavy odor.";
              }
            }
          }

          const cat = MOCK_CATEGORIES.find((c) => c.id === q.category_id);
          const weight = cat ? cat.weight_percentage : 20;
          const weightedPts = (score / q.max_points) * (weight / 4);
          totalPoints += weightedPts;

          responses.push({
            id: `resp-${auditId}-${q.id}`,
            audit_id: auditId,
            question_id: q.id,
            score_awarded: score,
            notes,
            image_url: imageUrl,
            created_at: date.toISOString(),
          });

          if (score <= 2) {
            let capStatus = "open";
            let remediationNotes = "";

            if (propIdx === 0 && i === 1) {
              capStatus = "resolved";
              remediationNotes = "Maintenance electrician dispatched. Replaced faulty distributor breaker. Checked main line current, load balanced successfully.";
            } else if (propIdx === 5 && i === 1) {
              capStatus = "resolved";
              remediationNotes = "Standard sign bulb replaced with high-durability LED indicator. Tested and operational.";
            } else if (propIdx === 2 && i === 3) {
              capStatus = "in_progress";
              remediationNotes = "Plumbing agency contracted. Replacement washer and brass valve gaskets ordered, repair scheduled for tomorrow.";
            } else if (propIdx === 4 && i === 3 && q.id === "q8") {
              capStatus = "in_progress";
              remediationNotes = "Kitchen manager issued a formal warning letter. Kitchen closed for deep sanitation for 4 hours. Chef retrained on safety clothing compliance.";
            }

            correctiveActions.push({
              id: `cap-${auditId}-${q.id}`,
              audit_id: auditId,
              property_id: prop.id,
              question_id: q.id,
              issue_description: `${cat?.name || "General"} Department: ${q.question_text} (Inspector Score: ${score}/5)`,
              status: capStatus,
              assigned_to: auditorId,
              remediation_notes: remediationNotes,
              created_at: date.toISOString(),
              updated_at: date.toISOString(),
            });
          }
        });

        audits.push({
          id: auditId,
          property_id: prop.id,
          template_id: templateId,
          auditor_id: auditorId,
          status: "completed",
          total_score: parseFloat(totalPoints.toFixed(1)),
          max_possible_score: maxPoints,
          conducted_at: date.toISOString(),
          completed_at: date.toISOString(),
          created_at: date.toISOString(),
        });
      }
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

/** Mock Client Class implementing Supabase query methods */
class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitCount: number | null = null;

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

  // Execute Select Query
  async then(resolve: (result: any) => void) {
    let list = this.getData();

    // Apply filters
    this.filters.forEach((filter) => {
      list = list.filter(filter);
    });

    // Apply sorting
    if (this.orderCol) {
      list.sort((a, b) => {
        const valA = a[this.orderCol!];
        const valB = b[this.orderCol!];
        if (valA < valB) return this.orderAsc ? -1 : 1;
        if (valA > valB) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }

    // Apply limits
    const rawCount = list.length;
    if (this.limitCount !== null) {
      list = list.slice(0, this.limitCount);
    }

    resolve({
      data: list,
      error: null,
      count: rawCount
    });
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

      // Trigger automatic Corrective Action (CAP) tracking for failing score
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

  // Intercept and auto-create Corrective Action Plan items
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
        issue_description: `${cat ? cat.name : "General"} Compliance: ${q ? q.question_text : "Review Flag"} (Inspector Score: ${response.score_awarded}/5)`,
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

/** Complete Mock Client API */
export const mockSupabase = {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  },

  // Mock Authentication APIs
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
      toast.success("Successfully logged in in Mock Demo Mode!");
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

      // Add to profiles
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
      toast.success("Mock account created successfully!");
      return { data: { user }, error: null };
    },

    async signOut() {
      localStorage.removeItem("ilh_mock_session");
      toast.success("Logged out from Mock Demo Mode.");
      return { error: null };
    }
  },

  // Mock Storage APIs
  storage: {
    from(bucketName: string) {
      return {
        async upload(filePath: string, file: any) {
          toast.success("Mock upload: file saved to audit-images bucket.");
          return { data: { path: filePath }, error: null };
        },
        getPublicUrl(filePath: string) {
          return { data: { publicUrl: `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800` } };
        }
      };
    }
  }
};
