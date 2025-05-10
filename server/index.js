import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";

const clientPort = 3000;
const serverPort = 5000;
const redirectUri = `http://127.0.0.1:${clientPort}/auth/callback`;

dotenv.config();

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;

const app = express();

let accessToken;
let codeVerifier;

app.get("/auth/login", async (req, res) => {
    const generateRandomString = (length) => {
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const values = crypto.getRandomValues(new Uint8Array(length));
        return values.reduce(
            (acc, x) => acc + possible[x % possible.length],
            ""
        );
    };

    codeVerifier = generateRandomString(64);

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

    const scope = "streaming user-read-email user-read-private";
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        redirect_uri: redirectUri,
    });

    authUrl.search = auth_query_parameters.toString();
    res.redirect(authUrl.toString());
});

app.get("/auth/callback", async (req, res) => {
    const code = req.query.code;
    const tokenUrl = "https://accounts.spotify.com/api/token";
    const payload = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: spotify_client_id,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    };

    const body = await fetch(tokenUrl, payload);
    const response = await body.json();
    accessToken = response.access_token;
    res.redirect("/");
});

app.get("/auth/token", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.json({
        access_token: accessToken,
    });
});

app.listen(serverPort, () => {
    console.log(`Listening at http://127.0.0.1:${serverPort}`);
});
