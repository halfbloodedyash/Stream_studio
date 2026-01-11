"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), "uploads");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/webm"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type"));
        }
    },
});
// Upload asset
router.post("/upload", auth_1.authMiddleware, upload.single("file"), async (req, res) => {
    try {
        const userId = req.userId;
        const file = req.file;
        const { type = "overlay" } = req.body;
        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const { data: asset, error } = await supabase_1.supabase
            .from("assets")
            .insert({
            id: (0, uuid_1.v4)(),
            user_id: userId,
            type,
            filename: file.originalname,
            storage_url: `/uploads/${file.filename}`,
            size_bytes: file.size,
            metadata: {
                mimetype: file.mimetype,
            },
        })
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json({ asset });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});
// List user's assets
router.get("/", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { type } = req.query;
        let query = supabase_1.supabase
            .from("assets")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (type) {
            query = query.eq("type", type);
        }
        const { data: assets, error } = await query;
        if (error)
            throw error;
        res.json({ assets });
    }
    catch (error) {
        console.error("List assets error:", error);
        res.status(500).json({ error: "Failed to list assets" });
    }
});
// Get asset by ID
router.get("/:id", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { data: asset, error } = await supabase_1.supabase
            .from("assets")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
        if (error || !asset) {
            return res.status(404).json({ error: "Asset not found" });
        }
        res.json({ asset });
    }
    catch (error) {
        console.error("Get asset error:", error);
        res.status(500).json({ error: "Failed to get asset" });
    }
});
// Delete asset
router.delete("/:id", auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { data: asset, error: findError } = await supabase_1.supabase
            .from("assets")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
        if (findError || !asset) {
            return res.status(404).json({ error: "Asset not found" });
        }
        // Delete file from disk
        const filePath = path_1.default.join(process.cwd(), asset.storage_url);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        // Delete from database
        const { error: deleteError } = await supabase_1.supabase
            .from("assets")
            .delete()
            .eq("id", id);
        if (deleteError)
            throw deleteError;
        res.json({ success: true });
    }
    catch (error) {
        console.error("Delete asset error:", error);
        res.status(500).json({ error: "Failed to delete asset" });
    }
});
exports.default = router;
//# sourceMappingURL=assets.js.map