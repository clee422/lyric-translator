import { StatusCodes } from "http-status-codes";
import { romanize as romanizeKorean } from "@romanize/korean";
import pinyin from "chinese-to-pinyin";

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

// Returns:
// [
//     {
//         plainLyrics: string,
//         syncedLyrics: string
//     }
//     ...
// ]
export async function lyrics(req, res) {
    const queryParams = new URLSearchParams(req.query);
    const lyricsURL = new URL("https://lrclib.net/api/get");
    lyricsURL.search = queryParams;
    const fetchLyricRes = await fetch(lyricsURL, {
        headers: {
            "User-Agent": `${process.env.npm_package_name} v${process.env.npm_package_version} ${process.env.PROJECT_REPO_URL}`,
        },
    });
    if (fetchLyricRes.status == StatusCodes.OK) {
        const fetchedLyrics = await fetchLyricRes.json();
        if (fetchedLyrics.syncedLyrics === null) {
            // Search lyrics again if synced lyrics unavailable from get endpoint
            const secondSearch = await searchLyricsAgain(queryParams, true);
            res.status(StatusCodes.OK).json(
                secondSearch !== null ? secondSearch : fetchedLyrics
            );
        } else {
            res.status(StatusCodes.OK).json(fetchedLyrics);
        }
    } else if (fetchLyricRes.status == StatusCodes.NOT_FOUND) {
        const secondSearch = await searchLyricsAgain(queryParams, false);
        if (secondSearch !== null) {
            res.status(StatusCodes.OK).json(secondSearch);
        } else {
            res.status(StatusCodes.NOT_FOUND).end();
        }
    } else {
        res.status(fetchLyricRes).end();
    }
}

// Second lyric search if lyrics not found or found lyrics were not synced
async function searchLyricsAgain(queryParams, sync) {
    queryParams.delete("album_name");
    const lyricsURL = new URL("https://lrclib.net/api/search");
    lyricsURL.search = queryParams;
    const fetchLyricRes = await fetch(lyricsURL, {
        headers: {
            "User-Agent": `${process.env.npm_package_name} v${process.env.npm_package_version} ${process.env.PROJECT_REPO_URL}`,
        },
    });
    let resultLyrics;
    if (fetchLyricRes.status == StatusCodes.OK) {
        const fetchedLyrics = await fetchLyricRes.json();
        for (let i = 0; i < fetchedLyrics.length; i++) {
            if (fetchedLyrics[i].syncedLyrics !== null) {
                return fetchedLyrics[i];
            }
            if (resultLyrics === undefined && !sync) {
                resultLyrics = fetchedLyrics[i];
            }
        }
    }
    return null;
}

// Returns:
// [
//     {
//         detectedLanguage: string,
//         translatedText: string,
//         romanizedText: string
//     }
//     ...
// ]
export async function translate(req, res) {
    const content = req.body.content;
    const targetLanguage = req.body.targetLanguage;
    if (!content || !targetLanguage) {
        res.status(StatusCodes.BAD_REQUEST).end();
    } else {
        const translation = await translateContent(
            content,
            targetLanguage,
            req.session.googleAccessToken
        );
        const romanization = await romanizeContent(
            content,
            translation.detectedLanguage,
            req.session.googleAccessToken
        );

        const translatedContent = translation.translatedText.map(
            (line, index) => {
                return {
                    ...line,
                    romanizedText: romanization
                        ? romanization[index]
                        : undefined,
                };
            }
        );

        res.status(StatusCodes.OK).json({
            translatedContent: translatedContent,
        });
    }
}

async function translateContent(content, targetLanguage, accessToken) {
    const translationResponse = await fetch(
        `https://translate.googleapis.com/v3/projects/${process.env.GOOGLE_PROJECT_ID}/locations/global:translateText`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: content,
                mimeType: "text/plain",
                targetLanguageCode: targetLanguage,
            }),
        }
    );
    const translationJson = await translationResponse.json();

    const detectedLanguages = new Map();
    const translatedText = translationJson.translations.map((line) => {
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
        translatedText: translatedText,
        detectedLanguage: mostFreqLanguage,
    };
}

async function romanizeContent(content, sourceLanguage, accessToken) {
    if (googleRomanizeTextSupportedLanguages.has(sourceLanguage)) {
        const romanizeResponse = await fetch(
            `https://translate.googleapis.com/v3/projects/${process.env.GOOGLE_PROJECT_ID}/locations/global:romanizeText`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: content,
                    sourceLanguageCode: sourceLanguage,
                }),
            }
        );
        const romanizeJson = await romanizeResponse.json();

        return romanizeJson.romanizations.map((line) => line.romanizedText);
    } else if (sourceLanguage === "ko") {
        return content.map((line) => {
            let romanized = "";
            try {
                romanized = romanizeKorean(line, { system: "RR" });
            } catch {
                return romanized;
            }

            return romanized.charAt(0).toUpperCase() + romanized.slice(1);
        });
    } else if (chineseLanguageCodes.has(sourceLanguage)) {
        return content.map((line) => {
            const romanized = pinyin(line, { keepRest: true });
            return romanized.charAt(0).toUpperCase() + romanized.slice(1);
        });
    }
    return undefined;
}
