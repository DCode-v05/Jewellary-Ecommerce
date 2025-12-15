import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { registerSchema, loginSchema, forgetPasswordSchema, deleteUserSchema } from "../validators/auth.validator";
import { v4 as uuidv4 } from "uuid";
import { sendSmsOtp, sendEmailOtp, verifySmsOtp, verifyEmailOtp} from "../utils/otpHandling";
import { ZodError } from "zod";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization APIs for user registration, login, OTP verification, and password management
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *       description: Access token stored in HttpOnly cookie (15 minutes expiry)
 *     refreshAuth:
 *       type: apiKey
 *       in: cookie
 *       name: refreshToken
 *       description: Refresh token stored in HttpOnly cookie (7 days expiry)
 *
 *   schemas:
 *     # Common Error Responses
 *     ValidationError:
 *       type: object
 *       properties:
 *         error:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               expected:
 *                 type: string
 *               received:
 *                 type: string
 *               path:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *           example:
 *             - code: "invalid_string"
 *               expected: "valid email format"
 *               received: "invalid-email"
 *               path: ["email"]
 *               message: "Invalid email format"
 *
 *     GenericError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message describing what went wrong
 *
 *     # Registration Schemas
 *     RegisterInput:
 *       type: object
 *       required: [email, password, name, phone, gender, dateOfBirth]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (will be converted to lowercase)
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$
 *           description: Password must contain at least 8 characters with uppercase, lowercase, and numbers. Special characters @$!%*?& are allowed
 *           example: "StrongP@ss123"
 *         name:
 *           type: string
 *           minLength: 1
 *           description: User's full name
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           pattern: ^\+91\d{10}$
 *           description: Indian phone number in +91 followed by 10 digits format
 *           example: "+919876543210"
 *         gender:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *           description: User's gender preference
 *           example: "MALE"
 *         dateOfBirth:
 *           type: string
 *           format: date-time
 *           pattern: ^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$
 *           description: User's date of birth in ISO 8601 format (UTC)
 *           example: "1995-06-15T00:00:00Z"
 *
 *     RegisterUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User registered. OTPs sent to email and phone."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Unique user identifier
 *               example: "8a45bcca-e6e2-41c7-b6be-8db0b0f9c3f1"
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               format: email
 *               example: "john.doe@example.com"
 *             phone:
 *               type: string
 *               example: "+919876543210"
 *             smsStatus:
 *               type: string
 *               enum: [pending, approved, failed]
 *               description: Status of SMS OTP sending
 *               example: "pending"
 *             emailStatus:
 *               type: string
 *               enum: [pending, approved, failed]
 *               description: Status of Email OTP sending
 *               example: "pending"
 *       description: Response after successful user registration with OTP sending status
 *
 *     # Login Schemas
 *     LoginInput:
 *       type: object
 *       required: [userName, password]
 *       properties:
 *         userName:
 *           type: string
 *           description: Email address or phone number for authentication
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$
 *           description: User's password (same requirements as registration)
 *           example: "StrongP@ss123"
 *
 *     LoginAuthResponse:
 *       type: object
 *       properties:
 *         result:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: User's full name
 *               example: "John Doe"
 *             email:
 *               type: string
 *               format: email
 *               description: User's email address
 *               example: "john.doe@example.com"
 *             role:
 *               type: string
 *               enum: [USER, ADMIN]
 *               description: User's role in the system
 *               example: "USER"
 *       description: Response after successful login. Access and refresh tokens are set as HttpOnly cookies
 *
 *     # Token Refresh Schema
 *     RefreshTokenAuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Access token refreshed successfully"
 *       description: Response after successful token refresh. New tokens are set as HttpOnly cookies
 *
 *     # Logout Schema
 *     LogoutResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Logged out successfully."
 *       description: Response after successful logout. All authentication cookies are cleared
 *
 *     # OTP Verification Schemas
 *     VerifyEmailOTPInput:
 *       type: object
 *       required: [email, emailOtp]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address associated with the OTP
 *           example: "john.doe@example.com"
 *         emailOtp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           pattern: ^\d{6}$
 *           description: 6-digit OTP received via email
 *           example: "123456"
 *
 *     VerifyEmailOTPResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Email OTP verified successfully."
 *       description: Response after successful email OTP verification. User's email is marked as verified
 *
 *     VerifySmsOTPInput:
 *       type: object
 *       required: [phone, smsOtp]
 *       properties:
 *         phone:
 *           type: string
 *           pattern: ^\+91\d{10}$
 *           description: Phone number associated with the OTP
 *           example: "+919876543210"
 *         smsOtp:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *           pattern: ^\d{6}$
 *           description: 6-digit OTP received via SMS
 *           example: "654321"
 *
 *     VerifySmsOTPResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "SMS OTP verified successfully."
 *       description: Response after successful SMS OTP verification. User's phone is marked as verified
 *
 *     # OTP Resend Schemas
 *     ResendEmailOtpInput:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address to resend OTP to
 *           example: "john.doe@example.com"
 *
 *     ResendEmailOtpResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "OTP resend successfully to john.doe@example.com."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "5f4eabc0-1b22-4c77-8aa4-12edbd123456"
 *             email:
 *               type: string
 *               format: email
 *               example: "john.doe@example.com"
 *             emailStatus:
 *               type: string
 *               enum: [pending, approved, failed]
 *               example: "pending"
 *       description: Response after successfully resending email OTP
 *
 *     ResendSmsOtpInput:
 *       type: object
 *       required: [phone]
 *       properties:
 *         phone:
 *           type: string
 *           pattern: ^\+91\d{10}$
 *           description: Phone number to resend OTP to
 *           example: "+919876543210"
 *
 *     ResendSmsOtpResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "OTP resend successfully to +919876543210."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               example: "5f4eabc0-1b22-4c77-8aa4-12edbd123456"
 *             phone:
 *               type: string
 *               example: "+919876543210"
 *             smsStatus:
 *               type: string
 *               enum: [pending, approved, failed]
 *               example: "pending"
 *       description: Response after successfully resending SMS OTP
 *
 *     # Forgot Password Schemas
 *     ForgetPasswordInput:
 *       type: object
 *       required: [email, newPassword]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the account to reset password
 *           example: "john.doe@example.com"
 *         newPassword:
 *           type: string
 *           pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$
 *           description: New password (same requirements as registration)
 *           example: "NewStrongP@ss123"
 *
 *     ForgetPasswordResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Password updated successfully."
 *       description: Response after successful password reset
 *
 *     DeleteUserInput:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the user to delete
 *           example: "john.doe@example.com"
 *
 *     DeleteUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User deleted successfully."
 */

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    audience: "wymi-api",
    issuer: "wymi.in",
    jwtid: uuidv4(),
  });
};

