import { useEffect } from "react";

export default function Ping() {
    useEffect(() => {
        async function sendPing() {
            const response = await fetch(
                `${import.meta.env.VITE_APP_SERVER_URL}/ping`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );
            const msg = await response.text();
            document.body.innerHTML += `<pre>${msg}</pre>`;
        }
        sendPing();
    }, []);

    return <div />;
}
