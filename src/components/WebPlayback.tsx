import { useState, useEffect } from "react";
import Lyrics from "./Lyrics";
import PlaybackControl from "./PlaybackControl";
import "./WebPlayerback.css";

export default function WebPlayback({ token }: { token: string }) {
    const [webPlayer, setWebPlayer] = useState<Spotify.Player>();
    const [paused, setPaused] = useState<boolean>();
    const [currentTrack, setCurrentTrack] = useState<Spotify.Track>();
    const [showOriginalLyrics, setShowOriginalLyrics] = useState<boolean>(true);
    const [showTranslation, setShowTranslation] = useState<boolean>(true);
    const [showRomanization, setShowRomanization] = useState<boolean>(true);
    const [followLyrics, setFollowLyrics] = useState<boolean>(true);

    // Period for playback position updates (in milliseconds)
    const pollingInterval: number = 200;
    const targetLanguage = "en";

    function handleToggleOriginalLyrics() {
        setShowOriginalLyrics((prev) => !prev);
    }

    function handleToggleTranslation() {
        setShowTranslation((prev) => !prev);
    }

    function handleToggleRomanization() {
        setShowRomanization((prev) => !prev);
    }

    function handleToggleFollowLyrics() {
        setFollowLyrics((prev) => !prev);
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
                        setCurrentTrack(stateCurrentTrack);
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

    return (
        <div className="playback-container">
            <Lyrics
                webPlayer={webPlayer}
                currentTrack={currentTrack}
                targetLanguage={targetLanguage}
                showOriginalLyrics={showOriginalLyrics}
                showTranslation={showTranslation}
                showRomanization={showRomanization}
                followLyrics={followLyrics}
                stopFollowingLyrics={handleToggleFollowLyrics}
                pollingInterval={pollingInterval}
            />
            <PlaybackControl
                webPlayer={webPlayer}
                currentTrack={currentTrack}
                paused={paused}
                showOriginalLyrics={showOriginalLyrics}
                showTranslation={showTranslation}
                showRomanization={showRomanization}
                followLyrics={followLyrics}
                onToggleOriginalLyrics={handleToggleOriginalLyrics}
                onToggleTranslation={handleToggleTranslation}
                onToggleRomanization={handleToggleRomanization}
                onToggleFollowLyrics={handleToggleFollowLyrics}
                targetLanguage={targetLanguage}
                pollingInterval={pollingInterval}
            />
        </div>
    );
}
