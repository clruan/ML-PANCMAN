import Webcam from "react-webcam";
import { Grid, Button, Box, Typography } from "@mui/material";
import { useAtom } from "jotai";
import {
    imgSrcArrAtom,
    batchSizeAtom,
    gameRunningAtom,
    isCameraOnAtom,
    validationActiveAtom,
    validationConfidenceAtom,
    validationDirectionAtom,
    validationThresholdAtom,
} from "../GlobalState";
import {
    DIRECTION_ICON_COMPONENTS,
    DIRECTION_KEYS,
} from "../constants/directions";

const DIRECTION_ICONS = DIRECTION_ICON_COMPONENTS;

const HIGHLIGHT_ROTATIONS = {
    up: 0,
    right: 90,
    down: 180,
    left: 270,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function DataCollection({ webcamRef }) {
    const [isCameraOn, setIsCameraOn] = useAtom(isCameraOnAtom);

    // ---- Model Training ----
    const [imgSrcArr, setImgSrcArr] = useAtom(imgSrcArrAtom);

    // ---- Configurations ----
    const [, setBatchSize] = useAtom(batchSizeAtom);
    const [gameRunning] = useAtom(gameRunningAtom);

    // ---- Shared Overlay State ----
    const [validationActive] = useAtom(validationActiveAtom);
    const [validationConfidence] = useAtom(validationConfidenceAtom);
    const [validationDirection] = useAtom(validationDirectionAtom);
    const [validationThreshold] = useAtom(validationThresholdAtom);

    const capture = (direction) => async () => {
        // Capture image from webcam
        const newImageSrc = webcamRef.current.getScreenshot();

        // If image is not null, proceed with adding it to the dataset
        if (newImageSrc) {

            // Add example to the dataset
            const newImageArr = [...imgSrcArr, { src: newImageSrc, label: direction }];
            setImgSrcArr(newImageArr);
            setBatchSize(Math.floor(newImageArr.length * 0.4));
        }
    };

    const cameraPlaceholder = (
        <Box
            display="flex"
            textAlign={"center"}
            justifyContent="center"
            alignItems="center"
            sx={{
                p: 2,
                border: "1px dashed grey",
                height: "224px",
                width: "224px",
                margin: "auto",
                backgroundColor: "#ddd",
            }}
        >
            Camera is off
        </Box>
    );

    return (
        <Grid container>
            {/* first row */}

            <Grid
                item
                xs={12}
                sx={{ marginBottom: 2 }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
            >
                <Box textAlign="center">
                    <Button
                        variant="contained"
                        onClick={() => setIsCameraOn(!isCameraOn)}
                        disabled={gameRunning}
                    >
                        {" "}
                        {isCameraOn ? "Stop" : "Start"} Camera
                    </Button>
                </Box>
                <Box sx={{ marginTop: 1 }}>
                    {isCameraOn ? (
                        <Box className="camera-face-container">
                            <Webcam
                                mirrored
                                className="camera-face-video"
                                width={224}
                                height={224}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 224,
                                    height: 224,
                                    facingMode: "user",
                                }}
                            />
                            <CameraOverlay
                                validationActive={validationActive}
                                validationConfidence={validationConfidence}
                                validationDirection={validationDirection}
                                validationThreshold={validationThreshold}
                            />
                        </Box>
                    ) : (
                        cameraPlaceholder
                    )}
                </Box>
            </Grid>

            {DIRECTION_KEYS.map((directionKey) => {
                return (
                    <OneDirection
                        key={directionKey}
                        disabled={!isCameraOn}
                        directionIcon={DIRECTION_ICONS[directionKey]}
                        onCapture={capture(directionKey)}
                        dirImgSrcArr={imgSrcArr.filter((d) => d.label == directionKey)}
                    />
                );
            })}
        </Grid>
    );
}

const OneDirection = ({ directionIcon, onCapture, dirImgSrcArr, disabled }) => {
    const Icon = directionIcon;
    return (
        <Grid item xs={3}>
            <Box textAlign="center">
                <Button
                    variant="outlined"
                    endIcon={Icon ? <Icon /> : null}
                    onClick={onCapture}
                    disabled={disabled}
                >
                    {" "}
                    Add to{" "}
                </Button>
            </Box>
            <Box textAlign="center" sx={{ width: "100%", height: "100px" }}>
                {dirImgSrcArr.length > 0 && (
                    <img
                        height={"100%"}
                        src={dirImgSrcArr[dirImgSrcArr.length - 1].src}
                        style={{ padding: "2px" }}
                    />
                )}
            </Box>
        </Grid>
    );
};

