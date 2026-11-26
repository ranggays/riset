import { Suspense } from "react";
import LoginForm from "./components/LoginForm";
import Loading from "./components/Loading";

export default function Login(){
    return(
        <Suspense fallback={ <Loading />}>
            <LoginForm />
        </Suspense>
    )
}