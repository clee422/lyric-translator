export async function spotifyLogin(req, res) {
    const generateRandomString = (length) => {
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce(
            (acc, x) => acc + possible[x % possible.length],
            "",
        );
    };

    const codeVerifier = generateRandomString(64);

    const sha256 = async (plain) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return crypto.subtle.digest("SHA-256", data);
    };

    const base64encode = (input) => {
        return btoa(String.fromCharCode(...new Uint8Array(input)))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");
    };

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    req.session.spotifyCodeVerifier = codeVerifier;

    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const authQueryParams = new URLSearchParams({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: "streaming user-read-email user-read-private",
        redirect_uri: `${process.env.APP_CLIENT_URL}/api/auth/spotify/callback`,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
    });

    authUrl.search = authQueryParams.toString();
    res.redirect(authUrl.toString());
}

export async function spotifyCallback(req, res) {
    const code = req.query.code || null;
    const codeVerifier = req.session.spotifyCodeVerifier;

    const tokenResponse = await fetch(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${new Buffer.from(
                    process.env.SPOTIFY_CLIENT_ID +
                        ":" +
                        process.env.SPOTIFY_CLIENT_SECRET,
                ).toString("base64")}`,
            },
            body: new URLSearchParams({
                client_id: process.env.SPOTIFY_CLIENT_ID,
                redirect_uri: `${process.env.APP_CLIENT_URL}/api/auth/spotify/callback`,
                grant_type: "authorization_code",
                code: code,
                code_verifier: codeVerifier,
            }),
        },
    );
    const tokenJson = await tokenResponse.json();
    req.session.spotifyAccessToken = tokenJson.access_token;
    req.session.save(() => {
        res.redirect(`${process.env.APP_CLIENT_URL}/continue-auth`);
    });
}

export async function spotifyToken(req, res) {
    res.json({
        access_token: req.session.spotifyAccessToken,
    });
}
