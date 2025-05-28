import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import MongoStore from "connect-mongo";
import { lyrics, translate } from "./song.js";
import { spotifyLogin, spotifyCallback, spotifyToken } from "./auth/spotify.js";
import { googleCallback, googleLogin, googleToken } from "./auth/google.js";

dotenv.config();

const PORT = process.env.PORT;
const app = express();
app.use(
    cors({
        origin: process.env.APP_CLIENT_URL,
        credentials: true,
    })
);
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
            ttl: 3600000, // Session life (1 hour)
        }),
        cookie: {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : false,
            secure: process.env.NODE_ENV === "production", // Set to true if using HTTPS
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

app.get("/test-session", (req, res) => {
    req.session.foo = "bar";
    res.json({
        sessionID: req.sessionID,
    });
});

app.listen(PORT, () => {
    console.log(
        `Server started at ${process.env.APP_SERVER_URL} on port ${PORT}`
    );
});
