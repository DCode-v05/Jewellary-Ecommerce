import jwt, { JwtPayload } from "jsonwebtoken";

export const getUserId = (token: string ): string | null => {
  try {
    if (!token) {
        return null;
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    return decodedToken.userId || null;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};