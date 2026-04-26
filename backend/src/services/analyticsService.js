const { HttpError } = require('../utils/httpError');

function createAnalyticsService({ urlRepository, clickRepository }) {
  return {
    async recordClick({ shortCode, referrerDomain, deviceCategory, browserFamily }) {
      await clickRepository.create({
        shortCode,
        referrerDomain,
        deviceCategory,
        browserFamily,
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
        createdAt: urlRecord.created_at,
        totalClicks: summary.totalClicks,
        lastClickedAt: summary.lastClickedAt,
        recentClicks: summary.recentClicks,
        clickTrend: summary.clickTrend,
        topReferrers: summary.topReferrers,
        deviceBreakdown: summary.deviceBreakdown,
        browserBreakdown: summary.browserBreakdown,
      };
    },
  };
}

module.exports = {
  createAnalyticsService,
};
