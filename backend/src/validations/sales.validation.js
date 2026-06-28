const { z } = require('zod');

const createCustomerSchema = z.object({
  customerCode: z.string().min(1).max(50),
  name: z.string().min(2).max(150),
  contactPerson: z.string().max(150).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  gstNumber: z.string().max(50).optional().nullable(),
  creditLimit: z.number().nonnegative().optional(),
  paymentTerms: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});
const updateCustomerSchema = createCustomerSchema.partial().omit({ customerCode: true });

const soItemSchema = z.object({
  fabricDesignId: z.string().uuid(),
  quantityMeters: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const createSOSchema = z.object({
  soNumber: z.string().min(1).max(50),
  customerId: z.string().uuid(),
  orderDate: z.string().optional(),
  requiredByDate: z.string().optional().nullable(),
  taxAmount: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(soItemSchema).min(1),
});

const updateSOStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'CANCELLED']),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
});

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

module.exports = {
  createCustomerSchema, updateCustomerSchema,
  createSOSchema, updateSOStatusSchema, recordPaymentSchema,
  idParamSchema, listQuerySchema,
};
