const request = require('supertest');
const { buildRouter } = require('../routes/buildRouter');

describe('GET /analytics/:code', () => {
  test('returns click totals and the latest 10 clicks', async () => {
    const analyticsService = {
      getAnalytics: jest.fn().mockResolvedValue({
        shortCode: 'abc1234',
        originalUrl: 'https://example.com',
        totalClicks: 14,
        recentClicks: [
          {
            short_code: 'abc1234',
            clicked_at: '2026-04-23T12:00:00.000Z',
            user_agent: 'Jest',
            ip: '127.0.0.1',
          },
        ],
      }),
      recordClick: jest.fn(),
    };

    const app = buildRouter({
      urlService: {
        shortenUrl: jest.fn(),
        getOriginalUrl: jest.fn(),
      },
      analyticsService,
      rateLimiter: (_req, _res, next) => next(),
    });

    const response = await request(app).get('/analytics/abc1234');

    expect(response.status).toBe(200);
    expect(response.body.totalClicks).toBe(14);
    expect(response.body.recentClicks).toHaveLength(1);
    expect(analyticsService.getAnalytics).toHaveBeenCalledWith('abc1234');
  });
});
