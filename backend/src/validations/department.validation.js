const { z } = require('zod');

const createSchema = z.object({
  name: z.string().min(2).max(150),
  code: z.string().min(2).max(30),
  description: z.string().max(1000).optional().nullable(),
  parentDepartmentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = { createSchema, updateSchema, listQuerySchema, idParamSchema };
