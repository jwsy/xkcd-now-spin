import { useState, useEffect, useRef, useCallback } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SEASONS = [
  { name: "Winter", start: 355, end: 80, color: "#b8d4e8" },
  { name: "Spring", start: 80, end: 172, color: "#b8e8b8" },
  { name: "Summer", start: 172, end: 264, color: "#f0e0a0" },
  { name: "Fall", start: 264, end: 355, color: "#e8c080" },
];

const TIMES_OF_DAY = [
  { name: "Deep Night", start: 0, end: 4, color: "#1a1a3e" },
  { name: "Early Morning", start: 4, end: 7, color: "#3a2a5e" },
  { name: "Morning", start: 7, end: 12, color: "#f0c060" },
  { name: "Afternoon", start: 12, end: 17, color: "#e8a030" },
  { name: "Evening", start: 17, end: 20, color: "#c06020" },
  { name: "Night", start: 20, end: 24, color: "#2a1a4e" },
];

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getDaysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function drawHandSketch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  length: number,
  width: number,
  color: string,
  wobble: number = 2
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();

  const endX = cx + Math.cos(angle - Math.PI / 2) * length;
  const endY = cy + Math.sin(angle - Math.PI / 2) * length;

  const cp1x = cx + Math.cos(angle - Math.PI / 2) * length * 0.4 + (Math.random() - 0.5) * wobble;
  const cp1y = cy + Math.sin(angle - Math.PI / 2) * length * 0.4 + (Math.random() - 0.5) * wobble;
  const cp2x = cx + Math.cos(angle - Math.PI / 2) * length * 0.7 + (Math.random() - 0.5) * wobble;
  const cp2y = cy + Math.sin(angle - Math.PI / 2) * length * 0.7 + (Math.random() - 0.5) * wobble;

  ctx.moveTo(cx, cy);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.stroke();
  ctx.restore();
}

