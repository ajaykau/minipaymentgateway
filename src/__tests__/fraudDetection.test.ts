import { describe, it, expect } from 'vitest';
import { FraudDetector } from '../fraudDetection';
import { ChargeRequest } from '../types';

describe('FraudDetector', () => {
  const fraudDetector = new FraudDetector();

  describe('calculateRiskScore', () => {
    it('should return 0 for low-risk transaction', () => {
      const request: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const score = fraudDetector.calculateRiskScore(request);
      expect(score).toBe(0);
    });

    it('should add 0.3 for large amounts over $500', () => {
      const request: ChargeRequest = {
        amount: 60000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const score = fraudDetector.calculateRiskScore(request);
      expect(score).toBe(0.3);
    });

    it('should add 0.4 for suspicious domains', () => {
      const testCases = [
        'user@test.com',
        'user@domain.ru',
        'user@site.tk',
        'user@example.ml',
        'user@site.ga'
      ];

      testCases.forEach(email => {
        const request: ChargeRequest = {
          amount: 1000,
          currency: 'USD',
          source: 'tok_test',
          email
        };

        const score = fraudDetector.calculateRiskScore(request);
        expect(score).toBe(0.4);
      });
    });

    it('should add 0.2 for very large amounts over $1000', () => {
      const request: ChargeRequest = {
        amount: 150000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const score = fraudDetector.calculateRiskScore(request);
      expect(score).toBe(0.5); // 0.3 + 0.2
    });

    it('should add 0.3 for suspicious email patterns', () => {
      const testCases = ['temp@gmail.com', 'fake@example.com'];

      testCases.forEach(email => {
        const request: ChargeRequest = {
          amount: 1000,
          currency: 'USD',
          source: 'tok_test',
          email
        };

        const score = fraudDetector.calculateRiskScore(request);
        expect(score).toBe(0.3);
      });
    });

    it('should combine multiple risk factors', () => {
      const request: ChargeRequest = {
        amount: 200000,
        currency: 'USD',
        source: 'tok_test',
        email: 'temp@test.com'
      };

      const score = fraudDetector.calculateRiskScore(request);
      expect(score).toBe(1.0); // 0.3 + 0.4 + 0.2 + 0.3 = 1.2, capped at 1.0
    });

    it('should cap risk score at 1.0', () => {
      const request: ChargeRequest = {
        amount: 500000,
        currency: 'USD',
        source: 'tok_test',
        email: 'fake@test.com'
      };

      const score = fraudDetector.calculateRiskScore(request);
      expect(score).toBe(1.0);
    });
  });

  describe('shouldBlock', () => {
    it('should not block low risk scores', () => {
      expect(fraudDetector.shouldBlock(0.0)).toBe(false);
      expect(fraudDetector.shouldBlock(0.3)).toBe(false);
      expect(fraudDetector.shouldBlock(0.49)).toBe(false);
    });

    it('should block high risk scores', () => {
      expect(fraudDetector.shouldBlock(0.5)).toBe(true);
      expect(fraudDetector.shouldBlock(0.7)).toBe(true);
      expect(fraudDetector.shouldBlock(1.0)).toBe(true);
    });

    it('should block exactly at threshold', () => {
      expect(fraudDetector.shouldBlock(0.5)).toBe(true);
    });
  });
});