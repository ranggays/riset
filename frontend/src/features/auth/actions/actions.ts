"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { login, logout, register } from "@/lib/supabase/auth";
import { Register, type Login } from "../types";

interface AuthResult {
  error?: string;
  success?: boolean;
};

type RegisterResult = { success: true; needsEmailConfirmation: boolean } | { error: string };

export async function loginAction(formData: Login): Promise<AuthResult> {
  try {
    if (!formData.email?.trim() || !formData.password) {
      return { error: "Email dan kata sandi wajib diisi." };
    }

    const supabase = await createServerSupabaseClient();
    const { user } = await login(supabase, formData);
    if (!user) return { error: "Login gagal. Silakan coba lagi." };

    return { success: true };
  } catch (error) {
    console.error("Login failed:", error);
    return { error: "Email atau kata sandi salah. Silakan coba lagi." };
  }
};

export async function registerAction(formData: Register): Promise<RegisterResult> {
    try {
        const fullName = formData.fullName.trim();
        const sid = formData.sid.trim();
        const email = formData.email.trim();
        const group = formData.group.trim();
        const password = formData.password;
        if(!email || !password?.trim() || !fullName || !formData.group || !sid) return { error: "Semua field harus diisi"};

        if(formData.group !== "A" && formData.group !== "B") return { error: "Grup yang dipilih tidak valid"};

        const supabase = await createServerSupabaseClient();
        const { user, session } = await register(supabase, {
            ...formData,
            fullName,
            sid,
            email,
            group,
            password
        });
        if (!user) return { error: "Register gagal. Silakan coba lagi." };
        
        return { success: true, needsEmailConfirmation: !session };
    } catch (error) {
        console.error("Register gagal:", error);
        return { error: "Register gagal. Periksa data Anda dan silahkan coba lagi."};
    }
};

export async function logoutAction(){
    try {
        const supabase = await createServerSupabaseClient();
        await logout(supabase);

    } catch (error) {
        console.error("Logout gagal", error);
        return { error: "Logout gagal"};
    }
}