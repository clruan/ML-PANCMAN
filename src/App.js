import React from "react";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { gameRunningAtom } from "./GlobalState";
import PacMan from "./components/PacMan";
import MLTrain from "./components/MLTrain";
import DataCollection from "./components/DataCollection";
import InteractiveValidation from "./components/InteractiveValidation";
import { useEmotionDetection } from "./model/emotionModule";
import { EmotionContext } from "./model/EmotionContext";

import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./driver-overrides.css";

import {
    Button,
    Box,
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    Container,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Tooltip,
    IconButton,
    colors,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { getEmotionColor, withAlpha } from "./constants/emotions";

export default function App() {
    const webcamRef = React.useRef(null);

    // Feature 2
    const [gameRunning] = useAtom(gameRunningAtom);
    const [selectedEmotion, setSelectedEmotion] = useState("angry");
    const emotionState = useEmotionDetection(webcamRef, true, selectedEmotion); // once the user starts the camera, the face detection will run
    const [isEmotionDropdownOpen, setIsEmotionDropdownOpen] = useState(false);

    const emotionOptions = [
        "angry",
        "happy",
        "sad",
        "surprised",
        "fearful",
        "disgusted",
        "neutral",
    ];

    const pacmanGifUrl = `${process.env.PUBLIC_URL}/pacman.gif`

    const startTour = () => {
        const tour = driver({
            opacity: 0.75,
            allowClose: true,
            showProgress: true,
            steps: [
                {
                    element: '[data-tour="data-collection"]',
                    popover: {
                        title: "Step 1: Collect gesture data",
                        description:
                            "Turn on the camera and record several examples for each direction. This is how the AI learns your gestures.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: '[data-tour="train"]',
                    popover: {
                        title: "Step 2: Train the model",
                        description:
                            "Click “Train” to fine-tune the model on your data. Better, more balanced examples usually give better control.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: '[data-tour="validation"]',
                    popover: {
                        title: "Step 3: Validate predictions",
                        description:
                            "Use this panel to see live predictions and confidence, and adjust the threshold before starting the game.",
                        side: "right",
                        align: "start",
                    },
                },
                {
                    element: '[data-tour="emotion"]',
                    popover: {
                        title: "Step 4: Emotion-based speed control",
                        description:
                            "Choose which emotion will boost Pac‑Man, and watch the live emotion scores to understand how the model reacts.",
                        side: "left",
                        align: "start",
                    },
                },
                {
                    element: '[data-tour="game"]',
                    popover: {
                        title: "Step 5: Play with AI",
                        description:
                            `
        <div style="text-align: center;">
          <img
            src="${pacmanGifUrl}"
            alt="Pac-Man"
            style="max-width: 250px; display: block; margin: 0 auto 8px;"
          />
          <div>Have fun! Gestures steer Pac-Man, emotions control speed.</div>
        </div>
      `,
                        side: "left",
                        align: "start",
                    },
                },
            ],
        });

        tour.drive();
    };

    // On first load, check if the tour has been seen
    useEffect(() => {
        const hasSeenTour = window.localStorage.getItem("pacman_tour_seen");
        if (!hasSeenTour) {
            try {
                startTour();
                window.localStorage.setItem("pacman_tour_seen", "true");
            } catch (e) {
                console.error("Failed to start tour automatically:", e);
            }
        }
    }, []);


    return (
        <EmotionContext.Provider value={{ ...emotionState, selectedEmotion, setSelectedEmotion }}>
            <Box sx={{ display: "flex" }}>
                <CssBaseline />
                <AppBar position="absolute">
                    <Toolbar
                        sx={{
                            pl: "24px", // left padding
                        }}
                    >
                        <Typography component="h1" variant="h3" color="inherit" noWrap>
                            Control PAC MAN via the camera!
                        </Typography>
                        <Button
                            variant="outlined"
                            onClick={(e) => {
                                e.stopPropagation();
                                startTour();
                            }}
                            style={{ color: 'white', borderColor: 'white', marginLeft: '80px', fontSize: '25px' }}
                        >
                            Show Tour
                        </Button>
                    </Toolbar>
                </AppBar>

                <Box
                    component="main"
                    sx={{
                        backgroundColor: (theme) => theme.palette.grey[800],
                        flexGrow: 1,
                        height: "100vh",
                        width: "100vw",
                        overflow: "auto",
                    }}
                >
                    <Toolbar />
                    <Container sx={{ paddingTop: 3 }}>
                        <Grid container spacing={3}>
                            {/* Chart */}
                            <Grid
                                item
                                xs={12}
                                md={6}
                                lg={6}
                                sx={{
                                    position: 'relative',
                                    ...(gameRunning && {
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backdropFilter: 'blur(4px) brightness(0.95)',
                                            WebkitBackdropFilter: 'blur(4px) brightness(0.95)',
                                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                            zIndex: 1,
                                            pointerEvents: 'none',
                                            transition: 'all 0.3s ease-in-out',
                                        }
                                    })
                                }}
                            >
                                <Paper
                                    data-tour="data-collection"
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        marginBottom: 3,
                                    }}
                                >
                                    {/* part 1 where we collect training data */}
                                    <DataCollection webcamRef={webcamRef} />
                                </Paper>
                                <Paper
                                    data-tour="train"
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        height: 340,
                                    }}
                                >
                                    <MLTrain webcamRef={webcamRef} />
                                </Paper>
                                <Paper
                                    data-tour="validation"
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        marginTop: 3,
                                    }}
                                >
                                    <InteractiveValidation webcamRef={webcamRef} />
                                </Paper>
                            </Grid>
                            {/* Recent Deposits */}
                            <Grid item xs={12} md={6} lg={6}>
                                <Paper data-tour="game" sx={{ p: 2, display: "flex", flexDirection: "column" }}>
                                    <PacMan />
                                </Paper>
                                {/* Feature 2*/}
                                <Paper
                                    data-tour="emotion"
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        marginTop: 3,
                                        backgroundColor: emotionState.isBoostActive
                                            ? withAlpha(getEmotionColor(selectedEmotion), 0.18)
                                            : "white",
                                        cursor: 'pointer'  // Show it's clickable
                                    }}
                                    onClick={() => setIsEmotionDropdownOpen(!isEmotionDropdownOpen)}
                                >
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        gap={1}
                                        flexWrap="wrap"
                                    >
                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            alignItems="center"
                                            justifyContent="space-between"
                                            flexWrap="nowrap"
                                            sx={{ flex: 1 }}
                                        >
                                            <FormControl
                                                size="small"
                                                sx={{ width: 200, flexShrink: 0 }}
                                            >
                                                <InputLabel id="boost-emotion-select-label">Select Emotion</InputLabel>
                                                <Select
                                                    labelId="boost-emotion-select-label"
                                                    value={selectedEmotion}
                                                    label="Select Emotion"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => setSelectedEmotion(e.target.value)}
                                                >
                                                    {emotionOptions.map((emotion) => (
                                                        <MenuItem key={emotion} value={emotion}>
                                                            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <Typography sx={{ whiteSpace: "nowrap", flexShrink: 0 }}>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "8ch",
                                                        textAlign: "right",
                                                        marginRight: 1,
                                                    }}
                                                >
                                                    {selectedEmotion.charAt(0).toUpperCase() + selectedEmotion.slice(1)}
                                                </span>
                                                {" Score:"}
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        width: "3ch",
                                                        textAlign: "right",
                                                        marginLeft: 1,
                                                        fontVariantNumeric: "tabular-nums",
                                                    }}
                                                >
                                                    {(emotionState.boostScore * 100).toFixed(0)}
                                                </span>
                                                %
                                            </Typography>
                                            <span style={{ marginLeft: '5px', whiteSpace: 'nowrap' }}>
                                                {isEmotionDropdownOpen ? '▲' : '▼'} See more scores
                                            </span>
                                        </Stack>
                                        <Box
                                            sx={{
                                                width: "100%",
                                                display: "flex",
                                                justifyContent: "flex-end",
                                            }}
                                        >
                                            <Tooltip title="Select which emotion will boost Pac-Man's speed. The confiduence score is calculated right away from your webcmera feed.">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label="Select boost emotion help"
                                                >
                                                    <InfoOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                    <br />
                                </Paper>
                                {isEmotionDropdownOpen && emotionState.emotion && (
                                    <Paper sx={{ p: 2, marginTop: 3 }}>
                                        <Typography variant="h6" gutterBottom>All Emotions:</Typography>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {Object.entries(emotionState.emotion).map(([emotionName, score]) => {
                                                const color = getEmotionColor(emotionName);
                                                const isSelected = selectedEmotion === emotionName;
                                                return (
                                                    <span
                                                        key={emotionName}
                                                        style={{
                                                            flexBasis: 'calc(33.33% - 10px)',  // 3 items per row
                                                            minWidth: '120px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            fontWeight: isSelected ? 'bold' : 'normal'
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: '50%',
                                                                backgroundColor: color,
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                        <span>
                                                            {emotionName.charAt(0).toUpperCase() + emotionName.slice(1)}: {(score *
                                                                100).toFixed(0)}%
                                                        </span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </Paper>
                                )}
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
            </Box>
        </EmotionContext.Provider>
    );
}
