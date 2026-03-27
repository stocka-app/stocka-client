import {
  consentSchema,
  preferencesSchema,
  businessProfileSchema,
  invitationCodeSchema,
} from '@/features/onboarding/schemas/onboarding.schema';

// ---------------------------------------------------------------------------
// consentSchema
// ---------------------------------------------------------------------------

describe('consentSchema', () => {
  describe('Given the user has accepted the terms', () => {
    describe('When the consent form is submitted with terms=true', () => {
      it('Then the schema parses successfully', () => {
        const result = consentSchema.safeParse({ terms: true, marketing: false });
        expect(result.success).toBe(true);
      });

      it('Then marketing and analytics default to true when omitted', () => {
        const result = consentSchema.safeParse({ terms: true });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.marketing).toBe(true);
          expect(result.data.analytics).toBe(true);
        }
      });
    });

    describe('When the user also opts into marketing', () => {
      it('Then the schema parses with marketing=true', () => {
        const result = consentSchema.safeParse({ terms: true, marketing: true });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.marketing).toBe(true);
        }
      });
    });
  });

  describe('Given the user has NOT accepted the terms', () => {
    describe('When the consent form is submitted with terms=false', () => {
      it('Then the schema rejects the submission', () => {
        const result = consentSchema.safeParse({ terms: false, marketing: false });
        expect(result.success).toBe(false);
      });

      it('Then the error is on the terms field', () => {
        const result = consentSchema.safeParse({ terms: false, marketing: false });
        if (!result.success) {
          const termError = result.error.issues.find((issue) => issue.path.includes('terms'));
          expect(termError).toBeDefined();
        }
      });
    });

    describe('When terms is missing entirely', () => {
      it('Then the schema rejects the submission', () => {
        const result = consentSchema.safeParse({ marketing: false });
        expect(result.success).toBe(false);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// preferencesSchema
// ---------------------------------------------------------------------------

describe('preferencesSchema', () => {
  describe('Given the user submits valid preferences', () => {
    describe('When language, currency, and theme are all valid', () => {
      it('Then Spanish / MXN / light is accepted', () => {
        const result = preferencesSchema.safeParse({
          language: 'es',
          currency: 'MXN',
          theme: 'light',
        });
        expect(result.success).toBe(true);
      });

      it('Then English / USD / dark is accepted', () => {
        const result = preferencesSchema.safeParse({
          language: 'en',
          currency: 'USD',
          theme: 'dark',
        });
        expect(result.success).toBe(true);
      });

      it('Then EUR currency is accepted', () => {
        const result = preferencesSchema.safeParse({
          language: 'es',
          currency: 'EUR',
          theme: 'light',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given the user submits invalid preferences', () => {
    describe('When an unsupported language is submitted', () => {
      it('Then the schema rejects it', () => {
        const result = preferencesSchema.safeParse({
          language: 'fr',
          currency: 'MXN',
          theme: 'light',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('When an unsupported currency is submitted', () => {
      it('Then the schema rejects it', () => {
        const result = preferencesSchema.safeParse({
          language: 'en',
          currency: 'GBP',
          theme: 'light',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('When an unsupported theme is submitted', () => {
      it('Then the schema rejects it', () => {
        const result = preferencesSchema.safeParse({
          language: 'en',
          currency: 'MXN',
          theme: 'system',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// businessProfileSchema
// ---------------------------------------------------------------------------

describe('businessProfileSchema', () => {
  describe('Given the user submits a valid business profile', () => {
    describe('When all required fields are present and valid', () => {
      it('Then the schema parses successfully', () => {
        const result = businessProfileSchema.safeParse({
          businessName: 'Ferretería Central',
          businessType: 'RETAIL',
          country: 'MX',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given the user submits a business name that is too short', () => {
    describe('When businessName has only 1 character', () => {
      it('Then the schema rejects it with a length error', () => {
        const result = businessProfileSchema.safeParse({
          businessName: 'A',
          businessType: 'RETAIL',
          country: 'MX',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameError = result.error.issues.find((i) => i.path.includes('businessName'));
          expect(nameError?.message).toBe('step3.businessNameTooShort');
        }
      });
    });

    describe('When businessName is empty', () => {
      it('Then the schema rejects it with a required error', () => {
        const result = businessProfileSchema.safeParse({
          businessName: '',
          businessType: 'RETAIL',
          country: 'MX',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameError = result.error.issues.find((i) => i.path.includes('businessName'));
          expect(nameError).toBeDefined();
        }
      });
    });
  });

  describe('Given the user submits a business name that is too long', () => {
    describe('When businessName exceeds 100 characters', () => {
      it('Then the schema rejects it with a max length error', () => {
        const longName = 'A'.repeat(101);
        const result = businessProfileSchema.safeParse({
          businessName: longName,
          businessType: 'RETAIL',
          country: 'MX',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameError = result.error.issues.find((i) => i.path.includes('businessName'));
          expect(nameError?.message).toBe('step3.businessNameTooLong');
        }
      });
    });
  });

  describe('Given the user omits the business type', () => {
    describe('When businessType is missing', () => {
      it('Then the schema rejects it', () => {
        const result = businessProfileSchema.safeParse({
          businessName: 'Mi Negocio',
          country: 'MX',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('When businessType is an unrecognized string', () => {
      it('Then the schema rejects it with the custom error message', () => {
        const result = businessProfileSchema.safeParse({
          businessName: 'Mi Negocio',
          businessType: 'INVALID_TYPE',
          country: 'MX',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const issue = result.error.issues.find((i) => i.path[0] === 'businessType');
          expect(issue?.message).toBe('step3.businessTypeRequired');
        }
      });
    });
  });

  describe('Given the user omits the country', () => {
    describe('When country is empty', () => {
      it('Then the schema rejects it', () => {
        const result = businessProfileSchema.safeParse({
          businessName: 'Mi Negocio',
          businessType: 'SERVICES',
          country: '',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Given all 9 business types', () => {
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
    ];

    validTypes.forEach((type) => {
      it(`Then ${type} is accepted`, () => {
        const result = businessProfileSchema.safeParse({
          businessName: 'Mi Negocio',
          businessType: type,
          country: 'MX',
        });
        expect(result.success).toBe(true);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// invitationCodeSchema
// ---------------------------------------------------------------------------

describe('invitationCodeSchema', () => {
  describe('Given the user enters a valid 8-character alphanumeric code', () => {
    describe('When the code is all uppercase letters and numbers', () => {
      it('Then ABC12345 is accepted', () => {
        const result = invitationCodeSchema.safeParse({ code: 'ABC12345' });
        expect(result.success).toBe(true);
      });

      it('Then 12345678 (all numbers) is accepted', () => {
        const result = invitationCodeSchema.safeParse({ code: '12345678' });
        expect(result.success).toBe(true);
      });

      it('Then ABCDEFGH (all letters) is accepted', () => {
        const result = invitationCodeSchema.safeParse({ code: 'ABCDEFGH' });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Given the user enters a code that is too short', () => {
    describe('When the code has fewer than 8 characters', () => {
      it('Then a 7-character code is rejected', () => {
        const result = invitationCodeSchema.safeParse({ code: 'ABC1234' });
        expect(result.success).toBe(false);
      });

      it('Then an empty code is rejected', () => {
        const result = invitationCodeSchema.safeParse({ code: '' });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Given the user enters a code that is too long', () => {
    describe('When the code has more than 8 characters', () => {
      it('Then a 9-character code is rejected', () => {
        const result = invitationCodeSchema.safeParse({ code: 'ABC123456' });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Given the user enters a code with invalid characters', () => {
    describe('When the code contains lowercase letters', () => {
      it('Then abc12345 is rejected', () => {
        const result = invitationCodeSchema.safeParse({ code: 'abc12345' });
        expect(result.success).toBe(false);
      });
    });

    describe('When the code contains special characters', () => {
      it('Then ABC-1234 is rejected', () => {
        const result = invitationCodeSchema.safeParse({ code: 'ABC-1234' });
        expect(result.success).toBe(false);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// consentSchema — refine validation
// ---------------------------------------------------------------------------

describe('consentSchema refine validation', () => {
  describe('Given the user rejects the terms', () => {
    describe('When the form is parsed with terms=false', () => {
      it('Then the schema fails validation', () => {
        const result = consentSchema.safeParse({ terms: false, marketing: false });
        expect(result.success).toBe(false);
      });

      it('Then the error is on the terms field with the custom message', () => {
        const result = consentSchema.safeParse({ terms: false, marketing: false });
        if (!result.success) {
          const termIssue = result.error.issues.find((i) => i.path.includes('terms'));
          expect(termIssue?.message).toBe('step1.termsRequired');
        }
      });
    });
  });
});
