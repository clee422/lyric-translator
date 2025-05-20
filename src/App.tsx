import { useState, useEffect } from "react";
import Login from "./components/Login";
import WebPlayback from "./components/WebPlayback";

export default function App() {
    const [token, setToken] = useState<string | undefined>(undefined);

    useEffect(() => {
        async function getToken() {
            const response = await fetch("/auth/spotify/token");
            const json = await response.json();
            setToken(json.access_token);
        }
        getToken();
    }, []);

    return (
        <main className="app">
            {token === undefined ? <Login /> : <WebPlayback token={token} />}
        </main>
    );
}
