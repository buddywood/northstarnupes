-- Migration: Update dress_code_type to dress_codes (array) for multiple selections
-- Date: Allow multiple dress codes per event
--
-- This migration changes dress_code_type from a single value to dress_codes as a JSONB array

DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'events' AND constraint_name = 'events_dress_code_type_check'
  ) THEN
    ALTER TABLE events DROP CONSTRAINT events_dress_code_type_check;
    RAISE NOTICE 'Dropped old dress_code_type constraint';
  END IF;

  -- Handle dress_code_type column: rename to dress_codes if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='events' AND column_name='dress_code_type') THEN
    -- Drop the default first to avoid type conflicts
    ALTER TABLE events ALTER COLUMN dress_code_type DROP DEFAULT;
    RAISE NOTICE 'Dropped default from dress_code_type';
    
    -- Convert existing single value to array
    ALTER TABLE events 
      ALTER COLUMN dress_code_type TYPE JSONB 
      USING jsonb_build_array(dress_code_type);
    
    -- If dress_codes already exists, drop it first (shouldn't happen, but be safe)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='events' AND column_name='dress_codes') THEN
      ALTER TABLE events DROP COLUMN dress_codes;
      RAISE NOTICE 'Dropped existing dress_codes column before rename';
    END IF;
    
    -- Rename the column
    ALTER TABLE events RENAME COLUMN dress_code_type TO dress_codes;
    RAISE NOTICE 'Renamed dress_code_type to dress_codes and converted to array';
    
    -- Set new default
    ALTER TABLE events ALTER COLUMN dress_codes SET DEFAULT '["business_casual"]'::jsonb;
    RAISE NOTICE 'Set default for dress_codes column';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name='events' AND column_name='dress_codes') THEN
    -- Add dress_codes column if neither dress_code_type nor dress_codes exists
    ALTER TABLE events ADD COLUMN dress_codes JSONB NOT NULL DEFAULT '["business_casual"]'::jsonb;
    RAISE NOTICE 'Added dress_codes column to events table';
  END IF;
  
  -- Final cleanup: ensure dress_code_type is completely removed
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='events' AND column_name='dress_code_type') THEN
    -- Drop any remaining constraints
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'events' AND constraint_name = 'events_dress_code_type_check'
    ) THEN
      ALTER TABLE events DROP CONSTRAINT events_dress_code_type_check;
      RAISE NOTICE 'Dropped remaining dress_code_type constraint';
    END IF;
    
    -- Drop the column
    ALTER TABLE events DROP COLUMN dress_code_type;
    RAISE NOTICE 'Dropped remaining dress_code_type column';
  END IF;

  -- Add check constraint for valid dress code enum values in array
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'events' AND constraint_name = 'events_dress_codes_check'
  ) THEN
    ALTER TABLE events ADD CONSTRAINT events_dress_codes_check
      CHECK (
        jsonb_typeof(dress_codes) = 'array' AND
        dress_codes <@ '["business", "business_casual", "formal", "semi_formal", "kappa_casual", "greek_encouraged", "greek_required", "outdoor", "athletic", "comfortable", "all_white"]'::jsonb
      );
    RAISE NOTICE 'Added dress_codes check constraint';
  END IF;
END $$;

