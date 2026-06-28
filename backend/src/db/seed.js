/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({ connectionString: env.db.connectionString, ssl: env.db.ssl });

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding factory settings...');
    await client.query(`
      INSERT INTO factory_settings (factory_name, legal_name, default_currency, fiscal_year_start_month, working_days_per_week)
      SELECT 'Shivay Textiles', 'Shivay Textiles Pvt Ltd', 'INR', 4, 6
      WHERE NOT EXISTS (SELECT 1 FROM factory_settings)
    `);

    console.log('Seeding departments...');
    const departments = [
      ['Weaving', 'WVG'],
      ['Spinning', 'SPN'],
      ['Quality Control', 'QC'],
      ['Warehouse', 'WH'],
      ['Dispatch', 'DSP'],
      ['Maintenance', 'MNT'],
      ['Administration', 'ADM'],
      ['Dyeing', 'DYE'],
      ['Finishing', 'FIN'],
      ['Procurement', 'PRC'],
    ];
    const deptIds = {};
    for (const [name, code] of departments) {
      const checkRes = await client.query(
        'SELECT id FROM departments WHERE code = $1',
        [code]
      );
      if (checkRes.rows.length > 0) {
        const id = checkRes.rows[0].id;
        await client.query(
          'UPDATE departments SET name = $1 WHERE id = $2',
          [name, id]
        );
        deptIds[code] = id;
      } else {
        const insertRes = await client.query(
          'INSERT INTO departments (name, code) VALUES ($1, $2) RETURNING id',
          [name, code]
        );
        deptIds[code] = insertRes.rows[0].id;
      }
    }

    console.log('Seeding users (owner + demo users)...');
    const passwords = {
      owner: await bcrypt.hash('Owner@12345', 12),
      demo: await bcrypt.hash('Demo@12345', 12),
    };

    const users = [
      ['Factory Owner', 'owner@textileerp.com', 'OWNER', deptIds.ADM],
      ['Factory Manager', 'manager@textileerp.com', 'MANAGER', deptIds.ADM],
      ['Weaving Supervisor', 'supervisor@textileerp.com', 'SUPERVISOR', deptIds.WVG],
      ['Accounts Lead', 'accountant@textileerp.com', 'ACCOUNTANT', deptIds.ADM],
      ['Loom Operator', 'worker@textileerp.com', 'WORKER', deptIds.WVG],
      ['Dye Master', 'dyemaster@textileerp.com', 'SUPERVISOR', deptIds.DYE],
      ['Finishing Lead', 'finishing@textileerp.com', 'SUPERVISOR', deptIds.FIN],
      ['Procurement Officer', 'procure@textileerp.com', 'WORKER', deptIds.PRC],
      ['HR Manager', 'hr@textileerp.com', 'MANAGER', deptIds.ADM],
      ['Warehouse Executive', 'warehouse@textileerp.com', 'WORKER', deptIds.WH],
    ];
    for (const [name, email, role, deptId] of users) {
      const hash = email === 'owner@textileerp.com' ? passwords.owner : passwords.demo;
      await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, department_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [name, email, hash, role, deptId]
      );
    }

    console.log('Seeding inventory items...');
    const items = [
      ['RM-COTYARN-30', 'Cotton Yarn 30s', 'YARN', 'KG', 500, 100, 250],
      ['RM-POLYYARN-40', 'Polyester Yarn 40s', 'YARN', 'KG', 300, 80, 220],
      ['CHM-DYE-BLUE', 'Reactive Dye - Blue', 'CHEMICAL', 'KG', 50, 10, 450],
      ['PKG-ROLLBAG', 'Fabric Roll Packing Bag', 'PACKING_MATERIAL', 'PCS', 1000, 200, 12],
      ['RM-COTYARN-20', 'Cotton Yarn 20s', 'YARN', 'KG', 800, 200, 200],
      ['RM-SILKYARN-50', 'Silk Yarn 50s', 'YARN', 'KG', 120, 30, 1200],
      ['CHM-ALKA', 'Alkali Chemical', 'CHEMICAL', 'KG', 200, 50, 80],
      ['PKG-TAPE', 'Packing Tape', 'PACKING_MATERIAL', 'PCS', 2000, 500, 5],
      ['RM-POLYFILL', 'Polyester Filling', 'YARN', 'KG', 400, 100, 180],
      ['RM-BLEND-10', 'Blend Yarn 10s', 'YARN', 'KG', 350, 80, 210],
    ];
    for (const [code, name, category, unit, stock, reorder, cost] of items) {
      await client.query(
        `INSERT INTO inventory_items (item_code, name, category, unit, current_stock, reorder_level, unit_cost)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (item_code) DO NOTHING`,
        [code, name, category, unit, stock, reorder, cost]
      );
    }

    console.log('Seeding machines...');
    const machines = [
      ['LOOM-001', 'Air Jet Loom 1', 'AIR_JET_LOOM', deptIds.WVG],
      ['LOOM-002', 'Air Jet Loom 2', 'AIR_JET_LOOM', deptIds.WVG],
      ['LOOM-003', 'Rapier Loom 1', 'RAPIER_LOOM', deptIds.WVG],
      ['LOOM-004', 'Rapier Loom 2', 'RAPIER_LOOM', deptIds.WVG],
      ['SPN-001', 'Spinning Frame 1', 'SPINNING_FRAME', deptIds.SPN],
      ['SPN-002', 'Spinning Frame 2', 'SPINNING_FRAME', deptIds.SPN],
      ['DYE-001', 'Dye Machine 1', 'DYE_MACHINE', deptIds.DYE],
      ['FIN-001', 'Finishing Stenter', 'FINISHER', deptIds.FIN],
      ['PKG-001', 'Packing Station 1', 'PACKING', deptIds.WH],
      ['MNT-001', 'Compressor 1', 'UTILITY', deptIds.MNT],
    ];
    for (const [code, name, type, deptId] of machines) {
      await client.query(
        `INSERT INTO machines (machine_code, name, machine_type, department_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (machine_code) DO NOTHING`,
        [code, name, type, deptId]
      );
    }

    console.log('Seeding fabric designs...');
    const fabricDesigns = [
      ['FD-001', 'Plain Cotton Poplin', 'POPLIN', 58, 120, '30s', '30s', 85.0],
      ['FD-002', 'Twill Cotton', 'TWILL', 60, 150, '20s', '30s', 95.0],
      ['FD-003', 'Satin Weave', 'SATIN', 56, 180, '40s', '40s', 120.0],
      ['FD-004', 'Denim', 'DENIM', 62, 320, '10s', '12s', 220.0],
      ['FD-005', 'Voile', 'VOILE', 44, 80, '40s', '50s', 70.0],
      ['FD-006', 'Poplin Stripe', 'POPLIN', 58, 130, '30s', '30s', 90.0],
      ['FD-007', 'Canvas', 'CANVAS', 64, 340, '8s', '8s', 250.0],
      ['FD-008', 'Linen Blend', 'LINEN', 57, 160, '28s', '30s', 140.0],
      ['FD-009', 'Silk Blend', 'SILK', 54, 90, '50s', '50s', 320.0],
      ['FD-010', 'Jacquard', 'JACQUARD', 60, 200, '30s', '30s', 180.0],
    ];
    for (const [code, name, ftype, width, weight, warp, weft, rate] of fabricDesigns) {
      await client.query(
        `INSERT INTO fabric_designs (design_code, name, fabric_type, width_inches, weight_gsm, warp_yarn_count, weft_yarn_count, standard_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (design_code) DO NOTHING`,
        [code, name, ftype, width, weight, warp, weft, rate]
      );
    }

    // --- Additional module seeding ---
    console.log('Seeding suppliers and customers...');
    const suppliers = [
      ['SUP-001', 'Global Textile Suppliers', 'Mr. Rao', '9999999999', 'supplier1@textile.com', '123 Supplier St'],
      ['SUP-002', 'Local Yarn Traders', 'Ms. Singh', '9881112222', 'supplier2@textile.com', '22 Yarn Lane'],
      ['SUP-003', 'Chemical House', 'Mr. Iyer', '9773334444', 'chem@suppliers.com', '45 Chem Rd'],
      ['SUP-004', 'Packing Goods Co', 'Ms. Jain', '9665556666', 'pack@suppliers.com', '12 Pack St'],
      ['SUP-005', 'Silk Source', 'Mr. Roy', '9557778888', 'silk@suppliers.com', '33 Silk Ave'],
      ['SUP-006', 'Blend Yarns Ltd', 'Mr. Das', '9441112222', 'blend@suppliers.com', '7 Blend Blvd'],
      ['SUP-007', 'Dye Suppliers Inc', 'Ms. Mehta', '9333334444', 'dye@suppliers.com', '9 Dye Park'],
      ['SUP-008', 'Industrial Machines', 'Mr. Kumar', '9222223333', 'machines@suppliers.com', '88 Machine Rd'],
      ['SUP-009', 'Packaging Solutions', 'Ms. Kapoor', '9110002222', 'pack2@suppliers.com', '66 Pack Plaza'],
      ['SUP-010', 'Utility Supplies', 'Mr. Bose', '9009998888', 'util@suppliers.com', '21 Utility St'],
    ];
    for (const [code, name, contact, phone, email, addr] of suppliers) {
      await client.query(
        `INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (supplier_code) DO NOTHING`,
        [code, name, contact, phone, email, addr]
      );
    }
    const { rows: supAll } = await client.query("SELECT id, supplier_code FROM suppliers WHERE supplier_code LIKE 'SUP-%' ORDER BY supplier_code LIMIT 1");
    const supplierId = supAll[0]?.id;

    const customers = [
      ['CUST-001', 'Retail Buyer Ltd', 'Ms. Patel', '9888888888', 'customer1@retail.com', '456 Customer Rd'],
      ['CUST-002', 'Wholesale Traders', 'Mr. Verma', '9777776666', 'cust2@retail.com', '99 Wholesale St'],
      ['CUST-003', 'Export Exports', 'Ms. Rao', '9666665555', 'export@retail.com', '7 Export Ave'],
      ['CUST-004', 'Boutique House', 'Mr. Roy', '9555554444', 'boutique@retail.com', '33 Boutique Rd'],
      ['CUST-005', 'Online Retailer', 'Ms. Kaur', '9444443333', 'online@retail.com', '11 Ecom Ln'],
      ['CUST-006', 'Fabric Warehouse', 'Mr. Sen', '9333332222', 'warehouse@retail.com', '22 Store St'],
      ['CUST-007', 'Design Studio', 'Ms. Iyer', '9222221111', 'design@retail.com', '88 Design Park'],
      ['CUST-008', 'Chain Retailer', 'Mr. Nair', '9111110000', 'chain@retail.com', '66 Chain Blvd'],
      ['CUST-009', 'Private Label', 'Ms. Thomas', '9000009999', 'priv@retail.com', '44 Private Ave'],
      ['CUST-010', 'Bulk Buyer Co', 'Mr. Sharma', '8999998888', 'bulk@retail.com', '55 Bulk Rd'],
    ];
    for (const [code, name, contact, phone, email, addr] of customers) {
      await client.query(
        `INSERT INTO customers (customer_code, name, contact_person, phone, email, billing_address)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (customer_code) DO NOTHING`,
        [code, name, contact, phone, email, addr]
      );
    }
    const { rows: custAll } = await client.query("SELECT id, customer_code FROM customers WHERE customer_code LIKE 'CUST-%' ORDER BY customer_code LIMIT 1");
    const customerId = custAll[0]?.id;

    console.log('Seeding employees linked to users...');
    const { rows: userRows } = await client.query("SELECT id, full_name, email, department_id FROM users WHERE email LIKE '%@textileerp.com'");
    let empCount = 1;
    for (const u of userRows) {
      const empCode = (u.full_name || 'EMP').replace(/\s+/g, '').toUpperCase().slice(0,10) + empCount;
      await client.query(
        `INSERT INTO employees (user_id, employee_code, full_name, phone, email, department_id, designation, base_salary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (employee_code) DO NOTHING`,
        [u.id, empCode, u.full_name, null, u.email, u.department_id, 'Staff', 20000 + empCount * 1000]
      );
      empCount += 1;
    }

    console.log('Seeding purchase orders...');
    const invRows = await client.query('SELECT id FROM inventory_items LIMIT 10');
    const invIds = invRows.rows.map((r) => r.id);
    for (let i = 1; i <= 8; i++) {
      const poNumber = `PO-${String(i).padStart(3,'0')}`;
      const supplier = (await client.query('SELECT id FROM suppliers ORDER BY id OFFSET $1 LIMIT 1', [(i - 1) % 10])).rows[0];
      const supplierRef = supplier ? supplier.id : supplierId;
      await client.query(
        `INSERT INTO purchase_orders (po_number, supplier_id, order_date, status, subtotal, tax_amount, total_amount)
         VALUES ($1, $2, CURRENT_DATE - ($3 || 0)::int, 'SENT', $4, $5, $6)
         ON CONFLICT (po_number) DO NOTHING`,
        [poNumber, supplierRef, i, 1000 * i, 50 * i, 1050 * i]
      );
      const poIdRow = (await client.query('SELECT id FROM purchase_orders WHERE po_number=$1', [poNumber])).rows[0];
      const poId = poIdRow?.id;
      if (poId && invIds.length) {
        const itemId = invIds[(i - 1) % invIds.length];
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, inventory_item_id, quantity_ordered, unit_price, quantity_received, line_total)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [poId, itemId, 50 * i, 10.0 + i, 0, 50 * i * (10.0 + i)]
        );
      }
    }

    console.log('Seeding sales orders and production pipeline...');
    const fabricRows = await client.query('SELECT id FROM fabric_designs LIMIT 10');
    const fabricIds = fabricRows.rows.map((r) => r.id);
    const machineRows2 = await client.query('SELECT id FROM machines LIMIT 10');
    const machineIds = machineRows2.rows.map((r) => r.id);
    for (let i = 1; i <= 8; i++) {
      const soNumber = `SO-${String(i).padStart(3,'0')}`;
      const cust = (await client.query('SELECT id FROM customers ORDER BY id OFFSET $1 LIMIT 1', [(i - 1) % 10])).rows[0];
      const custRef = cust ? cust.id : customerId;
      const fabricId = fabricIds[(i - 1) % fabricIds.length];
      await client.query(
        `INSERT INTO sales_orders (so_number, customer_id, order_date, status, subtotal, tax_amount, total_amount)
         VALUES ($1, $2, CURRENT_DATE - ($3 || 0)::int, 'CONFIRMED', $4, $5, $6)
         ON CONFLICT (so_number) DO NOTHING`,
        [soNumber, custRef, i, 5000 * i, 250 * i, 5250 * i]
      );
      const soRow = (await client.query('SELECT id FROM sales_orders WHERE so_number=$1', [soNumber])).rows[0];
      const soId = soRow?.id;
      if (soId && fabricId) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, fabric_design_id, quantity_meters, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [soId, fabricId, 100 * i, 5.0 + i, (100 * i) * (5.0 + i)]
        );
      }

      // production plan -> work order -> production order -> daily entry -> fabric roll
      const planCode = `PLAN-${String(i).padStart(3,'0')}`;
      await client.query(
        `INSERT INTO production_plans (plan_code, fabric_design_id, planned_quantity_meters, start_date, end_date)
         VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
         ON CONFLICT (plan_code) DO NOTHING`,
        [planCode, fabricId, 1000 * i]
      );
      const planRow = (await client.query('SELECT id FROM production_plans WHERE plan_code=$1', [planCode])).rows[0];
      const planId = planRow?.id;
      if (planId) {
        const woNo = `WO-${String(i).padStart(3,'0')}`;
        await client.query(
          `INSERT INTO work_orders (work_order_no, production_plan_id, fabric_design_id, target_quantity_meters, status)
           VALUES ($1, $2, $3, $4, 'PLANNED')
           ON CONFLICT (work_order_no) DO NOTHING`,
          [woNo, planId, fabricId, 1000 * i]
        );
        const woRow = (await client.query('SELECT id FROM work_orders WHERE work_order_no=$1', [woNo])).rows[0];
        const woId = woRow?.id;
        if (woId) {
          const prodNo = `PRD-${String(i).padStart(3,'0')}`;
          const mId = machineIds[(i - 1) % machineIds.length];
          await client.query(
            `INSERT INTO production_orders (production_order_no, work_order_id, machine_id, target_quantity_meters, status)
             VALUES ($1, $2, $3, $4, 'PENDING')
             ON CONFLICT (production_order_no) DO NOTHING`,
            [prodNo, woId, mId, 1000 * i]
          );
          const prodRow = (await client.query('SELECT id FROM production_orders WHERE production_order_no=$1', [prodNo])).rows[0];
          const prodId = prodRow?.id;
          if (prodId) {
            await client.query(
              `INSERT INTO daily_production_entries (production_order_id, machine_id, operator_id, quantity_produced_meters, yarn_consumed_kg, machine_runtime_minutes)
               VALUES ($1, $2, NULL, $3, $4, $5)
               ON CONFLICT DO NOTHING`,
              [prodId, mId, 100 * i, 20 * i, 480]
            );
            const dpe = (await client.query('SELECT id FROM daily_production_entries WHERE production_order_id = $1 LIMIT 1', [prodId])).rows[0];
            await client.query(
              `INSERT INTO fabric_rolls (roll_no, production_order_id, daily_production_entry_id, fabric_design_id, length_meters, weight_kg)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (roll_no) DO NOTHING`,
              [`ROLL-${String(i).padStart(3,'0')}`, prodId, dpe?.id || null, fabricId, 100 * i, 10 * i]
            );
          }
        }
      }
    }

    console.log('Seeding machine logs, attendance, payroll and notifications...');
    const someMachines = await client.query('SELECT id FROM machines LIMIT 10');
    let idx = 1;
    for (const m of someMachines.rows) {
      await client.query(
        `INSERT INTO machine_logs (machine_id, event_type, notes, meter_reading)
         VALUES ($1, 'START', $2, $3)
         ON CONFLICT DO NOTHING`,
        [m.id, `Initial setup log ${idx}`, idx * 10]
      );
      idx += 1;
    }

    const employeesAll = await client.query('SELECT id FROM employees LIMIT 20');
    idx = 1;
    for (const e of employeesAll.rows) {
      await client.query(
        `INSERT INTO attendance (employee_id, attendance_date, status, check_in)
         VALUES ($1, CURRENT_DATE - ($2 || 0)::int, 'PRESENT', NOW()::time)
         ON CONFLICT DO NOTHING`,
        [e.id, idx % 5]
      );
      idx += 1;
    }

    for (let m = 1; m <= 6; m++) {
      await client.query(
        `INSERT INTO payroll_runs (period_month, period_year, total_amount, status)
         VALUES ($1, $2, $3, 'PAID')
         ON CONFLICT DO NOTHING`,
        [m, 2026, 40000 + m * 5000]
      );
    }

    // notifications
    for (let n = 1; n <= 8; n++) {
      await client.query(
        `INSERT INTO notifications (title, message, severity)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [`Welcome ${n}`, `Demo data seeded entry ${n}. Login with owner@textileerp.com`, 'INFO']
      );
    }

    console.log('Seeding inventory transactions...');
    const invTxnItems = await client.query('SELECT id, current_stock FROM inventory_items LIMIT 5');
    for (let i = 0; i < invTxnItems.rows.length; i++) {
      const item = invTxnItems.rows[i];
      await client.query(
        `INSERT INTO inventory_transactions (inventory_item_id, txn_type, quantity, balance_after, unit_cost, reference_type)
         VALUES ($1, 'IN', $2, $3, $4, 'PURCHASE')
         ON CONFLICT DO NOTHING`,
        [item.id, 100 + i * 50, Number(item.current_stock) + 100 + i * 50, 20 + i * 5]
      );
    }

    console.log('Seeding raw material consumptions...');
    const prodOrderRows = await client.query('SELECT id FROM production_orders LIMIT 5');
    const invRows2 = await client.query('SELECT id FROM inventory_items LIMIT 5');
    for (let i = 0; i < Math.min(prodOrderRows.rows.length, invRows2.rows.length); i++) {
      await client.query(
        `INSERT INTO raw_material_consumptions (production_order_id, inventory_item_id, daily_production_entry_id, quantity_consumed, consumption_date, notes)
         VALUES ($1, $2, NULL, $3, CURRENT_DATE - ($4 || ' days')::interval, $5)
         ON CONFLICT DO NOTHING`,
        [prodOrderRows.rows[i].id, invRows2.rows[i].id, 50 + i * 10, `${i}`, `Consumed material for production order ${i + 1}`]
      );
    }

    console.log('Seeding machine breakdowns and maintenance...');
    const machineRows3 = await client.query('SELECT id FROM machines LIMIT 4');
    const employeeRefs = employeesAll.rows.map((e) => e.id);
    const userIds = userRows.map((u) => u.id);
    for (let i = 0; i < machineRows3.rows.length; i++) {
      await client.query(
        `INSERT INTO machine_breakdowns (machine_id, reported_by, issue_description, status, downtime_minutes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [machineRows3.rows[i].id, employeeRefs[i % employeeRefs.length], `Routine issue ${i + 1}`, i % 2 === 0 ? 'RESOLVED' : 'IN_PROGRESS', 30 + i * 15]
      );
      await client.query(
        `INSERT INTO machine_maintenance (machine_id, maintenance_type, scheduled_date, status, performed_by, cost, description)
         VALUES ($1, 'PREVENTIVE', CURRENT_DATE - ($2 || ' days')::interval, 'COMPLETED', $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [machineRows3.rows[i].id, `${i}`, employeeRefs[(i + 1) % employeeRefs.length], 500 + i * 50, `Scheduled maintenance ${i + 1}`]
      );
    }

    console.log('Seeding beams and beam allocations...');
    const beamRows = [
      ['BM-001', 'WARP', '40s', 10000, 'IN_STOCK', null],
      ['BM-002', 'WEFT', '40s', 8000, 'IN_STOCK', null],
      ['BM-003', 'WARP', '30s', 12000, 'ALLOCATED', machineRows3.rows[0]?.id],
      ['BM-004', 'WEFT', '20s', 9000, 'ALLOCATED', machineRows3.rows[1]?.id],
    ];
    const beamIds = [];
    for (const [code, type, yarnCount, totalEnds, status, machineId] of beamRows) {
      await client.query(
        `INSERT INTO beams (beam_code, beam_type, yarn_count, total_ends, length_meters, status, current_machine_id)
         VALUES ($1, $2, $3, $4, 20, $5, $6)
         ON CONFLICT (beam_code) DO NOTHING`,
        [code, type, yarnCount, totalEnds, status, machineId]
      );
      const beamRow = (await client.query('SELECT id FROM beams WHERE beam_code=$1', [code])).rows[0];
      if (beamRow) beamIds.push(beamRow.id);
    }
    for (let i = 0; i < beamIds.length; i++) {
      if (machineRows3.rows[i]) {
        await client.query(
          `INSERT INTO beam_allocations (beam_id, machine_id, allocated_by, released_at, meters_used)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '1 day', $4)
           ON CONFLICT DO NOTHING`,
          [beamIds[i], machineRows3.rows[i].id, userIds[i % userIds.length], 500 + i * 100]
        );
      }
    }

    console.log('Seeding leave requests and payroll items...');
    const leaveTypes = ['SICK', 'CASUAL', 'EARNED', 'UNPAID'];
    for (let i = 0; i < Math.min(employeeRefs.length, 4); i++) {
      await client.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status, approved_by)
         VALUES ($1, $2, CURRENT_DATE - ($3 || ' days')::interval, CURRENT_DATE - ($4 || ' days')::interval, $5, $6, 'APPROVED', $7)
         ON CONFLICT DO NOTHING`,
        [employeeRefs[i], leaveTypes[i], `${i + 7}`, `${i + 5}`, i + 2, `Leave request ${i + 1}`, userIds[i % userIds.length]]
      );
    }
    const payrollRows = await client.query('SELECT id FROM payroll_runs LIMIT 4');
    let payrollItemCount = 1;
    for (const payroll of payrollRows.rows) {
      for (let i = 0; i < Math.min(employeeRefs.length, 4); i++) {
        const base = 20000 + payrollItemCount * 1000;
        await client.query(
          `INSERT INTO payroll_items (payroll_run_id, employee_id, days_present, days_absent, days_on_leave, paid_leave_days, overtime_hours, base_salary, overtime_amount, production_bonus, deductions, net_salary, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'PAID')
           ON CONFLICT DO NOTHING`,
          [payroll.id, employeeRefs[i], 22, 1, 1, 1, 5, base, 150, 200, 100, base + 250 - 100]
        );
        payrollItemCount += 1;
      }
    }

    console.log('Seeding quality inspections, packing, vehicles, dispatches, and dispatch items...');
    const fabricRolls = await client.query('SELECT id, production_order_id FROM fabric_rolls LIMIT 6');
    const vehicleCodes = ['VEH-001', 'VEH-002', 'VEH-003'];
    const vehicleIds = [];
    for (const code of vehicleCodes) {
      await client.query(
        `INSERT INTO vehicles (vehicle_number, vehicle_type, driver_name, driver_phone, capacity_kg, status)
         VALUES ($1, 'TRUCK', $2, $3, 5000, 'AVAILABLE')
         ON CONFLICT (vehicle_number) DO NOTHING`,
        [code, `Driver ${code.slice(-3)}`, `90000${code.slice(-3)}`]
      );
      const row = (await client.query('SELECT id FROM vehicles WHERE vehicle_number=$1', [code])).rows[0];
      if (row) vehicleIds.push(row.id);
    }
    for (let i = 0; i < fabricRolls.rows.length; i++) {
      const roll = fabricRolls.rows[i];
      await client.query(
        `INSERT INTO quality_inspections (fabric_roll_id, inspected_by, inspection_date, result, defect_type, grade)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [roll.id, employeeRefs[i % employeeRefs.length], i % 2 === 0 ? 'PASS' : 'REWORK', i % 2 === 0 ? null : 'Minor weave defect', i % 2 === 0 ? 'A' : 'B']
      );
      await client.query(
        `INSERT INTO packing_records (package_no, fabric_roll_id, packed_by, package_weight_kg, package_type, status)
         VALUES ($1, $2, $3, $4, 'ROLL_BAG', 'PACKED')
         ON CONFLICT (package_no) DO NOTHING`,
        [`PKG-${String(i + 1).padStart(3,'0')}`, roll.id, employeeRefs[i % employeeRefs.length], 12 + i * 2]
      );
    }
    const packingIds = await client.query('SELECT id, fabric_roll_id FROM packing_records LIMIT 6');
    const soRows = await client.query('SELECT id, customer_id FROM sales_orders LIMIT 6');
    for (let i = 0; i < Math.min(packingIds.rows.length, soRows.rows.length, vehicleIds.length); i++) {
      const dispatchNo = `DISP-${String(i + 1).padStart(3,'0')}`;
      await client.query(
        `INSERT INTO dispatches (dispatch_no, sales_order_id, customer_id, vehicle_id, dispatch_date, status, total_weight_kg, total_packages)
         VALUES ($1, $2, $3, $4, CURRENT_DATE - ($5 || ' days')::interval, 'IN_TRANSIT', $6, $7)
         ON CONFLICT (dispatch_no) DO NOTHING`,
        [dispatchNo, soRows.rows[i].id, soRows.rows[i].customer_id, vehicleIds[i], `${i}`, 1000 + i * 100, i + 1]
      );
      const dispatchRow = (await client.query('SELECT id FROM dispatches WHERE dispatch_no=$1', [dispatchNo])).rows[0];
      if (dispatchRow) {
        await client.query(
          `INSERT INTO dispatch_items (dispatch_id, packing_record_id, fabric_roll_id, quantity_meters)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [dispatchRow.id, packingIds.rows[i].id, packingIds.rows[i].fabric_roll_id, 120 + i * 20]
        );
      }
    }

    console.log('Seeding expenses, utilities, productivity, waste, and audit logs...');
    const expenseEntries = [
      ['EXP-001', 'RAW_MATERIAL', 'Cotton purchase', 15000],
      ['EXP-002', 'UTILITY', 'Electricity bill', 42000],
      ['EXP-003', 'SALARY', 'Employee salary payout', 180000],
      ['EXP-004', 'MAINTENANCE', 'Machine servicing', 22000],
      ['EXP-005', 'TRANSPORT', 'Dispatch transport', 9000],
      ['EXP-006', 'ADMIN', 'Stationery purchase', 4200],
      ['EXP-007', 'OTHER', 'Plant cleaning', 5200],
      ['EXP-008', 'RAW_MATERIAL', 'Dye stock', 12500],
    ];
    for (const [code, category, desc, amount] of expenseEntries) {
      await client.query(
        `INSERT INTO expenses (expense_no, category, description, amount, department_id, payment_method, approved_by)
         VALUES ($1, $2, $3, $4, $5, 'BANK_TRANSFER', $6)
         ON CONFLICT (expense_no) DO NOTHING`,
        [code, category, desc, amount, deptIds.ADM, userIds[0]]
      );
    }
    for (let i = 1; i <= 5; i++) {
      await client.query(
        `INSERT INTO electricity_readings (reading_date, department_id, machine_id, meter_reading, units_consumed, cost_amount, recorded_by)
         VALUES (CURRENT_DATE - ($1 || ' days')::interval, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [i, deptIds.MNT, machineRows3.rows[i % machineRows3.rows.length]?.id, 1000 + i * 50, 50 + i * 5, 500 + i * 20, userIds[i % userIds.length]]
      );
      await client.query(
        `INSERT INTO water_readings (reading_date, department_id, meter_reading, units_consumed, cost_amount, recorded_by)
         VALUES (CURRENT_DATE - ($1 || ' days')::interval, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [i, deptIds.DYE, 800 + i * 25, 80 + i * 3, 200 + i * 10, userIds[i % userIds.length]]
      );
    }
    for (let i = 0; i < Math.min(employeeRefs.length, 6); i++) {
      await client.query(
        `INSERT INTO worker_productivity (employee_id, production_date, machine_id, quantity_produced_meters, hours_worked, efficiency_percent, defect_count)
         VALUES ($1, CURRENT_DATE - ($2 || ' days')::interval, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [employeeRefs[i], i + 1, machineRows3.rows[i % machineRows3.rows.length]?.id, 500 + i * 50, 8, 85 + i, i % 3]
      );
    }
    for (let i = 1; i <= 6; i++) {
      await client.query(
        `INSERT INTO waste_records (waste_date, waste_type, source_machine_id, production_order_id, quantity_kg, disposal_method, recovery_value, notes, created_by)
         VALUES (CURRENT_DATE - ($1 || ' days')::interval, 'FABRIC_WASTE', $2, $3, $4, 'RECYCLED', $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [i, machineRows3.rows[i % machineRows3.rows.length]?.id, prodOrderRows.rows[i % prodOrderRows.rows.length]?.id, 20 + i * 5, 150 + i * 10, `Waste entry ${i}`, userIds[i % userIds.length]]
      );
    }
    for (let i = 1; i <= 8; i++) {
      await client.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [userIds[i % userIds.length], 'CREATE', 'inventory_items', invTxnItems.rows[i % invTxnItems.rows.length]?.id, null, JSON.stringify({ created: true }), `192.168.0.${i}`, `Seeder/${i}`]
      );
    }

    await client.query('COMMIT');
    console.log('\nSeed completed successfully.');
    console.log('Login with: owner@textileerp.com / Owner@12345 (OWNER)');
    console.log('Demo accounts use password: Demo@12345');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Additional seeding for remaining modules: suppliers, customers, purchase/sales orders,
// employees (linked to users), production pipeline (plans, work orders, production orders),
// daily entries, fabric rolls, machine logs, attendance, payroll_runs, notifications.
// This block is idempotent and uses ON CONFLICT DO NOTHING where appropriate.

async function seedAdditional() {
  const client = new Pool({ connectionString: env.db.connectionString, ssl: env.db.ssl }).connect();
  (await client).release();
}
