import { useCallback, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import {
    modelAtom,
    truncatedMobileNetAtom,
    validationActiveAtom,
    validationConfidenceAtom,
    validationDirectionAtom,
    validationThresholdAtom,
    isCameraOnAtom,
} from "../GlobalState";
import { predictDirectionWithConfidence } from "../model";
import { Box, Button, Slider, Stack, Typography, Tooltip } from "@mui/material";
import { DIRECTION_ICON_COMPONENTS } from "../constants/directions";

export default function InteractiveValidation({ webcamRef }) {
    const [model] = useAtom(modelAtom);
    const [truncatedMobileNet] = useAtom(truncatedMobileNetAtom);
    const [validationActive, setValidationActive] = useAtom(validationActiveAtom);
    const [validationDirection, setValidationDirection] = useAtom(
        validationDirectionAtom
    );
    const [validationConfidence, setValidationConfidence] = useAtom(
        validationConfidenceAtom
    );
    const [validationThreshold, setValidationThreshold] = useAtom(
        validationThresholdAtom
    );
    const [isCameraOn] = useAtom(isCameraOnAtom);

    const loopRef = useRef(null);
    const DirectionIcon =
        validationDirection && DIRECTION_ICON_COMPONENTS[validationDirection]
            ? DIRECTION_ICON_COMPONENTS[validationDirection]
            : null;

    const runValidation = useCallback(async () => {
        if (
            !validationActive ||
            !model ||
            !truncatedMobileNet ||
            !webcamRef?.current ||
            !isCameraOn
        ) {
            return;
        }

        const result = await predictDirectionWithConfidence(
            webcamRef,
            truncatedMobileNet,
            model
        );

        if (!result) {
            setValidationDirection(null);
            setValidationConfidence(0);
            return;
        }

        setValidationDirection(result.directionLabel);
        setValidationConfidence(result.confidence);
    }, [
        validationActive,
        model,
        truncatedMobileNet,
        webcamRef,
        isCameraOn,
        setValidationDirection,
        setValidationConfidence,
    ]);

    useEffect(() => {
        if (!validationActive) {
            if (loopRef.current) {
                clearInterval(loopRef.current);
                loopRef.current = null;
            }
            return;
        }

        runValidation();
        loopRef.current = setInterval(runValidation, 250);

        return () => {
            if (loopRef.current) {
                clearInterval(loopRef.current);
                loopRef.current = null;
            }
        };
    }, [validationActive, runValidation]);

    const toggleValidation = () => {
        if (!validationActive && !model) {
            return;
        }
        setValidationActive(!validationActive);
        if (validationActive) {
            setValidationDirection(null);
            setValidationConfidence(0);
        }
    };

    const confidencePercent = `${(validationConfidence * 100).toFixed(1)}%`;
    const isConfident = validationConfidence >= validationThreshold;

    return (
        <Stack spacing={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Interactive Validation</Typography>
                <Tooltip
                    title={
                        !model
                            ? "Train a model before starting validation."
                            : !isCameraOn
                            ? "Turn on the camera in the data collection panel."
                            : ""
                    }
                >
                    <span>
                        <Button
                            variant={validationActive ? "outlined" : "contained"}
                            onClick={toggleValidation}
                            disabled={!model || !isCameraOn}
                        >
                            {validationActive ? "Stop" : "Start"} Validation
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            <Box>
                <Typography variant="body2" gutterBottom>
                    Confidence Threshold: {(validationThreshold * 100).toFixed(0)}%
                </Typography>
                <Slider
                    min={0.5}
                    max={0.95}
                    step={0.01}
                    value={validationThreshold}
                    onChange={(_, value) => {
                        if (typeof value === "number") {
                            setValidationThreshold(value);
                        }
                    }}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                    disabled={!model}
                />
            </Box>

            <Typography variant="body2" color="textSecondary">
                Watch the main camera panel: it now renders a Face ID-style ring, reusing the live stream to
                avoid extra captures. A green ring and arrow mean the model is confident about the predicted
                direction; a grey ring indicates the system is still searching.
            </Typography>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                justifyContent="space-between"
            >
                <Box>
                    <Typography variant="subtitle2">Predicted Direction</Typography>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            minHeight: "2.5rem",
                        }}
                    >
                        {DirectionIcon ? (
                            <DirectionIcon sx={{ fontSize: "2rem" }} />
                        ) : (
                            "—"
                        )}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Confidence</Typography>
                    <Typography variant="h6">{confidencePercent}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2">Status</Typography>
                    <Typography variant="h6">
                        {validationActive ? (isConfident ? "Tracking" : "Scanning") : "Idle"}
                    </Typography>
                </Box>
            </Stack>
        </Stack>
    );
}
