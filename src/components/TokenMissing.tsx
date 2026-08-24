import { useState, useEffect } from "react";
import "./TokenMissing.css";

export default function TokenMissing() {
    const [spotifyToken, setSpotifyToken] = useState<string | undefined>();

    useEffect(() => {
        // async function getToken() {
        //     const spotifyRes = await fetch(
        //         `${import.meta.env.VITE_APP_SERVER_URL}/auth/spotify/token`,
        //         {
        //             method: "GET",
        //             credentials: "include",
        //         },
        //     );

        //     console.log("bodyUsed before reading: ", spotifyRes.bodyUsed);

        //     console.log("STATUS: ", spotifyRes.status);
        //     console.log(
        //         "CONTENT-TYPE: ",
        //         spotifyRes.headers.get("content-type"),
        //     );

        //     const text = await spotifyRes.text();
        //     console.log("RAW RESPONSE:", text);

        //     console.log("bodyUsed after reading: ", spotifyRes.bodyUsed);

        //     const data = JSON.parse(text);

        //     console.log("PARSED DATA:", data);
        //     console.log("KEYS:", Object.keys(data));

        //     // const spotifyJson = await spotifyRes.json();
        //     // console.log("DATA: ", spotifyJson);
        //     // console.log(`TOKEN: ${spotifyJson.access_token}`);
        //     // setSpotifyToken(spotifyJson.access_token);
        // }
        async function getToken() {
            const url = `${
                import.meta.env.VITE_APP_SERVER_URL
            }/auth/spotify/token`;

            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
            });

            console.log("URL:", response.url);
            console.log("STATUS:", response.status);
            console.log("BODY USED:", response.bodyUsed);

            const raw = await response.text();

            console.log("RAW:", raw);
            console.log("BODY USED:", response.bodyUsed);

            const data = JSON.parse(raw);

            console.log("DATA:", data);
            console.log("TOKEN:", data.access_token);

            setSpotifyToken(data.access_token);
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
