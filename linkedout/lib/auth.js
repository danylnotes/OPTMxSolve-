// Pseudonymous accounts: username + password only. No email, no real name.
// Passwords are hashed with scrypt (node:crypto), never stored or logged.
import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const USERNAME_RULES = Object.freeze({ min: 3, max: 20 });
export const PASSWORD_RULES = Object.freeze({ min: 8, max: 200 });
const RESERVED = new Set(['admin', 'administrator', 'moderator', 'mod', 'linkedout', 'anonymous', 'support', 'staff', 'system', 'root', 'null', 'undefined']);

export const usernameKey = (name) => String(name).toLowerCase();

/** Returns { ok: true, value } or { ok: false, error } */
export function validateUsername(input) {
  const name = typeof input === 'string' ? input.trim() : '';
  if (name.length < USERNAME_RULES.min || name.length > USERNAME_RULES.max) {
    return { ok: false, error: `Username must be ${USERNAME_RULES.min}–${USERNAME_RULES.max} characters.` };
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) return { ok: false, error: 'Use only letters, numbers and underscores.' };
  if (RESERVED.has(usernameKey(name))) return { ok: false, error: 'That username is reserved.' };
  return { ok: true, value: name };
}

export function validatePassword(input) {
  if (typeof input !== 'string' || input.length < PASSWORD_RULES.min) {
    return { ok: false, error: `Password must be at least ${PASSWORD_RULES.min} characters.` };
  }
  if (input.length > PASSWORD_RULES.max) return { ok: false, error: 'Password is too long.' };
  return { ok: true, value: input };
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

// Verified against this when the username doesn't exist, so response time doesn't reveal which usernames are taken.
let dummy;
export async function verifyPassword(password, stored) {
  stored ||= (dummy ??= await hashPassword('dummy-password-for-timing'));
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

export const newSessionToken = () => randomBytes(32).toString('base64url');
/** Only the hash of a session token is stored, so a leaked data file can't be used to hijack sessions. */
export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');
