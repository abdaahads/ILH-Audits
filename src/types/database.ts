/**
 * Database type definitions for ILH Audits
 *
 * These interfaces mirror the Supabase/Postgres schema and are used
 * throughout the application for type-safe data access.
 */

/* ------------------------------------------------------------------ */
/*  Core Tables                                                       */
/* ------------------------------------------------------------------ */

/** A care-home property that can be audited */
export interface Property {
  id: string;
  name: string;
  location: string;
  total_beds: number;
  site_manager?: string | null;
  total_employees?: number;
  created_at: string;
}

/** User profile stored alongside Supabase Auth */
export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'auditor';
  created_at: string;
}

/** Top-level audit template (e.g. "Monthly Compliance Audit") */
export interface AuditTemplate {
  id: string;
  title: string;
  description: string | null;
  max_score: number;
  created_at: string;
}

/** Weighted category within a template (e.g. "EHS Documentation") */
export interface AuditCategory {
  id: string;
  template_id: string;
  name: string;
  weight_percentage: number;
  sort_order: number;
  created_at: string;
}

/** Individual question inside a category */
export interface AuditQuestion {
  id: string;
  category_id: string;
  question_text: string;
  max_points: number;
  sort_order: number;
  legal_reference?: string | null;
  compliance_type?: 'score' | 'yes_no';
  created_at: string;
}

/** A single audit instance performed at a property */
export interface Audit {
  id: string;
  property_id: string;
  template_id: string;
  auditor_id: string;
  status: 'in_progress' | 'completed';
  total_score: number;
  max_possible_score: number;
  conducted_at: string;
  completed_at: string | null;
  major_observations?: string | null;
  good_practices?: string | null;
  recommendations?: string | null;
  next_steps?: string | null;
  created_at: string;
  /** Populated when joined via Supabase select */
  property?: Property;
  /** Populated when joined via Supabase select */
  auditor?: Profile;
}

/** An auditor's response to a single question */
export interface AuditResponse {
  id: string;
  audit_id: string;
  question_id: string;
  score_awarded: number;
  notes: string | null;
  remarks: string | null;
  image_url: string | null;
  supporting_images: string[] | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Extended / UI Types                                                */
/* ------------------------------------------------------------------ */

/** Category with its nested questions – used when rendering an audit form */
export interface CategoryWithQuestions extends AuditCategory {
  questions: AuditQuestion[];
}

/** Property card with aggregate audit stats */
export interface PropertyWithScore extends Property {
  avg_score: number;
  audit_count: number;
}

/** Audit row with mandatory joined relations */
export interface AuditWithDetails extends Audit {
  property: Property;
  auditor: Profile;
}

/** A corrective action item (CAP) to track failed audit questions */
export interface CorrectiveAction {
  id: string;
  audit_id: string;
  property_id: string;
  question_id: string;
  issue_description: string;
  status: 'open' | 'in_progress' | 'resolved';
  assigned_to: string | null;
  remediation_notes: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  question?: AuditQuestion;
  auditor?: Profile;
}
