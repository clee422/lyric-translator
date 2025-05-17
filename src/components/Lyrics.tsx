import { clsx } from "clsx";
import type { LyricLine, TranslationLine } from "./WebPlayback";
import { CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";
import "./Lyrics.css";

export default function Lyrics({
    lyrics,
    currentLine,
    onLyricClick,
    loading,
    targetLanguage,
    translation,
    showOriginalLyrics,
    showTranslation,
    showRomanization,
    lyricSync,
}: {
    lyrics: LyricLine[] | undefined;
    currentLine: number | undefined;
    onLyricClick: any;
    loading: boolean;
    targetLanguage: string;
    translation: TranslationLine[] | undefined;
    showOriginalLyrics: boolean;
    showTranslation: boolean;
    showRomanization: boolean;
    lyricSync: boolean | undefined;
}) {
    const [lyricsWidth, setLyricsWidth] = useState<number>();

    // Calculate width of lyrics based on longest line
    useEffect(() => {
        let maxChars: number = 0;
        if (showTranslation || showRomanization) {
            translation?.forEach((line) => {
                if (showTranslation) {
                    maxChars = Math.max(maxChars, line.translatedText?.length);
                }
                if (showRomanization) {
                    maxChars = Math.max(maxChars, line.romanizedText?.length);
                }
            });
        }
        if (showOriginalLyrics) {
            lyrics?.forEach(
                (line) => (maxChars = Math.max(maxChars, line.lyric.length))
            );
        }
        setLyricsWidth(maxChars * 0.62);
    }, [
        showOriginalLyrics,
        showTranslation,
        showRomanization,
        lyrics,
        translation,
    ]);

    function renderLyrics() {
        if (!lyrics) {
            return (
                <div className="lyrics-unavailable">
                    <span>Lyrics not available for this song</span>
                </div>
            );
        }
        let translationIndex = -1;

        const lyricElements = lyrics.map((line, index) => {
            const verseBreak: boolean = line.lyric === "";
            const classNames = clsx("lyric-line", {
                "verse-break": verseBreak,
                "plain-lyric": !verseBreak && !lyricSync,
                "synced-lyric": !verseBreak && lyricSync,
                "current-line": index === currentLine,
            });
            if (!verseBreak) {
                translationIndex += 1;
            }
            return (
                <div
                    key={index}
                    className={classNames}
                    onClick={lyricSync ? () => onLyricClick(index) : undefined}
                >
                    {/* Translated lyric */}
                    {showTranslation &&
                    !verseBreak &&
                    translation &&
                    translation[translationIndex] &&
                    translation[translationIndex].translatedText !==
                        line.lyric ? (
                        <span className="lyric-translation">{`${translation[translationIndex].translatedText}\n`}</span>
                    ) : null}
                    {/* Romanized lyric */}
                    {showRomanization &&
                    !verseBreak &&
                    translation &&
                    translation[translationIndex] &&
                    translation[translationIndex].detectedLanguage !==
                        targetLanguage &&
                    translation[translationIndex].romanizedText ? (
                        <span className="lyric-romanization">{`${translation[translationIndex].romanizedText}\n`}</span>
                    ) : null}
                    {/* Original lyric */}
                    {showOriginalLyrics ||
                    verseBreak ||
                    (showTranslation &&
                        translation &&
                        translation[translationIndex].detectedLanguage ===
                            targetLanguage) ||
                    (showRomanization &&
                        translation &&
                        translation[translationIndex].detectedLanguage ===
                            targetLanguage) ? (
                        <span>{`${line.lyric}\n`}</span>
                    ) : null}
                </div>
            );
        });

        return lyricElements;
    }

    return (
        <div className="lyrics-container">
            {loading ? (
                <CircularProgress
                    color="inherit"
                    size="7rem"
                    style={{
                        color: "#545454",
                        marginTop: "30vh",
                    }}
                />
            ) : (
                <div
                    className="lyrics"
                    style={{
                        width: lyricSync ? `${lyricsWidth}rem` : "fit-content",
                    }}
                >
                    {renderLyrics()}
                </div>
            )}
        </div>
    );
}
