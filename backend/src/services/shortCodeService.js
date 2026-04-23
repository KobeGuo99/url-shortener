const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generateShortCode(length = 7) {
  const bytes = crypto.randomBytes(length);
  let result = '';

  for (let index = 0; index < length; index += 1) {
    result += ALPHABET[bytes[index] % ALPHABET.length];
  }

  return result;
}

module.exports = {
  generateShortCode,
  ALPHABET,
};
