import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase";

export interface AuthRequest extends Request {
    userId?: string;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];

        try {
            // Verify Supabase JWT token
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }

            (req as any).userId = user.id;
            next();
        } catch (tokenError) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Optional auth - doesn't fail if no token, but attaches userId if present
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const { data: { user } } = await supabase.auth.getUser(token);
                if (user) {
                    (req as any).userId = user.id;
                }
            } catch {
                // Token invalid, but we continue without userId
            }
        }

        next();
    } catch (error) {
        next();
    }
};
