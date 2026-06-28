const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  password: z.string().min(8).max(100),
  role: z.enum(['OWNER', 'MANAGER', 'SUPERVISOR', 'WORKER', 'ACCOUNTANT']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

module.exports = { registerSchema, loginSchema, refreshSchema, changePasswordSchema };
