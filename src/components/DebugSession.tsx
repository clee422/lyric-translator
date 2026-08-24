import { useEffect } from "react";

export default function DebugSession() {
    useEffect(() => {
        async function debugSession() {
            const output = document.createElement("pre");
            output.style.whiteSpace = "pre-wrap";
            output.style.wordBreak = "break-word";

            try {
                const response = await fetch(`/api/debug-session`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const headers: Record<string, string> = {};

                for (const [key, value] of response.headers.entries()) {
                    // Don't display sensitive cookie values
                    if (key.toLowerCase() === "set-cookie") {
                        headers[key] = "[REDACTED]";
                    } else {
                        headers[key] = value;
                    }
                }

                const raw = await response.text();

                const debugInfo = {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    redirected: response.redirected,
                    type: response.type,
                    headers: headers,
                    body: raw,
                };

                output.textContent = JSON.stringify(debugInfo, null, 2);

                document.body.appendChild(output);
            } catch (error) {
                output.textContent = `ERROR:\n${error}`;
                document.body.appendChild(output);
            }
        }

        debugSession();
    }, []);

    return <div />;
}
