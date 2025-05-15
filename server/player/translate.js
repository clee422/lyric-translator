import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";
import { TranslationServiceClient } from "@google-cloud/translate";
import { romanize as romanizeKorean } from "@romanize/korean";
import pinyin from "chinese-to-pinyin";

dotenv.config();

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

const translationClient = new TranslationServiceClient();

export async function translate(req, res) {
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
}

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
