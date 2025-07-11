import { clsx } from "clsx";
import { StatusCodes } from "http-status-codes";
import { CircularProgress } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import "./Lyrics.css";

export interface LyricLine {
    // Time in ms
    timestamp: number | undefined;
    lyric: string;
}

export interface TranslationLine {
    translatedText: string;
    romanizedText: string;
    // ISO 639 language code
    detectedLanguage: string;
}

export default function Lyrics({
    webPlayer,
    currentTrack,
    targetLanguage,
    showOriginalLyrics,
    showTranslation,
    showRomanization,
    followLyrics,
    pollingInterval,
}: {
    webPlayer: Spotify.Player | undefined;
    currentTrack: Spotify.Track | undefined;
    targetLanguage: string;
    showOriginalLyrics: boolean;
    showTranslation: boolean;
    showRomanization: boolean;
    followLyrics: boolean;
    pollingInterval: number;
}) {
    const [lyrics, setLyrics] = useState<LyricLine[]>();
    const [translation, setTranslation] = useState<TranslationLine[]>();
    const [currentLine, setCurrentLine] = useState<number>();
    const [lyricSync, setLyricSync] = useState<boolean>();
    const [lyricsWidth, setLyricsWidth] = useState<number>();
    const [loading, setLoading] = useState<boolean>(true);

    const currentLineRef = useRef<null | HTMLDivElement>(null);

    async function getTrackLyrics(
        stateCurrentTrack: Spotify.Track
    ): Promise<any> {
        const queryParams = new URLSearchParams({
            track_name: stateCurrentTrack.name,
            artist_name: stateCurrentTrack.artists[0].name,
            album_name: stateCurrentTrack.album.name,
            duration: Math.floor(
                stateCurrentTrack.duration_ms / 1000
            ).toString(),
        });

        try {
            return fetch(
                `${
                    import.meta.env.VITE_APP_SERVER_URL
                }/song/lyrics?${queryParams}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            ).then((res) => {
                if (res.status == StatusCodes.OK) {
                    return res.json();
                } else if (res.status == StatusCodes.NOT_FOUND) {
                    return undefined;
                } else {
                    console.error(
                        `Attempted to fetch lyrics, response was status ${res.status}`
                    );
                    return undefined;
                }
            });
        } catch (error) {
            console.error(`Error fetching lyrics: ${error}`);
            return undefined;
        }
    }

    function parseAndSetLyrics(lyricsJson: any): void {
        if (
            !lyricsJson ||
            !(lyricsJson.syncedLyrics || lyricsJson.plainLyrics)
        ) {
            setLyrics(undefined);
            setLyricSync(false);
            return;
        }

        if (lyricsJson.syncedLyrics) {
            const synced: string[] = lyricsJson.syncedLyrics
                .split("\n")
                .filter((line: string) =>
                    /\[\d{2}:\d{2}.\d{2}\]\s*.+/.test(line)
                );

            // Use plain lyrics to determine linebreak for new verse
            let syncedLyricsIndex = 0;
            const plainLyricsSplit: string[] =
                lyricsJson.plainLyrics.split("\n");

            let newLyrics = plainLyricsSplit.map((line) => {
                if (syncedLyricsIndex >= synced.length) {
                    return {
                        invalid: true,
                        lyric: "",
                        timestamp: undefined,
                    };
                }
                if (!/\S+/.test(line)) {
                    return {
                        timestamp: undefined,
                        lyric: "",
                    };
                }
                const parts = /\[(\d{2}):(\d{2}).(\d{2})\]\s*(.+)/.exec(
                    synced[syncedLyricsIndex]
                );
                syncedLyricsIndex += 1;
                if (!parts) {
                    return {
                        invalid: true,
                        lyric: "",
                        timestamp: undefined,
                    };
                }
                // Compute timestamp in ms
                const timestamp =
                    parseInt(parts[1]) * 60000 +
                    parseInt(parts[2]) * 1000 +
                    parseInt(parts[3]) * 10;
                const lyric = parts[4];

                return {
                    lyric: lyric,
                    timestamp: timestamp,
                };
            });
            newLyrics = newLyrics.filter((line) =>
                line.invalid ? false : true
            );
            setLyrics(newLyrics);
            setLyricSync(true);
        } else if (lyricsJson.plainLyrics) {
            const split: string[] = lyricsJson.plainLyrics.split("\n");
            setLyrics(
                split.map((line) => ({
                    timestamp: undefined,
                    lyric: line,
                }))
            );
            setLyricSync(false);
        } else {
            setLyrics(undefined);
            setLyricSync(false);
        }
    }

    function translateLyrics(lyricsJson: any): void {
        if (
            !lyricsJson ||
            !(lyricsJson.syncedLyrics || lyricsJson.plainLyrics)
        ) {
            return;
        }
        const lyrics: string[] = lyricsJson.plainLyrics
            .split("\n")
            .filter((line: string) => line !== "");
        fetch(`${import.meta.env.VITE_APP_SERVER_URL}/song/translate`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content: lyrics,
                targetLanguage: targetLanguage,
            }),
        })
            .then((res) => {
                if (res.status == StatusCodes.OK) {
                    res.json().then((json) =>
                        setTranslation(json.translatedContent)
                    );
                } else {
                    console.error(
                        `Attempted to translate lyrics, response was status ${res.status}`
                    );
                }
            })
            .catch((error) => {
                console.error(`Error translating lyrics: ${error}`);
            });
    }

    function updateCurrentLine(position: number) {
        if (lyricSync) {
            setCurrentLine((prevLine) => {
                if (lyrics && lyrics[0].timestamp !== undefined) {
                    if (position < lyrics[0].timestamp) {
                        return undefined;
                    }

                    // Binary search to find current lyric. O(log(n)) time
                    let l = 0;
                    let r = lyrics.length - 1;
                    let lyricLineIndex = 0;

                    while (l <= r) {
                        let m = Math.floor((l + r) / 2);
                        if (lyrics[m].timestamp === undefined) {
                            // If lyrics[m] is a verse break
                            if (position < lyrics[m + 1].timestamp!) {
                                r = m - 1;
                            } else {
                                l = m + 1;
                            }
                        } else if (position < lyrics[m].timestamp!) {
                            r = m - 1;
                        } else {
                            lyricLineIndex = Math.max(lyricLineIndex, m);
                            l = m + 1;
                        }
                    }
                    return prevLine === lyricLineIndex
                        ? prevLine
                        : lyricLineIndex;
                }
                return prevLine;
            });
        }
    }

    function renderLyrics() {
        if (!lyrics) {
            return null;
        }
        let translationIndex = -1;

        const lyricElements = lyrics.map((line, index) => {
            const verseBreak: boolean = !/\S+/.test(line.lyric);
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
                    onClick={
                        lyricSync
                            ? () => {
                                  if (line.timestamp)
                                      handleLyricClick(line.timestamp);
                              }
                            : undefined
                    }
                    ref={index === currentLine ? currentLineRef : null}
                >
                    {/* Translated lyric */}
                    {showTranslation &&
                    !verseBreak &&
                    translation &&
                    translation[translationIndex] &&
                    translation[translationIndex].detectedLanguage !==
                        targetLanguage &&
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

    function handleLyricClick(timestamp: number) {
        webPlayer?.seek(timestamp);
    }

    // On track change
    useEffect(() => {
        // Clear previous lyrics on track change
        setLyrics([]);
        setTranslation([]);
        setCurrentLine(undefined);
        setLyricSync(false);
        setLoading(true);

        // Get and set current track lyrics and translations
        if (currentTrack) {
            getTrackLyrics(currentTrack).then((lyricsJson) => {
                parseAndSetLyrics(lyricsJson);
                if (showTranslation || showRomanization) {
                    translateLyrics(lyricsJson);
                }
                setLoading(false);
            });
        }
    }, [currentTrack]);

    // Interval for updating current line
    useEffect(() => {
        const interval = setInterval(() => {
            webPlayer?.getCurrentState().then((state) => {
                if (!state) {
                    return;
                }
                updateCurrentLine(state.position);
                if (followLyrics && currentLineRef.current !== null) {
                    currentLineRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            });
        }, pollingInterval);

        return () => {
            clearInterval(interval);
        };
    });

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
        setLyricsWidth(maxChars * 0.65);
    }, [
        showOriginalLyrics,
        showTranslation,
        showRomanization,
        lyrics,
        translation,
    ]);

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
            ) : lyrics ? (
                <div
                    className="lyrics"
                    style={{
                        width: lyricSync ? `${lyricsWidth}rem` : "fit-content",
                    }}
                >
                    {renderLyrics()}
                </div>
            ) : (
                <div className="lyrics-unavailable">
                    <span>Lyrics not available for this song</span>
                </div>
            )}
        </div>
    );
}
