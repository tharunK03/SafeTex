-- Manual SQL script to create raw_materials table
-- Run this directly in your Supabase SQL Editor

-- Step 1: Create raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  min_stock_level DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_raw_materials_name ON raw_materials(name);
CREATE INDEX IF NOT EXISTS idx_raw_materials_supplier ON raw_materials(supplier);
CREATE INDEX IF NOT EXISTS idx_raw_materials_status ON raw_materials(status);

-- Step 3: Enable Row Level Security
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
DROP POLICY IF EXISTS "Authenticated users can view raw materials" ON raw_materials;
CREATE POLICY "Authenticated users can view raw materials" ON raw_materials
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage raw materials" ON raw_materials;
CREATE POLICY "Authenticated users can manage raw materials" ON raw_materials
  FOR ALL USING (true);

-- Step 5: Create production_material_requirements table
CREATE TABLE IF NOT EXISTS production_material_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, raw_material_id)
);

-- Step 6: Create indexes for production_material_requirements
CREATE INDEX IF NOT EXISTS idx_production_material_requirements_product_id ON production_material_requirements(product_id);
CREATE INDEX IF NOT EXISTS idx_production_material_requirements_raw_material_id ON production_material_requirements(raw_material_id);

-- Step 7: Enable RLS for production_material_requirements
ALTER TABLE production_material_requirements ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for production_material_requirements
DROP POLICY IF EXISTS "Authenticated users can view production material requirements" ON production_material_requirements;
CREATE POLICY "Authenticated users can view production material requirements" ON production_material_requirements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage production material requirements" ON production_material_requirements;
CREATE POLICY "Authenticated users can manage production material requirements" ON production_material_requirements
  FOR ALL USING (true);

-- Step 9: Insert sample data (optional)
INSERT INTO raw_materials (name, description, current_stock, unit, min_stock_level, cost_per_unit, supplier) VALUES
('Cotton Fabric', 'High quality cotton fabric for t-shirt production', 1000.00, 'meters', 100.00, 25.50, 'Textile Suppliers Ltd'),
('Polyester Thread', 'Strong polyester thread for stitching', 500.00, 'spools', 50.00, 5.75, 'Thread Masters'),
('Zippers', 'Metal zippers for jackets and bags', 200.00, 'pieces', 20.00, 12.00, 'Hardware Supply Co'),
('Buttons', 'Plastic buttons for shirts', 1000.00, 'pieces', 100.00, 0.25, 'Button World'),
('Elastic Band', 'Elastic bands for waistbands', 300.00, 'meters', 30.00, 8.00, 'Elastic Solutions')
ON CONFLICT (id) DO NOTHING;

-- Step 10: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 11: Create triggers
DROP TRIGGER IF EXISTS update_raw_materials_updated_at ON raw_materials;
CREATE TRIGGER update_raw_materials_updated_at
    BEFORE UPDATE ON raw_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_material_requirements_updated_at ON production_material_requirements;
CREATE TRIGGER update_production_material_requirements_updated_at
    BEFORE UPDATE ON production_material_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Add comments
COMMENT ON TABLE raw_materials IS 'Stores information about raw materials used in production';
COMMENT ON TABLE production_material_requirements IS 'Stores material requirements for each product';

-- Verification queries
SELECT 'raw_materials table created successfully' as status;
SELECT COUNT(*) as raw_materials_count FROM raw_materials;
SELECT 'production_material_requirements table created successfully' as status;



