const { z } = require('zod');

const generateSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
});

const idParamSchema = z.object({ id: z.string().uuid() });

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

module.exports = { generateSchema, idParamSchema, listQuerySchema };
