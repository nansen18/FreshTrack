-- Add nutritional data columns to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS calories NUMERIC,
ADD COLUMN IF NOT EXISTS sugar NUMERIC,
ADD COLUMN IF NOT EXISTS protein NUMERIC,
ADD COLUMN IF NOT EXISTS fat NUMERIC,
ADD COLUMN IF NOT EXISTS fiber NUMERIC,
ADD COLUMN IF NOT EXISTS carbohydrates NUMERIC,
ADD COLUMN IF NOT EXISTS sodium NUMERIC,
ADD COLUMN IF NOT EXISTS nutrition_score TEXT,
ADD COLUMN IF NOT EXISTS health_score TEXT,
ADD COLUMN IF NOT EXISTS ai_feedback TEXT,
ADD COLUMN IF NOT EXISTS nutrition_data JSONB;

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);

-- Create index on nutrition_score for filtering
CREATE INDEX IF NOT EXISTS idx_items_nutrition_score ON items(nutrition_score);