/**
 * DATABASE TYPE DEFINITIONS — src/types/database.ts
 * ============================================================
 *
 * WHAT THIS FILE DOES:
 * Defines TypeScript interfaces that mirror every table in the Supabase
 * PostgreSQL database. These types are used throughout the application
 * to ensure type-safe data access — meaning the compiler catches bugs
 * like misspelled column names or wrong data types before the code runs.
 *
 * WHY IT MATTERS FOR ILH:
 * The ILH Audits system manages sensitive compliance data across 9+
 * student housing properties in India. A type error (e.g., treating a
 * string as a number) could cause incorrect audit scores, missed CAP
 * items, or dashboard rendering failures. These interfaces act as a
 * contract between the database and the application code.
 *
 * FOR THE FOUNDER / CTO:
 * Each interface below maps 1:1 to a database table. The relationships
 * between them form the data model:
 *
 *   Properties ──has many──▶ Audits ──has many──▶ Audit Responses
 *       │                      │                       │
 *       │                      ├── uses ──▶ Audit Template
 *       │                      │               └── has ──▶ Categories ──▶ Questions
 *       │                      │
 *       └── tracked by ──▶ Corrective Actions ◀── flagged from ──┘
 *
 * FOR DEVELOPERS:
 * - These types do NOT auto-generate from the database schema. If you
 *   change a column in Supabase, you MUST update the corresponding
 *   interface here manually.
 * - Optional fields (marked with `?`) correspond to nullable columns
 *   or columns that may not be present in all query results.
 * - The "Extended / UI Types" section contains composite types used
 *   only in the frontend (e.g., CategoryWithQuestions for the audit form).
 * ============================================================
 */

/* ------------------------------------------------------------------ */
/*  Core Tables — Direct mirrors of Supabase PostgreSQL tables         */
/* ------------------------------------------------------------------ */

/**
 * Property — An ILH student housing location that can be audited.
 *
 * BUSINESS CONTEXT:
 * ILH (Ivy League House) operates co-living properties across India
 * (Pune, Mumbai, Delhi, Bengaluru, Hyderabad, Vizag, Ahmedabad, Dehradun,
 * Durgapur). Each property has a unique name, physical location, bed
 * capacity, and an on-site manager responsible for day-to-day operations.
 *
 * The `total_beds` field is critical for the founder's portfolio analytics —
 * it's used to assess property scale and correlate quality scores with
 * property size. Larger properties (700+ beds) may need more staff and
 * have different compliance challenges than smaller ones (200 beds).
 */
export interface Property {
  id: string;                        // UUID primary key
  name: string;                      // e.g., "ILH Pune", "ILH Mumbai"
  location: string;                  // Full address: "Tathawade, Pune, Maharashtra"
  total_beds: number;                // Bed capacity (e.g., 706 for ILH Pune)
  site_manager?: string | null;      // Name of the on-site operations manager
  total_employees?: number;          // Staff headcount for workforce analytics
  created_at: string;                // ISO timestamp of when the property was added
}

/**
 * Profile — User profile stored alongside Supabase Auth.
 *
 * BUSINESS CONTEXT:
 * Every user who logs into the system has a profile that extends the
 * Supabase auth.users table with ILH-specific fields. The `role` field
 * controls what the user can see and do:
 *
 *   "admin"   → Full access: can create properties, manage templates,
 *               view all audits across all properties, and access the
 *               founder analytics dashboard.
 *   "auditor" → Can conduct audits, view their own audit history, and
 *               upload photo evidence. Cannot modify templates or
 *               view other auditors' results.
 *
 * The profile is auto-created by a PostgreSQL trigger (`handle_new_user`)
 * when a new user signs up. If the trigger fails, the audit submission
 * code has a self-healing mechanism that creates the profile on-the-fly.
 */
export interface Profile {
  id: string;                        // UUID — matches auth.users(id)
  full_name: string;                 // Display name shown in audit reports
  role: 'admin' | 'auditor';        // Access control role
  created_at: string;                // ISO timestamp
}

/**
 * AuditTemplate — Top-level inspection format definition.
 *
 * BUSINESS CONTEXT:
 * A template defines the structure of an audit. Currently, ILH uses a
 * single template: "EHS & PGHP Comprehensive Audit" which covers
 * Environment, Health & Safety (EHS) and Process-Grooming-Hygiene-Product
 * (PGHP) parameters. In the future, different templates could be created
 * for different inspection types (e.g., "Fire Safety Only", "Food Quality").
 *
 * The `max_score` is always 100 because the scoring system uses weighted
 * percentages — each category's weight adds up to 100%.
 */
