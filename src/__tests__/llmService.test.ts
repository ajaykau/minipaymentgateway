import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMService } from '../llmService';
import { ChargeRequest } from '../types';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

describe('LLMService', () => {
  let llmService: LLMService;
  const mockRequest: ChargeRequest = {
    amount: 1000,
    currency: 'USD',
    source: 'tok_test',
    email: 'user@example.com'
  };

  beforeEach(() => {
    llmService = new LLMService();
    vi.clearAllMocks();
  });

  describe('generateExplanation', () => {
    it('should generate fallback explanation when no OpenAI key', async () => {
      const explanation = await llmService.generateExplanation(
        mockRequest,
        0.15,
        'stripe',
        false
      );

      expect(explanation).toContain('Payment routed to stripe');
      expect(explanation).toContain('low risk score');
      expect(explanation).toContain('0.15');
      expect(explanation).toContain('$10.00');
    });

    it('should generate blocked explanation', async () => {
      const explanation = await llmService.generateExplanation(
        mockRequest,
        0.75,
        null,
        true
      );

      expect(explanation).toContain('Payment blocked');
      expect(explanation).toContain('high risk score');
      expect(explanation).toContain('0.75');
    });

    it('should generate moderate risk explanation', async () => {
      const explanation = await llmService.generateExplanation(
        mockRequest,
        0.4,
        'paypal',
        false
      );

      expect(explanation).toContain('Payment routed to paypal');
      expect(explanation).toContain('moderate risk score');
      expect(explanation).toContain('0.40');
    });

    it('should cache explanations', async () => {
      const explanation1 = await llmService.generateExplanation(
        mockRequest,
        0.15,
        'stripe',
        false
      );

      const explanation2 = await llmService.generateExplanation(
        mockRequest,
        0.15,
        'stripe',
        false
      );

      expect(explanation1).toBe(explanation2);
    });

    it('should generate different explanations for different inputs', async () => {
      const explanation1 = await llmService.generateExplanation(
        mockRequest,
        0.15,
        'stripe',
        false
      );

      const explanation2 = await llmService.generateExplanation(
        mockRequest,
        0.75,
        null,
        true
      );

      expect(explanation1).not.toBe(explanation2);
    });

    it('should handle different amounts correctly', async () => {
      const highAmountRequest: ChargeRequest = {
        ...mockRequest,
        amount: 500000
      };

      const explanation = await llmService.generateExplanation(
        highAmountRequest,
        0.15,
        'stripe',
        false
      );

      expect(explanation).toContain('$5000.00');
    });

    it('should handle different risk levels', async () => {
      const lowRiskExplanation = await llmService.generateExplanation(
        mockRequest,
        0.1,
        'stripe',
        false
      );

      const moderateRiskExplanation = await llmService.generateExplanation(
        mockRequest,
        0.4,
        'paypal',
        false
      );

      const highRiskExplanation = await llmService.generateExplanation(
        mockRequest,
        0.8,
        null,
        true
      );

      expect(lowRiskExplanation).toContain('low risk');
      expect(moderateRiskExplanation).toContain('moderate risk');
      expect(highRiskExplanation).toContain('high risk');
    });
  });

  describe('with OpenAI API key', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should use OpenAI when API key is available', async () => {
      const mockOpenAI = await import('openai');
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'AI generated explanation'
          }
        }]
      });

      (mockOpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      llmService = new LLMService();
      
      const explanation = await llmService.generateExplanation(
        mockRequest,
        0.15,
        'stripe',
        false
      );

      expect(mockCreate).toHaveBeenCalled();
      expect(explanation).toBe('AI generated explanation');
    });

    it('should fallback to default explanation on OpenAI error', async () => {
      const mockOpenAI = await import('openai');
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

      (mockOpenAI.default as any).mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }));

      llmService = new LLMService();
      
      const explanation = await llmService.generateExplanation(
        mockRequest,
        0.15,
        'stripe',
        false
      );

      expect(explanation).toContain('Payment routed to stripe');
    });
  });
});