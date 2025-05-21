import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://127.0.0.1:3000/auth/google/callback"
);

export function googleLogin(req, res) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: "https://www.googleapis.com/auth/cloud-translation",
    });
    res.redirect(authUrl);
}

export async function googleCallback(req, res) {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    req.session.googleAccessToken = tokens.access_token;
    res.redirect("/");
}
