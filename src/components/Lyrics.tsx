import { clsx } from "clsx";
import "./Lyrics.css";

export interface LyricLine {
    // Time in ms
    timestamp: number | undefined;
    lyric: string;
}

export default function Lyrics({
    lyrics,
    currentLine,
    onLyricClick,
    translation,
    showTranslation,
    lyricSync,
}: {
    lyrics: LyricLine[] | undefined;
    currentLine: number | undefined;
    onLyricClick: any;
    translation: string[] | undefined;
    showTranslation: boolean;
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
                    translation[translationIndex] !== line.lyric ? (
                        <span className="lyric-translation">{`${translation[translationIndex]}\n`}</span>
                    ) : null}
                    <span>{`${line.lyric}\n`}</span>
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
