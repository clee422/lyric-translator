import { clsx } from "clsx";
import "./Lyrics.css";

export interface LyricLine {
    // Time in ms
    timestamp: number;
    lyric: string;
}

export default function Lyrics({
    lyrics,
    currentLine,
    onLyricClick,
    translation,
    showTranslation,
}: {
    lyrics: LyricLine[] | undefined;
    currentLine: number | undefined;
    onLyricClick: any;
    translation: string[] | undefined;
    showTranslation: boolean;
}) {
    function renderLyrics() {
        if (!lyrics) {
            return (
                <div className="lyrics-unavailable">
                    <span>Lyrics not available for this song</span>
                </div>
            );
        }

        const lyricsElem = lyrics?.map((line, index) => {
            const classNames = clsx("lyric-line", {
                "current-line": index === currentLine,
            });
            return (
                <div
                    className={classNames}
                    key={index}
                    onClick={() => onLyricClick(index)}
                >
                    {translation &&
                    showTranslation &&
                    translation[index] !== line.lyric ? (
                        <span>{`${translation[index]}\n`}</span>
                    ) : null}
                    <span>{`${line.lyric}\n`}</span>
                </div>
            );
        });

        return lyricsElem;
    }

    return (
        <div className="lyrics-container">
            <div className="lyrics">{renderLyrics()}</div>
        </div>
    );
}
