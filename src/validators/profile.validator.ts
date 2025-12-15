import { z } from "zod";

export const createAddressSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(1, "Phone number is required"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().min(1, "Address line 2 is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string().min(1, "Zip code is required"),
});


export const updateAddressSchema = z.object({
    id: z.string().uuid().min(1, "Address ID is required"),
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    phone: z.string().min(1, "Phone number is required").optional(),
    addressLine1: z.string().min(1, "Address line 1 is required").optional(),
    addressLine2: z.string().min(1, "Address line 2 is required").optional(),
    city: z.string().min(1, "City is required").optional(),
    state: z.string().min(1, "State is required").optional(),
    country: z.string().min(1, "Country is required").optional(),
    zipCode: z.string().min(1, "Zip code is required").optional(),
});

export const deleteAddressSchema = z.object({
    addressId: z.string().uuid().min(1, "Address ID is required"),
});


export const updateProfileSchema = z.object({
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, { message: "Date of birth must be in YYYY-MM-DDTHH:mm:ss format" }).optional(),
});

export const updateSubscriptionSchema = z.object({
    subscriptionStatus: z.boolean(),
});

export const updatePasswordSchema = z.object({
    currentPasswordHash: z.string(),
    newPasswordHash: z.string(),
});

export const  createContactMeSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+91\d{10}$/, { message: "Phone number must be in the 10 digit" }),
    message: z.string().min(1, "Message is required"),
});

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+91\d{10}$/, { message: "Phone number must be in the 10 digit" }),
    role: z.enum(["USER", "ADMIN"]),
    passwordHash: z.string()
});

export const updateUserSchema = z.object({
    id: z.string().uuid().min(1, "User ID is required"),
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().regex(/^\+91\d{10}$/, { message: "Phone number must be in the 10 digit" }).optional(),
    role: z.enum(["USER", "ADMIN"]).optional(),
    passwordHash: z.string().optional(),
    isEmailVerified: z.boolean().optional(),
    isSmsVerified: z.boolean().optional(),
});

export const deleteUserSchema = z.object({
    id: z.string().uuid().min(1, "User ID is required"),
});
