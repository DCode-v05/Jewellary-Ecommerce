import { Request, Response } from "express";
import crypto from "crypto";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     CsrfProtection:
 *       type: apiKey
 *       in: header
 *       name: x-csrf-token
 *       description: |
 *         CSRF token required for state-changing operations (POST, PUT, DELETE, PATCH).
 *         
 *         **How CSRF Protection Works:**
 *         1. Get a CSRF token from GET /api/csrf-token
 *         2. The token is returned in response body AND set as a cookie
 *         3. Include the token in the `x-csrf-token` header for protected requests
 *         4. Server validates that header token matches cookie token
 *         
 *         **Validation Errors (HTTP 403):**
 *         - "CSRF cookie not found." - No csrfToken cookie present
 *         - "CSRF header not found." - No x-csrf-token header present  
 *         - "CSRF token mismatch." - Header and cookie tokens don't match
 *         
 *         **Example Usage:**
 *         ```
 *         // 1. Get token
 *         GET /api/csrf-token
 *         Response: { "csrfToken": "abc123..." }
 *         Set-Cookie: csrfToken=abc123...
 *         
 *         // 2. Use token in protected request
 *         POST /api/some-protected-endpoint
 *         Headers: {
 *           "x-csrf-token": "abc123...",
 *           "Cookie": "csrfToken=abc123..."
 *         }
 *         ```
 */

/**
 * @swagger
 * tags:
 *   name: CSRF
 *   description: CSRF (Cross-Site Request Forgery) protection APIs for securing state-changing operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CsrfTokenResponse:
 *       type: object
 *       properties:
 *         csrfToken:
 *           type: string
 *           description: A 64-character hexadecimal CSRF token for protecting against cross-site request forgery attacks
 *           example: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 *       required:
 *         - csrfToken
 *     
 *     CsrfError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing the CSRF validation failure
 *       required:
 *         - error
 *       examples:
 *         cookieNotFound:
 *           value:
 *             error: "CSRF cookie not found."
 *         headerNotFound:
 *           value:
 *             error: "CSRF header not found."
 *         tokenMismatch:
 *           value:
 *             error: "CSRF token mismatch."
 */

/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     summary: Generate CSRF token
 *     description: |
 *       Generates a new CSRF token for protecting against Cross-Site Request Forgery attacks.
 *       
 *       **How to use:**
 *       1. Call this endpoint to get a CSRF token
 *       2. The token is returned in the response body AND set as a cookie
 *       3. Include the token in the `x-csrf-token` header for protected requests
 *       4. The server will validate that the header token matches the cookie token
 *       
 *       **Cookie Details:**
 *       - Name: `csrfToken`
 *       - HttpOnly: `false` (accessible to JavaScript)
 *       - Secure: `true` in production, `false` in development
 *       - SameSite: `Lax`
 *       - Path: `/`
 *       
 *       **Security Note:** This endpoint does not require authentication and can be called by anyone.
 *     tags: [CSRF]
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         headers:
 *           Set-Cookie:
 *             description: CSRF token set as a cookie for validation purposes
 *             schema:
 *               type: string
 *               example: "csrfToken=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456; Path=/; SameSite=Lax"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CsrfTokenResponse'
 *             example:
 *               csrfToken: "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
 */

export const getCsrfToken = (req: Request, res: Response) => {
  const token = crypto.randomBytes(32).toString("hex");

  res.cookie("csrfToken", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // domain: ".wymi.in",
  });

  res.status(200).json({ csrfToken: token });
};
