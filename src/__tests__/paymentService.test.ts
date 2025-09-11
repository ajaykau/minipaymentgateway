import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../paymentService';
import { ChargeRequest } from '../types';

// Mock dependencies
const mockCalculateRiskScore = vi.fn();
const mockShouldBlock = vi.fn();
const mockGenerateExplanation = vi.fn();

vi.mock('../fraudDetection', () => ({
  FraudDetector: vi.fn().mockImplementation(() => ({
    calculateRiskScore: mockCalculateRiskScore,
    shouldBlock: mockShouldBlock
  }))
}));

vi.mock('../llmService', () => ({
  LLMService: vi.fn().mockImplementation(() => ({
    generateExplanation: mockGenerateExplanation
  }))
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;
  const mockRequest: ChargeRequest = {
    amount: 1000,
    currency: 'USD',
    source: 'tok_test',
    email: 'user@example.com'
  };

  beforeEach(() => {
    paymentService = new PaymentService();
    vi.clearAllMocks();
    // Default mock values
    mockCalculateRiskScore.mockReturnValue(0.15);
    mockShouldBlock.mockReturnValue(false);
    mockGenerateExplanation.mockResolvedValue('Test explanation');
  });

  describe('processCharge', () => {
    it('should process successful low-risk charge', async () => {
      const response = await paymentService.processCharge(mockRequest);

      expect(response).toHaveProperty('transactionId');
      expect(response).toHaveProperty('provider');
      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('riskScore');
      expect(response).toHaveProperty('explanation');
      expect(response.transactionId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should route to stripe for low risk', async () => {
      const lowRiskRequest: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const response = await paymentService.processCharge(lowRiskRequest);

      expect(response.status).toBe('success');
      expect(response.provider).toBe('stripe');
      expect(response.riskScore).toBeLessThan(0.3);
    });

    it('should route to paypal for moderate risk', async () => {
      // Configure mocks for moderate risk
      mockCalculateRiskScore.mockReturnValue(0.35);
      mockShouldBlock.mockReturnValue(false);
      
      const moderateRiskRequest: ChargeRequest = {
        amount: 60000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com'
      };

      const response = await paymentService.processCharge(moderateRiskRequest);

      expect(response.status).toBe('success');
      expect(response.provider).toBe('paypal');
      expect(response.riskScore).toBeGreaterThanOrEqual(0.3);
      expect(response.riskScore).toBeLessThan(0.5);
    });

    it('should block high-risk transactions', async () => {
      // Configure mocks for high-risk transaction
      mockCalculateRiskScore.mockReturnValue(0.75);
      mockShouldBlock.mockReturnValue(true);
      
      const highRiskRequest: ChargeRequest = {
        amount: 200000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@test.com'
      };

      const response = await paymentService.processCharge(highRiskRequest);

      expect(response.status).toBe('blocked');
      expect(response.provider).toBe('none');
      expect(response.riskScore).toBeGreaterThanOrEqual(0.5);
    });

    it('should generate unique transaction IDs', async () => {
      const response1 = await paymentService.processCharge(mockRequest);
      const response2 = await paymentService.processCharge(mockRequest);

      expect(response1.transactionId).not.toBe(response2.transactionId);
    });

    it('should include explanation in response', async () => {
      const response = await paymentService.processCharge(mockRequest);

      expect(response.explanation).toBeDefined();
      expect(typeof response.explanation).toBe('string');
      expect(response.explanation).toBe('Test explanation');
    });
  });

  describe('getTransactions', () => {
    it('should return empty array initially', () => {
      const transactions = paymentService.getTransactions();
      expect(transactions).toEqual([]);
    });

    it('should store processed transactions', async () => {
      await paymentService.processCharge(mockRequest);
      
      const transactions = paymentService.getTransactions();
      expect(transactions).toHaveLength(1);
      
      const transaction = transactions[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('timestamp');
      expect(transaction).toHaveProperty('request');
      expect(transaction).toHaveProperty('response');
      expect(transaction.request).toEqual(mockRequest);
    });

    it('should store multiple transactions', async () => {
      await paymentService.processCharge(mockRequest);
      await paymentService.processCharge({
        ...mockRequest,
        amount: 2000
      });

      const transactions = paymentService.getTransactions();
      expect(transactions).toHaveLength(2);
    });

    it('should return copy of transactions array', async () => {
      await paymentService.processCharge(mockRequest);
      
      const transactions1 = paymentService.getTransactions();
      const transactions2 = paymentService.getTransactions();
      
      expect(transactions1).not.toBe(transactions2);
      expect(transactions1).toEqual(transactions2);
    });

    it('should include timestamp in transactions', async () => {
      const beforeTime = new Date();
      await paymentService.processCharge(mockRequest);
      const afterTime = new Date();
      
      const transactions = paymentService.getTransactions();
      const transaction = transactions[0];
      
      expect(transaction.timestamp).toBeInstanceOf(Date);
      expect(transaction.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(transaction.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('provider selection', () => {
    it('should select stripe for risk score < 0.3', async () => {
      const request: ChargeRequest = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const response = await paymentService.processCharge(request);
      expect(response.provider).toBe('stripe');
    });

    it('should select paypal for risk score >= 0.3 and < 0.5', async () => {
      // Configure mocks for moderate risk
      mockCalculateRiskScore.mockReturnValue(0.35);
      mockShouldBlock.mockReturnValue(false);
      
      const request: ChargeRequest = {
        amount: 60000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com'
      };

      const response = await paymentService.processCharge(request);
      expect(response.provider).toBe('paypal');
    });

    it('should not select provider for blocked transactions', async () => {
      // Configure mocks for blocked transaction
      mockCalculateRiskScore.mockReturnValue(0.75);
      mockShouldBlock.mockReturnValue(true);
      
      const request: ChargeRequest = {
        amount: 200000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@test.com'
      };

      const response = await paymentService.processCharge(request);
      expect(response.provider).toBe('none');
      expect(response.status).toBe('blocked');
    });
  });
});