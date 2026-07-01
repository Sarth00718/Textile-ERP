const { z } = require('zod');

const reportListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  productionOrderId: z.string().uuid().optional(),
  category: z.string().optional(),
  lowStockOnly: z.enum(['true', 'false']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  periodMonth: z.string().optional(),
  periodYear: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

module.exports = { reportListQuerySchema };