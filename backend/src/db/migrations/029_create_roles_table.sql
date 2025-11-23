-- Create roles reference table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert all available roles
INSERT INTO roles (name, description, display_order) VALUES
  ('ADMIN', 'System administrator with full access', 1),
  ('SELLER', 'User who can sell products on the platform', 2),
  ('PROMOTER', 'User who can promote events', 3),
  ('GUEST', 'Regular user who can browse and purchase', 4),
  ('STEWARD', 'User who can manage steward listings', 5)
ON CONFLICT (name) DO NOTHING;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Add comment to table
COMMENT ON TABLE roles IS 'Reference table for all available user roles in the system';

