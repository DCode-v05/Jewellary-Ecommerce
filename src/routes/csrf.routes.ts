import { Router } from "express";
import { getCsrfToken } from "../controllers/csrf.controller";

const router = Router();

router.get("/csrf-token", getCsrfToken);

export default router;
