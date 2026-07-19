import CryptoJS from 'crypto-js';

// W środowisku React Native Expo używamy EXPO_PUBLIC do zmiennych srodowiskowych
const HMAC_SECRET = process.env.EXPO_PUBLIC_HMAC_SECRET || 'MySuperSecretHmacKeyForBooksi2026!';

function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const signRequest = (config: any) => {
  const timestamp = Date.now().toString();
  const nonce = generateNonce();

  const method = config.method ? config.method.toUpperCase() : 'GET';
  
  let rawPath = config.url || '';
  if (config.baseURL && rawPath.startsWith('http')) {
      rawPath = rawPath.replace(config.baseURL, '');
  }
  
  if (config.params) {
      const params = new URLSearchParams(config.params).toString();
      if (params) {
          rawPath += '?' + params;
      }
  }

  let bodyString = '';
  if (config.data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      bodyString = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
  }

  const payload = `${method}${rawPath}${bodyString}${timestamp}${nonce}`;
  const signature = CryptoJS.HmacSHA256(payload, HMAC_SECRET).toString(CryptoJS.enc.Base64);

  config.headers = config.headers || {};
  config.headers['X-Timestamp'] = timestamp;
  config.headers['X-Nonce'] = nonce;
  config.headers['X-Signature'] = signature;

  return config;
};
