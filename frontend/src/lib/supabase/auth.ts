import { SupabaseClient } from "@supabase/supabase-js";

interface Login {
    email: string;
    password?: string;
};

interface Register extends Login {
    fullName: string;
    sid: string;
    group: string;
};

export async function login(supabase: SupabaseClient, params:Login){
    const { email, password } = params;
    if(!password || !email){
        throw new Error("Email & Password harus diisi");
    };

    const { data, error } = await supabase.auth.signInWithPassword({email, password});
    if(error) throw error;
    return data;
};

export async function register(supabase:SupabaseClient, params:Register){
    const { email, password, fullName, sid, group } = params;
    if(!email || !password || !fullName || !sid || !group) throw new Error("Semua kolom harus diisi");

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                sid: sid,
                group: group,
            },
        },
    });

    if(error) throw error;
    return data;
};

export async function logout(supabase:SupabaseClient){
    const { error } = await supabase.auth.signOut();
    if(error) throw error;
};

export async function getSession(supabase:SupabaseClient){
    const { data: { session }, error } = await supabase.auth.getSession();
    if(error) throw error;
    return session;
};