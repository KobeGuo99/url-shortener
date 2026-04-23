const { generateShortCode, ALPHABET } = require('../services/shortCodeService');

describe('generateShortCode', () => {
  test('creates fixed-length codes from the allowed alphabet', () => {
    const code = generateShortCode();

    expect(code).toHaveLength(7);
    expect(code.split('').every((character) => ALPHABET.includes(character))).toBe(true);
  });

  test('creates varied values across calls', () => {
    const samples = new Set(Array.from({ length: 25 }, () => generateShortCode()));
    expect(samples.size).toBeGreaterThan(20);
  });
});
