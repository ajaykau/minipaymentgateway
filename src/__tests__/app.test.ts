import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('API Endpoints', () => {
  it('should process valid charge request', async () => {
    const chargeData = {
      amount: 1000,
      currency: 'USD',
      source: 'tok_test',
      email: 'user@example.com'
    };

    const response = await request(app)
      .post('/charge')
      .send(chargeData)
      .expect(200);

    expect(response.body).toHaveProperty('transactionId');
    expect(response.body).toHaveProperty('provider');
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('riskScore');
    expect(response.body).toHaveProperty('explanation');
  });

  it('should reject invalid charge request', async () => {
    const invalidData = {
      amount: -100,
      currency: 'INVALID',
      email: 'not-an-email'
    };

    await request(app)
      .post('/charge')
      .send(invalidData)
      .expect(400);
  });

  it('should return transactions list', async () => {
    const response = await request(app)
      .get('/transactions')
      .expect(200);

    expect(response.body).toHaveProperty('transactions');
    expect(Array.isArray(response.body.transactions)).toBe(true);
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});