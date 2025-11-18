-- Migration: Add professions table and profession_id to fraternity_members
-- Date: Add profession support for members

-- Create professions table (similar to industries)
CREATE TABLE IF NOT EXISTS professions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add profession_id to fraternity_members table
ALTER TABLE fraternity_members 
ADD COLUMN IF NOT EXISTS profession_id INTEGER REFERENCES professions(id);

-- Create index for profession filtering
CREATE INDEX IF NOT EXISTS idx_fraternity_members_profession_id ON fraternity_members(profession_id);
CREATE INDEX IF NOT EXISTS idx_professions_active ON professions(is_active);
CREATE INDEX IF NOT EXISTS idx_professions_display_order ON professions(display_order);

-- Create trigger to update updated_at timestamp for professions
CREATE OR REPLACE FUNCTION update_professions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_professions_updated_at ON professions;
CREATE TRIGGER update_professions_updated_at 
  BEFORE UPDATE ON professions
  FOR EACH ROW
  EXECUTE FUNCTION update_professions_updated_at();