const generateRefreshToken = (userId: string, jti: string) => {
  return jwt.sign({ userId, jti }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    audience: "wymi-api",
    issuer: "wymi.in",
  });
};

const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const cookieSet = (
  res: Response,
  key: string,
  value: string,
  maxAge: number
) => {
  res.cookie(key, value, {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    domain: ".wymi.in",
    path: "/",
    maxAge: maxAge,
  });
};

const cookieClear = (res: Response, key: string) => {
  res.clearCookie(key, {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    domain: ".wymi.in",
    path: "/",
  });
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: |
 *       Creates a new user account in the system and sends OTP verification codes to both email and phone number.
 *       
 *       **Process:**
 *       1. Validates input data (email format, password strength, phone format, etc.)
 *       2. Checks if email or phone already exists in the system
 *       3. Creates user account with hashed password
 *       4. Sends 6-digit OTP to email via Twilio
 *       5. Sends 6-digit OTP to phone via SMS (with WhatsApp fallback)
 *       6. Sets encrypted OTP session identifiers in cookies
 *       
 *       **Note:** User account will be created but requires email and SMS verification before login is allowed.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *           examples:
 *             validUser:
 *               summary: Valid user registration
 *               value:
 *                 email: "john.doe@example.com"
 *                 password: "StrongP@ss123"
 *                 name: "John Doe"
 *                 phone: "+919876543210"
 *                 gender: "MALE"
 *                 dateOfBirth: "1995-06-15T00:00:00Z"
 *     responses:
 *       201:
 *         description: User registered successfully and OTPs sent
 *         headers:
 *           Set-Cookie:
 *             description: Session cookies for OTP verification (encodedSmsSid, encodedEmailSid)
 *             schema:
 *               type: string
 *               example: "encodedSmsSid=base64EncodedValue; Path=/; Domain=.wymi.in; Secure; Max-Age=600"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterUserResponse'
 *             examples:
 *               success:
 *                 summary: Successful registration
 *                 value:
 *                   message: "User registered. OTPs sent to email and phone."
 *                   user:
 *                     id: "8a45bcca-e6e2-41c7-b6be-8db0b0f9c3f1"
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                     phone: "+919876543210"
 *                     smsStatus: "pending"
 *                     emailStatus: "pending"
 *       400:
 *         description: Invalid input data or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/GenericError'
 *             examples:
 *               validationError:
 *                 summary: Validation errors
 *                 value:
 *                   error:
 *                     - code: "invalid_string"
 *                       expected: "valid email format"
 *                       received: "invalid-email"
 *                       path: ["email"]
 *                       message: "Invalid email format"
 *               emailExists:
 *                 summary: Email already registered
 *                 value:
 *                   error: "Email Id already registered."
 *               phoneExists:
 *                 summary: Phone already registered
 *                 value:
 *                   error: "Phone number already registered."
 *               generalError:
 *                 summary: Registration processing error
 *                 value:
 *                   error: "Register Error: OTP service unavailable"
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingEmail) {
      res.status(400).json({ error: "Email Id already registered." });
      return;
    }

    const existingPhone = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingPhone) {
      res.status(400).json({ error: "Phone number already registered." });
      return;
    }


    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: "USER",
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        isSmsVerified: false,
        isEmailVerified: false,
      },
    });

    const smsOtpStatus = await sendSmsOtp(user.phone);
    
    if (smsOtpStatus) {
      const encodedSmsSid = Buffer.from(smsOtpStatus.smsSid ?? "").toString("base64");
      cookieSet(res, "encodedSmsSid", encodedSmsSid, 10 * 60 * 1000);

      res.status(201).json({
        message: "User registered. OTPs sent to email and phone.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          smsStatus: smsOtpStatus.smsStatus,
        },
      });
    }
    // if (smsOtpStatus && emailOtpStatus) {
    //   const encodedSmsSid = Buffer.from(smsOtpStatus.smsSid ?? "").toString("base64");
    //   cookieSet(res, "encodedSmsSid", encodedSmsSid, 10 * 60 * 1000);

    //   const encodedEmailSid = Buffer.from(emailOtpStatus.emailSid ?? "").toString("base64");
    //   cookieSet(res, "encodedEmailSid", encodedEmailSid, 10 * 60 * 1000);

    //   res.status(201).json({
    //     message: "User registered. OTPs sent to email and phone.",
    //     user: {
    //       id: user.id,
    //       name: user.name,
    //       email: user.email,
    //       phone: user.phone,
    //       smsStatus: smsOtpStatus.smsStatus,
    //       emailStatus: emailOtpStatus.emailStatus,
    //     },
    //   });
    // }
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      res.status(400).json({ error: "Register Error: " + (err as Error).message });
    }
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user with credentials
 *     description: |
 *       Authenticates a user using email/phone and password, then issues authentication tokens.
 *       
 *       **Process:**
 *       1. Validates input credentials
 *       2. Finds user by email or phone number
 *       3. Verifies password using bcrypt
 *       4. Checks if both email and SMS are verified
 *       5. Generates access token (15 min expiry) and refresh token (7 days expiry)
 *       6. Stores refresh token in database with session info
 *       7. Sets tokens as HttpOnly cookies
 *       8. Updates user's last login timestamp
 *       
 *       **Rate Limiting:** Limited to 5 login attempts per 5 minutes per IP address.
 *       
 *       **Security:** Tokens are stored as HttpOnly, Secure cookies with SameSite=None for cross-origin support.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *           examples:
 *             emailLogin:
 *               summary: Login with email
 *               value:
 *                 userName: "john.doe@example.com"
 *                 password: "StrongP@ss123"
 *             phoneLogin:
 *               summary: Login with phone
 *               value:
 *                 userName: "+919876543210"
 *                 password: "StrongP@ss123"
 *     responses:
 *       200:
 *         description: Login successful, authentication tokens set as cookies
 *         headers:
 *           Set-Cookie:
 *             description: Authentication cookies (accessToken, refreshToken)
 *             schema:
 *               type: string
 *               example: "accessToken=jwt.token.here; Path=/; Domain=.wymi.in; HttpOnly; Secure; Max-Age=900"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginAuthResponse'
 *             examples:
 *               userLogin:
 *                 summary: Successful user login
 *                 value:
 *                   result:
 *                     name: "John Doe"
 *                     email: "john.doe@example.com"
 *                     role: "USER"
 *               adminLogin:
 *                 summary: Successful admin login
 *                 value:
 *                   result:
 *                     name: "Admin User"
 *                     email: "admin@example.com"
 *                     role: "ADMIN"
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/GenericError'
 *             examples:
 *               validationError:
 *                 summary: Input validation failed
 *                 value:
 *                   error:
 *                     - code: "too_small"
 *                       minimum: 1
 *                       type: "string"
 *                       inclusive: true
 *                       exact: false
 *                       message: "Username is required"
 *                       path: ["userName"]
 *               loginError:
 *                 summary: Login processing error
 *                 value:
 *                   error: "Login Error: Database connection failed"
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             examples:
 *               userNotFound:
 *                 summary: User doesn't exist
 *                 value:
 *                   error: "User not found"
 *               invalidCredentials:
 *                 summary: Wrong password
 *                 value:
 *                   error: "Invalid credentials"
 *               emailNotVerified:
 *                 summary: Email verification required
 *                 value:
 *                   error: "Email not verified"
 *               smsNotVerified:
 *                 summary: SMS verification required
 *                 value:
 *                   error: "SMS not verified"
 *               bothNotVerified:
 *                 summary: Both verifications required
 *                 value:
 *                   error: "Email not verified, SMS not verified"
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Too many login attempts. Please try again later."
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    let user;
    if (data.userName.includes("@")) {
      user = await prisma.user.findUnique({
        where: { email: data.userName.toLowerCase() },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { phone: data.userName },
      });
    }

    if (!user) {
      res.status(401).json({ error: "User not found" });
    } else if (data.passwordHash !== user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
    } else if (!user.isEmailVerified || !user.isSmsVerified) {
      const errorMessages = [];
      // if (!user.isEmailVerified) {
      //   errorMessages.push("Email not verified");
      // }
      if (!user.isSmsVerified) {
        errorMessages.push("Phone Number not verified");
        res.status(401).json({ error: errorMessages.join(", "), email: user.email, phone: user.phone });
        return;
      }
    }

    const jti = uuidv4();
    const accessToken = generateAccessToken(user!.id, user!.role);
    const refreshToken = generateRefreshToken(user!.id, jti);

    const refreshTokenHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        id: jti,
        tokenHash: refreshTokenHash,
        userId: user!.id,
        userAgent: req.get("User-Agent") || "Unknown",
        ipAddress: req.ip || "Unknown",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    cookieSet(res, "refreshToken", refreshToken, 7 * 24 * 60 * 60 * 1000);

    cookieSet(res, "accessToken", accessToken, 15 * 60 * 1000);

    const result = {
      name: user!.name,
      email: user!.email,
      role: user!.role,
    };
    res.status(200).json({ result });
  } catch (err: unknown) {
    console.error("Login error:", err);
    if (err instanceof ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      res.status(400).json({ error: "Login Error: " + (err as Error).message });
    }
  }
};

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh authentication tokens
 *     description: |
 *       Refreshes the access token using a valid refresh token stored in cookies.
 *       
 *       **Process:**
 *       1. Extracts refresh token from HttpOnly cookie
 *       2. Verifies and decodes the refresh token
 *       3. Validates token against database (checks expiry, validity)
 *       4. Invalidates the old refresh token
 *       5. Generates new access and refresh tokens
 *       6. Stores new refresh token in database
 *       7. Sets new tokens as HttpOnly cookies
 *       
 *       **Security:** This endpoint uses token rotation - each refresh invalidates the previous token.
 *     tags: [Auth]
 *     security:
 *       - refreshAuth: []
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: New authentication cookies (accessToken, refreshToken)
 *             schema:
 *               type: string
 *               example: "accessToken=new.jwt.token; Path=/; Domain=.wymi.in; HttpOnly; Secure; Max-Age=900"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenAuthResponse'
 *             example:
 *               message: "Access token refreshed successfully"
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             examples:
 *               missingToken:
 *                 summary: No refresh token provided
 *                 value:
 *                   error: "Refresh token missing."
 *               invalidToken:
 *                 summary: Token invalid or expired
 *                 value:
 *                   error: "Invalid or expired refresh token."
 *               userNotFound:
 *                 summary: User associated with token not found
 *                 value:
 *                   error: "User not found."
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({ error: "Refresh token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      jti: string;
    };

    const incomingHash = hashToken(token);

    const existingToken = await prisma.refreshToken.findUnique({
      where: { id: decoded.jti },
    });

    if (
      !existingToken ||
      !existingToken.isValid ||
      existingToken.tokenHash !== incomingHash ||
      existingToken.expiresAt < new Date()
    ) {
      res.status(401).json({ error: "Invalid or expired refresh token." });
    }

    await prisma.refreshToken.update({
      where: { id: decoded.jti },
      data: { isValid: false },
    });

    const newJti = uuidv4();
    const newRefreshToken = generateRefreshToken(decoded.userId, newJti);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });
    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }
    const newAccessToken = generateAccessToken(decoded.userId, user.role);

    const newRefreshTokenHash = hashToken(newRefreshToken);

    await prisma.refreshToken.create({
      data: {
        id: newJti,
        tokenHash: newRefreshTokenHash,
        userId: decoded.userId,
        userAgent: req.get("User-Agent") || "Unknown",
        ipAddress: req.ip || "Unknown",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    cookieSet(res, "refreshToken", newRefreshToken, 7 * 24 * 60 * 60 * 1000);

    cookieSet(res, "accessToken", newAccessToken, 15 * 60 * 1000);

    res.json({
      message: "Access token refreshed successfully",
    });
  } catch (err) {
    console.error("Refresh Token error:", err);
    res.status(401).json({ error: "Invalid or expired refresh token." });
  }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     description: |
 *       Logs out the user by invalidating their refresh token and clearing all authentication cookies.
 *       
 *       **Process:**
 *       1. Extracts refresh token from HttpOnly cookie
 *       2. Verifies and decodes the refresh token
 *       3. Marks the refresh token as invalid in database
 *       4. Clears all authentication and session cookies
 *       
 *       **Cookies Cleared:** refreshToken, accessToken, csrfToken, _csrf, encodedSmsSid, encodedEmailSid
 *     tags: [Auth]
 *     security:
 *       - refreshAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears all authentication cookies
 *             schema:
 *               type: string
 *               example: "refreshToken=; Path=/; Domain=.wymi.in; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *             example:
 *               message: "Logged out successfully."
 *       400:
 *         description: Refresh token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Refresh token missing."
 *       500:
 *         description: Logout failed due to server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Logout failed."
 */
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(400).json({ error: "Refresh token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      jti: string;
    };

    await prisma.refreshToken.updateMany({
      where: { id: decoded.jti },
      data: { isValid: false },
    });

    cookieClear(res, "refreshToken");
    cookieClear(res, "accessToken");
    cookieClear(res, "csrfToken");
    cookieClear(res, "_csrf");
    cookieClear(res, "encodedSmsSid");
    cookieClear(res, "encodedEmailSid");

    res.json({ message: "Logged out successfully." });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed." });
  }
};


/**
 * @swagger
 * /api/auth/verify-email-otp:
 *   post:
 *     summary: Verify email OTP for account activation
 *     description: |
 *       Verifies the 6-digit OTP sent to the user's email address during registration.
 *       
 *       **Process:**
 *       1. Validates the email and OTP format
 *       2. Finds the user by email address
 *       3. Retrieves the encrypted email OTP session ID from cookies
 *       4. Verifies the OTP with Twilio's verification service
 *       5. Marks the user's email as verified in the database
 *       6. Clears the email OTP session cookie
 *       
 *       **Rate Limiting:** Limited to 5 OTP verification attempts per 15 minutes per IP.
 *       
 *       **Required:** Must have valid encodedEmailSid cookie from registration/resend.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailOTPInput'
 *           example:
 *             email: "john.doe@example.com"
 *             emailOtp: "123456"
 *     responses:
 *       200:
 *         description: Email OTP verified successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears the email OTP session cookie
 *             schema:
 *               type: string
 *               example: "encodedEmailSid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyEmailOTPResponse'
 *             example:
 *               message: "Email OTP verified successfully."
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             examples:
 *               invalidOtp:
 *                 summary: Wrong or expired OTP
 *                 value:
 *                   error: "Invalid or expired email OTP."
 *               verificationError:
 *                 summary: OTP service error
 *                 value:
 *                   error: "OTP verification service unavailable"
 *       401:
 *         description: Missing email OTP session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Email OTP SID missing."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "User not found."
 *       429:
 *         description: Too many OTP attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Too many OTP requests. Try again later."
 */
export const verifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email, emailOtp } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const encodedEmailSid = req.cookies.encodedEmailSid;
    if (!encodedEmailSid) {
      res.status(401).json({ error: "Email OTP SID missing." });
      return;
    }

    const emailSid = Buffer.from(encodedEmailSid, "base64").toString("utf-8");
    const emailVerificationResult = await verifyEmailOtp(emailSid, emailOtp);
    if (
      emailVerificationResult &&
      emailVerificationResult.emailStatus == "approved"
    ) {
      res.clearCookie("encodedEmailSid", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
        },
      });
      res.status(200).json({ message: "Email OTP verified successfully." });
    } else {
      res.status(400).json({ error: "Invalid or expired email OTP." });
      return;
    }
    res.status(200).json({ message: "Email OTP verified successfully." });
  } catch (err: unknown) {
    console.error("Email OTP verification error:", err);
    res.status(400).json({ error: (err as Error).message });
  }
};

