import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest
){
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if(!user || error) return NextResponse.json(
            {error: "Autentikasi Tidak Valid"},
            {status: 401}
        );

        const { searchParams } = request.nextUrl;
        const sessionId = searchParams.get("sessionId");
        
        const page = parseInt(searchParams.get("page") || '1');
        const limit = parseInt(searchParams.get("limit") || "3");
        const offset = (page - 1) * limit;

        if(!sessionId) return NextResponse.json(
            {error: "SessionId Tidak Ada"},
            {status: 404}
        );

        const session = await prisma.brainstormingSession.findUnique({
            where: {
                id: sessionId,
                userId: user.id,
            }
        });

        if(!session) return NextResponse.json(
            {error: "Sesi Tidak Ditemukan"},
            {status: 400}
        );

        const totalMessages = await prisma.chatMessage.count({
            where: {
                sessionId: sessionId,
            }
        });

        const chatHistory = await prisma.chatMessage.findMany({
            where: {
                sessionId: sessionId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            skip: offset,
            take: limit,
        });

        const reversedHistory = chatHistory.reverse();

        const hasMore = offset + limit < totalMessages;

        return NextResponse.json({
            messages: reversedHistory,
            total: totalMessages,
            hasMore: hasMore,
            currentPage: page,
            totalPages: Math.ceil(totalMessages / limit)
        });
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    };
};