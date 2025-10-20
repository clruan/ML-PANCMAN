# Feature 2: Anger-Based Acceleration

## Note
Make sure to run this first
```Code
npm install @vladmandic/face-api
```

## Emotion State (Global)
Available in `App.js`:
```javascript
const emotionState = useEmotionDetection(webcamRef, true);
```

**Lifecycle**: Active from camera start → stops when camera closes \
**Debug**: Check browser console for real-time emotion detection output

## State Structure
```javascript
{
  emotion: { angry: 0.91, happy: 0.04, ... },  // All 7 emotions (0-1 range)
  angerScore: 0.91,                             // Anger value only
  speedMultiplier: 2.4,                         // Current game speed
  isModelLoaded: true,                          // Model ready status
  isAngryDetected: true                         // True if anger > 0.7
}
```

## Feature 2 Visualization Tip
**Location**: Can be done in `App.js` lines 73-81 \
Use `emotionState` to create some visual feedbacks
