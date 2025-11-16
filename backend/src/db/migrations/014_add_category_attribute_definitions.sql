-- Migration: Add category attribute definitions and product attribute values
-- Date: Add flexible attribute system for category-specific product attributes
-- 
-- This migration creates tables to define which attributes belong to each category
-- and stores the actual attribute values for each product

DO $$
BEGIN
  -- Create category_attribute_definitions table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_attribute_definitions') THEN
    CREATE TABLE category_attribute_definitions (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
      attribute_name VARCHAR(100) NOT NULL,
      attribute_type VARCHAR(50) NOT NULL CHECK (attribute_type IN ('TEXT', 'SELECT', 'NUMBER', 'BOOLEAN')),
      is_required BOOLEAN DEFAULT false,
      display_order INTEGER NOT NULL DEFAULT 0,
      options JSONB, -- For SELECT type: ["Small", "Medium", "Large"]
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category_id, attribute_name)
    );
    
    RAISE NOTICE 'Created category_attribute_definitions table';
  END IF;

  -- Create product_attribute_values table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_attribute_values') THEN
    CREATE TABLE product_attribute_values (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      attribute_definition_id INTEGER NOT NULL REFERENCES category_attribute_definitions(id) ON DELETE CASCADE,
      value_text TEXT,
      value_number NUMERIC,
      value_boolean BOOLEAN,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, attribute_definition_id)
    );
    
    RAISE NOTICE 'Created product_attribute_values table';
  END IF;

  -- Create indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_category_attr_def_category') THEN
    CREATE INDEX idx_category_attr_def_category ON category_attribute_definitions(category_id);
    RAISE NOTICE 'Created index idx_category_attr_def_category';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_attr_values_product') THEN
    CREATE INDEX idx_product_attr_values_product ON product_attribute_values(product_id);
    RAISE NOTICE 'Created index idx_product_attr_values_product';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_attr_values_definition') THEN
    CREATE INDEX idx_product_attr_values_definition ON product_attribute_values(attribute_definition_id);
    RAISE NOTICE 'Created index idx_product_attr_values_definition';
  END IF;

  -- Insert attribute definitions for categories
  -- Note: We'll use category IDs, but since they're auto-generated, we'll use subqueries
  
  -- Apparel attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Size', 'SELECT', true, 1, '["XS", "S", "M", "L", "XL", "2XL", "3XL"]'::jsonb
  FROM product_categories WHERE name = 'Apparel'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', true, 2, '["Black", "White", "Navy", "Red", "Crimson", "Cream", "Gray", "Other"]'::jsonb
  FROM product_categories WHERE name = 'Apparel'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Material', 'TEXT', false, 3
  FROM product_categories WHERE name = 'Apparel'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Outerwear attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Size', 'SELECT', true, 1, '["XS", "S", "M", "L", "XL", "2XL", "3XL"]'::jsonb
  FROM product_categories WHERE name = 'Outerwear'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', true, 2, '["Black", "Navy", "Brown", "Gray", "Camel", "Other"]'::jsonb
  FROM product_categories WHERE name = 'Outerwear'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Footwear attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Size', 'SELECT', true, 1, '["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"]'::jsonb
  FROM product_categories WHERE name = 'Footwear'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', true, 2, '["Black", "Brown", "Tan", "White", "Other"]'::jsonb
  FROM product_categories WHERE name = 'Footwear'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Width', 'SELECT', false, 3, '["Narrow", "Medium", "Wide", "Extra Wide"]'::jsonb
  FROM product_categories WHERE name = 'Footwear'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Accessories attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', false, 1, '["Black", "White", "Navy", "Brown", "Tan", "Gold", "Silver", "Brass", "Other"]'::jsonb
  FROM product_categories WHERE name = 'Accessories'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Material', 'TEXT', false, 2
  FROM product_categories WHERE name = 'Accessories'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Electronics attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Model', 'TEXT', false, 1
  FROM product_categories WHERE name = 'Electronics'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Storage Capacity', 'SELECT', false, 2, '["64GB", "128GB", "256GB", "512GB", "1TB"]'::jsonb
  FROM product_categories WHERE name = 'Electronics'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', false, 3, '["Space Gray", "Silver", "Gold", "Black", "White"]'::jsonb
  FROM product_categories WHERE name = 'Electronics'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Home Goods attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Dimensions', 'TEXT', false, 1
  FROM product_categories WHERE name = 'Home Goods'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', false, 2, '["Black", "White", "Brown", "Gray", "Cream", "Other"]'::jsonb
  FROM product_categories WHERE name = 'Home Goods'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Material', 'TEXT', false, 3
  FROM product_categories WHERE name = 'Home Goods'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Art & Prints attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Dimensions', 'TEXT', false, 1
  FROM product_categories WHERE name = 'Art & Prints'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Medium', 'TEXT', false, 2
  FROM product_categories WHERE name = 'Art & Prints'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Frame Included', 'BOOLEAN', false, 3
  FROM product_categories WHERE name = 'Art & Prints'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Books & Media attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Dimensions', 'TEXT', false, 1
  FROM product_categories WHERE name = 'Books & Media'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Medium', 'TEXT', false, 2
  FROM product_categories WHERE name = 'Books & Media'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  -- Cigar Lounge Essentials attributes
  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order)
  SELECT id, 'Material', 'TEXT', false, 1
  FROM product_categories WHERE name = 'Cigar Lounge Essentials'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  INSERT INTO category_attribute_definitions (category_id, attribute_name, attribute_type, is_required, display_order, options)
  SELECT id, 'Color', 'SELECT', false, 2, '["Black", "Brown", "Tan", "Leather", "Other"]'::jsonb
  FROM product_categories WHERE name = 'Cigar Lounge Essentials'
  ON CONFLICT (category_id, attribute_name) DO NOTHING;

  RAISE NOTICE 'Inserted category attribute definitions';

END $$;

