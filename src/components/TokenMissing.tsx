import { useState, useEffect } from "react";

export default function TokenMissing() {
    const [spotifyToken, setSpotifyToken] = useState<string | undefined>();

    useEffect(() => {
        // async function getToken() {
        //     const spotifyRes = await fetch(
        //         `/api/auth/spotify/token`,
        //         {
        //             method: "GET",
        //             credentials: "include",
        //         },
        //     );

        //     // const spotifyJson = await spotifyRes.json();
        //     // setSpotifyToken(spotifyJson.access_token);
        // }
        async function getToken() {
            const url = `/api/auth/spotify/token`;

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

            const debug = {
                status: response.status,
                responseUrl: response.url,
                rawResponse: raw,
            };

            document.body.innerHTML += `<pre>${JSON.stringify(
                debug,
                null,
                2,
            )}</pre>`;

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
