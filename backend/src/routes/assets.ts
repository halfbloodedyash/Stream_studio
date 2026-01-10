import { Router, Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth";
import { supabase } from "../lib/supabase";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "video/mp4", "video/webm"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"));
        }
    },
});

// Upload asset
router.post("/upload", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const file = req.file;
        const { type = "overlay" } = req.body;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { data: asset, error } = await supabase
            .from("assets")
            .insert({
                id: uuidv4(),
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

        if (error) throw error;

        res.status(201).json({ asset });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// List user's assets
router.get("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { type } = req.query;

        let query = supabase
            .from("assets")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (type) {
            query = query.eq("type", type as string);
        }

        const { data: assets, error } = await query;

        if (error) throw error;

        res.json({ assets });
    } catch (error) {
        console.error("List assets error:", error);
        res.status(500).json({ error: "Failed to list assets" });
    }
});

// Get asset by ID
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const { data: asset, error } = await supabase
            .from("assets")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error || !asset) {
            return res.status(404).json({ error: "Asset not found" });
        }

        res.json({ asset });
    } catch (error) {
        console.error("Get asset error:", error);
        res.status(500).json({ error: "Failed to get asset" });
    }
});

// Delete asset
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const { data: asset, error: findError } = await supabase
            .from("assets")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (findError || !asset) {
            return res.status(404).json({ error: "Asset not found" });
        }

        // Delete file from disk
        const filePath = path.join(process.cwd(), asset.storage_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        const { error: deleteError } = await supabase
            .from("assets")
            .delete()
            .eq("id", id);

        if (deleteError) throw deleteError;

        res.json({ success: true });
    } catch (error) {
        console.error("Delete asset error:", error);
        res.status(500).json({ error: "Failed to delete asset" });
    }
});

export default router;
