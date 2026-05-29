-- ============================================================
-- ILH Audits — Database Schema
-- Supabase PostgreSQL with Row Level Security (RLS)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROPERTIES TABLE
-- Stores all ILH student housing properties
-- ============================================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  total_beds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read properties
CREATE POLICY "Authenticated users can view properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify properties
CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 2. PROFILES TABLE
-- Extends auth.users with app-specific fields
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'auditor' CHECK (role IN ('admin', 'auditor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (for auditor names in reports)
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- ============================================================
-- 3. AUDIT TEMPLATES TABLE
-- Defines audit template configurations
-- ============================================================
CREATE TABLE audit_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON audit_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON audit_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 4. AUDIT CATEGORIES TABLE
-- Groups questions by category with weighted scoring
-- ============================================================
CREATE TABLE audit_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_percentage INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON audit_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON audit_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 5. AUDIT QUESTIONS TABLE
-- Individual checklist items within categories
-- ============================================================
CREATE TABLE audit_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES audit_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 5,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audit_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view questions"
  ON audit_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage questions"
  ON audit_questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 6. AUDITS TABLE
-- Records of completed/in-progress audits
-- ============================================================
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES audit_templates(id) ON DELETE RESTRICT,
  auditor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  total_score NUMERIC(5, 2) DEFAULT 0,
  max_possible_score INTEGER DEFAULT 100,
  conducted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Auditors can view their own audits; admins can view all
CREATE POLICY "Users can view relevant audits"
  ON audits FOR SELECT
  TO authenticated
  USING (
    auditor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Auditors can create audits
CREATE POLICY "Authenticated users can create audits"
  ON audits FOR INSERT
  TO authenticated
  WITH CHECK (auditor_id = auth.uid());

-- Auditors can update their own in-progress audits
CREATE POLICY "Users can update own audits"
  ON audits FOR UPDATE
  TO authenticated
  USING (auditor_id = auth.uid());

-- ============================================================
-- 7. AUDIT RESPONSES TABLE
-- Individual answers/scores for each question in an audit
-- ============================================================
CREATE TABLE audit_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES audit_questions(id) ON DELETE CASCADE,
  score_awarded INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(audit_id, question_id)
);

ALTER TABLE audit_responses ENABLE ROW LEVEL SECURITY;

-- Users can view responses for audits they can see
CREATE POLICY "Users can view relevant responses"
  ON audit_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_responses.audit_id
      AND (
        audits.auditor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
    )
  );

-- Users can insert responses for their own audits
CREATE POLICY "Users can insert responses for own audits"
  ON audit_responses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_responses.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );

-- Users can update responses for their own audits
CREATE POLICY "Users can update responses for own audits"
  ON audit_responses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audits
      WHERE audits.id = audit_responses.audit_id
      AND audits.auditor_id = auth.uid()
    )
  );

-- ============================================================
-- 8. AUTO-CREATE PROFILE ON USER SIGNUP
-- Trigger function to create a profile row when a new user signs up
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'auditor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 9. STORAGE BUCKET FOR AUDIT IMAGES
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-images', 'audit-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload audit images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audit-images');

-- Allow public read access to audit images
CREATE POLICY "Public can view audit images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'audit-images');

-- ============================================================
-- 10. USEFUL INDEXES
-- ============================================================
CREATE INDEX idx_audits_property_id ON audits(property_id);
CREATE INDEX idx_audits_auditor_id ON audits(auditor_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_conducted_at ON audits(conducted_at DESC);
CREATE INDEX idx_audit_responses_audit_id ON audit_responses(audit_id);
CREATE INDEX idx_audit_categories_template_id ON audit_categories(template_id);
CREATE INDEX idx_audit_questions_category_id ON audit_questions(category_id);
