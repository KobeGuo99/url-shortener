async function runMigrations(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS urls (
      id UUID PRIMARY KEY,
      short_code VARCHAR(32) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clicks (
      id UUID PRIMARY KEY,
      short_code VARCHAR(32) NOT NULL REFERENCES urls(short_code) ON DELETE CASCADE,
      clicked_at TIMESTAMP NOT NULL DEFAULT NOW(),
      user_agent TEXT,
      ip VARCHAR(128),
      referrer_domain VARCHAR(255),
      device_category VARCHAR(32),
      browser_family VARCHAR(32)
    );
  `);

  await pool.query(`
    ALTER TABLE clicks
      ADD COLUMN IF NOT EXISTS referrer_domain VARCHAR(255),
      ADD COLUMN IF NOT EXISTS device_category VARCHAR(32),
      ADD COLUMN IF NOT EXISTS browser_family VARCHAR(32);
  `);

  await pool.query(`
    UPDATE clicks
    SET user_agent = NULL,
        ip = NULL
    WHERE user_agent IS NOT NULL
       OR ip IS NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_urls_short_code
    ON urls(short_code);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_clicks_short_code_clicked_at
    ON clicks(short_code, clicked_at DESC);
  `);
}

module.exports = {
  runMigrations,
};
