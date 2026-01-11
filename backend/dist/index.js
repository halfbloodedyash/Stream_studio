"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const rooms_1 = __importDefault(require("./routes/rooms"));
const destinations_1 = __importDefault(require("./routes/destinations"));
const assets_1 = __importDefault(require("./routes/assets"));
const livekit_1 = __importDefault(require("./routes/livekit"));
const streaming_1 = __importDefault(require("./routes/streaming"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Trust proxy (required when behind reverse proxy like Nginx, DO App Platform, etc)
app.set('trust proxy', 1);
// CORS - Allow frontend origins
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "https://stream-studio-six.vercel.app",
].filter(Boolean);
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin)
            return callback(null, true);
        // Allow all Vercel preview URLs
        if (origin.includes('vercel.app'))
            return callback(null, true);
        // Check allowed origins list
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        // In production, be more permissive for debugging
        if (process.env.NODE_ENV === 'production')
            return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Body parsing
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API routes
app.use("/api/auth", auth_1.default);
app.use("/api/rooms", rooms_1.default);
app.use("/api/destinations", destinations_1.default);
app.use("/api/assets", assets_1.default);
app.use("/api/livekit", livekit_1.default);
app.use("/api/streaming", streaming_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map