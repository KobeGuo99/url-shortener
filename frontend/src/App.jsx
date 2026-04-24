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
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
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
    <div className="min-h-screen bg-canvas bg-grid bg-[length:42px_42px] text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 lg:px-10">
        <header className="grid gap-8 rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-card backdrop-blur animate-rise lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
          <div className="space-y-6">
            <p className="font-mono text-sm uppercase tracking-[0.32em] text-brand-600">
              Linklift - URL shortener
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">
                A URL shortener I built from scratch.
              </h1>
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-slate-500">
                Built by Kobe Guo
              </p>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                A production-style URL shortener with Redis cache-aside lookups,
                PostgreSQL persistence, Redis-backed rate limiting, and click analytics.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-700">
              {['Express', 'PostgreSQL', 'Redis', 'React', 'Docker', 'AWS-ready'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-slate-900 p-6 text-left text-sm text-slate-200">
            <p className="font-mono text-brand-300">$ architecture</p>
            <pre className="mt-4 overflow-auto font-mono leading-7 text-slate-300">
{`Client
  -> Express API
    -> Redis rate limiter
    -> POST /shorten -> PostgreSQL
    -> GET /:code -> Redis cache -> PostgreSQL fallback
    -> async click event -> clicks table`}
            </pre>
          </div>
        </header>

        <main className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-card animate-rise [animation-delay:120ms]">
            <div className="mb-6 space-y-2">
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                Shorten
              </p>
              <h2 className="text-3xl font-semibold">Create a short link</h2>
              <p className="text-slate-600">
                Paste any valid `http` or `https` URL and generate a shareable short code.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleShorten}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Long URL
                </span>
                <input
                  type="url"
                  required
                  value={longUrl}
                  onChange={(event) => setLongUrl(event.target.value)}
                  placeholder="https://example.com/really/long/path"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-base outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <button
                type="submit"
                disabled={isShortening}
                className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isShortening ? 'Creating short URL...' : 'Shorten URL'}
              </button>
            </form>

            {shortenError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {shortenError}
              </p>
            ) : null}

            {shortenResult ? (
              <div className="mt-6 rounded-[1.5rem] border border-brand-100 bg-brand-50 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-brand-600">
                  Generated short URL
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <a
                    className="break-all text-lg font-semibold text-brand-700 hover:text-brand-600"
                    href={shortenResult.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shortenResult.shortUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(shortenResult.shortUrl)}
                    className="rounded-full border border-brand-300 px-4 py-2 font-medium text-brand-700 transition hover:bg-white"
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Original: <span className="font-medium">{shortenResult.originalUrl}</span>
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-8 shadow-card animate-rise [animation-delay:240ms]">
            <div className="mb-6 space-y-2">
              <p className="font-mono text-sm uppercase tracking-[0.28em] text-accent">
                Analytics
              </p>
              <h2 className="text-3xl font-semibold">Inspect click activity</h2>
              <p className="text-slate-600">
                Enter a short code or full short URL to inspect total traffic and the latest visits.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleAnalyticsLookup}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Short code
                </span>
                <input
                  type="text"
                  required
                  value={analyticsInput}
                  onChange={(event) => setAnalyticsInput(event.target.value)}
                  placeholder="abc1234 or http://localhost:8080/abc1234"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-base outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoadingAnalytics}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingAnalytics ? 'Loading analytics...' : 'Fetch analytics'}
                </button>
                {displayCode ? (
                  <span className="rounded-full bg-slate-100 px-4 py-2 font-mono text-sm text-slate-600">
                    {displayCode}
                  </span>
                ) : null}
              </div>
            </form>

            {analyticsError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {analyticsError}
              </p>
            ) : null}

            {analyticsResult ? (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
                      Total clicks
                    </p>
                    <p className="mt-3 text-4xl font-semibold">{analyticsResult.totalClicks}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-500">
                      Destination
                    </p>
                    <p className="mt-3 break-all text-sm font-medium text-slate-700">
                      {analyticsResult.originalUrl}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-medium">Clicked at</th>
                          <th className="px-4 py-3 font-medium">IP</th>
                          <th className="px-4 py-3 font-medium">User agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {analyticsResult.recentClicks.map((click) => (
                          <tr key={`${click.clicked_at}-${click.ip}`}>
                            <td className="px-4 py-3">{formatTimestamp(click.clicked_at)}</td>
                            <td className="px-4 py-3 font-mono text-xs">{click.ip || 'n/a'}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {click.user_agent || 'Unknown client'}
                            </td>
                          </tr>
                        ))}
                        {analyticsResult.recentClicks.length === 0 ? (
                          <tr>
                            <td className="px-4 py-5 text-slate-500" colSpan="3">
                              No clicks recorded yet.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
