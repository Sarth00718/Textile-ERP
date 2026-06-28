const { z } = require('zod');

const createSchema = z.object({
  machineCode: z.string().min(1).max(50),
  name: z.string().min(2).max(150),
  machineType: z.string().min(1).max(100),
  manufacturer: z.string().max(150).optional().nullable(),
  modelNumber: z.string().max(100).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  installationDate: z.string().optional().nullable(),
  ratedSpeed: z.number().nonnegative().optional().nullable(),
  ratedPowerKw: z.number().nonnegative().optional().nullable(),
  location: z.string().max(150).optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['RUNNING', 'IDLE', 'BREAKDOWN', 'MAINTENANCE', 'OFFLINE']).optional(),
  departmentId: z.string().uuid().optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = { createSchema, updateSchema, listQuerySchema, idParamSchema };
