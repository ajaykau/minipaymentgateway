import { describe, it, expect } from 'vitest';
import { validateChargeRequest } from '../validation';

describe('Validation', () => {
  describe('validateChargeRequest', () => {
    it('should validate correct charge request', () => {
      const validRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com'
      };

      const result = validateChargeRequest(validRequest);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(validRequest);
    });

    describe('amount validation', () => {
      it('should reject negative amounts', () => {
        const request = {
          amount: -100,
          currency: 'USD',
          source: 'tok_test',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject zero amount', () => {
        const request = {
          amount: 0,
          currency: 'USD',
          source: 'tok_test',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject amounts over maximum', () => {
        const request = {
          amount: 10000001,
          currency: 'USD',
          source: 'tok_test',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject non-integer amounts', () => {
        const request = {
          amount: 100.5,
          currency: 'USD',
          source: 'tok_test',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should accept valid amounts', () => {
        const validAmounts = [1, 1000, 5000000, 10000000];

        validAmounts.forEach(amount => {
          const request = {
            amount,
            currency: 'USD',
            source: 'tok_test',
            email: 'user@example.com'
          };

          const result = validateChargeRequest(request);
          expect(result.error).toBeUndefined();
        });
      });
    });

    describe('currency validation', () => {
      it('should reject invalid currency codes', () => {
        const invalidCurrencies = [
          { currency: 'US', reason: 'too short' },
          { currency: 'USDD', reason: 'too long' },
          { currency: '123', reason: 'numbers' },
          { currency: '', reason: 'empty' },
          { currency: 'A', reason: 'too short' },
          { currency: 'ABCD', reason: 'too long' }
        ];

        invalidCurrencies.forEach(({ currency, reason }) => {
          const request = {
            amount: 1000,
            currency,
            source: 'tok_test',
            email: 'user@example.com'
          };

          const result = validateChargeRequest(request);
          expect(result.error, `Currency '${currency}' (${reason}) should be invalid`).toBeDefined();
        });
      });

      it('should accept valid currency codes', () => {
        const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];

        validCurrencies.forEach(currency => {
          const request = {
            amount: 1000,
            currency,
            source: 'tok_test',
            email: 'user@example.com'
          };

          const result = validateChargeRequest(request);
          expect(result.error).toBeUndefined();
        });
      });
    });

    describe('source validation', () => {
      it('should reject empty source', () => {
        const request = {
          amount: 1000,
          currency: 'USD',
          source: '',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject very long source', () => {
        const request = {
          amount: 1000,
          currency: 'USD',
          source: 'a'.repeat(101),
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should accept valid sources', () => {
        const validSources = ['tok_test', 'card_123', 'pm_test_card'];

        validSources.forEach(source => {
          const request = {
            amount: 1000,
            currency: 'USD',
            source,
            email: 'user@example.com'
          };

          const result = validateChargeRequest(request);
          expect(result.error).toBeUndefined();
        });
      });
    });

    describe('email validation', () => {
      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'not-an-email',
          '@example.com',
          'user@',
          'user.example.com',
          '',
          'user@.com',
          'user@com'
        ];

        invalidEmails.forEach(email => {
          const request = {
            amount: 1000,
            currency: 'USD',
            source: 'tok_test',
            email
          };

          const result = validateChargeRequest(request);
          expect(result.error).toBeDefined();
        });
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'user@example.com',
          'test.user@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com'
        ];

        validEmails.forEach(email => {
          const request = {
            amount: 1000,
            currency: 'USD',
            source: 'tok_test',
            email
          };

          const result = validateChargeRequest(request);
          expect(result.error).toBeUndefined();
        });
      });
    });

    describe('required fields', () => {
      it('should reject missing amount', () => {
        const request = {
          currency: 'USD',
          source: 'tok_test',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject missing currency', () => {
        const request = {
          amount: 1000,
          source: 'tok_test',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject missing source', () => {
        const request = {
          amount: 1000,
          currency: 'USD',
          email: 'user@example.com'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });

      it('should reject missing email', () => {
        const request = {
          amount: 1000,
          currency: 'USD',
          source: 'tok_test'
        };

        const result = validateChargeRequest(request);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject extra fields', () => {
      const request = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com',
        extraField: 'not allowed'
      };

      const result = validateChargeRequest(request);
      expect(result.error).toBeDefined();
    });
  });
});