import { clsx } from "clsx";
import type { LyricLine, TranslationLine } from "./WebPlayback";
import "./Lyrics.css";

export default function Lyrics({
    lyrics,
    currentLine,
    onLyricClick,
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
    targetLanguage: string;
    translation: TranslationLine[] | undefined;
    showOriginalLyrics: boolean;
    showTranslation: boolean;
    showRomanization: boolean;
    lyricSync: boolean | undefined;
}) {
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
                    {showTranslation &&
                    !verseBreak &&
                    translation &&
                    translation[translationIndex] &&
                    translation[translationIndex].translatedText !==
                        line.lyric ? (
                        <span className="lyric-translation">{`${translation[translationIndex].translatedText}\n`}</span>
                    ) : null}
                    {showRomanization &&
                    !verseBreak &&
                    translation &&
                    translation[translationIndex] &&
                    translation[translationIndex].detectedLanguage !=
                        targetLanguage &&
                    translation[translationIndex].romanizedText ? (
                        <span className="lyric-romanization">{`${translation[translationIndex].romanizedText}\n`}</span>
                    ) : null}
                    {showOriginalLyrics ? (
                        <span>{`${line.lyric}\n`}</span>
                    ) : null}
                </div>
            );
        });

        return lyricElements;
    }

    return (
        <div className="lyrics-container">
            <div className="lyrics">{renderLyrics()}</div>
        </div>
    );
}
