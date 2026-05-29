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

/** Weighted category within a template (e.g. "Infection Control") */
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
  image_url: string | null;
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
