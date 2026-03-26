import { z } from 'zod';

export const spaceTypeSchema = z.enum(['CUSTOM_ROOM', 'STORE_ROOM', 'WAREHOUSE']);

export const spaceStatusSchema = z.enum(['ACTIVE', 'FROZEN', 'ARCHIVED']);

export const spaceSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: spaceTypeSchema,
  status: spaceStatusSchema,
  address: z.string().max(255).nullable(),
  roomType: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const spaceFormBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: spaceTypeSchema,
  address: z.string().max(255).optional(),
});

export const createSpaceSchema = spaceFormBaseSchema.superRefine((data, ctx) => {
  if (data.type === 'WAREHOUSE' && (!data.address || data.address.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Address is required for Warehouse',
      path: ['address'],
    });
  }
});

export const updateSpaceSchema = spaceFormBaseSchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
});

export const spacesListSchema = z.array(spaceSchema);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceFormData = z.infer<typeof updateSpaceSchema>;
