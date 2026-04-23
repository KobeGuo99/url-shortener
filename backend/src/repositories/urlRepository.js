const { v4: uuidv4 } = require('uuid');

function createUrlRepository(pool) {
  return {
    async create({ shortCode, originalUrl }) {
      const { rows } = await pool.query(
        `
          INSERT INTO urls (id, short_code, original_url)
          VALUES ($1, $2, $3)
          RETURNING id, short_code, original_url, created_at;
        `,
        [uuidv4(), shortCode, originalUrl],
      );

      return rows[0];
    },

    async findByShortCode(shortCode) {
      const { rows } = await pool.query(
        `
          SELECT id, short_code, original_url, created_at
          FROM urls
          WHERE short_code = $1
          LIMIT 1;
        `,
        [shortCode],
      );

      return rows[0] || null;
    },
  };
}

module.exports = {
  createUrlRepository,
};
