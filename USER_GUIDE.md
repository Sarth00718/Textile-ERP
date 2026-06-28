# Shivay Textiles ERP — Ultimate Operations & RBAC Manual

This guide provides an exhaustive breakdown of all **42 operational modules** in the Shivay Textiles Factory ERP system. For each module, we outline the **business goal**, **RBAC permissions (who can view/manage)**, **step-by-step instructions on how to use it**, and **how it links to other modules in the database**.

---

# Table of Contents
1. [Core Settings & Auditing](#1-core-settings--auditing)
2. [Workforce & Administrative Control](#2-workforce--administrative-control)
3. [Shop Floor & Machinery](#3-shop-floor--machinery)
4. [Design & Production Planning](#4-design--production-planning)
5. [Daily Production & Output](#5-daily-production--output)
6. [Sales & Customer Relations](#6-sales--customer-relations)
7. [Procurement, Inventory & Stocking](#7-procurement-inventory--stocking)
8. [Logistics, Packing & Shipping](#8-logistics-packing--shipping)
9. [Financials & Utility Tracking](#9-financials--utility-tracking)
10. [Reports, Audit Logging & Monitoring](#10-reports-audit-logging--monitoring)

---

## 1. Core Settings & Auditing

### 1.1 Factory Settings
* **Purpose**: Manages system-wide variables, GST/PAN credentials, utility rates, and active shifts.
* **RBAC Rules**:
  * **Owner**: View & Manage (Update).
  * **Manager**: Read-only (View).
  * **Supervisor, Accountant, Worker**: No access.
* **How It Works (UI & Steps)**:
  1. Navigate to **Factory Settings** in the sidebar.
  2. Modify fields like Factory Name, Legal Name, GST Number, PAN, Address, Electricity Rate (₹/Unit), and Water Rate (₹/Unit).
  3. Under Shift Config, configure the 3-shift timings (e.g. Shift A: 08:00-16:00, Shift B: 16:00-00:00, Shift C: 00:00-08:00).
  4. Click **Save Settings**.
* **Database Relationships**: Updates the singular row in `factory_settings`. Rates logged here are referenced by utility logs to calculate monetary costs automatically.

### 1.2 Notifications
* **Purpose**: Displays alerts to users about system events like low raw material inventory, loom breakdowns, pending leave applications, and quality failures.
* **RBAC Rules**:
  * **All Roles**: View and mark their own notifications as read.
* **How It Works (UI & Steps)**:
  1. Click the **Bell Icon** on the navbar or navigate to `/notifications`.
  2. Click **Mark as Read** to clear individual items or **Clear All**.
* **Database Relationships**: Populates data from the `notifications` table, filtered by `user_id`.

### 1.3 Audit Logs
* **Purpose**: Ensures complete traceability for accounting and auditing. Every insert, edit, or delete action is logged here.
* **RBAC Rules**:
  * **Owner**: View only.
  * **Manager**: View only.
  * **Others**: No access.
* **How It Works (UI & Steps)**:
  1. Navigate to **Audit Logs** (under Settings).
  2. Filter by User, Date, Action Type (INSERT, UPDATE, DELETE), or Target Table.
  3. View the old JSON values vs. new JSON values to track changes.
* **Database Relationships**: Reads from the `audit_logs` table. populated automatically via backend hook actions on DB queries.

---

## 2. Workforce & Administrative Control

### 2.1 Departments
* **Purpose**: Manages the factory structure (e.g., Weaving Shop, Sizing, QC, Dispatch).
* **RBAC Rules**:
  * **Owner, Manager**: Create, Edit, Delete.
  * **Supervisor, Accountant**: View only.
  * **Worker**: No access.
* **How It Works (UI & Steps)**:
  1. Go to **Workforce > Departments**.
  2. Click **Add Department**. Input Department Name and Code (e.g. WEAV-01).
  3. Assign a Parent Department if applicable (for hierarchy).
* **Database Relationships**: Stored in `departments`. Referenced by employee files.

### 2.2 Employees
* **Purpose**: The master database of all employees (weavers, accountants, supervisors, management).
* **RBAC Rules**:
  * **Owner, Manager**: Create, Edit, Delete (change active status).
  * **Supervisor, Accountant**: View only.
  * **Worker**: No access.
* **How It Works (UI & Steps)**:
  1. Go to **Workforce > Employees**.
  2. Click **Add Employee**. Fill in details: Employee ID, Name, Contact, Base Salary, Daily Rate, Role, and Department.
  3. Click **Submit**. To deactivate an employee who left, click **Edit** and toggle **Is Active**.
* **Database Relationships**: Populates the `employees` table. Links to `departments` and `users` (auth table).

### 2.3 Attendance
* **Purpose**: Registers daily check-in and check-out to verify hours worked and calculate overtime.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Log, Edit, and View attendance records.
  * **Accountant**: View only.
  * **Worker**: No access.
* **How It Works (UI & Steps)**:
  1. Go to **Workforce > Attendance**.
  2. Click **Record Attendance**. Select Employee, Date, Check-In Time, Check-Out Time, and status (Present, Absent, Half-Day).
  3. The system computes Overtime Hours automatically if the shift length exceeds 8 hours.
* **Database Relationships**: Records are stored in `attendance`. Links to the `employees` table. Used by the Payroll module to count paid days.

### 2.4 Leave Management
* **Purpose**: Processes leave requests (Sick, Casual, Paid, Unpaid).
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Approve or Reject requests.
  * **Worker**: View own leaves & submit new Leave Request.
  * **Accountant**: View all leaves.
* **How It Works (UI & Steps)**:
  1. **Worker**: Goes to **Leaves**, clicks **Request Leave**, inputs Start Date, End Date, Type, and Reason.
  2. **Manager/Supervisor**: Receives a notification, goes to **Leaves**, views pending items, and clicks **Approve** or **Reject** (with comments).
* **Database Relationships**: Row inserted into `leaves` table. Approved leaves are marked as paid/unpaid and factored into payroll calculations.

### 2.5 Payroll
* **Purpose**: Runs monthly payroll, applying overtime earnings and unpaid leave deductions.
* **RBAC Rules**:
  * **Owner, Accountant**: Run payroll, issue slips, edit bonuses.
  * **Manager**: View only.
  * **Others**: No access.
* **How It Works (UI & Steps)**:
  1. Go to **Workforce > Payroll**.
  2. Click **Run Payroll**. Select Month and Year.
  3. The backend calculates:
     * `Paid Days` = Total days in month - Unpaid Leaves.
     * `Base Pay` = (Base Salary / Total Days) * Paid Days.
     * `Overtime Pay` = Overtime hours worked * Overtime rate (derived from settings/employee base).
     * Deductions (e.g. Tax, advance payment).
  4. Review details, adjust bonuses, and click **Process & Approve**. Print or Download PDF Payslip.
* **Database Relationships**: Reads from `employees`, `attendance`, and `leaves`. Inserts summary rows into `payroll` and item details into `payroll_items`.

---

## 3. Shop Floor & Machinery

### 3.1 Machine Management (Looms)
* **Purpose**: Manages loom specifications (Air Jet Looms, Rapier Looms, Projectile Looms, Sizing Machines).
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Add, Edit, Delete looms.
  * **Worker**: View only.
  * **Accountant**: No access.
* **How It Works (UI & Steps)**:
  1. Navigate to **Machines**.
  2. Click **Add Machine**. Fill in: Loom Number, Type, Speed (RPM), Max Width capacity, and Installation Date.
  3. The dashboard shows real-time status: Running, Stopped, or Under Maintenance.
* **Database Relationships**: Row added to `machines`. Linked to `machine_logs`, `breakdowns`, and `production_orders`.

### 3.2 Machine Logs
* **Purpose**: Registers loom state changes (run, idle, stop times) to compute overall equipment effectiveness (OEE).
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Full access.
  * **Worker**: Can log machine state changes.
* **How It Works (UI & Steps)**:
  1. Go to **Machines > Machine Logs**.
  2. Click **Add Log Entry**. Select Machine, Event (Start Run, Stop), Timestamp, and Reason (Weft Break, Warp Break, Beam Empty, No Operator).
* **Database Relationships**: Logs are appended to `machine_logs`.

### 3.3 Machine Breakdowns
* **Purpose**: Reports mechanical/electrical faults and tracks technician repairs.
* **RBAC Rules**:
  * **Worker**: Submit Breakdown Report.
  * **Owner, Manager, Supervisor**: Assign technician, log resolutions, and close the tickets.
* **How It Works (UI & Steps)**:
  1. **Worker**: On the floor, a loom stops. Goes to **Breakdowns**, clicks **Report Issue**, selects Loom ID, selects Category (Mechanical, Electrical, Electronic, Air Leak), and describes the issue. Loom status automatically changes to "Stopped".
  2. **Supervisor**: Navigates to **Breakdowns**, reviews ticket, assigns maintenance staff.
  3. **Resolution**: Once fixed, supervisor enters Resolution Details, Repair Cost, End Timestamp, and clicks **Mark Resolved**.
* **Database Relationships**: Adds rows to `machine_breakdowns`. Computes `downtime_minutes` = `resolved_at - reported_at`.

### 3.4 Machine Maintenance
* **Purpose**: Schedules preventive maintenance or records heavy repairs (e.g., replacing reeds, lubricants, or servo motors).
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Schedule, record and edit.
  * **Others**: No access.
* **How It Works (UI & Steps)**:
  1. Go to **Machines > Maintenance**.
  2. Click **Schedule Maintenance**. Select Machine, Maintenance Type (Routine, Preventive, Overhaul), Scheduled Date.
  3. After servicing is completed, input: Cost, Spare Parts Used, and Technician Notes.
* **Database Relationships**: Entries map to `machine_maintenance`. Maintenance costs are automatically synced to the Expense module.

### 3.5 Beam Management
* **Purpose**: Tracks inventory of Warp Beams and Weft Beams, including total warp end counts, sizing details, and yarn details.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Add and update.
  * **Worker**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Beams**.
  2. Click **Add Beam**. Input: Beam Number, Type (Warp/Weft), Total Ends, Sized Length (Meters), Yarn Count, Yarn Type, and Status (In Stock, Allocated, Empty).
* **Database Relationships**: Map to `beams` table. Linked to `beam_allocations`.

### 3.6 Beam Allocation
* **Purpose**: Tracks when a warp beam is loaded onto a loom and when it runs out.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Allocate/Release beams.
  * **Worker**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Beams > Beam Allocation**.
  2. Click **New Allocation**. Select Beam ID, Loom ID, and input installation date/time. Loom status changes to "Allocated".
  3. When the beam is fully woven out (empty), click **Release Beam**, log final date/time, and mark the beam as "Empty" so it can go back to Sizing.
* **Database Relationships**: Inserts and updates records in `beam_allocations`.

---

## 4. Design & Production Planning

### 4.1 Fabric Design (Master Design File)
* **Purpose**: Stores structural parameters of the fabrics to be woven (GSM, Pick Count, Warp Count, Reed Space).
* **RBAC Rules**:
  * **Owner, Manager**: Create, Edit, Delete designs.
  * **Supervisor, Worker**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Fabric Designs**.
  2. Click **Create Design**. Input Design Code (e.g., SATIN-220), GSM (grams per sq. meter), Warp Count (e.g., 40s Cotton), Weft Count (e.g., 30s Cotton), Ends/Inch, Picks/Inch, Fabric Width (e.g., 63 inches), and Price per meter.
* **Database Relationships**: Row added to `fabric_designs`. Linked to `production_plans` and `sales_order_items`.

### 4.2 Production Planning
* **Purpose**: Plans high-level manufacturing orders.
* **RBAC Rules**:
  * **Owner, Manager**: Create and Manage plans.
  * **Supervisor**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Production > Production Plans**.
  2. Click **New Plan**. Select Fabric Design Code, input Target Quantity (Meters), Start Date, and Estimated Completion Date.
* **Database Relationships**: Map to `production_plans`. Linked to `work_orders`.

### 4.3 Work Orders
* **Purpose**: Translates production plans into actionable manufacturing targets.
* **RBAC Rules**:
  * **Owner, Manager**: Issue work orders.
  * **Supervisor**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Production > Work Orders**.
  2. Click **Create Work Order**. Select active Production Plan, select target loom type capacity, specify meters, and click **Submit**.
* **Database Relationships**: Row inserted into `work_orders`. Link between plans and actual loom runs.

### 4.4 Production Orders
* **Purpose**: Assigns work orders to specific loom machines.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Issue and manage orders.
  * **Worker**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Production > Production Orders**.
  2. Click **Add Production Order**. Select Work Order, assign Loom ID, specify target quantity to be woven on this machine, and select Assigned Workers.
* **Database Relationships**: Inserts into `production_orders`. Loom machine status becomes "Running".

---

## 5. Daily Production & Output

### 5.1 Daily Production Entry (Shift Log)
* **Purpose**: Tracks loom run stats at the end of each shift.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor, Worker**: Submit logs.
* **How It Works (UI & Steps)**:
  1. Go to **Production > Daily Entries**.
  2. Click **Add Entry**. Select Production Order, Shift (A/B/C), Operator, Meters Produced, Runtime Minutes, Pick Count, Warp Breaks, and Weft Breaks.
  3. Click **Submit**. Loom efficiency is automatically calculated:
     * `Efficiency %` = `(Meters Woven / Target Meters on RPM capacity) * 100`.
* **Database Relationships**: Row added to `daily_production_entries`. Subtracts raw material components automatically if configured.

### 5.2 Fabric Roll Management
* **Purpose**: Tracks individual finished rolls cut from the loom.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Full access.
  * **Worker**: Log roll cut weight/meters.
* **How It Works (UI & Steps)**:
  1. Go to **Production > Fabric Rolls**.
  2. Click **Log Roll Cut**. Select Loom ID, Production Order, input Roll ID (or let system auto-generate), exact cut length (e.g. 120.5 meters), and weight (kg).
* **Database Relationships**: Added to `fabric_rolls`. Initially set status to "Pending QC".

### 5.3 Quality Control (QC)
* **Purpose**: Details warp/weft inspections and assigns quality grades.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Perform QC inspections.
  * **Worker**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Quality Control**. Select a fabric roll marked "Pending QC".
  2. Click **QC Audit**. Fill in: Warp Defects count, Weft Defects count, Stains/Oil spots count, and final Roll Grade (Grade A, Grade B, Grade C, Rejection).
  3. Click **Submit**. If passed (Grade A/B), status becomes "QC Passed", and it is sent to Packing.
* **Database Relationships**: Map to `quality_control`. Updates the status field in the `fabric_rolls` table.

---

## 6. Sales & Customer Relations

### 6.1 Customers
* **Purpose**: Directory of clients buying fabric.
* **RBAC Rules**:
  * **Owner, Manager**: Add/Edit/Delete.
  * **Accountant**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Customers**.
  2. Click **Add Customer**. Fill in: Company Name, Contact Person, GST Number, PAN, Payment terms (e.g., Net 30), Address, and Phone.
* **Database Relationships**: Added to `customers`. Linked to `sales_orders`.

### 6.2 Sales Orders
* **Purpose**: Records fabric purchase commitments from clients.
* **RBAC Rules**:
  * **Owner, Manager**: Book and edit orders.
  * **Accountant**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Sales Orders**.
  2. Click **New Sales Order**. Select Customer, Order Date, Delivery Deadline, and Payment Terms.
  3. Click **Add Order Items**. Fill in: Fabric Design Code, Quantity (Meters), and Unit Price (₹/Meter).
* **Database Relationships**: Inserts one row in `sales_orders` and multiple rows in `sales_order_items`. Used by production planners to schedule future looms.

---

## 7. Procurement, Inventory & Stocking

### 7.1 Inventory (Raw Materials & Spares)
* **Purpose**: Manages stock levels of yarn, chemicals, sizing ingredients, and spare loom parts.
* **RBAC Rules**:
  * **Owner, Manager**: Full access.
  * **Supervisor, Accountant**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Inventory**.
  2. View current stock levels, safety alerts (red for items below threshold).
  3. Click **Add Inventory Item** to register new items (e.g., "75D DTY Polyester Yarn"). Set Category, Reorder Level, and current quantity.
* **Database Relationships**: Maps to `inventory`. Linked to `inventory_transactions`.

### 7.2 Inventory Transactions
* **Purpose**: Records additions/deductions to inventory (e.g., PO deliveries, manual adjustments).
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Full access.
  * **Accountant**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Inventory > Transactions**.
  2. Click **Log Transaction**. Select Item, Transaction Type (IN: Receive stock, OUT: Consumption, ADJUST: Manual fix), Quantity, and Unit Cost.
* **Database Relationships**: Appends rows to `inventory_transactions` and updates `quantity_on_hand` in the `inventory` table.

### 7.3 Raw Material Consumption
* **Purpose**: Tracks yarn weights consumed during loom runs.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Log and view.
* **How It Works (UI & Steps)**:
  1. Go to **Inventory > Consumption Logs**.
  2. Click **Log Yarn Consumption**. Select active Production Order, select Yarn Item from inventory, and enter weight (Kg) consumed during the run.
* **Database Relationships**: Row added to `raw_material_consumption`. Automatically triggers an `OUT` transaction in `inventory_transactions` to decrement yarn stock.

### 7.4 Suppliers
* **Purpose**: Directory of vendors supplying yarn or loom parts.
* **RBAC Rules**:
  * **Owner, Manager**: Manage.
  * **Accountant**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Suppliers**. Click **Add Supplier**. Fill in details (Company Name, GST, Address, Payment terms).
* **Database Relationships**: Saved in `suppliers`. Linked to `purchase_orders`.

### 7.5 Purchase Orders (PO)
* **Purpose**: Generates purchase commitments for raw materials.
* **RBAC Rules**:
  * **Owner, Manager**: Draft and issue POs.
  * **Accountant**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Purchase Orders**.
  2. Click **New PO**. Select Supplier, Expected Delivery Date.
  3. Click **Add Items**. Select Inventory Item, Weight/Quantity, and Unit Cost.
  4. Once items are delivered, click **Mark Received**. This automatically generates an inventory `IN` transaction.
* **Database Relationships**: Adds rows to `purchase_orders` and `purchase_order_items`.

---

## 8. Logistics, Packing & Shipping

### 8.1 Packing
* **Purpose**: Combines finished, QC-passed fabric rolls into shipping boxes.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor, Worker**: Complete access.
* **How It Works (UI & Steps)**:
  1. Go to **Packing**.
  2. Click **New Packing Box**. Assign Box ID (or auto-generate), select QC-Passed Fabric Rolls to put inside the box.
  3. Total weight and meters of the box are computed automatically. Click **Pack & Close Box**.
* **Database Relationships**: Inserts rows into `packing_boxes`. Updates `fabric_rolls` status to "Packed" and links them to the box.

### 8.2 Vehicle Management
* **Purpose**: Registers trucks and shipping vehicles.
* **RBAC Rules**:
  * **Owner, Manager**: Add/Edit/Deactivate.
  * **Supervisor**: View only.
* **How It Works (UI & Steps)**:
  1. Go to **Vehicles**.
  2. Click **Register Vehicle**. Fill in: Vehicle Number, Driver Name, Driver Phone, License Number, and status (Available, In Transit).
* **Database Relationships**: Saved in `vehicles`. Linked to `dispatch` manifests.

### 8.3 Dispatch
* **Purpose**: Coordinates shipment transport to clients.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Full access.
* **How It Works (UI & Steps)**:
  1. Go to **Dispatch**.
  2. Click **Create Dispatch Manifest**. Select Customer, Sales Order, select Registered Vehicle, and add Packed Boxes to load.
  3. Print Packing Slips. Toggle status from "Pending" -> "Shipped" -> "Delivered".
* **Database Relationships**: Adds rows to `dispatches` and `dispatch_items`. Updates box status to "Shipped".

---

## 9. Financials & Utility Tracking

### 9.1 Expense Management
* **Purpose**: Tracks operational expenditures (Yarn purchases, loom repairs, parts, payroll, fuel).
* **RBAC Rules**:
  * **Owner, Accountant**: Add, Edit, Delete.
  * **Manager**: Manage/View.
* **How It Works (UI & Steps)**:
  1. Go to **Expenses**.
  2. Click **Add Expense**. Fill in: Category (Yarn, Spares, Payroll, Electricity, Fuel, Misc), Amount, Date, Reference/Invoice Number, and upload receipt image (integrated with Cloudinary).
* **Database Relationships**: Adds records to `expenses`.

### 9.2 Electricity Monitoring
* **Purpose**: Logs daily meter readings of looms to track consumption and costs.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor, Accountant**: Log and view.
* **How It Works (UI & Steps)**:
  1. Go to **Operations > Electricity**.
  2. Click **Log Meter Reading**. Select Date, select Machine (or main switchboard), and input: Starting Meter Reading, Ending Meter Reading.
  3. The system calculates:
     * `Units Consumed (KWh)` = `Ending Reading - Starting Reading`.
     * `Cost (₹)` = `Units Consumed * Electricity Rate (from Settings)`.
* **Database Relationships**: Records are stored in `electricity_monitoring`.

### 9.3 Water Monitoring
* **Purpose**: Registers daily water consumption (for sizing processes).
* **RBAC Rules**:
  * **Owner, Manager, Supervisor, Accountant**: Log and view.
* **How It Works (UI & Steps)**:
  1. Go to **Operations > Water**.
  2. Click **Log Water Usage**. Input Date, Liters Consumed. Cost is calculated using water rates from settings.
* **Database Relationships**: Map to `water_monitoring`.

### 9.4 Worker Productivity
* **Purpose**: Automated utility to evaluate weaver productivity.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: View only.
* **How It Works (UI & Steps)**:
  1. Navigate to **Operations > Worker Productivity**.
  2. Select dates. The module processes all daily production entries to display total meters produced, shifts worked, and efficiency percentage for each worker.
* **Database Relationships**: Reads dynamically from `daily_production_entries` and `employees`.

### 9.5 Waste Management
* **Purpose**: Tracks yarn waste (weft waste, sizing leftovers, chindi) to identify process inefficiencies.
* **RBAC Rules**:
  * **Owner, Manager, Supervisor**: Log and view.
* **How It Works (UI & Steps)**:
  1. Go to **Operations > Waste Management**.
  2. Click **Log Waste**. Select Date, Loom ID, Waste Type (Chindi, Hard Yarn, Sizing Waste), and Weight (Kg).
* **Database Relationships**: Maps to `waste_management`.

---

## 10. Reports, Audit Logging & Monitoring

### 10.1 Reports & Data Exports
* **Purpose**: Exports structured data to CSV, Excel, or PDF format.
* **RBAC Rules**:
  * **Owner, Manager, Accountant**: Run and export reports.
* **How It Works (UI & Steps)**:
  1. Find export buttons (CSV/Excel) on tables: Production logs, Attendance sheets, Invoices, and Expenses.
  2. Click the button to download the formatted file.
* **Database Relationships**: Reads from the active tables.
