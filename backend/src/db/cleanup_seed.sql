BEGIN;

-- Purchase / Sales / Production related (delete children first)
DELETE FROM sales_order_items WHERE sales_order_id IN (SELECT id FROM sales_orders WHERE so_number='SO-001');
DELETE FROM sales_orders WHERE so_number='SO-001';

DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE po_number='PO-001');
DELETE FROM purchase_orders WHERE po_number='PO-001';

DELETE FROM fabric_rolls WHERE roll_no='ROLL-001';
DELETE FROM daily_production_entries WHERE production_order_id IN (SELECT id FROM production_orders WHERE production_order_no='PRD-001');
DELETE FROM production_orders WHERE production_order_no='PRD-001';
DELETE FROM work_orders WHERE work_order_no='WO-001';
DELETE FROM production_plans WHERE plan_code='PLAN-001';

-- Machine logs
DELETE FROM machine_logs WHERE notes = 'Initial machine setup';

-- Notifications
DELETE FROM notifications WHERE title = 'Welcome' AND message LIKE '%Demo data seeded%';

-- Payroll and attendance
DELETE FROM attendance WHERE employee_id IN (SELECT id FROM employees WHERE email IN ('owner@textileerp.com','manager@textileerp.com','supervisor@textileerp.com','accountant@textileerp.com','worker@textileerp.com'));
DELETE FROM payroll_runs WHERE period_month = 6 AND period_year = 2026;

-- Employees and users
DELETE FROM employees WHERE email IN ('owner@textileerp.com','manager@textileerp.com','supervisor@textileerp.com','accountant@textileerp.com','worker@textileerp.com');
DELETE FROM users WHERE email IN ('owner@textileerp.com','manager@textileerp.com','supervisor@textileerp.com','accountant@textileerp.com','worker@textileerp.com');

-- Inventory and items
DELETE FROM purchase_order_items WHERE inventory_item_id IN (SELECT id FROM inventory_items WHERE item_code IN ('RM-COTYARN-30','RM-POLYYARN-40','CHM-DYE-BLUE','PKG-ROLLBAG'));
DELETE FROM inventory_items WHERE item_code IN ('RM-COTYARN-30','RM-POLYYARN-40','CHM-DYE-BLUE','PKG-ROLLBAG');

-- Machines
DELETE FROM machines WHERE machine_code IN ('LOOM-001','LOOM-002','LOOM-003');

-- Fabric designs
DELETE FROM fabric_designs WHERE design_code = 'FD-001';

-- Suppliers / Customers
DELETE FROM suppliers WHERE supplier_code = 'SUP-001';
DELETE FROM customers WHERE customer_code = 'CUST-001';

-- Departments and factory settings
DELETE FROM departments WHERE code IN ('WVG','SPN','QC','WH','DSP','MNT','ADM');
DELETE FROM factory_settings WHERE factory_name = 'Shivay Textiles';

COMMIT;
