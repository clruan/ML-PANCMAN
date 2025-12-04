import React from "react";
import { useState } from "react";
import { useAtom } from "jotai";
import { gameRunningAtom } from "./GlobalState";
import PacMan from "./components/PacMan";
import MLTrain from "./components/MLTrain";
import DataCollection from "./components/DataCollection";
import InteractiveValidation from "./components/InteractiveValidation";
import { useEmotionDetection } from "./model/emotionModule";
import { EmotionContext } from "./model/EmotionContext";

import {
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
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

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
                                <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
                                    <PacMan />
                                </Paper>
                                {/* Feature 2*/}
                                <Paper
                                    sx={{
                                        p: 2,
                                        textAlign: 'center',
                                        marginTop: 3,
                                        backgroundColor: emotionState.isBoostActive ? '#d63737ff' : 'white',
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
                                            justifyContent="center"
                                            flexWrap="wrap"
                                            sx={{ flex: 1 }}
                                        >
                                            <FormControl size="small" sx={{ minWidth: 180 }}>
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
                                            <Typography>
                                                {selectedEmotion.charAt(0).toUpperCase() + selectedEmotion.slice(1)} Score: {(emotionState.boostScore * 100).toFixed(0)}%
                                            </Typography>
                                            <span style={{ marginLeft: '10px' }}>
                                                {isEmotionDropdownOpen ? '▲' : '▼'} See more scores
                                            </span>
                                            <Tooltip title="Select which emotion will boost Pac-Man's speed. The confiduence score is calculated right away from your webcmera feed.">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label="Select boost emotion help"
                                                >
                                                    <InfoOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    </Box>
                                    <br />
                                </Paper>
                                {isEmotionDropdownOpen && emotionState.emotion && (
                                    <Paper sx={{ p: 2, marginTop: 3 }}>
                                        <Typography variant="h6" gutterBottom>All Emotions:</Typography>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {Object.entries(emotionState.emotion).map(([emotionName, score]) => (
                                                <span
                                                    key={emotionName}
                                                    style={{
                                                        flexBasis: 'calc(33.33% - 10px)',  // 3 items per row
                                                        minWidth: '120px'
                                                    }}
                                                >
                                                    <strong>{emotionName.charAt(0).toUpperCase() + emotionName.slice(1)}:</strong> {(score *
                                                        100).toFixed(0)}%
                                                </span>
                                            ))}
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