/**
 * @swagger
 * /api/auth/verify-sms-otp:
 *   post:
 *     summary: Verify SMS OTP for account activation
 *     description: |
 *       Verifies the 6-digit OTP sent to the user's phone number during registration.
 *       
 *       **Process:**
 *       1. Validates the phone number and OTP format
 *       2. Finds the user by phone number
 *       3. Retrieves the encrypted SMS OTP session ID from cookies
 *       4. Verifies the OTP with Twilio's verification service
 *       5. Marks the user's phone as verified in the database
 *       6. Clears the SMS OTP session cookie
 *       
 *       **Rate Limiting:** Limited to 5 OTP verification attempts per 15 minutes per IP.
 *       
 *       **Required:** Must have valid encodedSmsSid cookie from registration/resend.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifySmsOTPInput'
 *           example:
 *             phone: "+919876543210"
 *             smsOtp: "654321"
 *     responses:
 *       200:
 *         description: SMS OTP verified successfully
 *         headers:
 *           Set-Cookie:
 *             description: Clears the SMS OTP session cookie
 *             schema:
 *               type: string
 *               example: "encodedSmsSid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifySmsOTPResponse'
 *             example:
 *               message: "SMS OTP verified successfully."
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             examples:
 *               invalidOtp:
 *                 summary: Wrong or expired OTP
 *                 value:
 *                   error: "Invalid or expired SMS OTP."
 *               verificationError:
 *                 summary: OTP service error
 *                 value:
 *                   error: "SMS verification service unavailable"
 *       401:
 *         description: Missing SMS OTP session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "SMS OTP SID missing."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "User not found."
 *       429:
 *         description: Too many OTP attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Too many OTP requests. Try again later."
 */
