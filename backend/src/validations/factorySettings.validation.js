const { z } = require('zod');

const emptyToNull = (val) => (val === '' ? null : val);
const emptyToUndefined = (val) => (val === '' ? undefined : val);

const updateSchema = z.object({
  factoryName: z.preprocess(emptyToUndefined, z.string().min(2).max(255).optional()),
  legalName: z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
  gstNumber: z.preprocess(emptyToNull, z.string().max(50).nullable().optional()),
  panNumber: z.preprocess(emptyToNull, z.string().max(50).nullable().optional()),
  addressLine1: z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
  addressLine2: z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
  city: z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
  state: z.preprocess(emptyToNull, z.string().max(100).nullable().optional()),
  country: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  postalCode: z.preprocess(emptyToNull, z.string().max(20).nullable().optional()),
  phone: z.preprocess(emptyToNull, z.string().max(30).nullable().optional()),
  email: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().email().nullable().optional()
  ),
  logoUrl: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().url().nullable().optional()
  ),
  fiscalYearStartMonth: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1).max(12).optional()
  ),
  defaultCurrency: z.preprocess(emptyToUndefined, z.string().max(10).optional()),
  workingDaysPerWeek: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(1).max(7).optional()
  ),
  shiftConfig: z.array(z.object({ name: z.string(), startTime: z.string(), endTime: z.string() })).optional(),
  electricityRatePerUnit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().nonnegative().optional()
  ),
  waterRatePerUnit: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().nonnegative().optional()
  ),
});

module.exports = { updateSchema };
