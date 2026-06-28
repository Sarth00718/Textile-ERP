const { z } = require('zod');

const markSchema = z.object({
  employeeId: z.string().uuid(),
  attendanceDate: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  shiftName: z.string().max(50).optional().nullable(),
  hoursWorked: z.number().min(0).max(24).optional(),
  overtimeHours: z.number().min(0).max(24).optional(),
  remarks: z.string().optional().nullable(),
});

const bulkMarkSchema = z.object({
  attendanceDate: z.string(),
  records: z.array(
    z.object({
      employeeId: z.string().uuid(),
      status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']),
      checkIn: z.string().optional().nullable(),
      checkOut: z.string().optional().nullable(),
      shiftName: z.string().max(50).optional().nullable(),
    })
  ).min(1),
});

const updateSchema = markSchema.partial().omit({ employeeId: true, attendanceDate: true });

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = { markSchema, bulkMarkSchema, updateSchema, listQuerySchema, idParamSchema };
