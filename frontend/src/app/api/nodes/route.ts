import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
){
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get("sessionId");

        if(!sessionId){
            return NextResponse.json(
                {error: "SessionId Tidak Ditemukan"},
                {status: 400}
            );
        };

        const nodes = await prisma.node.findMany({
            where: {
                Article: {
                    sessionId: sessionId || undefined
                },
            },
        });

        if(!nodes) return NextResponse.json(
            {error: "Nodes Tidak Ditemukan"},
            {status: 400}
        );

        return NextResponse.json(nodes);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
};