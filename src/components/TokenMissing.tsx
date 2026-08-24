import { useState, useEffect } from "react";
import "./TokenMissing.css";

export default function TokenMissing({ token }: { token: string | undefined }) {
    const [spotifyToken, setSpotifyToken] = useState<string | undefined>(token);

    useEffect(() => {
        async function getToken() {
            const spotifyRes = await fetch(
                `${import.meta.env.VITE_APP_SERVER_URL}/auth/spotify/token`,
                {
                    method: "GET",
                    credentials: "include",
                },
            );

            console.log("STATUS: ", spotifyRes.status);
            console.log(
                "CONTENT-TYPE: ",
                spotifyRes.headers.get("content-type"),
            );

            const text = await spotifyRes.text();
            console.log("RAW RESPONSE:", text);

            const data = JSON.parse(text);

            console.log("PARSED DATA:", data);
            console.log("KEYS:", Object.keys(data));

            const spotifyJson = await spotifyRes.json();
            // console.log("DATA: ", spotifyJson);
            // console.log(`TOKEN: ${spotifyJson.access_token}`);
            setSpotifyToken(spotifyJson.access_token);
        }
        getToken();
    }, []);

    return (
        <div className="token-missing">
            <span>Missing Spotify OAuth Token</span>
            <br />
            <span>{`${spotifyToken}`}</span>
        </div>
    );
}
