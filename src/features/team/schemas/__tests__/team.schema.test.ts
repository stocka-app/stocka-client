import {
  inviteMemberSchema,
  changeRoleSchema,
  memberListResponseSchema,
  invitationListResponseSchema,
  grantListResponseSchema,
} from '@/features/team/schemas/team.schema';

// ─────────────────────────────────────────────────────────────────────────────
// inviteMemberSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the invite member form schema', () => {
  describe('When the user submits a valid email and role', () => {
    it('Then the schema parses successfully', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'juan@empresa.com',
        role: 'MANAGER',
      });
      expect(result.success).toBe(true);
    });

    it('Then the optional message is accepted when provided', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'ana@empresa.com',
        role: 'BUYER',
        message: 'Bienvenida al equipo',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Bienvenida al equipo');
      }
    });
  });

  describe('When the email field is empty', () => {
    it('Then validation fails with the emailRequired error', () => {
      const result = inviteMemberSchema.safeParse({ email: '', role: 'VIEWER' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain('invite.validation.emailRequired');
      }
    });
  });

  describe('When the email format is invalid', () => {
    it('Then validation fails with the emailInvalid error', () => {
      const result = inviteMemberSchema.safeParse({ email: 'not-an-email', role: 'VIEWER' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain('invite.validation.emailInvalid');
      }
    });
  });

  describe('When the message exceeds 200 characters', () => {
    it('Then validation fails', () => {
      const result = inviteMemberSchema.safeParse({
        email: 'test@test.com',
        role: 'VIEWER',
        message: 'a'.repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('When the role is an invalid value', () => {
    it('Then validation fails', () => {
      const result = inviteMemberSchema.safeParse({ email: 'test@test.com', role: 'SUPERADMIN' });
      expect(result.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// changeRoleSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the change role schema', () => {
  describe('When valid memberId and role are provided', () => {
    it('Then the schema parses successfully', () => {
      const result = changeRoleSchema.safeParse({
        memberId: '550e8400-e29b-41d4-a716-446655440000',
        newRole: 'PARTNER',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When memberId is not a valid UUID', () => {
    it('Then validation fails', () => {
      const result = changeRoleSchema.safeParse({
        memberId: 'not-a-uuid',
        newRole: 'MANAGER',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('When newRole is an invalid value', () => {
    it('Then validation fails', () => {
      const result = changeRoleSchema.safeParse({
        memberId: '550e8400-e29b-41d4-a716-446655440000',
        newRole: 'INVALID_ROLE',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// memberListResponseSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the member list API response schema', () => {
  describe('When the API returns a valid member list', () => {
    it('Then the schema parses successfully', () => {
      const result = memberListResponseSchema.safeParse({
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            userId: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Roberto Medina',
            email: 'roberto@stocka.mx',
            role: 'OWNER',
            status: 'ACTIVE',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        success: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When the API returns an empty member list', () => {
    it('Then the schema parses successfully with an empty array', () => {
      const result = memberListResponseSchema.safeParse({ data: [], success: true });
      expect(result.success).toBe(true);
    });
  });

  describe('When a member is missing a required field', () => {
    it('Then validation fails', () => {
      const result = memberListResponseSchema.safeParse({
        data: [{ id: '550e8400-e29b-41d4-a716-446655440000' }],
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// invitationListResponseSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the invitation list API response schema', () => {
  describe('When the API returns a valid invitation list', () => {
    it('Then the schema parses successfully', () => {
      const result = invitationListResponseSchema.safeParse({
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'invited@empresa.com',
            role: 'BUYER',
            sentAt: '2026-03-01T10:00:00.000Z',
            expiresAt: '2026-03-04T10:00:00.000Z',
            status: 'PENDING',
          },
        ],
        success: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When an invitation has an invalid status', () => {
    it('Then validation fails', () => {
      const result = invitationListResponseSchema.safeParse({
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'invited@empresa.com',
            role: 'BUYER',
            sentAt: '2026-03-01T10:00:00.000Z',
            expiresAt: '2026-03-04T10:00:00.000Z',
            status: 'UNKNOWN_STATUS',
          },
        ],
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// grantListResponseSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the grant list API response schema', () => {
  describe('When the API returns a valid grant list', () => {
    it('Then the schema parses successfully', () => {
      const result = grantListResponseSchema.safeParse({
        data: [
          {
            memberId: '550e8400-e29b-41d4-a716-446655440003',
            action: 'MEMBER_INVITE',
            grantedAt: '2026-03-10T00:00:00.000Z',
            grantedBy: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
        success: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When a grant contains an invalid action', () => {
    it('Then validation fails', () => {
      const result = grantListResponseSchema.safeParse({
        data: [
          {
            memberId: '550e8400-e29b-41d4-a716-446655440003',
            action: 'INVALID_ACTION',
            grantedAt: '2026-03-10T00:00:00.000Z',
            grantedBy: '550e8400-e29b-41d4-a716-446655440000',
          },
        ],
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});
