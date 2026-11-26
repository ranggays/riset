import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{id: string}>}
){
    try {
        const { id } = await params;
        const node = await prisma.node.findUnique({
            where: {
                id,
            }
        });
        if(!node) return NextResponse.json(
            {error: "Node Tidak Ditemukan"},
            {status: 404}
        );

        return NextResponse.json(node);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    };
};