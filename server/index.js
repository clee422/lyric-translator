import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { URLSearchParams } from "url";
import { TranslationServiceClient } from "@google-cloud/translate";
import { romanize as romanizeKorean } from "@romanize/korean";
import pinyin from "chinese-to-pinyin";

const clientPort = 3000;
const serverPort = 5000;
const redirectUri = `http://127.0.0.1:${clientPort}/auth/callback`;

dotenv.config();

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;

const app = express();
app.use(bodyParser.json());

const translationClient = new TranslationServiceClient();
// Google Cloud Translation API romanization supported languages
// (https://cloud.google.com/translate/docs/languages#roman)
const googleRomanizeTextSupportedLanguages = new Set([
    "ar",
    "am",
    "bn",
    "be",
    "hi",
    "ja",
    "my",
    "ru",
    "sr",
    "uk",
]);
const chineseLanguageCodes = new Set(["zh-CN", "zh-TW", "zh-HK", "zh-SG"]);

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

app.get("/player/lyrics", (req, res) => {
    const queryParams = req.url.split("?")[1];
    fetch(`https://lrclib.net/api/get?${queryParams}`, {
        headers: {
            "User-Agent": `${process.env.npm_package_name} v${process.env.npm_package_version} ${process.env.PROJECT_REPO_URL}`,
        },
    }).then((fetchLyricRes) => {
        if (fetchLyricRes.status == StatusCodes.OK) {
            fetchLyricRes
                .json()
                .then((json) => res.status(StatusCodes.OK).json(json));
        } else if (fetchLyricRes.status == StatusCodes.NOT_FOUND) {
            res.status(StatusCodes.NOT_FOUND).end();
        } else {
            res.status(fetchLyricRes).end();
        }
    });
});

app.post("/player/translate", async (req, res) => {
    const lyrics = req.body.lyrics;
    if (!lyrics) {
        res.status(StatusCodes.BAD_REQUEST).end();
    } else {
        const targetLanguage = req.body.targetLanguage;
        const translation = await translateLyrics(lyrics, targetLanguage);
        const romanizedLyrics = await romanizeLyrics(
            lyrics,
            translation.detectedLanguage
        );

        const responseBody = translation.translatedLyrics.map((line, index) => {
            return {
                ...line,
                romanizedText: romanizedLyrics
                    ? romanizedLyrics[index]
                    : undefined,
            };
        });

        res.status(StatusCodes.OK).json({
            translatedLyrics: responseBody,
        });
    }
});

async function translateLyrics(lyrics, targetLanguage) {
    const [translationResponse] = await translationClient.translateText({
        parent: `projects/${process.env.GOOGlE_PROJECT_ID}/locations/global`,
        contents: lyrics,
        mimeType: "text/plain",
        targetLanguageCode: targetLanguage,
    });

    const detectedLanguages = new Map();
    const translatedLyrics = translationResponse.translations.map((line) => {
        if (detectedLanguages.has(line.detectedLanguageCode)) {
            detectedLanguages.set(
                line.detectedLanguageCode,
                detectedLanguages.get(line.detectedLanguageCode) + 1
            );
        } else {
            detectedLanguages.set(line.detectedLanguageCode, 1);
        }
        return {
            translatedText: line.translatedText,
            detectedLanguage: line.detectedLanguageCode,
        };
    });

    let mostFreqLanguage;
    let mostFreqLanguageCount = 0;
    detectedLanguages.forEach((count, language) => {
        if (language !== targetLanguage && count > mostFreqLanguageCount) {
            mostFreqLanguage = language;
            mostFreqLanguageCount = count;
        }
    });

    return {
        translatedLyrics: translatedLyrics,
        detectedLanguage: mostFreqLanguage,
    };
}

async function romanizeLyrics(lyrics, sourceLanguage) {
    if (googleRomanizeTextSupportedLanguages.has(sourceLanguage)) {
        const [romanizeResponse] = await translationClient.romanizeText({
            parent: `projects/${process.env.GOOGlE_PROJECT_ID}/locations/global`,
            contents: lyrics,
            sourceLanguageCode: sourceLanguage,
        });
        return romanizeResponse.romanizations.map((line) => line.romanizedText);
    } else if (sourceLanguage === "ko") {
        return lyrics.map((line) => {
            const romanized = romanizeKorean(line, { system: "RR" });
            return romanized.charAt(0).toUpperCase() + romanized.slice(1);
        });
    } else if (chineseLanguageCodes.has(sourceLanguage)) {
        return lyrics.map((line) => {
            const romanized = pinyin(line, { keepRest: true });
            return romanized.charAt(0).toUpperCase() + romanized.slice(1);
        });
    }
    return undefined;
}

app.listen(serverPort, () => {
    console.log(`Server started at http://127.0.0.1:${serverPort}`);
});
