const { z } = require('zod');

const createSchema = z.object({
  designCode: z.string().min(1).max(50),
  name: z.string().min(2).max(150),
  fabricType: z.string().min(1).max(100),
  widthInches: z.number().positive().optional().nullable(),
  weightGsm: z.number().positive().optional().nullable(),
  warpYarnCount: z.string().max(50).optional().nullable(),
  weftYarnCount: z.string().max(50).optional().nullable(),
  weavePattern: z.string().max(100).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  standardRate: z.number().nonnegative().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  fabricType: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = { createSchema, updateSchema, listQuerySchema, idParamSchema };
