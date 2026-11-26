import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{id: string}>}
){
    let requestedId: string | undefined;

    try {
        const { id } = await params;
        requestedId = id;
        if(!id) return NextResponse.json(
            {error: "ID Tidak Ada"},
            {status: 404}
        );

        const edge = await prisma.edge.findUnique({
            where: {
                id,
            },
            include: {
                Node_Edge_fromIdToNode: {
                    select: { id: true, title: true },
                },
                Node_Edge_toIdToNode: {
                    select: { id: true, title: true },
                },
            }
        });

        if(!edge) return NextResponse.json(
            {error: "Edge Tidak Ditemukan"},
            {status: 404}
        );

        return NextResponse.json({
            id: edge.id,
            label: edge.label,
            relation: edge.relation,
            from: edge.Node_Edge_fromIdToNode,
            to: edge.Node_Edge_toIdToNode,
        });
    } catch (error) {
        console.error(`[GET /api/edges/${requestedId ?? "unknown"}] Failed to load edge:`, error);
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
}
