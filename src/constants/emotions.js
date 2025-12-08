// Simple mapping from emotion label to a highlight color.
// Colors are chosen to be distinct but not too bright.
const EMOTION_COLORS = {
  // high‑brightness, high‑contrast colors for clear visibility
  angry: "#ed7474",      // vivid red
  happy: "#ffeb3b",      // bright yellow
  sad: "#42a5f5",        // bright blue
  fearful: "#e040fb",    // vivid purple
  disgusted: "#65e569ff",  // bright green
  surprised: "#f4c175ff",  // vivid orange
  neutral: "#b1b8bbff",    // very light gray-blue
};

export function getEmotionColor(name) {
  if (!name) return "#ed7474";
  const key = String(name).toLowerCase();
  return EMOTION_COLORS[key] || "#ed7474";
}

export function withAlpha(hex, alpha) {
  const safe = hex || "#ed7474";
  const h = safe.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
