function createCacheService(redisClient, ttlSeconds) {
  return {
    async getUrl(shortCode) {
      const cached = await redisClient.get(`url:${shortCode}`);
      return cached ? JSON.parse(cached) : null;
    },

    async setUrl(shortCode, urlRecord) {
      await redisClient.setEx(`url:${shortCode}`, ttlSeconds, JSON.stringify(urlRecord));
    },
  };
}

module.exports = {
  createCacheService,
};
