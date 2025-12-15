import { z } from "zod";

export const subscribeEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email format" })
});