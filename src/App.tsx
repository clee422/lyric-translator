import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./components/Login";
import WebPlayback from "./components/WebPlayback";
import ContinueOAuth from "./components/ContinueOAuth";

export default function App() {
    const [spotifyToken, setSpotifyToken] = useState<string | undefined>(
        undefined
    );
    const [googleTokenAcquired, setGoogleTokenAcquired] =
        useState<boolean>(false);

    useEffect(() => {
        async function getTokens() {
            const spotifyRes = await fetch(
                `${import.meta.env.VITE_APP_SERVER_URL}/auth/spotify/token`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const spotifyJson = await spotifyRes.json();
            setSpotifyToken(spotifyJson.access_token);
            const googleRes = await fetch(
                `${import.meta.env.VITE_APP_SERVER_URL}/auth/google/token`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );
            const googleJson = await googleRes.json();
            setGoogleTokenAcquired(googleJson.tokenAcquired);
        }
        getTokens();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <main className="app">
                            {spotifyToken === undefined ||
                            !googleTokenAcquired ? (
                                <Login />
                            ) : (
                                <WebPlayback token={spotifyToken} />
                            )}
                        </main>
                    }
                />
                <Route path="/continue-auth" element={<ContinueOAuth />} />
            </Routes>
        </BrowserRouter>
    );
}
