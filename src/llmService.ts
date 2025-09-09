import OpenAI from "openai";
import { ChargeRequest, PaymentProvider } from "./types";

export class LLMService {
  private openai: OpenAI;
  private cache = new Map<string, string>();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "demo-key",
    });
  }

  async generateExplanation(
    request: ChargeRequest,
    riskScore: number,
    provider: PaymentProvider | null,
    isBlocked: boolean
  ): Promise<string> {
    const cacheKey = `${request.amount}-${request.email}-${riskScore}-${isBlocked}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Fallback explanation if OpenAI is not available
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "demo-key"
    ) {
      const explanation = this.generateFallbackExplanation(
        request,
        riskScore,
        provider,
        isBlocked
      );
      this.cache.set(cacheKey, explanation);
      return explanation;
    }

    try {
      const prompt = `Generate a brief explanation for a payment decision:
Amount: $${(request.amount / 100).toFixed(2)} ${request.currency}
Email: ${request.email}
Risk Score: ${riskScore.toFixed(2)}
${isBlocked ? "Decision: BLOCKED" : `Decision: APPROVED via ${provider}`}

Explain why this decision was made based on the risk factors. Keep it under 50 words.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
      });

      const explanation =
        response.choices[0]?.message?.content ||
        this.generateFallbackExplanation(
          request,
          riskScore,
          provider,
          isBlocked
        );

      this.cache.set(cacheKey, explanation);
      return explanation;
    } catch (error) {
      return this.generateFallbackExplanation(
        request,
        riskScore,
        provider,
        isBlocked
      );
    }
  }

  private generateFallbackExplanation(
    request: ChargeRequest,
    riskScore: number,
    provider: PaymentProvider | null,
    isBlocked: boolean
  ): string {
    const amount = request.amount / 100;
    const riskLevel =
      riskScore < 0.3 ? "low" : riskScore < 0.7 ? "moderate" : "high";

    if (isBlocked) {
      return `Payment blocked due to ${riskLevel} risk score (${riskScore.toFixed(
        2
      )}) from suspicious patterns.`;
    }

    return `Payment routed to ${provider} with ${riskLevel} risk score (${riskScore.toFixed(
      2
    )}) for $${amount.toFixed(2)} transaction.`;
  }
}
