import CryptoJS from 'crypto-js';

const getSecret = () => {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is not defined in environment variables');
  }
  return secret;
};

export const encryptText = (text: string): string => {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, getSecret()).toString();
};

export const decryptText = (ciphertext: string): string => {
  if (!ciphertext) return '';
  const bytes = CryptoJS.AES.decrypt(ciphertext, getSecret());
  return bytes.toString(CryptoJS.enc.Utf8);
};
