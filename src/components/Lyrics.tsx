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
        let lyricsElem;

        if (!lyricSync) {
            const classNames = clsx("lyric-line", "plain-lyric");
            lyricsElem = lyrics.map((line) => {
                return (
                    <div className={classNames}>
                        <span>{`${line.lyric}\n`}</span>
                    </div>
                );
            });
        } else {
            lyricsElem = lyrics.map((line, index) => {
                const classNames = clsx("lyric-line", "synced-lyric", {
                    "current-line": index === currentLine,
                });
                return (
                    <div
                        className={classNames}
                        key={index}
                        onClick={() => onLyricClick(index)}
                    >
                        {translation &&
                        translation[index] &&
                        showTranslation &&
                        translation[index] !== line.lyric ? (
                            <span>{`${translation[index]}\n`}</span>
                        ) : null}
                        <span>{`${line.lyric}\n`}</span>
                    </div>
                );
            });
        }

        return lyricsElem;
    }

    return (
        <div className="lyrics-container">
            <div className="lyrics">{renderLyrics()}</div>
        </div>
    );
}
