import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { create } from "domain";

export async function POST(
    request: NextRequest,
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if(!user || error) return NextResponse.json(
            {error: "Autentikasi Tidak Valid"},
            {status: 401}
        );

        const body = await request.json();
        const { metadata, document } = body;

        if(!metadata || !document) return NextResponse.json(
            {error: "Metadata atau Dokument Tidak Ada"}
        );

        const nodeWithUrl = await prisma.node.findFirst({
            where: {
                att_url: document,
            },
            select: {
                id: true,
                title: true,
                att_url: true,
                Article: {
                    select: {
                        id: true,
                        title: true,
                        filePath: true,
                        sessionId: true,
                    }
                }
            }
        });

        if(!nodeWithUrl) return NextResponse.json(
            {error: "Artikel / Dokumen Tidak Ada"},
            {status: 404}
        );

        const article = nodeWithUrl.Article;

        const newAnnotation = await prisma.annotation.create({
            data: {
                articleId: article.id,
                page: metadata.pageNumber,
                highlightedText: metadata.higlightedText || "",
                comment: metadata.contents || "",
                semanticTag: metadata.positionData || null,
                userId: user.id,
            },
            include: {
                Article: {
                    select: {
                        id: true,
                        title: true,
                        filePath: true,
                        sessionId: true,
                    },
                },
            },
        });

        return NextResponse.json(newAnnotation);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
};

export async function GET(
    request: NextRequest
){
    try {
        const searchParams = request.nextUrl.searchParams;
        const sessionId = searchParams.get("sessionId");
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error} = await supabase.auth.getUser();
        if(!user || error) return NextResponse.json(
            {error: "Autentikasi Tidak Valid"},
            {status: 401}
        );

        if(!sessionId) return NextResponse.json(
            {error: "SessionId Tidak Ditemukan"},
            {status: 400}
        );

        const annotations = await prisma.annotation.findMany({
            where: {
                userId: user.id,
                Article: {
                    sessionId: sessionId,
                }
            },
            include: {
                Article: {
                    select: {
                        id: true,
                        title: true,
                        filePath: true,
                        sessionId: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if(!annotations) return NextResponse.json(
            {error: "Annotation Tidak Ada"},
            {status: 404}
        );

        return NextResponse.json(annotations);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
};