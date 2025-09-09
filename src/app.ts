import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PaymentService } from './paymentService';
import { validateChargeRequest } from './validation';

export const createApp = () => {
  const app = express();
  const paymentService = new PaymentService();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.post('/charge', async (req, res) => {
    try {
      const { error, value } = validateChargeRequest(req.body);
      
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details.map(d => d.message)
        });
      }

      const response = await paymentService.processCharge(value);
      res.json(response);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/transactions', (req, res) => {
    const transactions = paymentService.getTransactions();
    res.json({ transactions });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
};

export default createApp;