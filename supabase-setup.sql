-- ATA Dashboard Supabase Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users/Team Members table
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  responsibilities TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases table
CREATE TABLE phases (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  phase_id TEXT REFERENCES phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  assignee TEXT REFERENCES team_members(id),
  blocked_by TEXT,
  notes TEXT,
  depends_on TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by TEXT REFERENCES team_members(id)
);

-- Action Items table
CREATE TABLE action_items (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  assignee TEXT REFERENCES team_members(id),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by TEXT REFERENCES team_members(id)
);

-- Blockers table
CREATE TABLE blockers (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  mitigation TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  affected_tasks TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT REFERENCES team_members(id),
  status TEXT NOT NULL DEFAULT 'pending',
  options TEXT[],
  decision TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project settings table
CREATE TABLE project_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial team members
INSERT INTO team_members (id, name, email, role, initials, color, responsibilities) VALUES
  ('lynn', 'Lynn Fisher', 'lynn.f@appliedtechac.com', 'Owner/Decision Maker', 'LF', '#0077B5', ARRAY['Strategic decisions', 'Owns Hostinger domains']),
  ('matt', 'Matt Marshall', NULL, 'IT/SaaS Manager', 'MM', '#059669', ARRAY['Primary technical contact', 'Manages Zoho One', 'Support escalations']),
  ('christine', 'Christine Harper', NULL, 'Sales & Partnerships', 'CH', '#7C3AED', ARRAY['Oversees sales team', 'Uses Lucia for prospecting']),
  ('kim', 'Kim', NULL, 'Operations', 'K', '#DB2777', ARRAY['Student registrations', 'Zoho to Arlo transfers']),
  ('ben', 'Ben Reeder', 'benreeder@builderbenai.com', 'Consultant', 'BR', '#EA580C', ARRAY['Project delivery', 'Technical implementation']);

-- Insert phases
INSERT INTO phases (id, number, name, description, deadline, status) VALUES
  ('phase1', 1, 'Inbound Automation', 'Automated email responses for Zoho form submissions', '2025-12-12', 'in_progress'),
  ('phase2', 2, 'System Integrations', 'Connect Arlo TMS and Cypher LMS systems', '2025-12-30', 'in_progress'),
  ('phase3', 3, 'Outbound Infrastructure', 'Cold email infrastructure for corporate outreach', '2026-01-10', 'not_started'),
  ('phase4', 4, 'Handoff & Training', 'Train team and deliver documentation', '2026-01-28', 'not_started');

-- Insert project settings
INSERT INTO project_settings (name, start_date, end_date) VALUES
  ('BTB AI - ATA Automation', '2025-11-28', '2026-01-28');

-- Insert tasks for Phase 1
INSERT INTO tasks (id, phase_id, title, description, status, assignee, blocked_by, notes, depends_on) VALUES
  ('p1t1', 'phase1', 'Audit all 8 Zoho forms', 'Document current form configurations and fields', 'not_started', 'ben', 'Need form access from Matt', 'Forms transferred from Lauren to Matt', ARRAY['p1t2']),
  ('p1t2', 'phase1', 'Get form access from Matt', 'Matt now owns forms (transferred from Lauren)', 'in_progress', 'matt', NULL, 'Matt confirmed form ownership transfer complete', ARRAY[]::TEXT[]),
  ('p1t3', 'phase1', 'Document current thank-you emails', 'Some forms have catalogs attached, need to audit all', 'not_started', 'ben', NULL, NULL, ARRAY['p1t1']),
  ('p1t4', 'phase1', 'Configure automated email responses', 'Triggered by form submissions with personalized templates', 'not_started', 'ben', NULL, NULL, ARRAY['p1t3']),
  ('p1t5', 'phase1', 'Create personalized email templates', 'Based on funding source, course interest, credentialing path', 'not_started', 'ben', NULL, '70% of leads are credentialing/military', ARRAY['p1t1']);

-- Insert tasks for Phase 2
INSERT INTO tasks (id, phase_id, title, description, status, assignee, blocked_by, notes, depends_on) VALUES
  ('p2t1', 'phase2', 'Build Arlo to Cypher LMS automation', 'Transfer First name, Last name, Email, Course code', 'in_progress', 'ben', 'Need Arlo API authentication resolved', 'ATA public classes only, exclude private/white-label', ARRAY['p2t4']),
  ('p2t2', 'phase2', 'Resolve Arlo API authentication', 'Cannot authenticate to pull registration data', 'blocked', 'matt', 'Awaiting Arlo support response', 'Matt escalating with Arlo support', ARRAY[]::TEXT[]),
  ('p2t3', 'phase2', 'Investigate Zoho to Arlo possibilities', 'Arlo API cannot create orders programmatically', 'blocked', 'ben', 'Arlo API limitation - cannot create orders', 'Workaround: Create contacts via API, Kim manually creates orders', ARRAY[]::TEXT[]),
  ('p2t4', 'phase2', 'Review Arlo API documentation', 'Confirm capabilities and limitations', 'complete', 'ben', NULL, 'Confirmed: Can find orders by ID but cannot create. 20-25 webhook endpoints available.', ARRAY[]::TEXT[]),
  ('p2t5', 'phase2', 'Confirm Cypher API capabilities', 'Verify student enrollment endpoints', 'not_started', 'ben', NULL, 'Need to check course timing - courses may not exist 2+ weeks out', ARRAY[]::TEXT[]),
  ('p2t6', 'phase2', 'Set up N8N workflow for registrations', 'Webhook triggers on new Arlo registration', 'complete', 'ben', NULL, 'Workflow created, triggers on registration but only gets registration ID', ARRAY[]::TEXT[]);

-- Insert tasks for Phase 3
INSERT INTO tasks (id, phase_id, title, description, status, assignee, blocked_by, notes, depends_on) VALUES
  ('p3t1', 'phase3', 'Get list of available Hostinger domains', 'Lynn has multiple domains with free email available', 'not_started', 'lynn', NULL, NULL, ARRAY[]::TEXT[]),
  ('p3t2', 'phase3', 'Set up 3 dedicated domains', 'From Hostinger inventory', 'not_started', 'ben', NULL, NULL, ARRAY['p3t1']),
  ('p3t3', 'phase3', 'Create 9 mailboxes (3 per domain)', 'Using Zap Mail for email hosting', 'not_started', 'ben', NULL, 'Lynn to create Zap Mail account', ARRAY['p3t2', 'p3t7']),
  ('p3t4', 'phase3', 'Configure DNS records (SPF, DKIM, DMARC)', 'Required for email deliverability', 'not_started', 'ben', NULL, NULL, ARRAY['p3t2']),
  ('p3t5', 'phase3', 'Warm up domains for sender reputation', '3-week warmup period required', 'not_started', 'ben', NULL, 'Start ASAP - takes 3 weeks minimum', ARRAY['p3t3', 'p3t4']),
  ('p3t6', 'phase3', 'Configure Instantly for email sequencing', 'Connect mailboxes and set up campaigns', 'not_started', 'ben', NULL, NULL, ARRAY['p3t3', 'p3t8']),
  ('p3t7', 'phase3', 'Create Zap Mail account', 'Email hosting service account setup', 'not_started', 'lynn', NULL, 'Lynn to set up with credit card', ARRAY[]::TEXT[]),
  ('p3t8', 'phase3', 'Create Instantly account', 'Cold email platform account setup', 'not_started', 'lynn', NULL, 'Lynn to set up with credit card, invite Ben', ARRAY[]::TEXT[]),
  ('p3t9', 'phase3', 'Create corporate outreach templates', '4-touch sequence: Intro, Value prop, Case study, Soft close', 'not_started', 'ben', NULL, 'Christine to provide target persona details', ARRAY[]::TEXT[]),
  ('p3t10', 'phase3', 'Build Lucia to Instantly workflow', 'Pull prospect lists and load into campaigns', 'not_started', 'ben', NULL, 'Already paying for Lucia - leverage existing tool', ARRAY['p3t6']);

-- Insert tasks for Phase 4
INSERT INTO tasks (id, phase_id, title, description, status, assignee, blocked_by, notes, depends_on) VALUES
  ('p4t1', 'phase4', 'Train ATA team on all new systems', 'Hands-on training sessions', 'not_started', 'ben', NULL, NULL, ARRAY[]::TEXT[]),
  ('p4t2', 'phase4', 'Deliver documentation for all automations', 'SOPs, troubleshooting guides, architecture diagrams', 'not_started', 'ben', NULL, NULL, ARRAY[]::TEXT[]),
  ('p4t3', 'phase4', 'Full system operational verification', 'End-to-end testing of all automations', 'not_started', 'ben', NULL, NULL, ARRAY[]::TEXT[]);

-- Insert action items
INSERT INTO action_items (id, title, assignee, due_date, status, notes) VALUES
  ('a1', 'Escalate Arlo API auth issue with support', 'matt', '2025-12-20', 'in_progress', 'Email sent to support@arlo.co'),
  ('a2', 'Provide list of available Hostinger domains', 'lynn', '2025-12-20', 'pending', NULL),
  ('a3', 'Create Zap Mail account and invite Ben', 'lynn', '2025-12-20', 'pending', 'Needed for email infrastructure'),
  ('a4', 'Create Instantly account and invite Ben', 'lynn', '2025-12-20', 'pending', 'Needed for email sequences'),
  ('a5', 'Send target persona details for outreach templates', 'christine', '2025-12-23', 'pending', 'Types of companies, job titles, industries'),
  ('a6', 'Set up shared Google Drive folder', 'matt', '2025-12-20', 'in_progress', 'For project documents and collaboration'),
  ('a7', 'Transfer Christine admin access in Arlo', 'matt', '2025-12-20', 'pending', 'Christine needs admin for registrations');

-- Insert blockers
INSERT INTO blockers (id, title, description, impact, mitigation, status, affected_tasks) VALUES
  ('b1', 'Arlo API cannot create orders programmatically', 'Confirmed by Arlo support. Can find orders but cannot create them.', 'Cannot fully automate Zoho to Arlo flow', 'Create contacts via API, Kim manually creates orders, automate post-order steps', 'acknowledged', ARRAY['p2t3']),
  ('b2', 'Arlo API authentication issue', 'Cannot authenticate to Arlo API to pull registration data after webhook trigger', 'Blocks Arlo to Cypher automation', 'Matt escalating with Arlo support', 'pending', ARRAY['p2t1', 'p2t2']),
  ('b3', 'Zoho Campaigns vs Marketing Automation conflict', 'Cannot run Campaigns AND Marketing Automation simultaneously in Zoho', 'Limited automation options within Zoho', 'Use external tools (Instantly) for sequences', 'acknowledged', ARRAY[]::TEXT[]);

-- Insert decisions
INSERT INTO decisions (id, title, description, owner, status, options) VALUES
  ('d1', 'Use Constant Contact integration or build custom?', 'ATA pays $50/month for Constant Contact. Could integrate with Zoho.', 'lynn', 'pending', ARRAY['Constant Contact + Zoho integration', 'Instantly only', 'Both platforms']),
  ('d2', 'Which Hostinger domains to use for outbound?', 'Lynn has multiple domains available', 'lynn', 'pending', ARRAY[]::TEXT[]);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON phases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON action_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON blockers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON project_settings FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update tasks
CREATE POLICY "Allow authenticated update tasks" ON tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update action items
CREATE POLICY "Allow authenticated update action_items" ON action_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert action_items" ON action_items FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update blockers
CREATE POLICY "Allow authenticated update blockers" ON blockers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert blockers" ON blockers FOR INSERT TO authenticated WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER action_items_updated_at BEFORE UPDATE ON action_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER blockers_updated_at BEFORE UPDATE ON blockers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
