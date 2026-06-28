const { z } = require('zod');

const createSupplierSchema = z.object({
  supplierCode: z.string().min(1).max(50),
  name: z.string().min(2).max(150),
  contactPerson: z.string().max(150).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  gstNumber: z.string().max(50).optional().nullable(),
  paymentTerms: z.string().max(100).optional().nullable(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
});
const updateSupplierSchema = createSupplierSchema.partial().omit({ supplierCode: true });

const poItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantityOrdered: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

const createPOSchema = z.object({
  poNumber: z.string().min(1).max(50),
  supplierId: z.string().uuid(),
  orderDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional().nullable(),
  taxAmount: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(poItemSchema).min(1),
});

const updatePOStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']),
});

const receivePOSchema = z.object({
  receipts: z.array(
    z.object({
      poItemId: z.string().uuid(),
      quantityReceived: z.number().positive(),
    })
  ).min(1),
});

const idParamSchema = z.object({ id: z.string().uuid() });
const listQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

module.exports = {
  createSupplierSchema, updateSupplierSchema,
  createPOSchema, updatePOStatusSchema, receivePOSchema,
  idParamSchema, listQuerySchema,
};
