const { z } = require('zod');

// ---- Production Plans ----
const createPlanSchema = z.object({
  planCode: z.string().min(1).max(50),
  fabricDesignId: z.string().uuid(),
  plannedQuantityMeters: z.number().positive(),
  startDate: z.string(),
  endDate: z.string(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  notes: z.string().optional().nullable(),
});
const updatePlanSchema = createPlanSchema.partial();

// ---- Work Orders ----
const createWorkOrderSchema = z.object({
  workOrderNo: z.string().min(1).max(50),
  productionPlanId: z.string().uuid().optional().nullable(),
  fabricDesignId: z.string().uuid(),
  salesOrderId: z.string().uuid().optional().nullable(),
  targetQuantityMeters: z.number().positive(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});
const updateWorkOrderSchema = z.object({
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  targetQuantityMeters: z.number().positive().optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

// ---- Production Orders ----
const createProductionOrderSchema = z.object({
  productionOrderNo: z.string().min(1).max(50),
  workOrderId: z.string().uuid(),
  machineId: z.string().uuid(),
  beamId: z.string().uuid().optional().nullable(),
  targetQuantityMeters: z.number().positive(),
  assignedOperatorId: z.string().uuid().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});
const updateProductionOrderSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  assignedOperatorId: z.string().uuid().optional().nullable(),
  beamId: z.string().uuid().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// ---- Daily Production Entry ----
const createDailyEntrySchema = z.object({
  productionOrderId: z.string().uuid(),
  entryDate: z.string().optional(),
  shiftName: z.string().max(50).optional(),
  operatorId: z.string().uuid().optional().nullable(),
  quantityProducedMeters: z.number().positive(),
  quantityRejectedMeters: z.number().nonnegative().optional(),
  yarnConsumedKg: z.number().nonnegative().optional(),
  machineRuntimeMinutes: z.number().int().nonnegative().optional(),
  remarks: z.string().optional().nullable(),
  rawMaterialItemId: z.string().uuid().optional().nullable(),
  rawMaterialQuantity: z.number().nonnegative().optional(),
  createFabricRoll: z.boolean().optional(),
  rollWeightKg: z.number().positive().optional().nullable(),
  warehouseLocation: z.string().max(100).optional().nullable(),
});

// ---- Fabric Rolls ----
const updateRollStatusSchema = z.object({
  status: z.enum(['PRODUCED', 'IN_QC', 'QC_PASSED', 'QC_FAILED', 'PACKED', 'DISPATCHED']),
  warehouseLocation: z.string().max(100).optional().nullable(),
});

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

module.exports = {
  createPlanSchema, updatePlanSchema,
  createWorkOrderSchema, updateWorkOrderSchema,
  createProductionOrderSchema, updateProductionOrderSchema,
  createDailyEntrySchema,
  updateRollStatusSchema,
  idParamSchema, listQuerySchema,
};
