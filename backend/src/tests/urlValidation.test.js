const { isValidHttpUrl } = require('../utils/urlValidation');

describe('isValidHttpUrl', () => {
  test('accepts http and https URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
    expect(isValidHttpUrl('http://example.com/path?query=1')).toBe(true);
  });

  test('rejects unsupported schemes and malformed values', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('notaurl')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });
});
