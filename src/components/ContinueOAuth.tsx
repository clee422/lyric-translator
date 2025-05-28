import { useEffect } from "react";

export default function ContinueOAuth() {
    useEffect(() => {
        window.location.href = `${
            import.meta.env.VITE_APP_SERVER_URL
        }/auth/google/login`;
    }, []);

    return null;
}
