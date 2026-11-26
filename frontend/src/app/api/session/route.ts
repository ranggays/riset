import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";

export async function GET(){
    try {
        const supabase = await createServerSupabaseClient();
        const session = await getSession(supabase);
        if(!session) return NextResponse.json(
            {error: "Not Authorized"},
            {status: 401}
        );

        const sessionId = `${session.user.id}_${Math.floor(session.expires_at! / 1000)}`;

        return NextResponse.json({
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name
            },
            expires_at: session.expires_at,
            sessionId,
        });
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        );
    };
}