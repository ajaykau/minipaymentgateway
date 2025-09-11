import { beforeEach } from 'vitest';

// Reset environment variables before each test
beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
});