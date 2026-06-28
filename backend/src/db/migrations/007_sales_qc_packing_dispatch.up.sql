-- 007: Customers, Sales Orders, Quality Control, Packing, Dispatch, Vehicle Management

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150),
  phone VARCHAR(30),
  email VARCHAR(150),
  billing_address TEXT,
  shipping_address TEXT,
  gst_number VARCHAR(50),
  credit_limit NUMERIC(14,2) DEFAULT 0,
  payment_terms VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  so_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_by_date DATE,
  status so_status NOT NULL DEFAULT 'DRAFT',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_so_status ON sales_orders(status);

CREATE TABLE sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  fabric_design_id UUID NOT NULL REFERENCES fabric_designs(id) ON DELETE RESTRICT,
  quantity_meters NUMERIC(12,2) NOT NULL,
  quantity_dispatched_meters NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_soi_so ON sales_order_items(sales_order_id);

ALTER TABLE work_orders
  ADD CONSTRAINT fk_work_orders_sales_order
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL;

CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_roll_id UUID NOT NULL REFERENCES fabric_rolls(id) ON DELETE CASCADE,
  inspected_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result qc_result NOT NULL DEFAULT 'PENDING',
  defect_type VARCHAR(100),
  defect_points INTEGER DEFAULT 0,
  grade VARCHAR(10),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qc_roll ON quality_inspections(fabric_roll_id);
CREATE INDEX idx_qc_result ON quality_inspections(result);

CREATE TABLE packing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_no VARCHAR(50) NOT NULL UNIQUE,
  fabric_roll_id UUID NOT NULL REFERENCES fabric_rolls(id) ON DELETE CASCADE,
  packed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  packed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  package_weight_kg NUMERIC(10,2),
  package_type VARCHAR(50) DEFAULT 'ROLL_BAG',
  status packing_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_packing_roll ON packing_records(fabric_roll_id);
CREATE INDEX idx_packing_status ON packing_records(status);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number VARCHAR(50) NOT NULL UNIQUE,
  vehicle_type VARCHAR(50),
  driver_name VARCHAR(150),
  driver_phone VARCHAR(30),
  capacity_kg NUMERIC(10,2),
  status vehicle_status NOT NULL DEFAULT 'AVAILABLE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_no VARCHAR(50) NOT NULL UNIQUE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status dispatch_status NOT NULL DEFAULT 'PENDING',
  delivered_at TIMESTAMPTZ,
  total_weight_kg NUMERIC(12,2),
  total_packages INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_dispatch_so ON dispatches(sales_order_id);
CREATE INDEX idx_dispatch_status ON dispatches(status);

CREATE TABLE dispatch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatches(id) ON DELETE CASCADE,
  packing_record_id UUID NOT NULL REFERENCES packing_records(id) ON DELETE RESTRICT,
  fabric_roll_id UUID NOT NULL REFERENCES fabric_rolls(id) ON DELETE RESTRICT,
  quantity_meters NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_dispatch_items_dispatch ON dispatch_items(dispatch_id);
