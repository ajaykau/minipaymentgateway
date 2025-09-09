export interface ChargeRequest {
  amount: number;
  currency: string;
  source: string;
  email: string;
}

export interface ChargeResponse {
  transactionId: string;
  provider: string;
  status: 'success' | 'blocked';
  riskScore: number;
  explanation: string;
}

export interface Transaction {
  id: string;
  timestamp: Date;
  request: ChargeRequest;
  response: ChargeResponse;
}

export type PaymentProvider = 'stripe' | 'paypal';