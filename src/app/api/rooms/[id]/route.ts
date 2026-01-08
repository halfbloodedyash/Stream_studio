import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/rooms/[id] - Get room by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: room, error } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

        if (error || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        return NextResponse.json({
            room: {
                id: room.id,
                title: room.title,
                description: room.description,
                status: room.status,
                createdAt: room.created_at,
                startedAt: room.started_at,
                endedAt: room.ended_at,
                participantCount: 0,
                settings: room.settings,
            }
        });
    } catch (error) {
        console.error("Get room error:", error);
        return NextResponse.json({ error: "Failed to get room" }, { status: 500 });
    }
}

// PUT /api/rooms/[id] - Update room
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const updateData: Record<string, any> = {};

        if (body.title) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.settings) updateData.settings = body.settings;

        const { data: room, error } = await supabase
            .from("rooms")
            .update(updateData)
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single();

        if (error || !room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        return NextResponse.json({
            room: {
                id: room.id,
                title: room.title,
                description: room.description,
                status: room.status,
                createdAt: room.created_at,
                settings: room.settings,
            }
        });
    } catch (error) {
        console.error("Update room error:", error);
        return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
    }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { error } = await supabase
            .from("rooms")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete room error:", error);
        return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
    }
}
