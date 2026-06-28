const { z } = require('zod');

const createInventoryItemSchema = z.object({
  itemCode: z.string().min(1).max(50),
  name: z.string().min(2).max(150),
  category: z.enum(['RAW_MATERIAL', 'YARN', 'CHEMICAL', 'SPARE_PART', 'PACKING_MATERIAL', 'FINISHED_GOODS', 'OTHER']).optional(),
  unit: z.string().max(20).optional(),
  openingStock: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  maxStockLevel: z.number().nonnegative().optional().nullable(),
  unitCost: z.number().nonnegative().optional(),
  warehouseLocation: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});
const updateInventoryItemSchema = createInventoryItemSchema.partial().omit({ itemCode: true, openingStock: true });

const inventoryListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStockOnly: z.enum(['true', 'false']).optional(),
  sortBy: z.string().optional(),
  sortDir: z.string().optional(),
  format: z.enum(['csv', 'excel', 'pdf']).optional(),
});

const createTransactionSchema = z.object({
  inventoryItemId: z.string().uuid(),
  txnType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN']),
  quantity: z.number(),
  unitCost: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const transactionListQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  inventoryItemId: z.string().uuid().optional(),
  txnType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const idParamSchema = z.object({ id: z.string().uuid() });

module.exports = {
  createInventoryItemSchema, updateInventoryItemSchema, inventoryListQuerySchema,
  createTransactionSchema, transactionListQuerySchema, idParamSchema,
};
