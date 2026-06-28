const { z } = require('zod');

const createQCSchema = z.object({
  fabricRollId: z.string().uuid(),
  inspectedBy: z.string().uuid().optional().nullable(),
  result: z.enum(['PASS', 'FAIL', 'REWORK']),
  defectType: z.string().max(100).optional().nullable(),
  defectPoints: z.number().int().nonnegative().optional(),
  grade: z.string().max(10).optional().nullable(),
  remarks: z.string().optional().nullable(),
});

const createPackingSchema = z.object({
  fabricRollId: z.string().uuid(),
  packedBy: z.string().uuid().optional().nullable(),
  packageWeightKg: z.number().positive().optional().nullable(),
  packageType: z.string().max(50).optional(),
});

const createVehicleSchema = z.object({
  vehicleNumber: z.string().min(1).max(50),
  vehicleType: z.string().max(50).optional().nullable(),
  driverName: z.string().max(150).optional().nullable(),
  driverPhone: z.string().max(30).optional().nullable(),
  capacityKg: z.number().positive().optional().nullable(),
});
const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'OUT_OF_SERVICE']).optional(),
  isActive: z.boolean().optional(),
});

const createDispatchSchema = z.object({
  salesOrderId: z.string().uuid(),
  vehicleId: z.string().uuid().optional().nullable(),
  dispatchDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      packingRecordId: z.string().uuid(),
    })
  ).min(1),
});

const markDeliveredSchema = z.object({});

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

module.exports = {
  createQCSchema, createPackingSchema, createVehicleSchema, updateVehicleSchema,
  createDispatchSchema, markDeliveredSchema, idParamSchema, listQuerySchema,
};