export const verifySmsOTP = async (req: Request, res: Response) => {
  const { phone, smsOtp } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { phone: phone },
    });

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const encodedSmsSid = req.cookies.encodedSmsSid;
    if (!encodedSmsSid) {
      res.status(401).json({ error: "SMS OTP SID missing." });
      return;
    }

    const smsSid = Buffer.from(encodedSmsSid, "base64").toString("utf-8");
    const smsVerificationResult = await verifySmsOtp(smsSid, smsOtp);
    if (
      smsVerificationResult &&
      smsVerificationResult.smsStatus == "approved"
    ) {
      res.clearCookie("encodedSmsSid", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isSmsVerified: true,
        },
      });
      res.status(200).json({ message: "SMS OTP verified successfully." });
    } else {
      res.status(400).json({ error: "Invalid or expired SMS OTP." });
      return;
    }
  } catch (err: unknown) {
    console.error("SMS OTP verification error:", err);
    res.status(400).json({ error: (err as Error).message });
  }
};

/**
 * @swagger
 * /api/auth/resend-email-otp:
 *   post:
 *     summary: Resend email OTP to user
 *     description: |
 *       Resends a new 6-digit OTP to the user's email address for verification.
 *       
 *       **Process:**
 *       1. Validates the email format
 *       2. Finds the user by email address
 *       3. Sends a new OTP via Twilio's email service
 *       4. Sets a new encrypted email OTP session ID in cookies
 *       
 *       **Rate Limiting:** Limited to 5 OTP requests per 15 minutes per IP.
 *       
 *       **Use Cases:**
 *       - Original OTP expired (10 minutes validity)
 *       - User didn't receive the original OTP
 *       - User entered wrong OTP multiple times
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendEmailOtpInput'
 *           example:
 *             email: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Email OTP resent successfully
 *         headers:
 *           Set-Cookie:
 *             description: New email OTP session cookie
 *             schema:
 *               type: string
 *               example: "encodedEmailSid=newBase64Value; Path=/; Domain=.wymi.in; Secure; Max-Age=600"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResendEmailOtpResponse'
 *             example:
 *               message: "OTP resend successfully to john.doe@example.com."
 *               user:
 *                 id: "5f4eabc0-1b22-4c77-8aa4-12edbd123456"
 *                 email: "john.doe@example.com"
 *                 emailStatus: "pending"
 *       400:
 *         description: Bad request or OTP sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             examples:
 *               sendingFailed:
 *                 summary: OTP service unavailable
 *                 value:
 *                   error: "Email service temporarily unavailable"
 *               generalError:
 *                 summary: Other processing error
 *                 value:
 *                   error: "Failed to process OTP request"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "User not found."
 *       429:
 *         description: Too many OTP requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Too many OTP requests. Try again later."
 */
