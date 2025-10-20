import { Button } from "@mui/material";
import { useEmotionContext } from "../model/EmotionContext"; // Feature 2
import "../lib/PacmanCovid/styles/index.scss";
import PacmanCovid from "../lib/PacmanCovid";
import {
    gameRunningAtom,
    predictionAtom,
} from "../GlobalState";
import { useAtom } from "jotai";
export default function PacMan() {
    const [isRunning, setIsRuning] = useAtom(gameRunningAtom);
    const [predictionDirection] = useAtom(predictionAtom);
    const { speedMultiplier } = useEmotionContext(); // Feature 2

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
