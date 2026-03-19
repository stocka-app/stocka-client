import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Enum schemas
// ─────────────────────────────────────────────────────────────────────────────

export const TenantRoleSchema = z.enum([
  'OWNER',
  'PARTNER',
  'MANAGER',
  'BUYER',
  'WAREHOUSE_KEEPER',
  'SALES_REP',
  'VIEWER',
]);

export const MemberStatusSchema = z.enum(['ACTIVE', 'SUSPENDED']);

export const InvitationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']);

export const RBACActionSchema = z.enum([
  'VIEW_ORG_CONFIG',
  'EDIT_ORG_CONFIG',
  'VIEW_MEMBERS',
  'INVITE_MEMBERS',
  'CHANGE_MEMBER_ROLE',
  'REMOVE_MEMBER',
  'VIEW_PRODUCTS',
  'CREATE_PRODUCT',
  'EDIT_PRODUCT',
  'DELETE_PRODUCT',
  'VIEW_SPACES',
  'CREATE_EDIT_SPACE',
  'VIEW_REPORTS',
  'EXPORT_REPORTS',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Entity schemas
// ─────────────────────────────────────────────────────────────────────────────

export const TenantMemberSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: TenantRoleSchema,
  status: MemberStatusSchema,
  joinedAt: z.string().datetime(),
});

export const PendingInvitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: TenantRoleSchema,
  sentAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  status: InvitationStatusSchema,
});

export const IndividualGrantSchema = z.object({
  memberId: z.string().uuid(),
  action: RBACActionSchema,
  grantedAt: z.string().datetime(),
  grantedBy: z.string().uuid(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Form schemas
// ─────────────────────────────────────────────────────────────────────────────

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'invite.validation.emailRequired')
    .email('invite.validation.emailInvalid'),
  role: TenantRoleSchema.refine((val) => val !== undefined, {
    message: 'invite.validation.roleRequired',
  }),
  message: z.string().max(200).optional(),
});

export const changeRoleSchema = z.object({
  memberId: z.string().uuid(),
  newRole: TenantRoleSchema,
});

// ─────────────────────────────────────────────────────────────────────────────
// API response schemas
// ─────────────────────────────────────────────────────────────────────────────

export const memberListResponseSchema = z.object({
  data: z.array(TenantMemberSchema),
  success: z.boolean(),
});

export const invitationListResponseSchema = z.object({
  data: z.array(PendingInvitationSchema),
  success: z.boolean(),
});

export const grantListResponseSchema = z.object({
  data: z.array(IndividualGrantSchema),
  success: z.boolean(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────────────────────────────────────

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
export type ChangeRoleFormData = z.infer<typeof changeRoleSchema>;
export type MemberListResponse = z.infer<typeof memberListResponseSchema>;
export type InvitationListResponse = z.infer<typeof invitationListResponseSchema>;
export type GrantListResponse = z.infer<typeof grantListResponseSchema>;
