-- Migration: Update promoters table structure
-- Date: Initial migration
-- Removes member-specific fields, adds member_id foreign key, adds verification fields
DO $$
BEGIN
  -- Only run these ALTER statements if the promoters table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='promoters') THEN
    -- Drop index on initiated_chapter_id before dropping the column
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'promoters' AND indexname = 'idx_promoters_initiated_chapter') THEN
      DROP INDEX IF EXISTS idx_promoters_initiated_chapter;
    END IF;

    -- Drop membership_number and initiated_chapter_id columns
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='membership_number') THEN
      ALTER TABLE promoters DROP COLUMN membership_number;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='initiated_chapter_id') THEN
      ALTER TABLE promoters DROP COLUMN initiated_chapter_id;
    END IF;

    -- Add member_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='promoters' AND column_name='member_id') THEN
      ALTER TABLE promoters ADD COLUMN member_id INTEGER REFERENCES members(id);
      CREATE INDEX IF NOT EXISTS idx_promoters_member_id ON promoters(member_id);
    END IF;

    -- Drop member-specific columns from promoters if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='location') THEN
      ALTER TABLE promoters DROP COLUMN location;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='initiated_season') THEN
      ALTER TABLE promoters DROP COLUMN initiated_season;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='initiated_year') THEN
      ALTER TABLE promoters DROP COLUMN initiated_year;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='ship_name') THEN
      ALTER TABLE promoters DROP COLUMN ship_name;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='line_name') THEN
      ALTER TABLE promoters DROP COLUMN line_name;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='address') THEN
      ALTER TABLE promoters DROP COLUMN address;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='address_is_private') THEN
      ALTER TABLE promoters DROP COLUMN address_is_private;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='phone_number') THEN
      ALTER TABLE promoters DROP COLUMN phone_number;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='phone_is_private') THEN
      ALTER TABLE promoters DROP COLUMN phone_is_private;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='industry') THEN
      ALTER TABLE promoters DROP COLUMN industry;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='job_title') THEN
      ALTER TABLE promoters DROP COLUMN job_title;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='promoters' AND column_name='bio') THEN
      ALTER TABLE promoters DROP COLUMN bio;
    END IF;
  END IF;
END $$;

