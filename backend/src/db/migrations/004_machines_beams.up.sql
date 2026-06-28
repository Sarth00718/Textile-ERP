-- 004: Machine Management, Machine Logs, Breakdown, Maintenance, Beam Management, Beam Allocation

CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  machine_type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(150),
  model_number VARCHAR(100),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  installation_date DATE,
  rated_speed NUMERIC(10,2),
  rated_power_kw NUMERIC(10,2),
  status machine_status NOT NULL DEFAULT 'IDLE',
  current_operator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location VARCHAR(150),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_machines_department ON machines(department_id);

CREATE TABLE machine_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  event_type machine_log_event NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  shift_name VARCHAR(50),
  meter_reading NUMERIC(14,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_machine_logs_machine ON machine_logs(machine_id);
CREATE INDEX idx_machine_logs_event_time ON machine_logs(event_time);

CREATE TABLE machine_breakdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issue_description TEXT NOT NULL,
  status breakdown_status NOT NULL DEFAULT 'OPEN',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  downtime_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_breakdowns_machine ON machine_breakdowns(machine_id);
CREATE INDEX idx_breakdowns_status ON machine_breakdowns(status);

CREATE TABLE machine_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  maintenance_type maintenance_type NOT NULL DEFAULT 'PREVENTIVE',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status maintenance_status NOT NULL DEFAULT 'SCHEDULED',
  performed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  cost NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  parts_replaced TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_maintenance_machine ON machine_maintenance(machine_id);
CREATE INDEX idx_maintenance_status ON machine_maintenance(status);

CREATE TABLE beams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beam_code VARCHAR(50) NOT NULL UNIQUE,
  beam_type VARCHAR(50) NOT NULL DEFAULT 'WARP',
  yarn_count VARCHAR(50),
  total_ends INTEGER,
  length_meters NUMERIC(10,2),
  status beam_status NOT NULL DEFAULT 'IN_STOCK',
  current_machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_beams_status ON beams(status);

CREATE TABLE beam_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beam_id UUID NOT NULL REFERENCES beams(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  allocated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  released_at TIMESTAMPTZ,
  meters_used NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_beam_alloc_beam ON beam_allocations(beam_id);
CREATE INDEX idx_beam_alloc_machine ON beam_allocations(machine_id);
CREATE INDEX idx_beam_alloc_active ON beam_allocations(is_active);
