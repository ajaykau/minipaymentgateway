import { v4 as uuidv4 } from 'uuid';
import { ChargeRequest, ChargeResponse, Transaction, PaymentProvider } from './types';
import { FraudDetector } from './fraudDetection';
import { LLMService } from './llmService';

export class PaymentService {
  private transactions: Transaction[] = [];
  private fraudDetector = new FraudDetector();
  private llmService = new LLMService();

  async processCharge(request: ChargeRequest): Promise<ChargeResponse> {
    const transactionId = uuidv4();
    const riskScore = this.fraudDetector.calculateRiskScore(request);
    const isBlocked = this.fraudDetector.shouldBlock(riskScore);
    
    let provider: PaymentProvider | null = null;
    let status: 'success' | 'blocked' = 'blocked';

    if (!isBlocked) {
      provider = this.selectProvider(riskScore);
      status = 'success';
    }

    const explanation = await this.llmService.generateExplanation(
      request, 
      riskScore, 
      provider, 
      isBlocked
    );

    const response: ChargeResponse = {
      transactionId,
      provider: provider || 'none',
      status,
      riskScore,
      explanation
    };

    // Log transaction
    this.transactions.push({
      id: transactionId,
      timestamp: new Date(),
      request,
      response
    });

    return response;
  }

  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  private selectProvider(riskScore: number): PaymentProvider {
    // Simple routing: lower risk goes to Stripe, higher risk to PayPal
    return riskScore < 0.3 ? 'stripe' : 'paypal';
  }
}