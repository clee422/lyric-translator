import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import { lyrics, translate } from "./song.js";
import { spotifyLogin, spotifyCallback, spotifyToken } from "./auth/spotify.js";
import { googleCallback, googleLogin } from "./auth/google.js";

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

app.get("/auth/spotify/login", spotifyLogin);

app.get("/auth/spotify/callback", spotifyCallback);

app.get("/auth/spotify/token", spotifyToken);

app.get("/auth/google/login", googleLogin);

app.get("/auth/google/callback", googleCallback);

app.get("/song/lyrics", lyrics);

app.post("/song/translate", translate);

app.listen(PORT, () => {
    console.log(`Server started at http://127.0.0.1:${PORT}`);
});
