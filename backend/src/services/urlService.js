const env = require('../config/env');
const { generateShortCode } = require('./shortCodeService');
const { isValidHttpUrl } = require('../utils/urlValidation');
const { HttpError } = require('../utils/httpError');

function createUrlService({ urlRepository, cacheService }) {
  return {
    async shortenUrl(originalUrl) {
      if (!isValidHttpUrl(originalUrl)) {
        throw new HttpError(400, 'A valid http or https URL is required.');
      }

      let attempt = 0;
      while (attempt < 7) {
        const shortCode = generateShortCode();

        try {
          const record = await urlRepository.create({
            shortCode,
            originalUrl,
          });

          await cacheService.setUrl(shortCode, record);

          return {
            shortCode: record.short_code,
            originalUrl: record.original_url,
            createdAt: record.created_at,
            shortUrl: `${env.BASE_URL}/${record.short_code}`,
          };
        } catch (error) {
          if (error.code !== '23505') {
            throw error;
          }
        }

        attempt += 1;
      }

      throw new HttpError(500, 'Unable to generate a unique short code right now.');
    },

    async getOriginalUrl(shortCode) {
      const cached = await cacheService.getUrl(shortCode);
      if (cached) {
        return cached;
      }

      const record = await urlRepository.findByShortCode(shortCode);
      if (!record) {
        throw new HttpError(404, 'Short URL not found.');
      }

      await cacheService.setUrl(shortCode, record);
      return record;
    },
  };
}

module.exports = {
  createUrlService,
};
