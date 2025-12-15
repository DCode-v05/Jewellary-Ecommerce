import twilio from 'twilio';
import { prisma } from "../utils/prisma";

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

export const sendSmsOtp = async (phoneNumber: string) => {

    try {
        // await client.verify.v2.
        // services(process.env.TWILIO_VERIFY_SERVICE_SID!).
        // verifications.create({
        //     channel: "whatsapp",
        //     to: phoneNumber,
        // });

        const smsVerification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
                channel: "sms",
                to: phoneNumber,
             });

            return {
                "smsSid": smsVerification.sid,
                "smsStatus": smsVerification.status,
            }
    } catch (err: unknown) {
        if((err as { code: number }).code === 60203) {
            console.error("Too many requests to send OTP. Please try again later.");
            return { error: "Too many requests. Please try again later." };
        }
        console.error("Sending SMS OTP error:", err);
        return { error: (err as Error).message };
    }
};

export const sendEmailOtp = async (email: string) => {

    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return { error: "User not found." };
        }
        const emailVerification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
                channel: "email",
                to: email,
                channelConfiguration: {
                    template_id: process.env.TWILIO_VERIFY_EMAIL_TEMPLATE_ID!,
                    substitutions: {
                        "name": user.name,
                        "companyName":"Wymi- You Deserve the Best Experience",
                        "year": new Date().getFullYear().toString(),
                    },
                }
            });

        return {
            "emailSid": emailVerification.sid,
            "emailStatus": emailVerification.status,
        }
    } catch (err: unknown) {
        if((err as { code: number }).code === 60203) {
            console.error("Too many requests to send OTP. Please try again later.");
            return { error: "Too many requests. Please try again later." };
        }
        console.error("Sending Email OTP error:", err);
        return { error: (err as Error).message };
    }
};

export const verifySmsOtp = async (smsSid: string, smsCode: string) => {
    try {
        const smsVerificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verificationChecks.create({
                code: smsCode,
                verificationSid: smsSid,
            });

        return {
            smsSid: smsVerificationCheck.sid,
            smsStatus: smsVerificationCheck.status,
        }
    } catch (err: unknown) {
        console.error("Verify SMS OTP error:", err);
        return { error: (err as Error).message };
    }
};
export const verifyEmailOtp = async (emailSid: string, emailCode: string) => {
    try {
        const emailVerificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verificationChecks.create({
                code: emailCode,
                verificationSid: emailSid,
            });

        return {
            emailSid: emailVerificationCheck.sid,
            emailStatus: emailVerificationCheck.status,
            
        }
    } catch (err: unknown) {
        console.error("Verify Email OTP error:", err);
        return { error: (err as Error).message };
    }
};