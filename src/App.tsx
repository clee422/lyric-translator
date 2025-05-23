import { useState, useEffect } from "react";
import Login from "./components/Login";
import WebPlayback from "./components/WebPlayback";

export default function App() {
    const [spotifyToken, setSpotifyToken] = useState<string | undefined>(
        undefined
    );
    const [googleTokenAcquired, setGoogleTokenAcquired] =
        useState<boolean>(false);

    useEffect(() => {
        async function getTokens() {
            const spotifyRes = await fetch("/auth/spotify/token");
            const spotifyJson = await spotifyRes.json();
            setSpotifyToken(spotifyJson.access_token);
            const googleRes = await fetch("/auth/google/token");
            const googleJson = await googleRes.json();
            setGoogleTokenAcquired(googleJson.tokenAcquired);
        }
        getTokens();
    }, []);

    return (
        <main className="app">
            {spotifyToken === undefined || !googleTokenAcquired ? (
                <Login />
            ) : (
                <WebPlayback token={spotifyToken} />
            )}
        </main>
    );
}
