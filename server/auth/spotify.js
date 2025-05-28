export async function spotifyLogin(req, res) {
    const generateRandomString = (length) => {
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce(
            (acc, x) => acc + possible[x % possible.length],
            ""
        );
    };

    const state = generateRandomString(16);
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const authQueryParams = new URLSearchParams({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: "streaming user-read-email user-read-private",
        redirect_uri: `${process.env.APP_SERVER_URL}/auth/spotify/callback`,
        state: state,
    });

    authUrl.search = authQueryParams.toString();
    res.redirect(authUrl.toString());
}

export async function spotifyCallback(req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;

    if (state === null) {
        res.redirect("/");
    } else {
        const tokenResponse = await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${new Buffer.from(
                        process.env.SPOTIFY_CLIENT_ID +
                            ":" +
                            process.env.SPOTIFY_CLIENT_SECRET
                    ).toString("base64")}`,
                },
                body: new URLSearchParams({
                    code: code,
                    redirect_uri: `${process.env.APP_SERVER_URL}/auth/spotify/callback`,
                    grant_type: "authorization_code",
                }),
            }
        );
        const tokenJson = await tokenResponse.json();
        req.session.spotifyAccessToken = tokenJson.access_token;
        console.log(`setting token: ${req.sessionID}`);
        req.session.save(() => {
            res.redirect(`${process.env.APP_CLIENT_URL}/continue-auth`);
        });
    }
}

export async function spotifyToken(req, res) {
    console.log(`getting token: ${req.sessionID}`);
    console.log(`token: ${JSON.stringify(req.session)}`);
    res.json({
        access_token: req.session.spotifyAccessToken,
    });
}
