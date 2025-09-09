import { PaymentService } from '../paymentService';
import { ChargeRequest } from '../types';

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  it('should process low-risk payment successfully', async () => {
    const request: ChargeRequest = {
      amount: 1000, // $10
      currency: 'USD',
      source: 'tok_test',
      email: 'user@gmail.com'
    };

    const response = await paymentService.processCharge(request);

    expect(response.status).toBe('success');
    expect(response.riskScore).toBeLessThan(0.5);
    expect(response.provider).toMatch(/stripe|paypal/);
    expect(response.transactionId).toBeDefined();
    expect(response.explanation).toBeDefined();
  });

  it('should block high-risk payment', async () => {
    const request: ChargeRequest = {
      amount: 200000, // $2000
      currency: 'USD',
      source: 'tok_test',
      email: 'user@test.com' // suspicious domain
    };

    const response = await paymentService.processCharge(request);

    expect(response.status).toBe('blocked');
    expect(response.riskScore).toBeGreaterThanOrEqual(0.5);
    expect(response.provider).toBe('none');
  });

  it('should log transactions', async () => {
    const request: ChargeRequest = {
      amount: 1000,
      currency: 'USD',
      source: 'tok_test',
      email: 'user@example.com'
    };

    await paymentService.processCharge(request);
    const transactions = paymentService.getTransactions();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].request).toEqual(request);
    expect(transactions[0].timestamp).toBeInstanceOf(Date);
  });
});