import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
export default async function AuthProtected(
    {children}: {children: React.ReactNode}
){
    await connection();
    
    const supabase = await createServerSupabaseClient();
    const session = await getSession(supabase);

    if(!session) redirect("/login");

    return children;
}