const { createUrlService } = require('../services/urlService');

describe('cache-aside lookup', () => {
  test('returns cached record without hitting the repository', async () => {
    const cacheService = {
      getUrl: jest.fn().mockResolvedValue({ original_url: 'https://cached.dev' }),
      setUrl: jest.fn(),
    };

    const urlRepository = {
      findByShortCode: jest.fn(),
    };

    const service = createUrlService({ urlRepository, cacheService });
    const record = await service.getOriginalUrl('abc1234');

    expect(record.original_url).toBe('https://cached.dev');
    expect(urlRepository.findByShortCode).not.toHaveBeenCalled();
  });

  test('hydrates cache on miss', async () => {
    const dbRecord = { short_code: 'abc1234', original_url: 'https://db.dev' };
    const cacheService = {
      getUrl: jest.fn().mockResolvedValue(null),
      setUrl: jest.fn().mockResolvedValue(undefined),
    };

    const urlRepository = {
      findByShortCode: jest.fn().mockResolvedValue(dbRecord),
    };

    const service = createUrlService({ urlRepository, cacheService });
    const record = await service.getOriginalUrl('abc1234');

    expect(record).toEqual(dbRecord);
    expect(cacheService.setUrl).toHaveBeenCalledWith('abc1234', dbRecord);
  });
});
