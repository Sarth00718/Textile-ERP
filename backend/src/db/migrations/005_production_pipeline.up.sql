-- 005: Fabric Design, Production Planning, Work Orders, Production Orders, Daily Production Entry, Fabric Rolls

CREATE TABLE fabric_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  fabric_type VARCHAR(100) NOT NULL,
  width_inches NUMERIC(7,2),
  weight_gsm NUMERIC(7,2),
  warp_yarn_count VARCHAR(50),
  weft_yarn_count VARCHAR(50),
  weave_pattern VARCHAR(100),
  color VARCHAR(50),
  image_url VARCHAR(500),
  standard_rate NUMERIC(12,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_fabric_designs_type ON fabric_designs(fabric_type);

CREATE TABLE production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code VARCHAR(50) NOT NULL UNIQUE,
  fabric_design_id UUID NOT NULL REFERENCES fabric_designs(id) ON DELETE RESTRICT,
  planned_quantity_meters NUMERIC(12,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  CHECK (end_date >= start_date)
);

CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_no VARCHAR(50) NOT NULL UNIQUE,
  production_plan_id UUID REFERENCES production_plans(id) ON DELETE SET NULL,
  fabric_design_id UUID NOT NULL REFERENCES fabric_designs(id) ON DELETE RESTRICT,
  sales_order_id UUID,
  target_quantity_meters NUMERIC(12,2) NOT NULL,
  status work_order_status NOT NULL DEFAULT 'DRAFT',
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_work_orders_status ON work_orders(status);

CREATE TABLE production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_no VARCHAR(50) NOT NULL UNIQUE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  beam_id UUID REFERENCES beams(id) ON DELETE SET NULL,
  target_quantity_meters NUMERIC(12,2) NOT NULL,
  produced_quantity_meters NUMERIC(12,2) NOT NULL DEFAULT 0,
  status production_order_status NOT NULL DEFAULT 'PENDING',
  assigned_operator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_production_orders_status ON production_orders(status);
CREATE INDEX idx_production_orders_machine ON production_orders(machine_id);
CREATE INDEX idx_production_orders_wo ON production_orders(work_order_id);

CREATE TABLE daily_production_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE RESTRICT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_name VARCHAR(50) NOT NULL DEFAULT 'DAY',
  operator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  quantity_produced_meters NUMERIC(12,2) NOT NULL,
  quantity_rejected_meters NUMERIC(12,2) NOT NULL DEFAULT 0,
  yarn_consumed_kg NUMERIC(12,2) DEFAULT 0,
  machine_runtime_minutes INTEGER DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_dpe_production_order ON daily_production_entries(production_order_id);
CREATE INDEX idx_dpe_date ON daily_production_entries(entry_date);
CREATE INDEX idx_dpe_machine ON daily_production_entries(machine_id);

CREATE TABLE fabric_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_no VARCHAR(50) NOT NULL UNIQUE,
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  daily_production_entry_id UUID REFERENCES daily_production_entries(id) ON DELETE SET NULL,
  fabric_design_id UUID NOT NULL REFERENCES fabric_designs(id) ON DELETE RESTRICT,
  length_meters NUMERIC(10,2) NOT NULL,
  weight_kg NUMERIC(10,2),
  status roll_status NOT NULL DEFAULT 'PRODUCED',
  warehouse_location VARCHAR(100),
  produced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_fabric_rolls_status ON fabric_rolls(status);
CREATE INDEX idx_fabric_rolls_po ON fabric_rolls(production_order_id);
