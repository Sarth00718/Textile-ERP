-- 002: Factory Settings, Departments, Users (Auth), Employees

CREATE TABLE factory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  postal_code VARCHAR(20),
  phone VARCHAR(30),
  email VARCHAR(150),
  logo_url VARCHAR(500),
  fiscal_year_start_month SMALLINT NOT NULL DEFAULT 4 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  default_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  working_days_per_week SMALLINT NOT NULL DEFAULT 6,
  shift_config JSONB NOT NULL DEFAULT '[]',
  electricity_rate_per_unit NUMERIC(10,2) DEFAULT 8.00,
  water_rate_per_unit NUMERIC(10,2) DEFAULT 0.05,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(30) NOT NULL UNIQUE,
  description TEXT,
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(50) UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'WORKER',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  avatar_url VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent VARCHAR(255),
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  employee_code VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  gender VARCHAR(20),
  date_of_birth DATE,
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  designation VARCHAR(100),
  date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
  date_of_leaving DATE,
  employment_status employment_status NOT NULL DEFAULT 'ACTIVE',
  salary_type VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK (salary_type IN ('MONTHLY','DAILY','PIECE_RATE')),
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  piece_rate NUMERIC(12,2),
  bank_account_number VARCHAR(50),
  bank_ifsc VARCHAR(20),
  emergency_contact_name VARCHAR(150),
  emergency_contact_phone VARCHAR(30),
  photo_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_code ON employees(employee_code);
