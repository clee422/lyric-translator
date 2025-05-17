import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import { URLSearchParams } from "url";
import { lyrics } from "./player/lyrics.js";
import { translate } from "./player/translate.js";

const PORT = 5000;

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(
    session({
        secret: crypto.randomBytes(32).toString("hex"),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, // Set to true if using HTTPS
            maxAge: 3600000, // 1 hour
        },
    })
);

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

    const state = generateRandomString(16);
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    const authQueryParams = new URLSearchParams({
        response_type: "code",
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: "streaming user-read-email user-read-private",
        redirect_uri: "http://127.0.0.1:3000/auth/callback",
        state: state,
    });

    authUrl.search = authQueryParams.toString();
    res.redirect(authUrl.toString());
});

app.get("/auth/callback", async (req, res) => {
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
                    redirect_uri: "http://127.0.0.1:3000/auth/callback",
                    grant_type: "authorization_code",
                }),
            }
        );
        const tokenJson = await tokenResponse.json();
        req.session.accessToken = tokenJson.access_token;

        res.redirect(`/`);
    }
});

app.get("/auth/token", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.json({
        access_token: req.session.accessToken,
    });
});

app.get("/player/lyrics", lyrics);

app.post("/player/translate", translate);

app.listen(PORT, () => {
    console.log(`Server started at http://127.0.0.1:${PORT}`);
});
