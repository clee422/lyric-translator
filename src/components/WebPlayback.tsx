import { useState, useEffect } from "react";
import { StatusCodes } from "http-status-codes";
import type { LyricLine } from "./Lyrics";
import Lyrics from "./Lyrics";
import PlaybackControl from "./PlaybackControl";
import "./WebPlayerback.css";

export default function WebPlayback({ token }: { token: string }) {
    const [webPlayer, setWebPlayer] = useState<Spotify.Player>();
    const [paused, setPaused] = useState<boolean>();
    const [currentTrack, setCurrentTrack] = useState<Spotify.Track>();
    const [lyrics, setLyrics] = useState<LyricLine[]>();
    const [lyricLine, setLyricLine] = useState<number>(-1);
    const [translation, setTranslation] = useState<string[]>();
    const [syncedAvailable, setSyncedAvailable] = useState<boolean>();

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
        setSyncedAvailable(false);

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
            setSyncedAvailable(false);
            return;
        }

        if (lyricsJson.syncedLyrics) {
            const split: string[] = lyricsJson.syncedLyrics.split("\n");
            const filtered = split.filter((line) =>
                /\[\d{2}:\d{2}.\d{2}\] .+/.test(line)
            );

            // Use plain lyrics to determine linebreak for new verse
            let plainLyricsIndex = 1;
            const plainLyricsSplit = lyricsJson.plainLyrics.split("\n");

            const newLyrics = filtered.map((line) => {
                const parts = /\[(\d{2}):(\d{2}).(\d{2})\] (.+)/.exec(line);
                if (!parts) {
                    return {
                        timestamp: 0,
                        lyric: "Lyrics could not be found",
                    };
                }
                // Timestamp in ms
                const timestamp =
                    parseInt(parts[1]) * 60000 +
                    parseInt(parts[2]) * 1000 +
                    parseInt(parts[3]) * 10;
                let lyric = parts[4];

                if (
                    plainLyricsIndex < plainLyricsSplit.length &&
                    plainLyricsSplit[plainLyricsIndex] === ""
                ) {
                    lyric += "\n";
                    plainLyricsIndex += 1;
                }
                plainLyricsIndex += 1;

                return {
                    timestamp: timestamp,
                    lyric: lyric,
                };
            });
            setLyrics(newLyrics);
            setSyncedAvailable(true);
        } else if (lyricsJson.plainLyrics) {
            const split: string[] = lyricsJson.plainLyrics.split("\n");
            split.unshift("[SYNCED LYRICS NOT AVAILABLE FOR THIS SONG]\n");
            setLyrics(
                split.map((line) => ({
                    timestamp: 0,
                    lyric: line,
                }))
            );
            setSyncedAvailable(false);
        }
    }

    function translateLyrics(lyricsJson: any): void {
        if (
            !lyricsJson ||
            !(lyricsJson.syncedLyrics || lyricsJson.plainLyrics)
        ) {
            return;
        }
        const lyrics: string = lyricsJson.plainLyrics
            .split("\n")
            .filter((line: string) => line !== "")
            .join("\n");
        fetch("/player/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ lyrics: lyrics }),
        })
            .then((res) => {
                if (res.status == StatusCodes.OK) {
                    res.json().then((json) => setTranslation(json));
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
        if (!paused) {
            webPlayer?.getCurrentState().then((state) => {
                if (!state) {
                    return;
                }
                if (!state.paused) {
                    setLyricLine((prevLine) => {
                        if (lyrics) {
                            if (state.position < lyrics[0].timestamp) {
                                return -1;
                            }

                            // Binary search to find current lyric
                            let l = 0;
                            let r = lyrics.length - 1;
                            let lyricLineIndex = 0;

                            while (l <= r) {
                                let m = Math.floor((l + r) / 2);
                                if (state.position < lyrics[m].timestamp) {
                                    r = m - 1;
                                } else {
                                    lyricLineIndex = Math.max(
                                        lyricLineIndex,
                                        m
                                    );
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
    }

    function handleLyricClick(index: number) {
        if (webPlayer && lyrics) {
            webPlayer.seek(lyrics[index].timestamp);
        }
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
            />
            <PlaybackControl
                currentTrack={currentTrack}
                paused={paused}
                webPlayer={webPlayer}
            />
        </div>
    );
}
