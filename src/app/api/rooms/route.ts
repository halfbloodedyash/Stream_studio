import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/rooms - List user's rooms
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = parseInt(searchParams.get("offset") || "0");

        let query = supabase
            .from("rooms")
            .select("*", { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq("status", status);
        }

        const { data: rooms, error, count } = await query;

        if (error) throw error;

        // Transform rooms to include participantCount
        const transformedRooms = (rooms || []).map(room => ({
            id: room.id,
            title: room.title,
            description: room.description,
            status: room.status,
            createdAt: room.created_at,
            startedAt: room.started_at,
            endedAt: room.ended_at,
            participantCount: 0, // TODO: Get actual count from participants table
            settings: room.settings,
        }));

        return NextResponse.json({
            rooms: transformedRooms,
            total: count || 0,
            limit,
            offset
        });
    } catch (error) {
        console.error("List rooms error:", error);
        return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 });
    }
}

// POST /api/rooms - Create a new room
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, settings } = body;

        if (!title || typeof title !== "string" || title.length < 1) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const { data: room, error } = await supabase
            .from("rooms")
            .insert({
                user_id: user.id,
                title,
                description: description || null,
                status: "draft",
                settings: settings || {},
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            room: {
                id: room.id,
                title: room.title,
                description: room.description,
                status: room.status,
                createdAt: room.created_at,
                participantCount: 0,
                settings: room.settings,
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Create room error:", error);
        return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
    }
}
