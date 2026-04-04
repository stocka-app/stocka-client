import { z } from 'zod';

export const storageTypeSchema = z.enum(['CUSTOM_ROOM', 'STORE_ROOM', 'WAREHOUSE']);

export const storageStatusSchema = z.enum(['ACTIVE', 'FROZEN', 'ARCHIVED']);

export const storageSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(2).max(80),
  type: storageTypeSchema,
  status: storageStatusSchema,
  address: z.string().max(255).nullable(),
  roomType: z.string().nullable(),
  icon: z.string(),
  color: z.string(),
  description: z.string().nullable(),
  archivedAt: z.string().nullable(),
  frozenAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const storageFormBaseSchema = z.object({
  name: z.string().min(2, 'Name is required').max(80, 'Name too long'),
  type: storageTypeSchema,
  address: z.string().max(255).optional(),
});

export const createStorageSchema = storageFormBaseSchema.superRefine((data, ctx) => {
  if (data.type === 'WAREHOUSE' && (!data.address || data.address.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Address is required for Warehouse',
      path: ['address'],
    });
  }
});

export const updateStorageSchema = storageFormBaseSchema.partial().extend({
  name: z.string().min(2).max(80).optional(),
});

export const storagesListSchema = z.array(storageSchema);

export const storagesPageSchema = z.object({
  items: z.array(storageSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

// ── Create drawer schemas ────────────────────────────────────────────────────

export const createWarehouseFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must be 80 characters or less'),
  address: z.string().min(1, 'Address is required').max(200, 'Address must be 200 characters or less'),
  description: z
    .string()
    .max(300, 'Description must be 300 characters or less')
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine((val) => val === undefined || val.length >= 5, {
      message: 'Description must be at least 5 characters if provided',
    }),
});

export const createStoreRoomFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must be 80 characters or less'),
  address: z.string().min(1, 'Address is required').max(200, 'Address must be 200 characters or less'),
  description: z
    .string()
    .max(300, 'Description must be 300 characters or less')
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine((val) => val === undefined || val.length >= 5, {
      message: 'Description must be at least 5 characters if provided',
    }),
});

export const createCustomRoomFormSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must be 80 characters or less'),
  address: z.string().min(1, 'Address is required').max(200, 'Address must be 200 characters or less'),
  description: z
    .string()
    .max(300, 'Description must be 300 characters or less')
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine((val) => val === undefined || val.length >= 5, {
      message: 'Description must be at least 5 characters if provided',
    }),
  icon: z.string().default('restaurant'),
  color: z.string().default('#0D9488'),
});

export type CreateStorageFormData = z.infer<typeof createStorageSchema>;
export type UpdateStorageFormData = z.infer<typeof updateStorageSchema>;
export type CreateWarehouseFormData = z.infer<typeof createWarehouseFormSchema>;
export type CreateStoreRoomFormData = z.infer<typeof createStoreRoomFormSchema>;
export type CreateCustomRoomFormData = z.infer<typeof createCustomRoomFormSchema>;
