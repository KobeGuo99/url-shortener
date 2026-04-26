import { startTransition, useMemo, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

function extractCode(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.pathname.replace(/^\/+/, '');
  } catch {
    return trimmed.replace(/^\/+/, '');
  }
}

function formatTimestamp(value) {
  if (!value) {
    return 'No clicks yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function getLargestClickCount(items = []) {
  return Math.max(1, ...items.map((item) => item.clicks || 0));
}

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [shortenResult, setShortenResult] = useState(null);
  const [shortenError, setShortenError] = useState('');
  const [isShortening, setIsShortening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [analyticsInput, setAnalyticsInput] = useState('');
  const [analyticsResult, setAnalyticsResult] = useState(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const displayCode = useMemo(() => extractCode(analyticsInput), [analyticsInput]);

  async function handleShorten(event) {
    event.preventDefault();
    setIsShortening(true);
    setShortenError('');

    try {
      const response = await api.post('/shorten', {
        url: longUrl,
      });

      startTransition(() => {
        setShortenResult(response.data);
        setIsCopied(false);
      });
    } catch (error) {
      setShortenError(error.response?.data?.error || 'Unable to shorten that URL right now.');
    } finally {
      setIsShortening(false);
    }
  }

  async function handleAnalyticsLookup(event) {
    event.preventDefault();
    setIsLoadingAnalytics(true);
    setAnalyticsError('');

    try {
      const response = await api.get(`/analytics/${extractCode(analyticsInput)}`);

      startTransition(() => {
        setAnalyticsResult(response.data);
      });
    } catch (error) {
      setAnalyticsResult(null);
      setAnalyticsError(error.response?.data?.error || 'Unable to load analytics.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }

  function handleCopy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    setIsCopied(true);
    window.setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#e7e3da] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:36px_36px]">
      <header className="fixed inset-x-0 top-0 z-10 border-b border-white/10 bg-[#0f0f0f]/90 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <a className="font-mono text-base font-semibold text-[#f3f0e9]" href="/">
              LinkLift
            </a>
            <p className="mt-0.5 text-xs text-[#7f796f]">URL shortener console</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#9b968c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4f8ef7]" />
            Built by Kobe Guo
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-screen w-full max-w-[720px] flex-col justify-center px-5 py-28 md:px-0">
        <div className="pointer-events-none absolute -left-20 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="flex flex-col items-center gap-3 font-mono text-xs text-[#5f5a53]">
            <span>01</span>
            <span className="h-16 w-px bg-white/10" />
            <span>02</span>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#151515]">
          <div className="h-px bg-gradient-to-r from-[#4f8ef7] via-white/20 to-transparent" />
          <div className="p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#f3f0e9]">Shorten</p>
                <p className="mt-1 text-sm text-[#8b867d]">
                  Paste a long URL to generate a short link.
                </p>
              </div>
            </div>

          <form onSubmit={handleShorten}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="block flex-1">
                <span className="sr-only">
                  Long URL
                </span>
                <input
                  type="url"
                  required
                  value={longUrl}
                  onChange={(event) => setLongUrl(event.target.value)}
                  placeholder="Paste a long URL"
                  className="h-14 w-full rounded-lg border border-white/10 bg-[#0f0f0f] px-4 text-base text-[#f3f0e9] outline-none transition placeholder:text-[#68645d] focus:border-[#4f8ef7] focus:ring-2 focus:ring-[#4f8ef7]/20"
                />
              </label>

              <button
                type="submit"
                disabled={isShortening}
                className="h-14 rounded-lg bg-[#f3f0e9] px-5 text-sm font-semibold text-[#101010] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-32"
              >
                {isShortening ? 'Working...' : 'Shorten'}
              </button>
            </div>
          </form>

          {shortenError ? (
            <p className="mt-3 text-sm text-[#ff8a8a]">
              {shortenError}
            </p>
          ) : null}

          {shortenResult ? (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#4f8ef7]/25 bg-[#101722] p-3 opacity-100 transition-opacity sm:flex-row sm:items-center sm:justify-between">
              <a
                className="min-w-0 break-all font-mono text-sm text-[#d7e6ff] hover:text-[#f3f0e9]"
                href={shortenResult.shortUrl}
                target="_blank"
                rel="noreferrer"
              >
                {shortenResult.shortUrl}
              </a>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(shortenResult.shortUrl)}
                  className="rounded-md border border-white/10 px-3 py-2 text-sm text-[#d7d2c7] transition hover:border-white/20 hover:bg-white/10"
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
                <a
                  className="inline-flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-sm text-[#d7d2c7] transition hover:border-white/20 hover:bg-white/10"
                  href={shortenResult.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M7 17 17 7" />
                    <path d="M9 7h8v8" />
                  </svg>
                </a>
              </div>
            </div>
          ) : null}
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-[#121212]/95">
          <div className="h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
          <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#f3f0e9]">Inspect</h2>
              <p className="mt-1 text-sm text-[#8b867d]">Look up a short code or pasted short URL.</p>
            </div>
            {displayCode ? (
              <span className="rounded-md bg-white/[0.045] px-2 py-1 font-mono text-xs text-[#bdb7ab]">
                {displayCode}
              </span>
            ) : null}
          </div>

          <form className="space-y-3" onSubmit={handleAnalyticsLookup}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="block flex-1">
                <span className="sr-only">Short code or short URL</span>
                <input
                  type="text"
                  required
                  value={analyticsInput}
                  onChange={(event) => setAnalyticsInput(event.target.value)}
                  placeholder="Short code or short URL"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#171717] px-3 text-sm text-[#f3f0e9] outline-none transition placeholder:text-[#68645d] focus:border-[#4f8ef7] focus:ring-2 focus:ring-[#4f8ef7]/20"
                />
              </label>

              <button
                type="submit"
                disabled={isLoadingAnalytics}
                className="h-11 rounded-lg border border-white/10 px-4 text-sm font-medium text-[#d7d2c7] transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-28"
              >
                {isLoadingAnalytics ? 'Loading...' : 'Inspect'}
              </button>
            </div>
          </form>

          {analyticsError ? (
            <p className="mt-3 text-sm text-[#ff8a8a]">
              {analyticsError}
            </p>
          ) : null}

          {analyticsResult ? (
            <div className="mt-5 space-y-5 opacity-100 transition-opacity">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-[#8b867d]">Destination</p>
                  <p className="break-all font-mono text-sm text-[#d7d2c7]">
                    {analyticsResult.originalUrl}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
                  <div className="rounded-lg border border-white/10 bg-[#151515] px-3 py-3">
                    <p className="text-xs text-[#8b867d]">Clicks</p>
                    <p className="mt-1 text-2xl font-semibold text-[#f3f0e9]">
                      {analyticsResult.totalClicks}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#151515] px-3 py-3">
                    <p className="text-xs text-[#8b867d]">Created</p>
                    <p className="mt-1 text-xs font-medium text-[#d7d2c7]">
                      {formatTimestamp(analyticsResult.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-[#151515] px-3 py-3">
                    <p className="text-xs text-[#8b867d]">Last click</p>
                    <p className="mt-1 text-xs font-medium text-[#d7d2c7]">
                      {formatTimestamp(analyticsResult.lastClickedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#151515] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#8b867d]">Last 7 days</p>
                  <p className="font-mono text-xs text-[#68645d]">
                    {analyticsResult.clickTrend?.reduce((sum, item) => sum + item.clicks, 0) || 0} clicks
                  </p>
                </div>
                <div className="grid h-28 grid-cols-7 items-end gap-2">
                  {(analyticsResult.clickTrend || []).map((item) => {
                    const height = `${Math.max(8, (item.clicks / getLargestClickCount(analyticsResult.clickTrend)) * 100)}%`;

                    return (
                      <div className="flex h-full flex-col justify-end gap-2" key={item.date}>
                        <div
                          className="min-h-2 rounded-t bg-[#4f8ef7]/80"
                          title={`${item.clicks} clicks`}
                          style={{ height }}
                        />
                        <span className="truncate text-center text-[10px] text-[#8b867d]">
                          {formatShortDate(item.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-[#151515] p-4">
                  <p className="mb-3 text-xs text-[#8b867d]">Top referrers</p>
                  {analyticsResult.topReferrers?.length ? (
                    <div className="space-y-2">
                      {analyticsResult.topReferrers.map((item) => (
                        <div className="flex items-center justify-between gap-3 text-xs" key={item.domain}>
                          <span className="min-w-0 truncate font-mono text-[#d7d2c7]">{item.domain}</span>
                          <span className="text-[#8b867d]">{item.clicks}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#68645d]">No external referrers yet.</p>
                  )}
                </div>

                <div className="rounded-lg border border-white/10 bg-[#151515] p-4">
                  <p className="mb-3 text-xs text-[#8b867d]">Devices</p>
                  <div className="space-y-2">
                    {(analyticsResult.deviceBreakdown || []).map((item) => (
                      <div className="flex items-center justify-between gap-3 text-xs" key={item.label}>
                        <span className="capitalize text-[#d7d2c7]">{item.label}</span>
                        <span className="text-[#8b867d]">{item.clicks}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#151515] p-4">
                  <p className="mb-3 text-xs text-[#8b867d]">Browsers</p>
                  <div className="space-y-2">
                    {(analyticsResult.browserBreakdown || []).map((item) => (
                      <div className="flex items-center justify-between gap-3 text-xs" key={item.label}>
                        <span className="text-[#d7d2c7]">{item.label}</span>
                        <span className="text-[#8b867d]">{item.clicks}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs text-[#8b867d]">Recent activity</p>
                {analyticsResult.recentClicks.length === 0 ? (
                  <p className="rounded-lg border border-white/10 px-3 py-3 text-sm text-[#8b867d]">
                    No clicks recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-white/10 border-y border-white/10">
                    {analyticsResult.recentClicks.map((click) => (
                      <div
                        className="py-3 font-mono text-xs text-[#bdb7ab]"
                        key={click.clicked_at}
                      >
                        <span>{formatTimestamp(click.clicked_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-[#68645d]">
              Enter a code to inspect recent traffic.
            </p>
          )}
          </div>
        </section>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0f0f0f]/90 px-5 py-3 text-xs text-[#8b867d] backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4f8ef7]" />
            Express · Redis · PostgreSQL · AWS
          </span>
          <span>~6,000 req/sec · 50ms p99</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
