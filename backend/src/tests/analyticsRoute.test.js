const request = require('supertest');
const { buildRouter } = require('../routes/buildRouter');

describe('GET /analytics/:code', () => {
  test('returns click totals and the latest 10 clicks', async () => {
    const analyticsService = {
      getAnalytics: jest.fn().mockResolvedValue({
        shortCode: 'abc1234',
        originalUrl: 'https://example.com',
        createdAt: '2026-04-23T11:00:00.000Z',
        totalClicks: 14,
        lastClickedAt: '2026-04-23T12:00:00.000Z',
        recentClicks: [
          {
            short_code: 'abc1234',
            clicked_at: '2026-04-23T12:00:00.000Z',
          },
        ],
        clickTrend: [
          {
            date: '2026-04-23',
            clicks: 14,
          },
        ],
        topReferrers: [
          {
            domain: 'github.com',
            clicks: 8,
          },
        ],
        deviceBreakdown: [
          {
            label: 'desktop',
            clicks: 9,
          },
        ],
        browserBreakdown: [
          {
            label: 'Chrome',
            clicks: 7,
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
    expect(response.body.createdAt).toBe('2026-04-23T11:00:00.000Z');
    expect(response.body.totalClicks).toBe(14);
    expect(response.body.lastClickedAt).toBe('2026-04-23T12:00:00.000Z');
    expect(response.body.recentClicks).toHaveLength(1);
    expect(response.body.recentClicks[0]).toEqual({
      short_code: 'abc1234',
      clicked_at: '2026-04-23T12:00:00.000Z',
    });
    expect(response.body.topReferrers).toEqual([
      {
        domain: 'github.com',
        clicks: 8,
      },
    ]);
    expect(analyticsService.getAnalytics).toHaveBeenCalledWith('abc1234');
  });

  test('records only coarse privacy-safe redirect metadata', async () => {
    const analyticsService = {
      getAnalytics: jest.fn(),
      recordClick: jest.fn().mockResolvedValue(undefined),
    };

    const app = buildRouter({
      urlService: {
        shortenUrl: jest.fn(),
        getOriginalUrl: jest.fn().mockResolvedValue({
          original_url: 'https://example.com',
        }),
      },
      analyticsService,
      rateLimiter: (_req, _res, next) => next(),
    });

    const response = await request(app)
      .get('/abc1234')
      .set('Host', 'short.test')
      .set('Referer', 'https://github.com/KobeGuo99/url-shortener?private=secret')
      .set(
        'User-Agent',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
      );

    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    expect(response.status).toBe(302);
    expect(analyticsService.recordClick).toHaveBeenCalledWith({
      shortCode: 'abc1234',
      referrerDomain: 'github.com',
      deviceCategory: 'mobile',
      browserFamily: 'Safari',
    });
  });
});
