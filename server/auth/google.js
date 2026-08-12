import { StatusCodes } from "http-status-codes";

export async function googleLogin(req, res) {
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

    req.session.googleCodeVerifier = codeVerifier;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    const authParams = new URLSearchParams({
        access_type: "offline",
        scope: "https://www.googleapis.com/auth/cloud-translation",
        response_type: "code",
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.APP_SERVER_URL}/auth/google/callback`,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        // state: state,
    });
    authUrl.search = authParams.toString();
    res.redirect(authUrl.toString());
}

export async function googleCallback(req, res) {
    const { code } = req.query;
    const codeVerifier = req.session.googleCodeVerifier;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${new Buffer.from(
                process.env.GOOGLE_CLIENT_ID +
                    ":" +
                    process.env.GOOGLE_CLIENT_SECRET,
            ).toString("base64")}`,
        },
        body: new URLSearchParams({
            redirect_uri: `${process.env.APP_SERVER_URL}/auth/google/callback`,
            grant_type: "authorization_code",
            code: code,
            code_verifier: codeVerifier,
        }),
    });
    const tokenJson = await tokenRes.json();
    req.session.googleAccessToken = tokenJson.access_token;
    req.session.save(() => {
        res.redirect(`${process.env.APP_CLIENT_URL}`);
    });
}

export function googleToken(req, res) {
    res.status(StatusCodes.OK).json({
        tokenAcquired: req.session.googleAccessToken !== undefined,
    });
}