export interface AuditTemplate {
  id: string;                        // UUID primary key
  title: string;                     // e.g., "EHS & PGHP Comprehensive Audit"
  description: string | null;        // Human-readable explanation of the template
  max_score: number;                 // Always 100 (percentage-based scoring)
  created_at: string;                // ISO timestamp
}

/**
 * AuditCategory — A weighted department/section within a template.
 *
 * BUSINESS CONTEXT:
 * Each category represents a compliance department that contributes a
 * percentage of the overall audit score. The current ILH framework has
 * 5 categories with these weights:
 *
 *   1. PGHP & Core Operations .............. 25%
 *   2. EHS Documentation & Legal Compliance . 25%
 *   3. Mechanical, Electrical & Lift Safety . 20%
 *   4. Chemical, Waste & Material Management  15%
 *   5. Emergency Preparedness & Subcontractor 15%
 *                                            ────
 *                                Total:      100%
 *
 * WHY WEIGHTED SCORING:
 * Not all departments are equally critical. PGHP and EHS Documentation
 * carry the highest weight (25% each) because they directly impact
 * student safety and regulatory compliance. A property could score
 * perfectly on emergency preparedness but still fail overall if their
 * core operations are substandard.
 */
export interface AuditCategory {
  id: string;                        // UUID primary key
  template_id: string;               // FK → audit_templates(id)
  name: string;                      // e.g., "PGHP & Core Operations"
  weight_percentage: number;         // 0-100, all categories sum to 100
  sort_order: number;                // Display order in the audit wizard
  created_at: string;                // ISO timestamp
}

/**
 * AuditQuestion — An individual checklist item within a category.
 *
 * BUSINESS CONTEXT:
 * Each question is a specific compliance checkpoint that the auditor
 * must evaluate on-site. Questions are scored from 0 to `max_points`
 * (typically 5). Examples:
 *
 *   "Are all on-duty staff wearing clean, standard-issue uniforms
 *    with appropriate PPE (gloves, hairnets, safety shoes)?"
 *
 *   "Is the electrical earthing system tested and certified
 *    within the last 12 months?"
 *
 * The `legal_reference` field links the question to the specific
 * Indian regulation it relates to (e.g., "Factories Act 1948, Section 28-29",
 * "FSSAI Act 2006", "BOCWA Section 44"). This is critical for legal
 * compliance reporting and helps auditors understand the regulatory
 * weight of each checkpoint.
 *
 * The `compliance_type` indicates whether the question uses a numeric
 * score (0-5 scale) or a binary yes/no assessment.
 */
export interface AuditQuestion {
  id: string;                        // UUID primary key
  category_id: string;               // FK → audit_categories(id)
  question_text: string;             // The full question text shown to the auditor
  max_points: number;                // Maximum score (typically 5)
  sort_order: number;                // Display order within the category
  legal_reference?: string | null;   // e.g., "Factories Act 1948, Section 45"
  compliance_type?: 'score' | 'yes_no'; // Scoring mode for this question
  created_at: string;                // ISO timestamp
}

/**
 * Audit — A single inspection event at a property.
 *
 * BUSINESS CONTEXT:
 * An audit represents one complete inspection visit to an ILH property.
 * It records:
 *   - WHO conducted the audit (auditor_id)
 *   - WHERE the audit was conducted (property_id)
 *   - WHAT template was used (template_id)
 *   - WHEN it happened (conducted_at, completed_at)
 *   - The OVERALL weighted compliance score (total_score out of 100)
 *   - Whether it's still in progress or completed (status)
 *
 * The executive summary fields (major_observations, good_practices,
 * recommendations, next_steps) are used in the Audit Detail Modal
 * and PDF export to provide a narrative alongside the numeric scores.
 *
 * SCORE THRESHOLDS (used across the dashboard):
 *   ≥ 80% = Green  = "Excellent" — Property meets or exceeds ILH standards
 *   60-79% = Amber  = "Warning"   — Property needs attention in specific areas
 *   < 60%  = Red    = "Critical"  — Immediate action required, escalate to founder
 */
export interface Audit {
  id: string;                        // UUID primary key
  property_id: string;               // FK → properties(id)
  template_id: string;               // FK → audit_templates(id)
  auditor_id: string;                // FK → profiles(id)
  status: 'in_progress' | 'completed'; // Audit lifecycle state
  total_score: number;               // Weighted percentage (0-100)
  max_possible_score: number;        // Always 100 (percentage-based)
  conducted_at: string;              // When the inspector arrived on-site
  completed_at: string | null;       // When the audit was submitted
  major_observations?: string | null; // Executive summary: key issues found
  good_practices?: string | null;    // Executive summary: what's working well
  recommendations?: string | null;   // Executive summary: improvement suggestions
  next_steps?: string | null;        // Executive summary: follow-up action items
  created_at: string;                // ISO timestamp
  /** Populated when joined via Supabase select — not always present */
  property?: Property;
  /** Populated when joined via Supabase select — not always present */
  auditor?: Profile;
}

