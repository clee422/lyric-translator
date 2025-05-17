import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import { getLyrics, translate } from "./lyrics.js";
import { login, callback, token } from "./auth.js";

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

app.get("/auth/login", login);

app.get("/auth/callback", callback);

app.get("/auth/token", token);

app.get("/lyrics/get-lyrics", getLyrics);

app.post("/lyrics/translate", translate);

app.listen(PORT, () => {
    console.log(`Server started at http://127.0.0.1:${PORT}`);
});
