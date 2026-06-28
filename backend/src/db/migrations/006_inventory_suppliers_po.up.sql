-- 006: Inventory, Inventory Transactions, Raw Material Consumption, Suppliers, Purchase Orders

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'RAW_MATERIAL' CHECK (category IN ('RAW_MATERIAL','YARN','CHEMICAL','SPARE_PART','PACKING_MATERIAL','FINISHED_GOODS','OTHER')),
  unit VARCHAR(20) NOT NULL DEFAULT 'KG',
  current_stock NUMERIC(14,3) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(14,3) NOT NULL DEFAULT 0,
  max_stock_level NUMERIC(14,3),
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  warehouse_location VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_reorder ON inventory_items(current_stock, reorder_level);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  txn_type inventory_txn_type NOT NULL,
  quantity NUMERIC(14,3) NOT NULL,
  balance_after NUMERIC(14,3) NOT NULL,
  unit_cost NUMERIC(12,2),
  reference_type VARCHAR(50),
  reference_id UUID,
  notes TEXT,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inv_txn_item ON inventory_transactions(inventory_item_id);
CREATE INDEX idx_inv_txn_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inv_txn_created ON inventory_transactions(created_at);

CREATE TABLE raw_material_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  daily_production_entry_id UUID REFERENCES daily_production_entries(id) ON DELETE SET NULL,
  quantity_consumed NUMERIC(14,3) NOT NULL,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_rmc_production_order ON raw_material_consumptions(production_order_id);
CREATE INDEX idx_rmc_item ON raw_material_consumptions(inventory_item_id);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(150),
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  gst_number VARCHAR(50),
  payment_terms VARCHAR(100),
  rating NUMERIC(3,1) DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status po_status NOT NULL DEFAULT 'DRAFT',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_ordered NUMERIC(14,3) NOT NULL,
  quantity_received NUMERIC(14,3) NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_poi_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_poi_item ON purchase_order_items(inventory_item_id);
