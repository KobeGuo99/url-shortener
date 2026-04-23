const fs = require('fs');
const path = require('path');
const autocannon = require('autocannon');

const targetUrl = process.env.LOADTEST_URL || 'http://localhost:8080/H6SsviB';
const resultsPath = path.resolve(__dirname, '..', 'results', 'loadtest.txt');

let ipCounter = 1;

function nextIp() {
  const current = ipCounter;
  ipCounter += 1;

  const second = Math.floor(current / 65025) % 250 + 1;
  const third = Math.floor(current / 255) % 250 + 1;
  const fourth = current % 250 + 1;

  return `10.${second}.${third}.${fourth}`;
}

function run() {
  const output = [];
  const originalWrite = process.stdout.write.bind(process.stdout);

  process.stdout.write = (chunk, encoding, callback) => {
    output.push(typeof chunk === 'string' ? chunk : chunk.toString(encoding));
    return originalWrite(chunk, encoding, callback);
  };

  const instance = autocannon({
    url: targetUrl,
    connections: 100,
    duration: 30,
    setupClient(client) {
      client.setHeaders({
        'X-Forwarded-For': nextIp(),
      });
    },
  }, (error, result) => {
    process.stdout.write = originalWrite;

    if (error) {
      console.error(error);
      process.exit(1);
    }

    const errorResponses = (result['4xx'] || 0) + (result['5xx'] || 0) + result.errors;
    const errorRate = ((errorResponses / result.requests.total) * 100).toFixed(2);

    const summary = [
      '',
      'Summary',
      `Target URL: ${targetUrl}`,
      `Requests/sec (avg): ${result.requests.average}`,
      `Latency p99: ${result.latency.p99} ms`,
      `Error rate: ${errorRate}%`,
      `3xx responses: ${result['3xx'] || 0}`,
      `4xx responses: ${result['4xx'] || 0}`,
      `5xx responses: ${result['5xx'] || 0}`,
      '',
    ].join('\n');

    const finalOutput = output.join('') + summary;
    fs.writeFileSync(resultsPath, finalOutput);
    process.stdout.write(summary);
  });

  instance.on('response', (client) => {
    client.setHeaders({
      'X-Forwarded-For': nextIp(),
    });
  });

  autocannon.track(instance, { renderProgressBar: false });
}

run();
