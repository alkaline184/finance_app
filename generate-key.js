const crypto = require('crypto');

// Generate a secure random API key (48 bytes = 64 characters in base64)
const apiKey = crypto.randomBytes(48).toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');
console.log('Generated API Key:', apiKey); 