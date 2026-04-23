const { v4: uuidv4 } = require('uuid');

function createClickRepository(pool) {
  return {
    async create({ shortCode, userAgent, ip }) {
      await pool.query(
        `
          INSERT INTO clicks (id, short_code, user_agent, ip)
          VALUES ($1, $2, $3, $4);
        `,
        [uuidv4(), shortCode, userAgent || null, ip || null],
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
          SELECT short_code, clicked_at, user_agent, ip
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
