import { Request, Response, NextFunction } from "express";

export const validateCsrf = (req: Request, res: Response, next: NextFunction): void => {
  const csrfCookie = req.cookies.csrfToken;
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie) {
    res.status(403).json({ error: "CSRF cookie not found." });
    return;
  }
  if (!csrfHeader) {
    res.status(403).json({ error: "CSRF header not found." });
    return;
  }
  if (csrfCookie !== csrfHeader) {
    res.status(403).json({ error: "CSRF token mismatch." });
    return;
  }

  next();
};
