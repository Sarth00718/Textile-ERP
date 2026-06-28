const { z } = require('zod');

const createLogSchema = z.object({
  machineId: z.string().uuid(),
  eventType: z.enum(['START', 'STOP', 'BREAKDOWN', 'MAINTENANCE', 'IDLE']),
  operatorId: z.string().uuid().optional().nullable(),
  shiftName: z.string().max(50).optional().nullable(),
  meterReading: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const logListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  machineId: z.string().uuid().optional(),
  eventType: z.enum(['START', 'STOP', 'BREAKDOWN', 'MAINTENANCE', 'IDLE']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const createBreakdownSchema = z.object({
  machineId: z.string().uuid(),
  reportedBy: z.string().uuid().optional().nullable(),
  issueDescription: z.string().min(2),
});

const resolveBreakdownSchema = z.object({
  resolvedBy: z.string().uuid().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
});

const breakdownListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  machineId: z.string().uuid().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']).optional(),
});

const createMaintenanceSchema = z.object({
  machineId: z.string().uuid(),
  maintenanceType: z.enum(['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE']).optional(),
  scheduledDate: z.string(),
  performedBy: z.string().uuid().optional().nullable(),
  cost: z.number().nonnegative().optional(),
  description: z.string().optional().nullable(),
});

const updateMaintenanceSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  completedDate: z.string().optional().nullable(),
  performedBy: z.string().uuid().optional().nullable(),
  cost: z.number().nonnegative().optional(),
  description: z.string().optional().nullable(),
  partsReplaced: z.string().optional().nullable(),
});

const maintenanceListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  machineId: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = {
  createLogSchema,
  logListQuerySchema,
  createBreakdownSchema,
  resolveBreakdownSchema,
  breakdownListQuerySchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceListQuerySchema,
  idParamSchema,
};