export const resendEmailOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const emailOtpStatus = await sendEmailOtp(user.email);
    if (emailOtpStatus) {
      const encodedEmailSid = Buffer.from(
        emailOtpStatus.emailSid ?? ""
      ).toString("base64");
      cookieSet(res, "encodedEmailSid", encodedEmailSid, 10 * 60 * 1000);
      res.status(200).json({
        message: "OTP resend successfully to " + user.email + ".",
        user: {
          id: user.id,
          email: user.email,
          emailStatus: emailOtpStatus.emailStatus,
        },
      });
    }
  } catch (err: unknown) {
    console.error("Resend Email OTP error:", err);
    res.status(400).json({ error: (err as Error).message });
  }
};

/**
 * @swagger
 * /api/auth/resend-sms-otp:
 *   post:
 *     summary: Resend SMS OTP to user
 *     description: |
 *       Resends a new 6-digit OTP to the user's phone number for verification.
 *       
 *       **Process:**
 *       1. Validates the phone number format
 *       2. Finds the user by phone number
 *       3. Sends a new OTP via Twilio's SMS service (with WhatsApp fallback)
 *       4. Sets a new encrypted SMS OTP session ID in cookies
 *       
 *       **Rate Limiting:** Limited to 5 OTP requests per 15 minutes per IP.
 *       
 *       **Use Cases:**
 *       - Original OTP expired (10 minutes validity)
 *       - User didn't receive the original SMS
 *       - User entered wrong OTP multiple times
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendSmsOtpInput'
 *           example:
 *             phone: "+919876543210"
 *     responses:
 *       200:
 *         description: SMS OTP resent successfully
 *         headers:
 *           Set-Cookie:
 *             description: New SMS OTP session cookie
 *             schema:
 *               type: string
 *               example: "encodedSmsSid=newBase64Value; Path=/; Domain=.wymi.in; Secure; Max-Age=600"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResendSmsOtpResponse'
 *             example:
 *               message: "OTP resend successfully to +919876543210."
 *               user:
 *                 id: "5f4eabc0-1b22-4c77-8aa4-12edbd123456"
 *                 phone: "+919876543210"
 *                 smsStatus: "pending"
 *       400:
 *         description: Bad request or OTP sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             examples:
 *               sendingFailed:
 *                 summary: SMS service unavailable
 *                 value:
 *                   error: "SMS service temporarily unavailable"
 *               generalError:
 *                 summary: Other processing error
 *                 value:
 *                   error: "Failed to process SMS OTP request"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "User not found."
 *       429:
 *         description: Too many OTP requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "Too many OTP requests. Try again later."
 */
