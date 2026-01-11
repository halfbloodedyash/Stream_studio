"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const supabase_1 = require("../lib/supabase");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }
        const token = authHeader.split(" ")[1];
        try {
            // Verify Supabase JWT token
            const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
            if (error || !user) {
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }
            req.userId = user.id;
            next();
        }
        catch (tokenError) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.authMiddleware = authMiddleware;
// Optional auth - doesn't fail if no token, but attaches userId if present
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const { data: { user } } = await supabase_1.supabase.auth.getUser(token);
                if (user) {
                    req.userId = user.id;
                }
            }
            catch {
                // Token invalid, but we continue without userId
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=auth.js.map