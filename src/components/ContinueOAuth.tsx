import { useEffect } from "react";

export default function ContinueOAuth() {
    useEffect(() => {
        window.open(
            `${import.meta.env.VITE_APP_SERVER_URL}/auth/google/login`,
            "_self"
        );
    }, []);

    return null;
}
