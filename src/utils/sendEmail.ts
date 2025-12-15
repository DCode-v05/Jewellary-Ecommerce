import twilio from 'twilio';
import { prisma } from "./prisma";

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_AUTH_TOKEN!);

export const sendSubscriptionNotification = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
                channel: "email",
                to: email,
                channelConfiguration: {
                    template_id: process.env.TWILIO_SUBSCRIPTION_EMAIL_TEMPLATE_ID!,
                    substitutions: {
                        "name": user?.name,
                        "companyName":"Wymi- You Deserve the Best Experience",
                        "year": new Date().getFullYear().toString(),
                    },
                }
            });
    } catch (error) {
        console.error("Error sending subscription notification:", error);
    }
};

export const sendContactNotification = async (name: string, email: string, phone: string, message: string) => {
    try {
        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
            .verifications.create({
                channel: "email",
                to: process.env.ADMIN_EMAIL!,
                channelConfiguration: {
                    template_id: process.env.TWILIO_CONTACT_EMAIL_TEMPLATE_ID!,
                    substitutions: {
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "message": message,
                        "companyName":"Wymi- You Deserve the Best Experience",
                        "year": new Date().getFullYear().toString(),
                    },
                }
            });
    } catch (error) {
        console.error("Error sending contact notification:", error);
    }
};