import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth";
import roomRoutes from "./routes/rooms";
import destinationRoutes from "./routes/destinations";
import assetRoutes from "./routes/assets";
import livekitRoutes from "./routes/livekit";
import streamingRoutes from "./routes/streaming";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (required when behind reverse proxy like Nginx, DO App Platform, etc)
app.set('trust proxy', 1);

// CORS - Allow frontend origins
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "https://stream-studio-six.vercel.app",
].filter(Boolean) as string[];

// Security middleware
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Allow all Vercel preview URLs
        if (origin.includes('vercel.app')) return callback(null, true);

        // Check allowed origins list
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // In production, be more permissive for debugging
        if (process.env.NODE_ENV === 'production') return callback(null, true);

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/livekit", livekitRoutes);
app.use("/api/streaming", streamingRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app;
