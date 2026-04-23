const { HttpError } = require('../utils/httpError');

function createAnalyticsService({ urlRepository, clickRepository }) {
  return {
    async recordClick({ shortCode, userAgent, ip }) {
      await clickRepository.create({
        shortCode,
        userAgent,
        ip,
      });
    },

    async getAnalytics(shortCode) {
      const urlRecord = await urlRepository.findByShortCode(shortCode);

      if (!urlRecord) {
        throw new HttpError(404, 'Short URL not found.');
      }

      const summary = await clickRepository.getSummary(shortCode);

      return {
        shortCode,
        originalUrl: urlRecord.original_url,
        totalClicks: summary.totalClicks,
        recentClicks: summary.recentClicks,
      };
    },
  };
}

module.exports = {
  createAnalyticsService,
};
