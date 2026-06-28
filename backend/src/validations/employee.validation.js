const { z } = require('zod');

const createSchema = z.object({
  fullName: z.string().min(2).max(150),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  dateOfJoining: z.string().optional(),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED']).optional(),
  salaryType: z.enum(['MONTHLY', 'DAILY', 'PIECE_RATE']).optional(),
  baseSalary: z.number().nonnegative().optional(),
  pieceRate: z.number().nonnegative().optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  bankIfsc: z.string().max(20).optional().nullable(),
  emergencyContactName: z.string().max(150).optional().nullable(),
  emergencyContactPhone: z.string().max(30).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  createUserAccount: z.boolean().optional(),
  userEmail: z.string().email().optional(),
  userPassword: z.string().min(8).optional(),
  userRole: z.enum(['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER', 'ACCOUNTANT']).optional(),
});

const updateSchema = createSchema.partial().omit({ createUserAccount: true, userEmail: true, userPassword: true, userRole: true });

const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'SUSPENDED']).optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = { createSchema, updateSchema, listQuerySchema, idParamSchema };
