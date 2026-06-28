const { query } = require('../config/db');

const COLUMN_MAP = {
  factoryName: 'factory_name',
  legalName: 'legal_name',
  gstNumber: 'gst_number',
  panNumber: 'pan_number',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  state: 'state',
  country: 'country',
  postalCode: 'postal_code',
  phone: 'phone',
  email: 'email',
  logoUrl: 'logo_url',
  fiscalYearStartMonth: 'fiscal_year_start_month',
  defaultCurrency: 'default_currency',
  workingDaysPerWeek: 'working_days_per_week',
  shiftConfig: 'shift_config',
  electricityRatePerUnit: 'electricity_rate_per_unit',
  waterRatePerUnit: 'water_rate_per_unit',
};

async function get() {
  const { rows } = await query('SELECT * FROM factory_settings ORDER BY created_at ASC LIMIT 1');
  return rows[0] || null;
}

async function createDefault() {
  const { rows } = await query(
    `INSERT INTO factory_settings (factory_name) VALUES ('My Textile Factory') RETURNING *`
  );
  return rows[0];
}

async function update(id, data) {
  const fields = [];
  const params = [];
  for (const [key, col] of Object.entries(COLUMN_MAP)) {
    if (data[key] !== undefined) {
      params.push(col === 'shift_config' ? JSON.stringify(data[key]) : data[key]);
      fields.push(`${col} = $${params.length}`);
    }
  }
  if (!fields.length) return get();
  fields.push('updated_at = NOW()');
  params.push(id);
  const { rows } = await query(`UPDATE factory_settings SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
  return rows[0];
}

module.exports = { get, createDefault, update };
