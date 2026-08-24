import { useEffect } from "react";

export default function DebugSession() {
    useEffect(() => {
        async function sendReq() {
            const response = await fetch(
                `${import.meta.env.VITE_APP_SERVER_URL}/debug-session`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );
            const msg = await response.text();
            document.body.innerHTML += `<pre>${msg}</pre>`;
        }
        sendReq();
    }, []);

    return <div />;
}
