import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{id:string}>}
){
    try {
        const { id } = await params;
        const existingAnnotation = await prisma.annotation.findUnique({
            where: {
                id: id,
            }
        });
        if(!existingAnnotation) return NextResponse.json(
            {error: "Annotation Tidak Ada"},
            {status: 404}
        );

        const deletedAnnotation = await prisma.annotation.delete({
            where: {
                id: id,
            }
        });

        return NextResponse.json(deletedAnnotation);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
};