import {
    PlayCircle,
    PauseCircle,
    SkipNext,
    SkipPrevious,
    VolumeUp,
    VolumeOff,
    Translate,
    Search,
    SearchOff,
} from "@mui/icons-material";
import {
    alpha,
    FormControlLabel,
    FormGroup,
    IconButton,
    Menu,
    MenuItem,
    Slider,
    styled,
    Switch,
    Tooltip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { StatusCodes } from "http-status-codes";
import "./PlaybackControl.css";

export default function PlaybackControl({
    webPlayer,
    currentTrack,
    paused,
    showOriginalLyrics,
    showTranslation,
    showRomanization,
    followLyrics,
    onToggleOriginalLyrics,
    onToggleTranslation,
    onToggleRomanization,
    onToggleFollowLyrics,
    targetLanguage,
    pollingInterval,
}: {
    webPlayer: Spotify.Player | undefined;
    currentTrack: Spotify.Track | undefined;
    paused: boolean | undefined;
    showOriginalLyrics: boolean;
    showTranslation: boolean;
    showRomanization: boolean;
    followLyrics: boolean;
    onToggleOriginalLyrics: any;
    onToggleTranslation: any;
    onToggleRomanization: any;
    onToggleFollowLyrics: any;
    targetLanguage: string;
    pollingInterval: number;
}) {
    const [position, setPosition] = useState<number>(0);
    const [volume, setVolume] = useState<number>(25);
    const [prevVolume, setPrevVolume] = useState<number>(0);
    const [translateTrackName, setTranslateTrackName] =
        useState<boolean>(false);
    const [trackNameTranslation, setTrackNameTranslation] = useState<
        string | undefined
    >();
    const [anchorEl, setAnchorElem] = useState<null | HTMLElement>(null);

    const trackDuration = currentTrack?.duration_ms;
    const open = Boolean(anchorEl);

    const LyricSwitch = styled(Switch)(({ theme }) => {
        const thumbColor = "#F0F0F0";
        const trackColor = "#777777";
        return {
            "& .MuiSwitch-switchBase.Mui-checked": {
                color: thumbColor,
                "&:hover": {
                    backgroundColor: alpha(
                        thumbColor,
                        theme.palette.action.hoverOpacity
                    ),
                },
            },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: trackColor,
            },
        };
    });

    function formatTimestamp(timestamp: number) {
        if (!trackDuration) {
            return null;
        }
        const currentMins = Math.floor(timestamp / 60000);
        let currentSecs = Math.floor((timestamp % 60000) / 1000).toString();
        if (currentSecs.length < 2) currentSecs = "0" + currentSecs;
        const totalMins = Math.floor(trackDuration / 60000);
        let totalSecs = Math.floor((trackDuration % 60000) / 1000).toString();
        if (totalSecs.length < 2) totalSecs = "0" + totalSecs;
        return `${currentMins}:${currentSecs} / ${totalMins}:${totalSecs}`;
    }

    async function translateTrackInfo(trackName: string | undefined) {
        if (!trackName) {
            return;
        }
        const translationRes = await fetch(
            `${import.meta.env.VITE_APP_SERVER_URL}/song/translate`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: [trackName],
                    targetLanguage: targetLanguage,
                }),
            }
        );
        if (translationRes.status == StatusCodes.OK) {
            translationRes.json().then((json) => {
                const [translatedContent] = json.translatedContent;
                if (translatedContent.detectedLanguage !== targetLanguage) {
                    setTrackNameTranslation(translatedContent.translatedText);
                }
            });
        } else {
            console.error(
                `Attempted to translate track info, response was status ${translationRes.status}`
            );
        }
    }

    function handleToggleTrackName() {
        if (trackNameTranslation) {
            setTranslateTrackName((prev) => !prev);
        }
    }

    function handleClickTranslationMenu(
        event: React.MouseEvent<HTMLButtonElement>
    ) {
        setAnchorElem(event.currentTarget);
    }

    function handleCloseTranslationMenu() {
        setAnchorElem(null);
    }

    function handleToggleMute() {
        if (volume === 0) {
            webPlayer?.setVolume(prevVolume / 100);
            setVolume(prevVolume);
        } else {
            setPrevVolume(volume);
            webPlayer?.setVolume(0);
            setVolume(0);
        }
    }

    // On track change
    useEffect(() => {
        // Show original song name by default
        setTrackNameTranslation(undefined);
        setTranslateTrackName(false);
        translateTrackInfo(currentTrack?.name);
    }, [currentTrack]);

    // Interval for updated current position
    useEffect(() => {
        const interval = setInterval(() => {
            webPlayer?.getCurrentState().then((state) => {
                if (!state) {
                    return;
                }
                setPosition(state.position);
            });
            webPlayer?.getVolume().then((val) => setVolume(val * 100));
        }, pollingInterval);
        return () => {
            clearInterval(interval);
        };
    });

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
                valueLabelDisplay="auto"
                valueLabelFormat={formatTimestamp}
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
                            <span
                                className={`current-track-name${
                                    trackNameTranslation !== undefined
                                        ? " translate-track-name"
                                        : ""
                                }`}
                                onClick={handleToggleTrackName}
                            >
                                {translateTrackName && trackNameTranslation
                                    ? trackNameTranslation
                                    : currentTrack.name + "\n"}
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
                <div className="playback-features">
                    <div className="toggle-follow-lyrics">
                        <Tooltip
                            title={
                                followLyrics
                                    ? "Stop following lyrics"
                                    : "Follow lyrics"
                            }
                        >
                            <IconButton onClick={onToggleFollowLyrics}>
                                {followLyrics ? <SearchOff /> : <Search />}
                            </IconButton>
                        </Tooltip>
                    </div>
                    <div className="toggle-translate">
                        <Tooltip title="Translate">
                            <IconButton onClick={handleClickTranslationMenu}>
                                <Translate />
                            </IconButton>
                        </Tooltip>

                        <Menu
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "right",
                            }}
                            transformOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleCloseTranslationMenu}
                            sx={{
                                ".MuiPaper-root": {
                                    color: "white",
                                    backgroundColor: "#1E1E1E",
                                },
                                ".MuiMenuItem-root:hover": {
                                    backgroundColor: "#2D2D2D",
                                },
                                ".MuiFormControlLabel-label": {
                                    fontFamily: `"Inter", sans-serif`,
                                    fontWeight: "300",
                                    marginLeft: "0.5rem",
                                },
                            }}
                        >
                            <FormGroup>
                                <MenuItem>
                                    <FormControlLabel
                                        control={
                                            <LyricSwitch
                                                checked={showOriginalLyrics}
                                                onChange={
                                                    onToggleOriginalLyrics
                                                }
                                                color="default"
                                            />
                                        }
                                        label="Original Lyrics"
                                    />
                                </MenuItem>
                                <MenuItem>
                                    <FormControlLabel
                                        control={
                                            <LyricSwitch
                                                checked={showTranslation}
                                                onChange={onToggleTranslation}
                                            />
                                        }
                                        label="Translation"
                                    />
                                </MenuItem>
                                <MenuItem>
                                    <FormControlLabel
                                        control={
                                            <LyricSwitch
                                                checked={showRomanization}
                                                onChange={onToggleRomanization}
                                            />
                                        }
                                        label="Romanization"
                                    />
                                </MenuItem>
                            </FormGroup>
                        </Menu>
                    </div>
                    <div className="playback-volume-control">
                        <Tooltip title={volume === 0 ? "Unmute" : "Mute"}>
                            <IconButton onClick={handleToggleMute}>
                                {volume === 0 ? <VolumeOff /> : <VolumeUp />}
                            </IconButton>
                        </Tooltip>
                        <Slider
                            size="small"
                            value={volume}
                            min={0}
                            max={100}
                            sx={() => ({
                                color: "rgb(200, 200, 200)",
                                "& .MuiSlider-thumb": {
                                    width: 0,
                                    height: 0,
                                    transition:
                                        "0.3s cubic-bezier(.47,1.64,.41,.8)",
                                    "&:hover, &.Mui-focusVisible": {
                                        boxShadow: "none",
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
                                webPlayer?.setVolume(value / 100);
                                setVolume(value);
                            }}
                            valueLabelDisplay="auto"
                        />
                    </div>
                </div>
            </div>
        </footer>
    );
}
