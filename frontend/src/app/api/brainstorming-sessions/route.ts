import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }} = await supabase.auth.getUser();

        if(!user){
            return NextResponse.json(
                {error: "Silahkan login/register terlebih dahulu"},
                {status: 401}
            )
        };

        const sessions = await prisma.brainstormingSession.findMany({
            where: {
                userId: user.id,
            },
            include: {
                _count: {
                    select: {
                        Article: true,
                        ChatMessage: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        );
    }
};

export async function POST(request: NextRequest){
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }} = await supabase.auth.getUser();
        if(!user){
            return NextResponse.json(
                {error: "Silahkan login/register terlebih dahulu."},
                {status: 401}
            );
        };

        const body = await request.json();
        const { title, description, coverColor } = body;

        const session = await prisma.brainstormingSession.create({
            data: {
                title,
                description,
                coverColor,
                userId: user.id,
                selectedFilterArticles: [],
                lastActivity: new Date(),
            },
        });

        return NextResponse.json({ id: session.id });
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
};