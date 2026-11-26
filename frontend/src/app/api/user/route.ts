import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if(!user || error) return NextResponse.json(
            {error: "Autentikasi Tidak Valid"},
            {status: 401}
        );

        const dbUser = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
            select: {
                id: true,
                email: true,
                name: true,
                group: true,
                nim: true,
            },
        });

        if(!dbUser) return NextResponse.json(
            {error: "User Tidak Valid"},
            {status: 401}
        );

        const result = {
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                group: dbUser.group,
                nim: dbUser.nim,
            },
        };

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
}

export async function POST(
    request: NextRequest,
){
    try {
        const body = await request.json();
        const { user } = body;
        if(!body || !user) return NextResponse.json(
            {error: "Autentikasi Tidak Valid"},
            {status: 401}
        );
    
        const dbUser = await prisma.user.findUnique({
            where: {
                id: user.id,
            },
            select: {
                id: true,
                email: true,
                name: true,
                group: true,
                nim: true,
            },
        });
    
        if(!dbUser) return NextResponse.json(
            {error: "User Tidak Valid"},
            {status: 401},
        );
    
        const result = {
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                group: dbUser.group,
                nim: dbUser.nim,
            },
        };
    
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        )
    }
}