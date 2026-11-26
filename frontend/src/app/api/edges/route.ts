import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest
){
    try {
        const { searchParams } = request.nextUrl;
        const sessionId = searchParams.get("sessionId");
        if(!sessionId) return NextResponse.json(
            {error: "SessionId Tidak Ditemukan"},
            {status: 400}
        );

        const edges = await prisma.edge.findMany({
            where: {
                Article: {
                    sessionId: sessionId || undefined
                }
            },
        });
        if(!edges) return NextResponse.json(
            {error: "Edges Tidak Ada"},
            {status: 400}
        );

        return NextResponse.json(edges);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    };
};