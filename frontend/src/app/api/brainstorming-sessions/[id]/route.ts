import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{id: string}> }
){
    try {
        const { id } = await params;
        const project = await prisma.brainstormingSession.findUnique({
            where: {
                id
            },
            include: {
                Article: {
                    include: {
                        Node: true,
                        Edge: true,
                    }
                },
                ChatMessage: true,
            },
        });

        if(!project){
            return NextResponse.json(
                {error: "Project Tidak Ditemukan"},
                {status: 404}
            )
        };

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )   
    };
};

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise <{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        if(!body){
            return NextResponse.json(
                {error: "Tidak ada request body"},
                {status: 404}
            )
        };

        const updated = await prisma.brainstormingSession.update({
            where: {
                id,
            },
            data: {
                title: body.title,
                description: body.description,
                coverColor: body.coverColor,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    };
};

export async function DELETE(
    { params }: { params: Promise<{id: string}>}
){
    try {
        const { id } = await params;
        const project = await prisma.brainstormingSession.findUnique({
            where: {
                id,
            },
            include: {
                Article: true,
                ChatMessage: true,
            }
        });
    
        if(!project) return NextResponse.json(
            {error: "Project Tidak Ditemukan"},
            {status: 404}
        );
    
        await prisma.brainstormingSession.delete({
            where: {
                id,
            }
        });
    
        return NextResponse.json(null, {status: 204});
        
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    };
};

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{id: string}> }
){
    const { id } = await params;
    if(!id) return NextResponse.json(
        {error: "Project tidak ditemukan"},
        {status: 404}
    );
    
    const body = await request.json();
    
    try {
        const updatedSession = await prisma.brainstormingSession.update({
            where: {
                id,
            },
            data: {
                selectedFilterArticles: body.selectedFilterArticles,
                graphFilters: body.graphFilters,
                lastSelectedNodeId: body.lastSelectedNodeId,
                lastSelectedEdgeId: body.lastSelectedEdgeId
            }
        });

        return NextResponse.json(updatedSession);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    };
}