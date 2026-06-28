const { z } = require('zod');

const createBeamSchema = z.object({
  beamCode: z.string().min(1).max(50),
  beamType: z.string().max(50).optional(),
  yarnCount: z.string().max(50).optional().nullable(),
  totalEnds: z.number().int().positive().optional().nullable(),
  lengthMeters: z.number().positive().optional().nullable(),
});

const updateBeamSchema = createBeamSchema.partial().extend({
  status: z.enum(['IN_STOCK', 'ALLOCATED', 'IN_USE', 'EMPTY', 'DAMAGED']).optional(),
});

const beamListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  status: z.enum(['IN_STOCK', 'ALLOCATED', 'IN_USE', 'EMPTY', 'DAMAGED']).optional(),
  search: z.string().optional(),
});

const allocateSchema = z.object({
  beamId: z.string().uuid(),
  machineId: z.string().uuid(),
  notes: z.string().optional().nullable(),
});

const releaseSchema = z.object({
  metersUsed: z.number().nonnegative().optional(),
});

const allocationListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  machineId: z.string().uuid().optional(),
  beamId: z.string().uuid().optional(),
  activeOnly: z.enum(['true', 'false']).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = {
  createBeamSchema, updateBeamSchema, beamListQuerySchema,
  allocateSchema, releaseSchema, allocationListQuerySchema, idParamSchema,
};
