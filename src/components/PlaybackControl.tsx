import {
    PlayCircle,
    PauseCircle,
    SkipNext,
    SkipPrevious,
    Translate,
} from "@mui/icons-material";
import { duration, Slider, Switch } from "@mui/material";
// import { Seekbar } from "react-seekbar"
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
                sx={{
                    color: "rgb(200, 200, 200)",
                }}
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
                    />
                </div>
            </div>
        </footer>
    );
}
