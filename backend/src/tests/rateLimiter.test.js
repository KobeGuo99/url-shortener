const { createRateLimiter } = require('../middleware/rateLimiter');

function createResponseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('rate limiter', () => {
  test('allows requests within the limit', async () => {
    const redisClient = {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    };

    const middleware = createRateLimiter(redisClient);
    const req = { ip: '127.0.0.1', headers: {}, socket: {} };
    const res = createResponseMock();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(redisClient.expire).toHaveBeenCalledWith('ratelimit:127.0.0.1', 60);
    expect(next).toHaveBeenCalled();
  });

  test('blocks requests over the limit', async () => {
    const redisClient = {
      incr: jest.fn().mockResolvedValue(11),
      expire: jest.fn(),
    };

    const middleware = createRateLimiter(redisClient);
    const req = { ip: '127.0.0.1', headers: {}, socket: {} };
    const res = createResponseMock();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Rate limit exceeded. Maximum 10 requests per minute per IP.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
