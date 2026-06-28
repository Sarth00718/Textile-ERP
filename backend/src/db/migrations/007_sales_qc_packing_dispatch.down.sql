DROP TABLE IF EXISTS dispatch_items;
DROP TABLE IF EXISTS dispatches;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS packing_records;
DROP TABLE IF EXISTS quality_inspections;
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS fk_work_orders_sales_order;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS customers;
