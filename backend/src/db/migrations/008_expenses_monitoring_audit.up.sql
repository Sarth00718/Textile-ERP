-- 008: Expense Management, Electricity/Water Monitoring, Worker Productivity, Waste Management, Notifications, Audit Logs

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_no VARCHAR(50) NOT NULL UNIQUE,
  category expense_category NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
  receipt_url VARCHAR(500),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

CREATE TABLE electricity_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_date DATE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  meter_reading NUMERIC(14,2) NOT NULL,
  units_consumed NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_electricity_date ON electricity_readings(reading_date);

CREATE TABLE water_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_date DATE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  meter_reading NUMERIC(14,2) NOT NULL,
  units_consumed NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_water_date ON water_readings(reading_date);

CREATE TABLE worker_productivity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  production_date DATE NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  quantity_produced_meters NUMERIC(12,2) NOT NULL DEFAULT 0,
  hours_worked NUMERIC(5,2) NOT NULL DEFAULT 0,
  efficiency_percent NUMERIC(5,2) DEFAULT 0,
  defect_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, production_date, machine_id)
);
CREATE INDEX idx_worker_prod_date ON worker_productivity(production_date);
CREATE INDEX idx_worker_prod_employee ON worker_productivity(employee_id);

CREATE TABLE waste_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
  waste_type waste_type NOT NULL,
  source_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  production_order_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
  quantity_kg NUMERIC(12,2) NOT NULL,
  disposal_method VARCHAR(100),
  recovery_value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_waste_date ON waste_records(waste_date);
CREATE INDEX idx_waste_type ON waste_records(waste_type);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity notification_severity NOT NULL DEFAULT 'INFO',
  module VARCHAR(50),
  reference_type VARCHAR(50),
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(64),
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
