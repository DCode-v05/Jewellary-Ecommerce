import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  passwordHash: z.string(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\+91\d{10}$/, { message: "Phone number must be in the 10 digit" }),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], { message: "Gender is required" }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, { message: "Date of birth must be in YYYY-MM-DDTHH:mm:ss format" }),
});

export const loginSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  passwordHash: z.string()
});

export const forgetPasswordSchema = z.object({
  // email: z.string().email({ message: "Invalid email format" }),
  phone: z.string().regex(/^\+91\d{10}$/, { message: "Phone number must be in the 10 digit" }),
  newPasswordHash: z.string(),
});

export const deleteUserSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});