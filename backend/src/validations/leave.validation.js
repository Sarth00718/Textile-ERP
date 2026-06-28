const { z } = require('zod');

const createSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(['SICK', 'CASUAL', 'EARNED', 'UNPAID', 'MATERNITY', 'PATERNITY']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().max(1000).optional().nullable(),
});

const approveSchema = z.object({});
const rejectSchema = z.object({
  rejectionReason: z.string().min(2).max(500),
});

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  leaveType: z.enum(['SICK', 'CASUAL', 'EARNED', 'UNPAID', 'MATERNITY', 'PATERNITY']).optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = { createSchema, approveSchema, rejectSchema, listQuerySchema, idParamSchema };