const CameraOverlay = ({
    validationActive,
    validationConfidence,
    validationDirection,
    validationThreshold,
}) => {
    const DirectionIcon =
        validationDirection && DIRECTION_ICONS[validationDirection]
            ? DIRECTION_ICONS[validationDirection]
            : null;

    if (!validationActive) {
        return null;
    }

    const normalizedConfidence = validationActive
        ? clamp(
              validationConfidence /
                  Math.max(validationThreshold || 0.001, 0.001),
              0,
              1
          )
        : 0;

    const ringStyle = {};
    const base = { r: 210, g: 210, b: 210 };
    const target = { r: 76, g: 175, b: 80 };
    const lerp = (start, end) =>
        Math.round(start + (end - start) * normalizedConfidence);

    const color = {
        r: lerp(base.r, target.r),
        g: lerp(base.g, target.g),
        b: lerp(base.b, target.b),
    };

    const alpha = 0.4 + normalizedConfidence * 0.45;
    const shadowAlpha = 0.05 + normalizedConfidence * 0.4;
    const scale = 0.95 + normalizedConfidence * 0.05;

    ringStyle.borderColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    ringStyle.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(
        0.95,
        alpha + 0.1
    )})`;
    ringStyle.boxShadow = `0 0 ${12 + normalizedConfidence * 14}px rgba(${color.r}, ${
        color.g
    }, ${color.b}, ${shadowAlpha})`;
    ringStyle.transform = `scale(${scale})`;

    let highlightStyle = null;
    if (
        validationDirection &&
        HIGHLIGHT_ROTATIONS.hasOwnProperty(validationDirection)
    ) {
        const rotation = HIGHLIGHT_ROTATIONS[validationDirection];
        const spread = 40 + normalizedConfidence * 18;
        const start = -90 - spread / 2;
        const strength = 0.35 + normalizedConfidence * 0.5;
        const wedgeColor = `rgba(76,175,80,${strength})`;
        const edgeFeather = Math.min(6, spread / 3);
        const innerStart = Math.max(edgeFeather, 0);
        const innerEnd = Math.max(innerStart, spread - edgeFeather);
        const wedgeGradient = `conic-gradient(from ${start}deg, transparent 0deg, transparent ${innerStart}deg, ${wedgeColor} ${innerStart}deg, ${wedgeColor} ${innerEnd}deg, transparent ${innerEnd}deg, transparent 360deg)`;
        const innerFade = clamp(34 - normalizedConfidence * 10, 20, 34);
        const outerFade = Math.min(innerFade + 10, 48);
        const radialMask = `radial-gradient(circle at center, transparent 0%, transparent ${innerFade}%, rgba(0,0,0,0.85) ${outerFade}%, rgba(0,0,0,1) 100%)`;
        highlightStyle = {
            backgroundImage: wedgeGradient,
            opacity: clamp(0.2 + normalizedConfidence, 0, 1),
            transform: `rotate(${(rotation + 90) % 360}deg) scale(${0.94 + normalizedConfidence * 0.04})`,
            maskImage: radialMask,
            WebkitMaskImage: radialMask,
        };
    }

    const directionConfidence = `${Math.round(validationConfidence * 100)}%`;

    return (
        <Box className="camera-face-overlay">
            <Box className="camera-face-ring" style={ringStyle}>
                {highlightStyle && (
                    <Box className="camera-face-ring-highlight" style={highlightStyle} />
                )}
                <Box className="camera-face-ring-icon">
                    {DirectionIcon ? <DirectionIcon fontSize="inherit" /> : "—"}
                </Box>
            </Box>
            <Box className="camera-face-overlay-info">
                <Typography
                    variant="caption"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    Direction:
                    {DirectionIcon ? (
                        <DirectionIcon
                            fontSize="inherit"
                            sx={{ fontSize: "1.2em", transform: "translateY(1px)" }}
                        />
                    ) : (
                        "—"
                    )}
                    <Box component="span" sx={{ opacity: 0.8 }}>
                        ({directionConfidence})
                    </Box>
                </Typography>
            </Box>
        </Box>
    );
};
