import {
  updateOrgSchema,
  cancelOrgSchema,
  transferOwnershipSchema,
  orgProfileResponseSchema,
  tierQuotasResponseSchema,
  auditLogResponseSchema,
} from '@/features/organization/schemas/organization.schema';

// =============================================================================
// updateOrgSchema
// =============================================================================

describe('updateOrgSchema', () => {
  describe('Given the user submits a valid organization profile update', () => {
    describe('When all required fields are valid', () => {
      it('Then the schema parses successfully', () => {
        const result = updateOrgSchema.safeParse({
          name: 'Mi Negocio',
          businessType: 'RETAIL',
          rfc: 'ABC123456789',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When rfc is omitted (optional field)', () => {
      it('Then the schema still parses successfully', () => {
        const result = updateOrgSchema.safeParse({
          name: 'Mi Negocio',
          businessType: 'RETAIL',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When rfc is an empty string', () => {
      it('Then the schema parses it as an empty string (allowed)', () => {
        const result = updateOrgSchema.safeParse({
          name: 'Mi Negocio',
          businessType: 'SERVICES',
          rfc: '',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given the user submits an invalid name', () => {
    describe('When name is empty', () => {
      it('Then validation fails with nameRequired error', () => {
        const result = updateOrgSchema.safeParse({
          name: '',
          businessType: 'RETAIL',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('validation.nameRequired');
        }
      });
    });

    describe('When name is a single character', () => {
      it('Then validation fails with nameTooShort error', () => {
        const result = updateOrgSchema.safeParse({
          name: 'A',
          businessType: 'RETAIL',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('validation.nameTooShort');
        }
      });
    });

    describe('When name exceeds 100 characters', () => {
      it('Then validation fails with nameTooLong error', () => {
        const result = updateOrgSchema.safeParse({
          name: 'A'.repeat(101),
          businessType: 'RETAIL',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('validation.nameTooLong');
        }
      });
    });

    describe('When name is exactly 2 characters', () => {
      it('Then the schema parses successfully (boundary)', () => {
        const result = updateOrgSchema.safeParse({
          name: 'AB',
          businessType: 'RETAIL',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When name is exactly 100 characters', () => {
      it('Then the schema parses successfully (boundary)', () => {
        const result = updateOrgSchema.safeParse({
          name: 'A'.repeat(100),
          businessType: 'RETAIL',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given the user submits an invalid businessType', () => {
    describe('When businessType is not in the allowed enum', () => {
      it('Then validation fails', () => {
        const result = updateOrgSchema.safeParse({
          name: 'Mi Negocio',
          businessType: 'INVALID_TYPE',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Given the user submits an invalid rfc', () => {
    describe('When rfc exceeds 20 characters', () => {
      it('Then validation fails with rfcTooLong error', () => {
        const result = updateOrgSchema.safeParse({
          name: 'Mi Negocio',
          businessType: 'RETAIL',
          rfc: 'A'.repeat(21),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('validation.rfcTooLong');
        }
      });
    });

    describe('When rfc is exactly 20 characters', () => {
      it('Then the schema parses successfully (boundary)', () => {
        const result = updateOrgSchema.safeParse({
          name: 'Mi Negocio',
          businessType: 'RETAIL',
          rfc: 'A'.repeat(20),
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given all business types in the catalog', () => {
    const validTypes = [
      'RETAIL',
      'RESTAURANT',
      'WORKSHOP',
      'SERVICES',
      'HEALTH',
      'EDUCATION',
      'EVENTS',
      'AGRICULTURE',
      'OTHER',
    ] as const;

    validTypes.forEach((type) => {
      describe(`When businessType is ${type}`, () => {
        it('Then the schema parses successfully', () => {
          const result = updateOrgSchema.safeParse({
            name: 'Mi Negocio',
            businessType: type,
          });
          expect(result.success).toBe(true);
        });
      });
    });
  });
});

// =============================================================================
// cancelOrgSchema
// =============================================================================

describe('cancelOrgSchema', () => {
  describe('Given the user types a business name to confirm cancellation', () => {
    describe('When confirmName has a valid value', () => {
      it('Then the schema parses successfully', () => {
        const result = cancelOrgSchema.safeParse({ confirmName: 'Mi Negocio Central' });
        expect(result.success).toBe(true);
      });
    });

    describe('When confirmName is empty', () => {
      it('Then validation fails with confirmNameRequired error', () => {
        const result = cancelOrgSchema.safeParse({ confirmName: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('validation.confirmNameRequired');
        }
      });
    });
  });
});

// =============================================================================
// transferOwnershipSchema
// =============================================================================

describe('transferOwnershipSchema', () => {
  describe('Given the user selects a new owner', () => {
    describe('When newOwnerId is a valid UUID', () => {
      it('Then the schema parses successfully', () => {
        const result = transferOwnershipSchema.safeParse({
          newOwnerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When newOwnerId is not a UUID', () => {
      it('Then validation fails with newOwnerRequired error', () => {
        const result = transferOwnershipSchema.safeParse({ newOwnerId: 'not-a-uuid' });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('validation.newOwnerRequired');
        }
      });
    });

    describe('When newOwnerId is empty', () => {
      it('Then validation fails', () => {
        const result = transferOwnershipSchema.safeParse({ newOwnerId: '' });
        expect(result.success).toBe(false);
      });
    });
  });
});

// =============================================================================
// orgProfileResponseSchema
// =============================================================================

describe('orgProfileResponseSchema', () => {
  const validProfile = {
    id: 'tenant-uuid-001',
    name: 'Ferretería Central',
    slug: 'ferreteria-central',
    businessType: 'RETAIL',
    rfc: 'FCE123456789',
    logoUrl: 'https://cdn.example.com/logo.png',
    status: 'ACTIVE',
    tier: 'STARTER',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  describe('Given a valid API response', () => {
    describe('When all fields are present and valid', () => {
      it('Then the schema parses successfully', () => {
        const result = orgProfileResponseSchema.safeParse(validProfile);
        expect(result.success).toBe(true);
      });
    });

    describe('When rfc is null', () => {
      it('Then the schema parses successfully (rfc is nullable)', () => {
        const result = orgProfileResponseSchema.safeParse({ ...validProfile, rfc: null });
        expect(result.success).toBe(true);
      });
    });

    describe('When logoUrl is null', () => {
      it('Then the schema parses successfully (logoUrl is nullable)', () => {
        const result = orgProfileResponseSchema.safeParse({ ...validProfile, logoUrl: null });
        expect(result.success).toBe(true);
      });
    });

    describe('When status is SUSPENDED', () => {
      it('Then the schema parses successfully', () => {
        const result = orgProfileResponseSchema.safeParse({
          ...validProfile,
          status: 'SUSPENDED',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When status is CANCELLED', () => {
      it('Then the schema parses successfully', () => {
        const result = orgProfileResponseSchema.safeParse({
          ...validProfile,
          status: 'CANCELLED',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When tier is ENTERPRISE', () => {
      it('Then the schema parses successfully', () => {
        const result = orgProfileResponseSchema.safeParse({
          ...validProfile,
          tier: 'ENTERPRISE',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given an invalid API response', () => {
    describe('When status is an unknown value', () => {
      it('Then the schema fails to parse', () => {
        const result = orgProfileResponseSchema.safeParse({
          ...validProfile,
          status: 'PENDING',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('When tier is an unknown value', () => {
      it('Then the schema fails to parse', () => {
        const result = orgProfileResponseSchema.safeParse({
          ...validProfile,
          tier: 'PREMIUM',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('When a required field is missing', () => {
      it('Then the schema fails to parse', () => {
        const profileWithoutName = Object.fromEntries(
          Object.entries(validProfile).filter(([k]) => k !== 'name'),
        );
        const result = orgProfileResponseSchema.safeParse(profileWithoutName);
        expect(result.success).toBe(false);
      });
    });
  });
});

// =============================================================================
// tierQuotasResponseSchema
// =============================================================================

describe('tierQuotasResponseSchema', () => {
  describe('Given a valid quotas API response', () => {
    describe('When warehouses, members and products have used and max values', () => {
      it('Then the schema parses successfully', () => {
        const result = tierQuotasResponseSchema.safeParse({
          warehouses: { used: 1, max: 3 },
          members: { used: 2, max: 5 },
          products: { used: 50, max: 1000 },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('When max is -1 (unlimited quota)', () => {
      it('Then the schema parses successfully', () => {
        const result = tierQuotasResponseSchema.safeParse({
          warehouses: { used: 5, max: -1 },
          members: { used: 10, max: -1 },
          products: { used: 500, max: -1 },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given an invalid quotas API response', () => {
    describe('When a quota field is missing', () => {
      it('Then the schema fails to parse', () => {
        const result = tierQuotasResponseSchema.safeParse({
          warehouses: { used: 1, max: 3 },
          members: { used: 2, max: 5 },
        });
        expect(result.success).toBe(false);
      });
    });
  });
});

// =============================================================================
// auditLogResponseSchema
// =============================================================================

describe('auditLogResponseSchema', () => {
  const validEntry = {
    id: 'audit-uuid-001',
    timestamp: '2026-03-01T10:00:00.000Z',
    actorId: 'user-uuid-001',
    actorName: 'Roberto Medina',
    action: 'PROFILE_UPDATED',
    details: 'Changed business name',
  };

  describe('Given a valid audit log API response', () => {
    describe('When the array has one valid entry', () => {
      it('Then the schema parses successfully', () => {
        const result = auditLogResponseSchema.safeParse([validEntry]);
        expect(result.success).toBe(true);
      });
    });

    describe('When the array is empty', () => {
      it('Then the schema parses as an empty array', () => {
        const result = auditLogResponseSchema.safeParse([]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(0);
        }
      });
    });

    describe('When the array has multiple entries', () => {
      it('Then all entries are parsed', () => {
        const result = auditLogResponseSchema.safeParse([validEntry, { ...validEntry, id: 'audit-uuid-002' }]);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
        }
      });
    });
  });

  describe('Given an invalid audit log API response', () => {
    describe('When an entry is missing a required field', () => {
      it('Then the schema fails to parse', () => {
        const entryWithoutActorName = Object.fromEntries(
          Object.entries(validEntry).filter(([k]) => k !== 'actorName'),
        );
        const result = auditLogResponseSchema.safeParse([entryWithoutActorName]);
        expect(result.success).toBe(false);
      });
    });
  });
});
