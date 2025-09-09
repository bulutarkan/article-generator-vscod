import CryptoJS from 'crypto-js';

// IMPORTANT: Add VITE_CRYPTO_SECRET_KEY to your .env file
const secretKey = import.meta.env.VITE_CRYPTO_SECRET_KEY;

if (!secretKey) {
  throw new Error('VITE_CRYPTO_SECRET_KEY is not defined in your environment variables. Please add it to your .env file.');
}

/**
 * Encrypts a JSON object.
 * @param data The object to encrypt.
 * @returns An encrypted string.
 */
export const encryptData = (data: object): string => {
  const stringifiedData = JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringifiedData, secretKey).toString();
};

/**
 * Decrypts an encrypted string back to a JSON object.
 * @param encryptedData The string to decrypt.
 * @returns The decrypted object.
 */
export const decryptData = <T extends object>(encryptedData: string): T => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  if (!decryptedString) {
    throw new Error('Failed to decrypt data. Check the secret key or data integrity.');
  }
  return JSON.parse(decryptedString) as T;
};
