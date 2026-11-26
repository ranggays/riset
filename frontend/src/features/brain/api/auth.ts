"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logout } from "@/lib/supabase/auth";

export async function authLogout(){
    const supabase = await createServerSupabaseClient();
    await logout(supabase);
}