import React from "react";
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
} from "@mui/material";

export default function App() {
    const webcamRef = React.useRef(null);

    // Feature 2
    const [gameRunning] = useAtom(gameRunningAtom);
    const emotionState = useEmotionDetection(webcamRef, true); // once the user starts the camera, the face dectection will run
    /**
     * What emotionState Contains:

  {
      emotion: {angry: 0.91, happy: 0.04, ...},  // All 7 emotions
      angerScore: 0.91,                           // Just the anger value
      speedMultiplier: 2.4,                       // Current speed
      isModelLoaded: true,                        // Model ready?
      isAngryDetected: true                       // Anger > 70%?
  }
     */

    return (
        <EmotionContext.Provider value={emotionState}>
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
                            <Grid item xs={12} md={6} lg={6}>
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

                                {/* Feature 2*/}
                                <Paper sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    marginBottom: 3,
                                    backgroundColor: emotionState.isAngryDetected ? '#ffcccc' : 'white'
                                }}>
                                    How angry are you right now?  😠 <br />
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
                            </Grid>
                        </Grid>
                    </Container>
                </Box>
            </Box>
        </EmotionContext.Provider>
    );
}
