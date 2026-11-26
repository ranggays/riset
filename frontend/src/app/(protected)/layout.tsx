import { Suspense } from "react";
import AuthProtected from "@/features/auth/components/Auth";

export default function RootLayout(
    {children}: {children: React.ReactNode}
){
    return(
        <>
            <Suspense fallback={<div>Memeriksa sesi...</div>}>
                <AuthProtected>
                    {children}
                </AuthProtected>
            </Suspense>
        </>
    )
}