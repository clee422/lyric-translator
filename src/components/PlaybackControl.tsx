import {
    PlayCircle,
    PauseCircle,
    SkipNext,
    SkipPrevious,
    Translate,
} from "@mui/icons-material";
import { Slider, Switch } from "@mui/material";
import "./PlaybackControl.css";

export default function PlaybackControl({
    currentTrack,
    paused,
    position,
    trackDuration,
    webPlayer,
    showTranslation,
    onToggleTranslation,
}: {
    currentTrack: Spotify.Track | undefined;
    paused: boolean | undefined;
    position: number;
    trackDuration: number | undefined;
    webPlayer: Spotify.Player | undefined;
    showTranslation: boolean;
    onToggleTranslation: any;
}) {
    return (
        <footer className="app-footer">
            <Slider
                className="playback-seeker"
                size="small"
                value={position}
                min={0}
                max={trackDuration}
                step={1}
                sx={(t) => ({
                    color: "rgb(200, 200, 200)",
                    "& .MuiSlider-thumb": {
                        width: 0,
                        height: 0,
                        transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                        "&:hover, &.Mui-focusVisible": {
                            boxShadow: `0px 0px 0px 8px ${"rgb(0 0 0 / 16%)"}`,
                            ...t.applyStyles("dark", {
                                boxShadow: `0px 0px 0px 8px ${"rgb(255 255 255 / 16%)"}`,
                            }),
                            width: 8,
                            height: 8,
                        },
                        "&.Mui-active": {
                            width: 12,
                            height: 12,
                        },
                    },
                })}
                onChange={(_, value) => {
                    webPlayer?.seek(value);
                }}
            />
            <div className="playback-control">
                <div className="current-track">
                    {currentTrack?.album.images[0].url ? (
                        <img
                            src={currentTrack.album.images[0].url}
                            className="current-track-cover"
                            alt=""
                        />
                    ) : null}
                    <div className="current-track-info">
                        {currentTrack?.name ? (
                            <span className="current-track-name">
                                {currentTrack.name + "\n"}
                            </span>
                        ) : null}
                        <span className="current-track-artist">
                            {currentTrack?.artists
                                .map((artist) => artist.name)
                                .join(", ")}
                        </span>
                    </div>
                </div>
                <div className="playback-control-buttons">
                    <button
                        className="playback-control-change-track"
                        onClick={() => {
                            if (position > 2000) {
                                webPlayer?.seek(0);
                            } else {
                                webPlayer?.previousTrack();
                            }
                        }}
                    >
                        <SkipPrevious />
                    </button>
                    <button
                        className="playback-control-toggle-play"
                        onClick={() => {
                            webPlayer?.togglePlay();
                        }}
                    >
                        {paused ? <PlayCircle /> : <PauseCircle />}
                    </button>
                    <button
                        className="playback-control-change-track"
                        onClick={() => {
                            webPlayer?.nextTrack();
                        }}
                    >
                        <SkipNext />
                    </button>
                </div>
                <div className="toggle-translate">
                    <Translate />
                    <Switch
                        checked={showTranslation}
                        onChange={onToggleTranslation}
                        style={{
                            color: "white",
                        }}
                        sx={{
                            // Switched ON color
                            ".css-161ms7l-MuiButtonBase-root-MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                {
                                    backgroundColor: "white",
                                },
                            // Switched OFF color
                            ".MuiSwitch-track": {
                                backgroundColor: "#828282",
                            },
                        }}
                    />
                </div>
            </div>
        </footer>
    );
}
