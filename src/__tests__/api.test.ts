import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('API Endpoints', () => {
  describe('POST /charge', () => {
    it('should process valid low-risk charge request', async () => {
      const chargeData = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@gmail.com'
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeData)
        .expect(200);

      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('riskScore');
      expect(response.body).toHaveProperty('explanation');
      expect(response.body.riskScore).toBeLessThan(0.5);
    });

    it('should block high-risk charge request', async () => {
      const chargeData = {
        amount: 200000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@test.com'
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeData)
        .expect(200);

      expect(response.body.status).toBe('blocked');
      expect(response.body.provider).toBe('none');
      expect(response.body.riskScore).toBeGreaterThanOrEqual(0.5);
    });

    it('should route to stripe for low risk', async () => {
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

      expect(response.body.provider).toBe('stripe');
      expect(response.body.riskScore).toBeLessThan(0.3);
    });

    it('should route to paypal for moderate risk', async () => {
      const chargeData = {
        amount: 60000,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com'
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeData)
        .expect(200);

      expect(response.body.provider).toBe('paypal');
      expect(response.body.riskScore).toBeGreaterThanOrEqual(0.3);
      expect(response.body.riskScore).toBeLessThan(0.5);
    });

    it('should reject invalid amount', async () => {
      const invalidData = {
        amount: -100,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com'
      };

      const response = await request(app)
        .post('/charge')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid request');
      expect(response.body).toHaveProperty('details');
    });

    it('should reject invalid currency', async () => {
      const invalidData = {
        amount: 1000,
        currency: 'INVALID',
        source: 'tok_test',
        email: 'user@example.com'
      };

      await request(app)
        .post('/charge')
        .send(invalidData)
        .expect(400);
    });

    it('should reject invalid email', async () => {
      const invalidData = {
        amount: 1000,
        currency: 'USD',
        source: 'tok_test',
        email: 'not-an-email'
      };

      await request(app)
        .post('/charge')
        .send(invalidData)
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      const invalidData = {
        amount: 1000
      };

      await request(app)
        .post('/charge')
        .send(invalidData)
        .expect(400);
    });

    it('should handle large amounts correctly', async () => {
      const chargeData = {
        amount: 9999999,
        currency: 'USD',
        source: 'tok_test',
        email: 'user@example.com'
      };

      const response = await request(app)
        .post('/charge')
        .send(chargeData)
        .expect(200);

      expect(response.body.riskScore).toBeGreaterThanOrEqual(0.5);
      expect(response.body.status).toBe('blocked');
    });
  });

  describe('GET /transactions', () => {
    beforeEach(async () => {
      // Create a transaction first
      await request(app)
        .post('/charge')
        .send({
          amount: 1000,
          currency: 'USD',
          source: 'tok_test',
          email: 'user@example.com'
        });
    });

    it('should return transactions list', async () => {
      const response = await request(app)
        .get('/transactions')
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.transactions.length).toBeGreaterThan(0);
    });

    it('should return transaction with correct structure', async () => {
      const response = await request(app)
        .get('/transactions')
        .expect(200);

      const transaction = response.body.transactions[0];
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('timestamp');
      expect(transaction).toHaveProperty('request');
      expect(transaction).toHaveProperty('response');
      
      expect(transaction.request).toHaveProperty('amount');
      expect(transaction.request).toHaveProperty('currency');
      expect(transaction.request).toHaveProperty('source');
      expect(transaction.request).toHaveProperty('email');
      
      expect(transaction.response).toHaveProperty('transactionId');
      expect(transaction.response).toHaveProperty('provider');
      expect(transaction.response).toHaveProperty('status');
      expect(transaction.response).toHaveProperty('riskScore');
      expect(transaction.response).toHaveProperty('explanation');
    });

    it('should return empty array when no transactions', async () => {
      // Create new app instance to have clean state
      const cleanApp = createApp();
      
      const response = await request(cleanApp)
        .get('/transactions')
        .expect(200);

      expect(response.body.transactions).toEqual([]);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/charge')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should return 404 for unknown endpoints', async () => {
      await request(app)
        .get('/unknown')
        .expect(404);
    });

    it('should handle empty request body', async () => {
      await request(app)
        .post('/charge')
        .send({})
        .expect(400);
    });
  });
});