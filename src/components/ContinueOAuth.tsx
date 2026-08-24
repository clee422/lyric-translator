import { useEffect } from "react";

export default function ContinueOAuth() {
    useEffect(() => {
        window.open(`/api/auth/google/login`, "_self");
    }, []);

    return null;
}
