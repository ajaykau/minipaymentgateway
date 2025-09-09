import { ChargeRequest } from './types';

export class FraudDetector {
  calculateRiskScore(request: ChargeRequest): number {
    let score = 0;

    // Large amount heuristic (amounts over $500)
    if (request.amount > 50000) { // 50000 cents = $500
      score += 0.3;
    }

    // Suspicious domain heuristic
    const email = request.email.toLowerCase();
    const suspiciousDomains = ['.ru', 'test.com', '.tk', '.ml', '.ga'];
    
    if (suspiciousDomains.some(domain => email.includes(domain))) {
      score += 0.4;
    }

    // Additional risk factors
    if (request.amount > 100000) { // $1000+
      score += 0.2;
    }

    if (email.includes('temp') || email.includes('fake')) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  shouldBlock(riskScore: number): boolean {
    return riskScore >= 0.5;
  }
}