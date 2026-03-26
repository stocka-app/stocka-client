import { z } from 'zod';

export const storageTypeSchema = z.enum(['CUSTOM_ROOM', 'STORE_ROOM', 'WAREHOUSE']);

export const storageStatusSchema = z.enum(['ACTIVE', 'FROZEN', 'ARCHIVED']);

export const storageSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: storageTypeSchema,
  status: storageStatusSchema,
  address: z.string().max(255).nullable(),
  roomType: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const storageFormBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
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
  name: z.string().min(1).max(100).optional(),
});

export const storagesListSchema = z.array(storageSchema);

export type CreateStorageFormData = z.infer<typeof createStorageSchema>;
export type UpdateStorageFormData = z.infer<typeof updateStorageSchema>;