/**
 * AuditResponse — An auditor's answer to a single question.
 *
 * BUSINESS CONTEXT:
 * For each question in the audit, the auditor records:
 *   - A numeric score (0 to max_points, typically 0-5)
 *   - Optional text notes explaining their observation
 *   - Optional remarks for critical findings
 *   - Optional photo evidence (uploaded to Supabase Storage)
 *   - Optional additional supporting images
 *
 * The photo evidence is especially critical for scores ≤ 2 (compliance
 * failures). Property managers and the founder can view these photos
 * in the Audit Detail Modal to understand the severity of the issue
 * without needing to visit the property in person.
 */
export interface AuditResponse {
  id: string;                        // UUID primary key
  audit_id: string;                  // FK → audits(id)
  question_id: string;               // FK → audit_questions(id)
  score_awarded: number;             // 0 to max_points (e.g., 0-5)
  notes: string | null;              // Auditor's observation notes
  remarks: string | null;            // Critical findings or executive notes
  image_url: string | null;          // Primary photo evidence URL
  supporting_images: string[] | null; // Additional photo evidence URLs
  created_at: string;                // ISO timestamp
}

/* ------------------------------------------------------------------ */
/*  Extended / UI Types — Composite types used only in the frontend     */
/* ------------------------------------------------------------------ */

/**
 * CategoryWithQuestions — A category with its nested questions array.
 *
 * Used in the New Audit wizard to render each step of the multi-step
 * form. Each step displays one category's questions for the auditor
 * to score. This type is assembled by joining audit_categories and
 * audit_questions on the client side.
 */
export interface CategoryWithQuestions extends AuditCategory {
  questions: AuditQuestion[];
}

/**
 * PropertyWithScore — Property card data with aggregate audit statistics.
 *
 * Used in the Properties page and the founder's Portfolio Compliance
 * Performance Chart. The `avg_score` is the average of all completed
 * audit scores for this property, and `audit_count` shows how many
 * inspections have been conducted.
 */
export interface PropertyWithScore extends Property {
  avg_score: number;                 // Average audit score across all inspections
  audit_count: number;               // Total number of completed audits
}

/**
 * AuditWithDetails — Audit record with mandatory joined relations.
 *
 * Used when displaying audit details that require the property name
 * and auditor name to be shown alongside the audit data (e.g., in
 * the Audit Detail Modal and PDF export).
 */
export interface AuditWithDetails extends Audit {
  property: Property;
  auditor: Profile;
}

/**
 * CorrectiveAction — A CAP (Corrective Action Plan) item.
 *
 * BUSINESS CONTEXT:
 * When an auditor scores a question ≤ 2 (compliance failure), the system
 * automatically generates a corrective action item. This creates a
 * trackable work order that flows through the operations pipeline:
 *
 *   "open"        → Issue identified, needs assignment
 *   "in_progress" → Operations team is working on the fix
 *   "resolved"    → Fix completed, verified in next audit
 *
 * The CAP Board (Issues page) is the central command center for
 * operations managers. They can:
 *   - Filter issues by property and status
 *   - View the source audit for context
 *   - Log remediation notes (e.g., "Plumber fixed leaking pipes on 29th May")
 *   - Transition status from Open → In Progress → Resolved
 *
 * The `remediation_notes` field serves as an audit trail for accountability.
 * The founder can review these notes to verify that issues are being
 * addressed properly and within acceptable timeframes.
 */
export interface CorrectiveAction {
  id: string;                        // UUID primary key
  audit_id: string;                  // FK → audits(id) — the source audit
  property_id: string;               // FK → properties(id) — where the issue is
  question_id: string;               // FK → audit_questions(id) — which checkpoint failed
  issue_description: string;         // Auto-generated description with score and notes
  status: 'open' | 'in_progress' | 'resolved'; // CAP lifecycle state
  assigned_to: string | null;        // FK → profiles(id) — who's responsible for the fix
  remediation_notes: string | null;  // Operations team's resolution log
  created_at: string;                // When the issue was first logged
  updated_at: string;                // Last status change timestamp
  property?: Property;               // Joined relation (not always present)
  question?: AuditQuestion;          // Joined relation (not always present)
  auditor?: Profile;                 // Joined relation (not always present)
}
