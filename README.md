# Mini Payment Gateway Proxy

A lightweight TypeScript backend API that simulates routing payment requests to Stripe or PayPal based on fraud risk scoring with LLM-generated explanations.

## 🚀 Features

### Core API Endpoints
- **POST /charge** - Process payment with fraud detection and routing
- **GET /transactions** - View complete transaction history
- **GET /health** - Health check endpoint

### Advanced Capabilities
- 🛡️ **Fraud Detection** - Risk scoring based on amount and email patterns
- 🤖 **LLM Integration** - OpenAI-powered natural language risk explanations
- ⚡ **Performance** - LLM response caching for faster repeated queries
- 📊 **Logging** - In-memory transaction storage with full metadata
- ✅ **Validation** - Comprehensive input validation with Joi
- 🐳 **Docker** - Full containerization support
- 🧪 **Testing** - Unit and integration tests with Jest

## 📋 Requirements Met

✅ **POST /charge endpoint** with exact payload format  
✅ **Fraud risk scoring** (0-1 float) with configurable heuristics  
✅ **Payment routing** based on risk thresholds  
✅ **LLM explanations** with OpenAI integration + fallbacks  
✅ **Transaction logging** in memory with timestamps  
✅ **Input validation** and error handling  
✅ **Unit tests** for core functionality  
✅ **Modern TypeScript** with strict typing  

### Stretch Goals Completed
✅ **GET /transactions** endpoint  
✅ **LLM prompt caching** for performance  
✅ **Docker containerization**  
✅ **Configurable fraud rules**  

## 🏗️ Architecture

```
src/
├── types.ts           # TypeScript interfaces
├── fraudDetection.ts  # Risk scoring logic
├── llmService.ts      # OpenAI integration + caching
├── paymentService.ts  # Main business logic
├── validation.ts      # Input validation schemas
├── app.ts            # Express application setup
├── index.ts          # Server entry point
└── __tests__/        # Unit and integration tests
```

## 🚀 Quick Start

### Installation
```bash
# Clone and install
git clone <repo>
cd minipaymentgateway
npm install

# Environment setup (optional)
cp .env.example .env
# Add your OpenAI API key to .env
```

### Development
```bash
npm run dev          # Start development server
npm test             # Run tests
npm test:watch       # Watch mode testing
```

### Production
```bash
npm run build        # Compile TypeScript
npm start            # Start production server
```

## 🔌 API Reference

### POST /charge
Process a payment with fraud detection and routing.

**Request:**
```json
{
  "amount": 1000,        // Amount in cents (required)
  "currency": "USD",     // 3-letter currency code (required)
  "source": "tok_test",  // Payment source token (required)
  "email": "user@example.com"  // Customer email (required)
}
```

**Response (Success):**
```json
{
  "transactionId": "txn_abc123",
  "provider": "stripe",
  "status": "success",
  "riskScore": 0.15,
  "explanation": "Payment routed to Stripe with low risk score (0.15) for $10.00 transaction."
}
```

**Response (Blocked):**
```json
{
  "transactionId": "txn_def456",
  "provider": "none",
  "status": "blocked",
  "riskScore": 0.75,
  "explanation": "Payment blocked due to high risk score (0.75) from suspicious patterns."
}
```

### GET /transactions
Retrieve all processed transactions.

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_abc123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "request": { /* original request */ },
      "response": { /* charge response */ }
    }
  ]
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🛡️ Fraud Detection Logic

The system calculates risk scores using these heuristics:

| Risk Factor | Condition | Score Added |
|-------------|-----------|-------------|
| Large Amount | > $500 (50,000 cents) | +0.3 |
| Suspicious Domain | .ru, test.com, .tk, .ml, .ga | +0.4 |
| Very Large Amount | > $1000 (100,000 cents) | +0.2 |
| Suspicious Email | Contains 'temp' or 'fake' | +0.3 |

### Routing Rules
- **Risk ≥ 0.5**: Payment blocked
- **Risk < 0.3**: Route to Stripe (low risk)
- **Risk 0.3-0.5**: Route to PayPal (moderate risk)

## 🤖 LLM Integration

### OpenAI Integration
- Uses GPT-3.5-turbo for generating risk explanations
- Configurable via `OPENAI_API_KEY` environment variable
- Automatic fallback to rule-based explanations if API unavailable

### Caching Strategy
- In-memory cache for LLM responses
- Cache key: `${amount}-${email}-${riskScore}-${isBlocked}`
- Improves performance for repeated similar requests

### Fallback Explanations
When OpenAI is unavailable, the system generates explanations like:
- "Payment routed to stripe with low risk score (0.15) for $10.00 transaction."
- "Payment blocked due to high risk score (0.75) from suspicious patterns."

## 🧪 Testing

### Run Tests
```bash
npm test                 # Run all tests
npm test:watch          # Watch mode
npm test -- --coverage  # With coverage report
```

### Test Coverage
- **PaymentService**: Risk calculation, provider selection, transaction logging
- **API Endpoints**: Request validation, response format, error handling
- **Fraud Detection**: All risk scoring scenarios
- **Integration**: End-to-end API testing

### Example Test Cases
```bash
# Low risk payment (should succeed)
curl -X POST http://localhost:3000/charge \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "USD", "source": "tok_test", "email": "user@gmail.com"}'

# High risk payment (should be blocked)
curl -X POST http://localhost:3000/charge \
  -H "Content-Type: application/json" \
  -d '{"amount": 200000, "currency": "USD", "source": "tok_test", "email": "user@test.com"}'
```

## 🐳 Docker Deployment

### Build and Run
```bash
# Build image
docker build -t mini-payment-gateway .

# Run container
docker run -p 3000:3000 mini-payment-gateway

# With environment variables
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key mini-payment-gateway
```

### Docker Compose (Optional)
```yaml
version: '3.8'
services:
  payment-gateway:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port (default: 3000)
OPENAI_API_KEY=sk-...        # OpenAI API key (optional)
```

### Fraud Rules Customization
Modify `src/fraudDetection.ts` to adjust risk scoring:

```typescript
// Example: Increase large amount threshold
if (request.amount > 75000) { // $750 instead of $500
  score += 0.3;
}

// Example: Add new suspicious domains
const suspiciousDomains = ['.ru', 'test.com', '.suspicious.net'];
```

## 📊 Performance Considerations

- **LLM Caching**: Reduces API calls for similar requests
- **In-Memory Storage**: Fast transaction retrieval (not persistent)
- **Async Processing**: Non-blocking LLM calls
- **Input Validation**: Early rejection of invalid requests

## 🔒 Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin request handling
- **Input Validation**: Prevents injection attacks
- **Error Handling**: No sensitive data in error responses

## 🚧 Production Considerations

For production deployment, consider:

1. **Persistent Storage**: Replace in-memory transactions with database
2. **Rate Limiting**: Add request rate limiting
3. **Monitoring**: Add logging and metrics
4. **Secrets Management**: Use proper secret management for API keys
5. **Load Balancing**: Scale horizontally with multiple instances

## 📝 Example Responses

### Successful Low-Risk Payment
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "stripe",
  "status": "success",
  "riskScore": 0.0,
  "explanation": "Payment approved with minimal risk factors detected. Transaction routed to Stripe for processing."
}
```

### Blocked High-Risk Payment
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440001",
  "provider": "none",
  "status": "blocked",
  "riskScore": 0.7,
  "explanation": "Payment blocked due to multiple risk factors: large transaction amount and suspicious email domain pattern."
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.