import jwt from 'jsonwebtoken';

/**
 * TokenManager class to handle JWT token generation and extraction.
 */
export class TokenManager {
    constructor() {}

    /**
     * Extracts and verifies a JWT token.
     * @template T
     * @param {string} token - The JWT token to be verified.
     * @param {string} secret - The secret key used to verify the token.
     * @returns {T | undefined} The decoded token payload if verification is successful, otherwise undefined.
     */
    extract<T>(token: string, secret: string): T | undefined {
        try {
            return jwt.verify(token, secret) as T;
        } catch (error) {
            console.error('Token verification failed:', error);
            return undefined;
        }
    }

    /**
     * Generates a JWT token.
     * @template T
     * @param {T} payload - The payload to be encoded in the token.
     * @param {string} secret - The secret key used to sign the token.
     * @param {string | number} [expiresIn='1h'] - The expiration time for the token.
     * @returns {string} The generated JWT token.
     */
    generate<T extends {}>(payload: T, secret: string, expiresIn: string | number = '1h'): string {
        try {
            return jwt.sign(payload, secret, { expiresIn });
        } catch (error) {
            console.error('Token generation failed:', error);
            throw new Error('Token generation failed');
        }
    }
}