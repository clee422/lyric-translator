import { StatusCodes } from "http-status-codes";

export function googleLogin(req, res) {
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
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    const authParams = new URLSearchParams({
        access_type: "offline",
        scope: "https://www.googleapis.com/auth/cloud-translation",
        response_type: "code",
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.APP_SERVER_URL}:${process.env.APP_SERVER_PORT}/auth/google/callback`,
        state: state,
    });
    authUrl.search = authParams.toString();
    res.redirect(authUrl.toString());
}

export async function googleCallback(req, res) {
    const { code } = req.query;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${new Buffer.from(
                process.env.GOOGLE_CLIENT_ID +
                    ":" +
                    process.env.GOOGLE_CLIENT_SECRET
            ).toString("base64")}`,
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: `${process.env.APP_SERVER_URL}:${process.env.APP_SERVER_PORT}/auth/google/callback`,
            grant_type: "authorization_code",
        }),
    });
    const tokenJson = await tokenRes.json();
    req.session.googleAccessToken = tokenJson.access_token;
    res.redirect(`${process.env.APP_CLIENT_URL}`);
}

export function googleToken(req, res) {
    res.status(StatusCodes.OK).json({
        tokenAcquired: req.session.googleAccessToken !== undefined,
    });
}
