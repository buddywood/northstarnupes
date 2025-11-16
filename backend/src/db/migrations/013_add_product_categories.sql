-- Migration: Add product categories table and category_id to products
-- Date: Add product categorization system
-- 
-- This migration creates a product_categories table and adds category_id to products

DO $$
BEGIN
  -- Create product_categories table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_categories') THEN
    CREATE TABLE product_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    RAISE NOTICE 'Created product_categories table';
  END IF;

  -- Add category_id to products table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='products' AND column_name='category_id') THEN
    ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES product_categories(id);
    RAISE NOTICE 'Added category_id column to products table';
  END IF;

  -- Create index for category_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_category') THEN
    CREATE INDEX idx_products_category ON products(category_id);
    RAISE NOTICE 'Created index idx_products_category';
  END IF;

  -- Insert categories if they don't exist
  INSERT INTO product_categories (name, display_order) VALUES
    ('Apparel', 1),
    ('Outerwear', 2),
    ('Footwear', 3),
    ('Accessories', 4),
    ('Electronics', 5),
    ('Home Goods', 6),
    ('Art & Prints', 7),
    ('Books & Media', 8),
    ('Heritage / Legacy Item', 9),
    ('Cigar Lounge Essentials', 10)
  ON CONFLICT (name) DO NOTHING;

  RAISE NOTICE 'Inserted product categories';

END $$;

