const { v4: uuidv4 } = require('uuid');

function createClickRepository(pool) {
  return {
    async create({ shortCode, referrerDomain, deviceCategory, browserFamily }) {
      await pool.query(
        `
          INSERT INTO clicks (id, short_code, referrer_domain, device_category, browser_family)
          VALUES ($1, $2, $3, $4, $5);
        `,
        [
          uuidv4(),
          shortCode,
          referrerDomain || null,
          deviceCategory || 'unknown',
          browserFamily || 'Other',
        ],
      );
    },

    async getSummary(shortCode) {
      const [
        countResult,
        recentClicksResult,
        clickTrendResult,
        topReferrersResult,
        deviceBreakdownResult,
        browserBreakdownResult,
      ] = await Promise.all([
        pool.query(
          `
            SELECT COUNT(*)::INT AS total_clicks,
                   MAX(clicked_at) AS last_clicked_at
            FROM clicks
            WHERE short_code = $1;
          `,
          [shortCode],
        ),
        pool.query(
          `
            SELECT short_code, clicked_at
            FROM clicks
            WHERE short_code = $1
            ORDER BY clicked_at DESC
            LIMIT 10;
          `,
          [shortCode],
        ),
        pool.query(
          `
            WITH days AS (
              SELECT generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                INTERVAL '1 day'
              )::DATE AS day
            ),
            counts AS (
              SELECT clicked_at::DATE AS day, COUNT(*)::INT AS clicks
              FROM clicks
              WHERE short_code = $1
                AND clicked_at >= CURRENT_DATE - INTERVAL '6 days'
              GROUP BY clicked_at::DATE
            )
            SELECT TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
                   COALESCE(counts.clicks, 0)::INT AS clicks
            FROM days
            LEFT JOIN counts ON counts.day = days.day
            ORDER BY days.day;
          `,
          [shortCode],
        ),
        pool.query(
          `
            SELECT referrer_domain AS domain, COUNT(*)::INT AS clicks
            FROM clicks
            WHERE short_code = $1
              AND referrer_domain IS NOT NULL
            GROUP BY referrer_domain
            ORDER BY clicks DESC, referrer_domain ASC
            LIMIT 5;
          `,
          [shortCode],
        ),
        pool.query(
          `
            SELECT COALESCE(device_category, 'unknown') AS label,
                   COUNT(*)::INT AS clicks
            FROM clicks
            WHERE short_code = $1
            GROUP BY COALESCE(device_category, 'unknown')
            ORDER BY clicks DESC, label ASC;
          `,
          [shortCode],
        ),
        pool.query(
          `
            SELECT COALESCE(browser_family, 'Other') AS label,
                   COUNT(*)::INT AS clicks
            FROM clicks
            WHERE short_code = $1
            GROUP BY COALESCE(browser_family, 'Other')
            ORDER BY clicks DESC, label ASC;
          `,
          [shortCode],
        ),
      ]);

      return {
        totalClicks: countResult.rows[0]?.total_clicks || 0,
        lastClickedAt: countResult.rows[0]?.last_clicked_at || null,
        recentClicks: recentClicksResult.rows,
        clickTrend: clickTrendResult.rows,
        topReferrers: topReferrersResult.rows,
        deviceBreakdown: deviceBreakdownResult.rows,
        browserBreakdown: browserBreakdownResult.rows,
      };
    },
  };
}

module.exports = {
  createClickRepository,
};
