import { useState, useEffect, useRef } from 'react';
import * as faceapi from '@vladmandic/face-api';
// ============================================
// MODULE STATE
// ============================================

let modelsLoaded = false;
let modelLoadingPromise = null;

// ============================================
// MODEL LOADING
// ============================================

/**
 * Loads face-api.js models for face detection and emotion recognition
 * Models are loaded from CDN on first call
 * 
 * @returns {Promise<boolean>} True when models are loaded
 */
async function loadEmotionModel() {
    // If already loaded, return immediately
    if (modelsLoaded) {
        return true;
    }

    // If currently loading, return the existing promise
    if (!modelLoadingPromise) {
        console.log('Loading face-api.js models...');

        modelLoadingPromise = Promise.all([
            // Load face detection model (TinyFaceDetector - lightweight & fast)

            faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'),

            // Load face expression recognition model

            faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model')
        ]).then(() => {
            modelsLoaded = true;
            console.log('face-api.js models loaded successfully!');
            return true;
        }).catch(error => {
            console.error('Failed to load face-api.js models:', error);
            modelLoadingPromise = null;
            throw error;
        });
    }

    return modelLoadingPromise;
}

// ============================================
// EMOTION DETECTION
// ============================================

/**
 * Detects emotions from a webcam image using face-api.js
 * 
 * @param {string} imageBase64 - Base64 encoded image from webcam.getScreenshot()
 * @returns {Promise<object|null>} Object with emotion scores, e.g., {angry: 0.9, happy: 0.05, ...}
 */
async function detectEmotion(imageBase64) {
    try {
        // Ensure models are loaded
        await loadEmotionModel();

        // Convert base64 to Image element (face-api.js needs an HTMLImageElement)
        const img = await loadImage(imageBase64);

        // Detect face and expressions
        // tinyFaceDetector options: inputSize and scoreThreshold
        const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

        // If no face detected, return null
        if (!detection) {
            console.log('No face detected');
            return null;
        }

        // Extract emotion scores
        const expressions = detection.expressions;

        // Convert to our format: {angry: 0.9, happy: 0.05, ...}
        const emotions = {
            angry: expressions.angry,
            disgusted: expressions.disgusted,
            fearful: expressions.fearful,
            happy: expressions.happy,
            neutral: expressions.neutral,
            sad: expressions.sad,
            surprised: expressions.surprised
        };

        console.log('Face detected with expressions:', emotions);

        return emotions;

    } catch (error) {
        console.error('Emotion detection error:', error);
        return null;
    }
}
/**
 * Converts base64 string to HTMLImageElement
 * face-api.js requires an actual Image element, not base64 string
 * 
 * @param {string} base64 - Base64 encoded image
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(base64) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = base64;
    });
}

// ============================================
// SPEED CALCULATION
// ============================================

/**
 * Calculates speed multiplier based on anger intensity
 * 
 * @param {number} angerScore - Anger confidence score (0 to 1)
 * @param {number} threshold - Minimum anger score to trigger boost (default: 0.7)
 * @returns {number} Speed multiplier (1.0 to 3.0)
 */

function calculateSpeedMultiplier(angerScore, threshold = 0.7) {
    // If no anger detected or below threshold, normal speed
    if (!angerScore || angerScore < threshold) {
        return 1.0;
    }

    // Linear scaling: 
    // - At threshold (0.7) → 1.0x speed (no boost)
    // - At maximum (1.0) → 3.0x speed (max boost)
    const normalized = (angerScore - threshold) / (1.0 - threshold);
    const multiplier = 1.0 + (normalized * 2.0);

    return multiplier;
}

// ============================================
// CUSTOMIZED HOOK (Main Export)
// ============================================

/**
 * Custom React hook for real-time emotion detection
 * 
 * @param {React.RefObject} webcamRef - Reference to react-webcam component
 * @param {boolean} isRunning - Whether detection should be active
 * @param {number} interval - Detection interval in milliseconds (default: 250ms)
 * @returns {object} Emotion state: { emotion, angerScore, speedMultiplier, 
isModelLoaded, isAngryDetected }
 */
export function useEmotionDetection(webcamRef, isRunning, interval = 250) {
    // State for emotion data
    const [emotion, setEmotion] = useState(null);
    const [angerScore, setAngerScore] = useState(0);
    const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    // Ref to track running state without causing re-renders
    const isRunningRef = useRef(false);

    // Preload model on component mount
    useEffect(() => {
        loadEmotionModel()
            .then(() => {
                setIsModelLoaded(true);
            })
            .catch(error => {
                console.error('Failed to preload emotion model:', error);
            });
    }, []); // Empty dependency array = run once on mount

    // Run emotion detection loop
    useEffect(() => {
        // Update ref (doesn't trigger re-render)
        isRunningRef.current = isRunning;

        // Don't run if not active or model not loaded
        if (!isRunning || !isModelLoaded) {
            return;
        }

        // Flag to cancel async operations if component unmounts
        let isCancelled = false;

        // Async detection loop
        async function detectLoop() {
            while (isRunningRef.current && !isCancelled) {
                // Check if webcam ref is available
                if (webcamRef.current) {
                    // Capture screenshot from webcam
                    const imageBase64 = webcamRef.current.getScreenshot();
                    if (imageBase64) {
                        // Run emotion detection
                        const emotions = await detectEmotion(imageBase64);

                        // Update state if detection succeeded and not cancelled
                        if (emotions && !isCancelled) {
                            setEmotion(emotions);

                            // Extract anger score
                            const currentAngerScore = emotions.angry || 0;
                            setAngerScore(currentAngerScore);

                            // Calculate speed multiplier
                            const multiplier =
                                calculateSpeedMultiplier(currentAngerScore);
                            setSpeedMultiplier(multiplier);

                            console.log('Emotions:', emotions);
                            console.log('Anger Score:', (currentAngerScore * 100).toFixed(0) + '%');

                            if (currentAngerScore >= 0.7) {
                                console.log('ANGRY DETECTED! Speed:', multiplier.toFixed(1) + 'x');
                            }
                        }
                    }
                }

                // Wait before next detection
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }

        // Start the loop
        detectLoop();

        // Cleanup function: runs when component unmounts or dependencies change
        return () => {
            isCancelled = true;
            isRunningRef.current = false;
        };
    }, [isRunning, isModelLoaded, webcamRef, interval]);

    // Return emotion state for consumers
    return {
        emotion,              // All emotion scores: {angry: 0.9, happy: 0.05, ...}
        angerScore,           // Just the anger score: 0.9
        speedMultiplier,      // Calculated multiplier: 2.5
        isModelLoaded,        // Model ready: true/false
        isAngryDetected: angerScore >= 0.7  // Boolean helper
    };
}