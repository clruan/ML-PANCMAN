import { createContext, useContext } from 'react';

/**
 * Context object with default values
 * These defaults are used if no Provider is found (shouldn't happen)
 */
export const EmotionContext = createContext({
    emotion: null,              // {angry: 0.9, happy: 0.05, ...}
    angerScore: 0,              // 0 to 1
    speedMultiplier: 1.0,       // 1.0 to 3.0
    isModelLoaded: false,       // true/false
    isAngryDetected: false      // true/false
});

/**
 * Custom hook to consume emotion context
 * Use this in components instead of useContext(EmotionContext)
 * 
 * @returns {object} Emotion state from context
 */
export const useEmotionContext = () => {
    const context = useContext(EmotionContext);
    return context;
};