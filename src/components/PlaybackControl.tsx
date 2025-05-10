import {
    PlayCircle,
    PauseCircle,
    SkipNext,
    SkipPrevious,
} from "@mui/icons-material";
import "./PlaybackControl.css";

export default function PlaybackControl({
    currentTrack,
    paused,
    webPlayer,
}: {
    currentTrack: Spotify.Track | undefined;
    paused: boolean | undefined;
    webPlayer: Spotify.Player | undefined;
}) {
    return (
        <footer className="playback-control">
            <div className="current-track">
                {currentTrack?.album.images[0].url ? (
                    <img
                        src={currentTrack.album.images[0].url}
                        className="current-track-cover"
                        alt=""
                    />
                ) : null}
                <div className="current-track-info">
                    <span className="current-track-name">
                        {currentTrack?.name + "\n"}
                    </span>

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
                        webPlayer?.previousTrack();
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
        </footer>
    );
}