function sketchArc(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
  color: string, lineWidth: number,
  fill?: string
) {
  ctx.save();
  ctx.beginPath();

  if (fill) {
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r + (Math.random() - 0.5) * 0.5, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function sketchText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  align: CanvasTextAlign = "center",
  angle: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `${fontSize}px "xkcd Script", "Comic Sans MS", cursive`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

interface ClockState {
  rotationOffset: number;
  isDragging: boolean;
  lastAngle: number;
  now: Date;
}

export default function XkcdNow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ClockState>({
    rotationOffset: 0,
    isDragging: false,
    lastAngle: 0,
    now: new Date(),
  });
  const animFrameRef = useRef<number>(0);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [now, setNow] = useState(new Date());
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNow = new Date();
      stateRef.current.now = newNow;
      setNow(newNow);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getAngleFromEvent = useCallback((e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return Math.atan2(clientY - cy, clientX - cx);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    stateRef.current.isDragging = true;
    stateRef.current.lastAngle = getAngleFromEvent(e, canvas);
  }, [getAngleFromEvent]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.isDragging) return;
    const currentAngle = getAngleFromEvent(e, canvas);
    const delta = currentAngle - stateRef.current.lastAngle;
    stateRef.current.lastAngle = currentAngle;
    stateRef.current.rotationOffset += delta;
    setRotationOffset(stateRef.current.rotationOffset);
  }, [getAngleFromEvent]);

  const handleMouseUp = useCallback(() => {
    stateRef.current.isDragging = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("touchstart", handleMouseDown, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleMouseMove, { passive: true });
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("touchstart", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { rotationOffset: rot, now: date } = stateRef.current;

    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.parentElement?.clientWidth || 600, canvas.parentElement?.clientHeight || 600, 600);
    if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);
    }

    const w = size;
    const h = size;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const dayOfYear = getDayOfYear(date);
    const daysInYear = getDaysInYear(date.getFullYear());
    const yearFraction = (dayOfYear - 1) / daysInYear;
    const yearAngle = yearFraction * Math.PI * 2 + rot;

    const hourFraction = (date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600) / 24;
    const dayAngle = hourFraction * Math.PI * 2 + rot;

    const outerR = w * 0.46;
    const monthRingW = w * 0.07;
    const innerR = outerR - monthRingW;
    const seasonR = innerR - w * 0.01;
    const hourOuterR = w * 0.25;
    const hourInnerR = w * 0.18;

    ctx.fillStyle = "#faf8f0";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    const numSeasons = 4;
    const seasonColors = ["#b8d4e8", "#b8e8b8", "#f0e0a0", "#e8c080"];
    const seasonNames = ["Winter", "Spring", "Summer", "Fall"];
    const seasonDays = [80, 172, 264, 355];
    const totalDays = daysInYear;

    for (let i = 0; i < numSeasons; i++) {
      const startDay = i === 0 ? 355 - 365 : seasonDays[i - 1];
      const endDay = seasonDays[i];
      const startAngle = (startDay / totalDays) * Math.PI * 2 - Math.PI / 2 + rot;
      const endAngle = (endDay / totalDays) * Math.PI * 2 - Math.PI / 2 + rot;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, seasonR, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seasonColors[i] + "99";
      ctx.fill();
      ctx.restore();

      const midAngle = (startAngle + endAngle) / 2;
      const labelR = seasonR * 0.65;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      sketchText(ctx, seasonNames[i], lx, ly, w * 0.022, "#555", "center", midAngle + Math.PI / 2);
    }

    for (let m = 0; m < 12; m++) {
      const startFrac = m / 12;
      const endFrac = (m + 1) / 12;
      const startAngle = startFrac * Math.PI * 2 - Math.PI / 2 + rot;
      const endAngle = endFrac * Math.PI * 2 - Math.PI / 2 + rot;
      const midAngle = (startAngle + endAngle) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(startAngle) * innerR, cy + Math.sin(startAngle) * innerR);
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = m % 2 === 0 ? "#e8e0c8" : "#d8d0b8";
      ctx.fill();
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();

      const labelR = (innerR + outerR) / 2;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      const monthAbbr = MONTHS[m].slice(0, 3);
      sketchText(ctx, monthAbbr, lx, ly, w * 0.028, "#444", "center", midAngle + Math.PI / 2);

      const tickAngle = startAngle;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(tickAngle) * innerR, cy + Math.sin(tickAngle) * innerR);
      ctx.lineTo(cx + Math.cos(tickAngle) * outerR, cy + Math.sin(tickAngle) * outerR);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    const timeColors = ["#1a1a3e", "#3a2a5e", "#f0c060", "#e8a030", "#c06020", "#2a1a4e"];
    const timeNames = ["Deep Night", "Early Morning", "Morning", "Afternoon", "Evening", "Night"];
    const timeHours = [0, 4, 7, 12, 17, 20];

    for (let t = 0; t < 6; t++) {
      const startH = timeHours[t];
      const endH = t < 5 ? timeHours[t + 1] : 24;
      const startAngle = (startH / 24) * Math.PI * 2 - Math.PI / 2 + rot;
      const endAngle = (endH / 24) * Math.PI * 2 - Math.PI / 2 + rot;
      const midAngle = (startAngle + endAngle) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, hourOuterR, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = timeColors[t] + "cc";
      ctx.fill();
      ctx.restore();

      const labelR = hourOuterR * 0.7;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      sketchText(ctx, timeNames[t], lx, ly, w * 0.018, t < 2 || t === 5 ? "#ccc" : "#444", "center", midAngle + Math.PI / 2);
    }

    for (let h = 0; h < 24; h++) {
      const tickAngle = (h / 24) * Math.PI * 2 - Math.PI / 2 + rot;
      const isMajor = h % 6 === 0;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(tickAngle) * hourInnerR, cy + Math.sin(tickAngle) * hourInnerR);
      ctx.lineTo(cx + Math.cos(tickAngle) * (isMajor ? hourOuterR + 4 : hourOuterR), cy + Math.sin(tickAngle) * (isMajor ? hourOuterR + 4 : hourOuterR));
      ctx.strokeStyle = "#666";
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      if (h % 6 === 0) {
        const hrs = h === 0 ? "midnight" : h === 12 ? "noon" : `${h}:00`;
        const labelR2 = hourOuterR + 14;
        const lx2 = cx + Math.cos(tickAngle) * labelR2;
        const ly2 = cy + Math.sin(tickAngle) * labelR2;
        sketchText(ctx, hrs, lx2, ly2, w * 0.020, "#555", "center");
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hourInnerR, 0, Math.PI * 2);
    ctx.fillStyle = "#faf8f0";
    ctx.fill();
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    sketchText(ctx, "NOW", cx, cy - 10, w * 0.028, "#333", "center");
    sketchText(ctx, date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), cx, cy + 12, w * 0.022, "#555", "center");

    const yearHandLen = seasonR * 0.88;
    drawHandSketch(ctx, cx, cy, yearAngle, yearHandLen, 4, "#cc3333", 1.5);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + Math.cos(yearAngle - Math.PI / 2) * yearHandLen, cy + Math.sin(yearAngle - Math.PI / 2) * yearHandLen, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#cc3333";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const dayHandLen = hourOuterR * 0.85;
    drawHandSketch(ctx, cx, cy, dayAngle, dayHandLen, 3, "#3355cc", 1.5);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + Math.cos(dayAngle - Math.PI / 2) * dayHandLen, cy + Math.sin(dayAngle - Math.PI / 2) * dayHandLen, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#3355cc";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#333";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = `${w * 0.022}px "xkcd Script", "Comic Sans MS", cursive`;
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.fillText(`xkcd now — ${date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, cx, h - 16);
    ctx.restore();

    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleReset = () => {
    stateRef.current.rotationOffset = 0;
    setRotationOffset(0);
  };

  const date = now;
  const dayOfYear = getDayOfYear(date);
  const daysInYear = getDaysInYear(date.getFullYear());
  const yearPct = ((dayOfYear / daysInYear) * 100).toFixed(1);
  const hour = date.getHours();
  const timeOfDay = TIMES_OF_DAY.find(t => hour >= t.start && hour < t.end) || TIMES_OF_DAY[0];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#faf8f0", fontFamily: '"xkcd Script", "Comic Sans MS", cursive' }}
      data-testid="xkcd-now-page"
    >
      <div className="w-full max-w-2xl px-4 flex flex-col items-center gap-4">
        <h1
          style={{ fontFamily: '"xkcd Script", "Comic Sans MS", cursive', fontSize: "1.7rem", color: "#333", letterSpacing: "0.02em" }}
          data-testid="title"
        >
          xkcd now — rotatable
        </h1>

        <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "-8px" }} data-testid="subtitle">
          Drag to rotate the clock face
        </p>

        <div
          className="relative"
          style={{ width: "100%", maxWidth: 560, aspectRatio: "1/1", cursor: "grab" }}
          data-testid="clock-container"
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "100%", touchAction: "none" }}
            data-testid="clock-canvas"
          />
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={handleReset}
            style={{
              fontFamily: '"xkcd Script", "Comic Sans MS", cursive',
              border: "2px solid #333",
              borderRadius: "4px",
              padding: "6px 18px",
              background: "#fff",
              cursor: "pointer",
              color: "#333",
              fontSize: "0.9rem",
            }}
            data-testid="button-reset"
          >
            Reset rotation
          </button>
          <button
            onClick={() => setShowInfo(v => !v)}
            style={{
              fontFamily: '"xkcd Script", "Comic Sans MS", cursive',
              border: "2px solid #555",
              borderRadius: "4px",
              padding: "6px 18px",
              background: "#fff",
              cursor: "pointer",
              color: "#555",
              fontSize: "0.9rem",
            }}
            data-testid="button-info"
          >
            {showInfo ? "Hide info" : "Show info"}
          </button>
        </div>

        {showInfo && (
          <div
            style={{
              border: "2px solid #aaa",
              borderRadius: "6px",
              padding: "16px 24px",
              background: "#fffef5",
              maxWidth: 480,
              width: "100%",
              color: "#444",
              lineHeight: 1.7,
              fontSize: "0.92rem",
            }}
            data-testid="info-panel"
          >
            <div style={{ marginBottom: 10, fontWeight: "bold", fontSize: "1rem", color: "#333" }}>Right now:</div>
            <div data-testid="info-date"><span style={{ color: "#cc3333" }}>&#9679;</span> <b>Date:</b> {date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            <div data-testid="info-time"><span style={{ color: "#3355cc" }}>&#9679;</span> <b>Time:</b> {date.toLocaleTimeString()}</div>
            <div data-testid="info-yearday"><b>Day</b> {dayOfYear} of {daysInYear} ({yearPct}% through the year)</div>
            <div data-testid="info-timeofday"><b>Time of day:</b> {timeOfDay.name}</div>
            <div style={{ marginTop: 12, color: "#888", fontSize: "0.82rem" }}>
              The <span style={{ color: "#cc3333" }}>red hand</span> shows where we are in the year.<br />
              The <span style={{ color: "#3355cc" }}>blue hand</span> shows the time of day.<br />
              Drag the clock to rotate it to any orientation.
            </div>
          </div>
        )}

        <div style={{ color: "#bbb", fontSize: "0.75rem", marginTop: 4, textAlign: "center" }}>
          Inspired by <a href="https://xkcd.com/now/" target="_blank" rel="noopener noreferrer" style={{ color: "#aaa" }}>xkcd #1017</a>
        </div>
      </div>
    </div>
  );
}
