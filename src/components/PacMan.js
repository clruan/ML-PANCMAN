import { Button } from "@mui/material";
import { useEmotionContext } from "../model/EmotionContext"; // Feature 2
import "../lib/PacmanCovid/styles/index.scss";
import PacmanCovid from "../lib/PacmanCovid";
import {
    gameRunningAtom,
    predictionAtom,
    validationActiveAtom,
    validationConfidenceAtom,
    validationDirectionAtom,
    validationThresholdAtom,
    validationProbabilitiesAtom,
} from "../GlobalState";
import { useAtom } from "jotai";
export default function PacMan() {
    const [isRunning, setIsRuning] = useAtom(gameRunningAtom);
    const [predictionDirection] = useAtom(predictionAtom);
    const [validationActive] = useAtom(validationActiveAtom);
    const [validationConfidence] = useAtom(validationConfidenceAtom);
    const [validationDirection] = useAtom(validationDirectionAtom);
    const [validationThreshold] = useAtom(validationThresholdAtom);
    const [validationProbabilities] = useAtom(validationProbabilitiesAtom);
    const { speedMultiplier, isBoostActive } = useEmotionContext(); // Feature 2

    const pacManProps = {
        gridSize: 17,
        animate: process.env.NODE_ENV !== "development",
        locale: "pt",
        onEnd: () => {
            console.log("onEnd");
        },
    };

    return (
        <>
            <PacmanCovid
                {...pacManProps}
                isRunning={isRunning}
                setIsRuning={setIsRuning}
                predictions={predictionDirection}
                speedMultiplier={speedMultiplier} // Feature 2
                isAngryDetected={isBoostActive}
                validationActive={validationActive}
                validationConfidence={validationConfidence}
                validationDirection={validationDirection}
                validationThreshold={validationThreshold}
                validationProbabilities={validationProbabilities}
            />
            {!isRunning && (
                <Button
                    variant="contained"
                    onClick={() => setIsRuning(!isRunning)}
                    sx={{ mt: 2 }}
                >
                    Start
                </Button>
            )}
        </>
    );
}
