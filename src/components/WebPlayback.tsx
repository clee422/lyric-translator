import { useState, useEffect } from "react";
import { StatusCodes } from "http-status-codes";
import Lyrics from "./Lyrics";
import PlaybackControl from "./PlaybackControl";
import "./WebPlayerback.css";

export interface LyricLine {
    // Time in ms
    timestamp: number | undefined;
    lyric: string;
}

export interface TranslationLine {
    translation: string;
    // ISO 639 language code
    detectedLanguage: string;
}

export default function WebPlayback({ token }: { token: string }) {
    const [webPlayer, setWebPlayer] = useState<Spotify.Player>();
    const [paused, setPaused] = useState<boolean>();
    const [currentTrack, setCurrentTrack] = useState<Spotify.Track>();
    const [lyrics, setLyrics] = useState<LyricLine[]>();
    const [lyricLine, setLyricLine] = useState<number>();
    const [translation, setTranslation] = useState<TranslationLine[]>();
    const [showTranslation, setShowTranslation] = useState<boolean>(true);
    const [lyricSync, setLyricSync] = useState<boolean>();

    // Period for playback position updates (in milliseconds)
    const positionPollingRate: number = 200;

    function onTrackChange(stateCurrentTrack: Spotify.Track): void {
        // Clear previous lyrics on track change
        setLyrics([
            {
                timestamp: 0,
                lyric: "Loading lyrics...",
            },
        ]);
        setTranslation([]);
        setLyricSync(false);
        setLyricLine(undefined);

        setCurrentTrack(stateCurrentTrack);
        getTrackLyrics(stateCurrentTrack).then((lyricsJson) => {
            setTrackLyrics(lyricsJson);
            translateLyrics(lyricsJson);
        });
    }

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
            return fetch(`/player/lyrics?${queryParams}`).then((res) => {
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

    function setTrackLyrics(lyricsJson: any): void {
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
                    /\[\d{2}:\d{2}.\d{2}\] .+/.test(line)
                );

            // Use plain lyrics to determine linebreak for new verse
            let syncedLyricsIndex = 0;
            const plainLyricsSplit: string[] =
                lyricsJson.plainLyrics.split("\n");

            const newLyrics = plainLyricsSplit.map((line) => {
                if (line === "") {
                    return {
                        timestamp: undefined,
                        lyric: "",
                    };
                }
                const parts = /\[(\d{2}):(\d{2}).(\d{2})\] (.+)/.exec(
                    synced[syncedLyricsIndex]
                );
                if (!parts) {
                    return {
                        timestamp: undefined,
                        lyric: "Lyrics could not be found",
                    };
                }
                // Compute timestamp in ms
                const timestamp =
                    parseInt(parts[1]) * 60000 +
                    parseInt(parts[2]) * 1000 +
                    parseInt(parts[3]) * 10;
                const lyric = parts[4];

                syncedLyricsIndex += 1;

                return {
                    lyric: lyric,
                    timestamp: timestamp,
                };
            });
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
        fetch("/player/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ lyrics: lyrics }),
        })
            .then((res) => {
                if (res.status == StatusCodes.OK) {
                    res.json().then((json) =>
                        setTranslation(json.translatedLyrics)
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

    function updatePosition() {
        webPlayer?.getCurrentState().then((state) => {
            if (!state) {
                return;
            }

            if (lyricSync) {
                setLyricLine((prevLine) => {
                    if (lyrics && lyrics[0].timestamp !== undefined) {
                        if (state.position < lyrics[0].timestamp) {
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
                                if (state.position < lyrics[m + 1].timestamp!) {
                                    r = m - 1;
                                } else {
                                    l = m + 1;
                                }
                            } else if (state.position < lyrics[m].timestamp!) {
                                r = m - 1;
                            } else {
                                lyricLineIndex = Math.max(lyricLineIndex, m);
                                l = m + 1;
                            }
                        }
                        return lyricLineIndex;
                    }
                    return prevLine;
                });
            }
        });
    }

    function handleLyricClick(index: number) {
        if (webPlayer && lyrics && lyrics[index].timestamp) {
            webPlayer.seek(lyrics[index].timestamp);
        }
    }

    function handleToggleTranslation() {
        setShowTranslation((prevShowTranslation) => !prevShowTranslation);
    }

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.type = "module";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player: Spotify.Player = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: (cb) => {
                    cb(token);
                },
                volume: 0.25,
            });

            setWebPlayer(player);

            player.addListener("ready", async ({ device_id }) => {
                console.log("Ready with Device ID", device_id);
                // Change playback device to Web Playback
                fetch("https://api.spotify.com/v1/me/player", {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        device_ids: [device_id],
                        play: true,
                    }),
                });
            });

            player.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
            });

            player.addListener("autoplay_failed", () => {
                console.log("Autoplay failed");
            });

            player.addListener("player_state_changed", (state) => {
                if (!state) {
                    return;
                }

                setPaused(state.paused);

                setCurrentTrack((prevTrack): Spotify.Track => {
                    const stateCurrentTrack: Spotify.Track =
                        state.track_window.current_track;

                    // On track change
                    if (prevTrack?.id !== stateCurrentTrack.id) {
                        onTrackChange(stateCurrentTrack);
                        return stateCurrentTrack;
                    }
                    return prevTrack;
                });
            });

            player.connect();
        };

        return () => {
            webPlayer?.disconnect();
            script.remove();
        };
    }, []);

    // Updating rack position timer
    useEffect(() => {
        const interval = setInterval(
            () => updatePosition(),
            positionPollingRate
        );

        return () => {
            clearInterval(interval);
        };
    }, [webPlayer, paused, lyrics, lyricLine]);

    return (
        <div className="playback-container">
            <Lyrics
                lyrics={lyrics}
                currentLine={lyricLine}
                onLyricClick={handleLyricClick}
                translation={translation}
                showTranslation={showTranslation}
                lyricSync={lyricSync}
            />
            <PlaybackControl
                currentTrack={currentTrack}
                paused={paused}
                webPlayer={webPlayer}
                showTranslation={showTranslation}
                onToggleTranslation={handleToggleTranslation}
            />
        </div>
    );
}