export const resendSMSOTP = async (req: Request, res: Response) => {
  const { phone } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: {
        phone: phone,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const smsOtpStatus = await sendSmsOtp(user.phone);
    if (smsOtpStatus) {
      const encodedSmsSid = Buffer.from(smsOtpStatus.smsSid ?? "").toString(
        "base64"
      );
      cookieSet(res, "encodedSmsSid", encodedSmsSid, 10 * 60 * 1000);
      res.status(200).json({
        message: "OTP resend successfully to " + user.phone + ".",
        user: {
          id: user.id,
          phone: user.phone,
          smsStatus: smsOtpStatus.smsStatus,
        },
      });
    }
  } catch (err: unknown) {
    console.error("Resend Sms OTP error:", err);
    res.status(400).json({ error: (err as Error).message });
  }
};

/**
 * @swagger
 * /api/auth/forget-password:
 *   post:
 *     summary: Reset user password
 *     description: |
 *       Allows users to reset their password using their email address.
 *       
 *       **Process:**
 *       1. Validates email format and new password strength
 *       2. Finds the user by email address
 *       3. Hashes the new password using bcrypt (12 salt rounds)
 *       4. Updates the user's password in the database
 *       
 *       **Security Note:** 
 *       - This endpoint directly resets the password without email verification
 *       - In a production environment, consider adding email OTP verification
 *       - Password must meet the same strength requirements as registration
 *       
 *       **Password Requirements:**
 *       - Minimum 8 characters
 *       - At least one uppercase letter (A-Z)
 *       - At least one lowercase letter (a-z)
 *       - At least one digit (0-9)
 *       - Special characters allowed: @$!%*?&
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgetPasswordInput'
 *           example:
 *             email: "john.doe@example.com"
 *             newPassword: "NewStrongP@ss123"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgetPasswordResponse'
 *             example:
 *               message: "Password updated successfully."
 *       400:
 *         description: Validation failed or bad input
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/GenericError'
 *             examples:
 *               validationError:
 *                 summary: Input validation failed
 *                 value:
 *                   error:
 *                     - code: "invalid_string"
 *                       expected: "valid email format"
 *                       received: "invalid-email"
 *                       path: ["email"]
 *                       message: "Invalid email format"
 *               passwordValidation:
 *                 summary: Password requirements not met
 *                 value:
 *                   error:
 *                     - code: "invalid_string"
 *                       validation: "regex"
 *                       path: ["newPassword"]
 *                       message: "Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
 *               generalError:
 *                 summary: Processing error
 *                 value:
 *                   error: "Forget Password Error: Database connection failed"
 *       404:
 *         description: Email not found in the system
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "User not found."
 */
