import React from 'react';
import PropTypes from 'prop-types';
import { PLAYER_RADIUS } from '../constants';
import { cssPosition } from '../helpers';
import './style.scss';

// Map validation directions to SVG angles (in degrees)
// SVG angles: 0=East, 90=South, 180=West, 270=North
// We need: up=North(270/-90), right=East(0), down=South(90), left=West(180)
const HIGHLIGHT_ROTATIONS = {
  up: -90,    // Points up (North)
  right: 0,   // Points right (East)
  down: 90,   // Points down (South)
  left: 180,  // Points left (West)
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Calculate weighted direction angle from probabilities
// Probabilities order: [up, down, left, right]
const calculateWeightedDirection = (probabilities) => {
  if (!probabilities || probabilities.length !== 4) {
    return null;
  }
  
  // Direction vectors in SVG coordinate system (y increases downward)
  // up: (0, -1), down: (0, 1), left: (-1, 0), right: (1, 0)
  const directionVectors = [
    { x: 0, y: -1 },  // up
    { x: 0, y: 1 },   // down
    { x: -1, y: 0 },  // left
    { x: 1, y: 0 },   // right
  ];
  
  // Calculate weighted sum of direction vectors
  let weightedX = 0;
  let weightedY = 0;
  
  probabilities.forEach((prob, idx) => {
    weightedX += directionVectors[idx].x * prob;
    weightedY += directionVectors[idx].y * prob;
  });
  
  // Calculate magnitude (how "strong" the weighted direction is)
  const magnitude = Math.sqrt(weightedX * weightedX + weightedY * weightedY);
  
  if (magnitude < 0.01) {
    return null; // No clear direction
  }
  
  // Calculate angle in degrees (SVG: 0=East, 90=South)
  const angleRad = Math.atan2(weightedY, weightedX);
  const angleDeg = (angleRad * 180 / Math.PI);
  
  return { angle: angleDeg, magnitude };
};

export default function ValidationOverlay({
  gridSize,
  position,
  validationConfidence,
  validationDirection,
  validationThreshold,
  validationProbabilities,
}) {
  const normalizedConfidence = clamp(
    validationConfidence / Math.max(validationThreshold || 0.001, 0.001),
    0,
    1
  );

  const radius = gridSize * PLAYER_RADIUS * 1.6; // Slightly larger than player

  const style = {
    ...cssPosition(position, gridSize),
    width: radius * 2,
    height: radius * 2,
    marginLeft: -radius,
    marginTop: -radius,
  };

  // Use a single green color for both predicted and weighted; vary only opacity
  const green = { r: 76, g: 175, b: 80 };
  const strokeWidth = 2 + normalizedConfidence * 1;

  // Weighted direction band (dimmer green, wider)
  let weightedArcPath = null;
  let weightedArcProps = null;
  const weightedDir = calculateWeightedDirection(validationProbabilities);
  
  if (weightedDir) {
    const weightedRotation = weightedDir.angle;
    const weightedSpread = 50 + weightedDir.magnitude * 30; // Wider spread
    const weightedStartAngle = weightedRotation - weightedSpread / 2;
    const weightedEndAngle = weightedRotation + weightedSpread / 2;
    
    const weightedStartRad = (weightedStartAngle * Math.PI) / 180;
    const weightedEndRad = (weightedEndAngle * Math.PI) / 180;
    
    const weightedInnerRadius = radius - strokeWidth / 2 - 4;
    const weightedOuterRadius = radius - strokeWidth / 2 + 4;
    
    const wx1 = radius + weightedInnerRadius * Math.cos(weightedStartRad);
    const wy1 = radius + weightedInnerRadius * Math.sin(weightedStartRad);
    const wx2 = radius + weightedOuterRadius * Math.cos(weightedStartRad);
    const wy2 = radius + weightedOuterRadius * Math.sin(weightedStartRad);
    const wx3 = radius + weightedOuterRadius * Math.cos(weightedEndRad);
    const wy3 = radius + weightedOuterRadius * Math.sin(weightedEndRad);
    const wx4 = radius + weightedInnerRadius * Math.cos(weightedEndRad);
    const wy4 = radius + weightedInnerRadius * Math.sin(weightedEndRad);
    
    const weightedLargeArcFlag = weightedSpread > 180 ? 1 : 0;
    
    weightedArcPath = `
      M ${wx1} ${wy1}
      L ${wx2} ${wy2}
      A ${weightedOuterRadius} ${weightedOuterRadius} 0 ${weightedLargeArcFlag} 1 ${wx3} ${wy3}
      L ${wx4} ${wy4}
      A ${weightedInnerRadius} ${weightedInnerRadius} 0 ${weightedLargeArcFlag} 0 ${wx1} ${wy1}
      Z
    `;
    
    // Keep weighted band as-is
    const weightedAlpha = 0.35 + weightedDir.magnitude * 0.45;
    weightedArcProps = {
      d: weightedArcPath,
      fill: `rgba(${green.r}, ${green.g}, ${green.b}, ${weightedAlpha})`,
    };
  }

  // Directional indicator (small wedge/arc) - brighter for predicted direction
  let arcPath = null;
  let arcProps = null;
  if (validationDirection && HIGHLIGHT_ROTATIONS.hasOwnProperty(validationDirection)) {
    const rotation = HIGHLIGHT_ROTATIONS[validationDirection];
    // Narrower predicted band in-game
    const spread = 20 + normalizedConfidence * 8; // degrees
    const startAngle = rotation - spread / 2;
    const endAngle = rotation + spread / 2;
    
    // Convert degrees to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    // Calculate arc endpoints
    const innerRadius = radius - strokeWidth / 2 - 3;
    const outerRadius = radius - strokeWidth / 2 + 3;
    
    const x1 = radius + innerRadius * Math.cos(startRad);
    const y1 = radius + innerRadius * Math.sin(startRad);
    const x2 = radius + outerRadius * Math.cos(startRad);
    const y2 = radius + outerRadius * Math.sin(startRad);
    const x3 = radius + outerRadius * Math.cos(endRad);
    const y3 = radius + outerRadius * Math.sin(endRad);
    const x4 = radius + innerRadius * Math.cos(endRad);
    const y4 = radius + innerRadius * Math.sin(endRad);
    
    const largeArcFlag = spread > 180 ? 1 : 0;
    
    arcPath = `
      M ${x1} ${y1}
      L ${x2} ${y2}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3}
      L ${x4} ${y4}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}
      Z
    `;
    
    // More solid predicted band
    const arcAlpha = Math.min(1, 0.7 + normalizedConfidence * 0.25);
    arcProps = {
      d: arcPath,
      fill: `rgba(${green.r}, ${green.g}, ${green.b}, ${arcAlpha})`,
    };
  }

  return (
    <svg className="validation-overlay" style={style}>
      {/* Weighted direction band - dimmer, rendered first (behind) */}
      {weightedArcPath && <path {...weightedArcProps} />}
      {/* Predicted direction - brighter, rendered on top */}
      {arcPath && <path {...arcProps} />}
    </svg>
  );
}

ValidationOverlay.propTypes = {
  gridSize: PropTypes.number.isRequired,
  position: PropTypes.array.isRequired,
  validationConfidence: PropTypes.number.isRequired,
  validationDirection: PropTypes.string,
  validationThreshold: PropTypes.number.isRequired,
  validationProbabilities: PropTypes.array,
};

