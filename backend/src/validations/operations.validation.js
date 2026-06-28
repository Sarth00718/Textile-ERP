const { z } = require('zod');

const createExpenseSchema = z.object({
  category: z.enum(['RAW_MATERIAL', 'UTILITY', 'SALARY', 'MAINTENANCE', 'TRANSPORT', 'ADMIN', 'OTHER']),
  description: z.string().min(2).max(255),
  amount: z.number().positive(),
  expenseDate: z.string().optional(),
  departmentId: z.string().uuid().optional().nullable(),
  paymentMethod: z.string().max(50).optional(),
  receiptUrl: z.string().url().optional().nullable(),
});
const updateExpenseSchema = createExpenseSchema.partial();

const createElectricitySchema = z.object({
  readingDate: z.string(),
  departmentId: z.string().uuid().optional().nullable(),
  machineId: z.string().uuid().optional().nullable(),
  meterReading: z.number().nonnegative(),
  unitsConsumed: z.number().nonnegative(),
});

const createWaterSchema = z.object({
  readingDate: z.string(),
  departmentId: z.string().uuid().optional().nullable(),
  meterReading: z.number().nonnegative(),
  unitsConsumed: z.number().nonnegative(),
});

const createProductivitySchema = z.object({
  employeeId: z.string().uuid(),
  productionDate: z.string(),
  machineId: z.string().uuid().optional().nullable(),
  quantityProducedMeters: z.number().nonnegative().optional(),
  hoursWorked: z.number().nonnegative().optional(),
  defectCount: z.number().int().nonnegative().optional(),
});

const createWasteSchema = z.object({
  wasteDate: z.string().optional(),
  wasteType: z.enum(['YARN_WASTE', 'FABRIC_WASTE', 'PROCESS_WASTE', 'OTHER']),
  sourceMachineId: z.string().uuid().optional().nullable(),
  productionOrderId: z.string().uuid().optional().nullable(),
  quantityKg: z.number().positive(),
  disposalMethod: z.string().max(100).optional().nullable(),
  recoveryValue: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

module.exports = {
  createExpenseSchema, updateExpenseSchema,
  createElectricitySchema, createWaterSchema,
  createProductivitySchema, createWasteSchema,
  idParamSchema, listQuerySchema,
};
