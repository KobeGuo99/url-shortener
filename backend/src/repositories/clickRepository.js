const { v4: uuidv4 } = require('uuid');

function createClickRepository(pool) {
  return {
    async create({ shortCode }) {
      await pool.query(
        `
          INSERT INTO clicks (id, short_code)
          VALUES ($1, $2);
        `,
        [uuidv4(), shortCode],
      );
    },

    async getSummary(shortCode) {
      const countResult = await pool.query(
        `
          SELECT COUNT(*)::INT AS total_clicks
          FROM clicks
          WHERE short_code = $1;
        `,
        [shortCode],
      );

      const recentClicksResult = await pool.query(
        `
          SELECT short_code, clicked_at
          FROM clicks
          WHERE short_code = $1
          ORDER BY clicked_at DESC
          LIMIT 10;
        `,
        [shortCode],
      );

      return {
        totalClicks: countResult.rows[0]?.total_clicks || 0,
        recentClicks: recentClicksResult.rows,
      };
    },
  };
}

module.exports = {
  createClickRepository,
};
