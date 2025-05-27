import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import MongoStore from "connect-mongo";
import { lyrics, translate } from "./song.js";
import { spotifyLogin, spotifyCallback, spotifyToken } from "./auth/spotify.js";
import { googleCallback, googleLogin, googleToken } from "./auth/google.js";

dotenv.config();

const app = express();
app.use(
    cors({
        origin: process.env.APP_CLIENT_URL,
        credentials: true,
    })
);
app.use(
    session({
        secret: crypto.randomBytes(32).toString("hex"),
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            ttl: 3600000, // Session life (1 hour)
        }),
        cookie: {
            httpOnly: true,
            secure: false, // Set to true if using HTTPS
            maxAge: 3600000, // 1 hour
        },
    })
);
app.use(bodyParser.json());

// Routes
app.get("/auth/spotify/login", spotifyLogin);

app.get("/auth/spotify/callback", spotifyCallback);

app.get("/auth/spotify/token", spotifyToken);

app.get("/auth/google/login", googleLogin);

app.get("/auth/google/callback", googleCallback);

app.get("/auth/google/token", googleToken);

app.get("/song/lyrics", lyrics);

app.post("/song/translate", translate);

app.listen(process.env.APP_SERVER_PORT, () => {
    console.log(
        `Server started at ${process.env.APP_SERVER_URL}:${process.env.APP_SERVER_PORT}`
    );
});
