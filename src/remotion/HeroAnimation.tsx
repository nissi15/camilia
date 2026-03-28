import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// Light mode palette
const GREEN = "#16A34A";
const GREEN_LIGHT = "#22C55E";
const INDIGO = "#6366F1";
const BG_LIGHT = "#F8FAFC";
const BG_WHITE = "#FFFFFF";

// Soft ambient glow orb
function AmbientOrb({
  x,
  y,
  size,
  color,
  delay,
  speed,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  speed: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: frame - delay, fps, config: { damping: 100 } });
  const floatX = Math.sin((frame - delay) * speed * 0.01) * 25;
  const floatY = Math.cos((frame - delay) * speed * 0.008) * 18;
  const breathe = Math.sin((frame - delay) * 0.015) * 0.12 + 0.88;

  return (
    <div
      style={{
        position: "absolute",
        left: x + floatX,
        top: y + floatY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, ${color}08 40%, transparent 70%)`,
        opacity: interpolate(s, [0, 1], [0, 0.5]) * breathe,
        filter: `blur(${size * 0.35}px)`,
        transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})`,
      }}
    />
  );
}

// Tracking node
function TrackingNode({
  cx,
  cy,
  label,
  color,
  activateAt,
}: {
  cx: number;
  cy: number;
  label: string;
  color: string;
  activateAt: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({
    frame: frame - activateAt,
    fps,
    config: { damping: 14, stiffness: 70 },
  });
  const scale = interpolate(s, [0, 1], [0.5, 1]);
  const glowOpacity = interpolate(s, [0, 1], [0, 0.35]);
  const pulse = Math.sin((frame - activateAt) * 0.05) * 0.1 + 1;

  return (
    <g>
      {/* Soft glow */}
      <circle cx={cx} cy={cy} r={50} fill={color} opacity={glowOpacity * 0.06 * pulse} />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={32} fill="none" stroke={color} strokeWidth={0.8} opacity={glowOpacity * 0.2 * pulse} />
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={24} fill="none" stroke={color} strokeWidth={1.2} opacity={glowOpacity * 0.5 * pulse} />
      {/* Main node */}
      <circle
        cx={cx}
        cy={cy}
        r={15}
        fill={color}
        opacity={interpolate(s, [0, 1], [0.15, 0.75])}
        transform={`translate(${cx * (1 - scale)}, ${cy * (1 - scale)}) scale(${scale})`}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* White core */}
      <circle cx={cx} cy={cy} r={5.5} fill="white" opacity={s * 0.9} />
      {/* Label */}
      <text
        x={cx}
        y={cy + 46}
        textAnchor="middle"
        fill="#1E293B"
        fontSize={13}
        fontFamily="'DM Sans', system-ui, sans-serif"
        fontWeight={500}
        opacity={interpolate(s, [0, 1], [0, 0.5])}
        letterSpacing={0.8}
      >
        {label}
      </text>
    </g>
  );
}

export const HeroAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const gradAngle = interpolate(frame, [0, durationInFrames], [145, 158]);

  const pathProgress = interpolate(frame, [30, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nodeY = height * 0.42;
  const nodes = [
    { cx: width * 0.18, cy: nodeY, label: "Warehouse", color: GREEN, activateAt: 40 },
    { cx: width * 0.5, cy: nodeY - 20, label: "Processing", color: INDIGO, activateAt: 100 },
    { cx: width * 0.82, cy: nodeY, label: "Restaurant", color: GREEN_LIGHT, activateAt: 160 },
  ];

  const pathD = `M ${nodes[0].cx} ${nodes[0].cy} Q ${width * 0.34} ${nodeY - 60} ${nodes[1].cx} ${nodes[1].cy} Q ${width * 0.66} ${nodeY + 40} ${nodes[2].cx} ${nodes[2].cy}`;
  const totalLength = 900;

  const dotProgress = interpolate(frame, [40, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dotVisible = dotProgress > 0.01 && dotProgress < 0.99;

  const orbs = [
    { x: width * 0.08, y: height * 0.15, size: 220, color: GREEN_LIGHT, delay: 0, speed: 1.2 },
    { x: width * 0.65, y: height * 0.1, size: 180, color: INDIGO, delay: 20, speed: 0.9 },
    { x: width * 0.35, y: height * 0.6, size: 260, color: GREEN, delay: 10, speed: 1.0 },
    { x: width * 0.8, y: height * 0.5, size: 200, color: INDIGO, delay: 30, speed: 0.8 },
    { x: width * 0.2, y: height * 0.75, size: 160, color: GREEN_LIGHT, delay: 15, speed: 1.1 },
  ];

  return (
    <AbsoluteFill>
      {/* Light gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${gradAngle}deg, ${BG_WHITE} 0%, ${BG_LIGHT} 40%, #EFF6FF 70%, ${BG_LIGHT} 100%)`,
        }}
      />

      {/* Ambient orbs */}
      {orbs.map((orb, i) => (
        <AmbientOrb key={i} {...orb} />
      ))}

      {/* Tracking path */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <path d={pathD} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={1} strokeDasharray="4 12" />
        <path
          d={pathD}
          fill="none"
          stroke="url(#pathGradLight)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength * (1 - pathProgress)}
        />

        {/* Glowing travel dot */}
        <circle r={12} fill={GREEN_LIGHT} opacity={dotVisible ? 0.12 : 0}>
          <animateMotion dur="6s" repeatCount="indefinite" path={pathD} keyPoints={`${dotProgress};${dotProgress}`} keyTimes="0;1" />
        </circle>
        <circle r={4} fill={GREEN} opacity={dotVisible ? 0.8 : 0}>
          <animateMotion dur="6s" repeatCount="indefinite" path={pathD} keyPoints={`${dotProgress};${dotProgress}`} keyTimes="0;1" />
        </circle>

        <defs>
          <linearGradient id="pathGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.1} />
            <stop offset="25%" stopColor={GREEN_LIGHT} stopOpacity={0.4} />
            <stop offset="50%" stopColor={INDIGO} stopOpacity={0.45} />
            <stop offset="75%" stopColor={GREEN_LIGHT} stopOpacity={0.4} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <Sequence from={0}>
          {nodes.map((node, i) => (
            <TrackingNode key={i} {...node} />
          ))}
        </Sequence>
      </svg>

      {/* Bottom fade to white */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "35%",
          background: `linear-gradient(to bottom, transparent, ${BG_LIGHT}cc, ${BG_LIGHT})`,
        }}
      />
    </AbsoluteFill>
  );
};