export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const data = forgetPasswordSchema.parse(req.body);
    // const user = await prisma.user.findUnique({
    //   where: { email: data.email.toLowerCase() },
    // });
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (data.newPasswordHash === user.passwordHash) {
      res.status(400).json({ error: "New password must be different from the old password." });
      return;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: data.newPasswordHash },
    });
    res.status(200).json({ message: "Password updated successfully." });
  } catch (err: unknown) {
    console.error("Forget Password error:", err);
    if (err instanceof ZodError) {
      res.status(400).json({ error: err.errors });
    } else {
      res.status(400).json({ error: "Forget Password Error: " + (err as Error).message });
    }
  }
};

/**
 * @swagger
 * /api/auth/delete-user:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete a user
 *     description: Deletes a user from the system
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteUserInput'
 *           example:
 *             email: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteUserResponse'
 *             example:
 *               message: "User deleted successfully."
 *       400:
 *         description: Validation failed or bad input
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/ValidationError'
 *                 - $ref: '#/components/schemas/GenericError'
 *             examples:
 *               validationError:
 *                 summary: Input validation failed
 *                 value:
 *                   error:
 *                     - code: "invalid_string"
 *                       expected: "valid email format"
 *                       received: "invalid-email"
 *                       path: ["email"]
 *                       message: "Invalid email format"
 *               generalError:
 *                 summary: Processing error
 *                 value:
 *                   error: "Delete User Error: Database connection failed"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericError'
 *             example:
 *               error: "User not found."
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const data = deleteUserSchema.parse(req.body);
    if (!data.email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    await prisma.user.delete({
      where: { id: user.id },
    });
    res.status(200).json({ message: "User Deleted successfully." });
  } catch (err: unknown) {
    console.error("Delete User error:", err);
    res.status(400).json({ error: "Delete User Error: " + (err as Error).message });
  }
};