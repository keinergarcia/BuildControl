import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Link } from "react-router-dom";
import { BC, FONT } from "./theme";

// Fondo con rejilla sutil estilo "plano de construcción".
function GridBackground() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 20% 15%, rgba(59,130,246,0.12), transparent 45%), radial-gradient(circle at 85% 85%, rgba(139,92,246,0.10), transparent 45%), ${BC.bgPrimary}`,
      }}
    />
  );
}

function buildGridPattern() {
  const cells: string[] = [];
  for (let r = 0; r < 18; r++) {
    for (let c = 0; c < 30; c++) {
      cells.push(
        `<rect x="${c * 40 + 4}" y="${r * 40 + 4}" width="32" height="32" rx="4" fill="none" stroke="${BC.border}" stroke-opacity="0.55" />`
      );
    }
  }
  return cells.join("");
}

function GridOverlay() {
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.35,
        maskImage: "radial-gradient(circle at 50% 40%, black, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(circle at 50% 40%, black, transparent 75%)",
      }}
      dangerouslySetInnerHTML={{ __html: buildGridPattern() }}
    />
  );
}

// Pequeña tarjeta animada que representa una métrica del panel.
function StatCard({
  icon,
  value,
  label,
  color,
  delay,
  x,
  y,
  rotate = 0,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
  delay: number;
  x: number;
  y: number;
  rotate?: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 30, mass: 1, stiffness: 100 } });
  const float = Math.sin((frame + delay) / 26) * 6;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translateY(${float}px) rotate(${rotate}deg) scale(${enter})`,
        opacity: enter,
        background: `linear-gradient(145deg, ${BC.bgCard}, ${BC.bgTertiary})`,
        border: `1px solid ${BC.border}`,
        borderRadius: 14,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          boxShadow: `0 0 18px ${color}55`,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 18,
            fontWeight: 700,
            color: BC.textPrimary,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 11,
            color: BC.textMuted,
            marginTop: 2,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export const HeroDuration = 210;

export function Hero() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame: frame - 8, fps, config: { damping: 30, mass: 1, stiffness: 110 } });
  const subtitleIn = spring({ frame: frame - 30, fps, config: { damping: 32, mass: 1, stiffness: 100 } });
  const ctaIn = spring({ frame: frame - 50, fps, config: { damping: 32, mass: 1, stiffness: 100 } });

  const logoFloat = Math.sin(frame / 30) * 5;

  return (
    <AbsoluteFill style={{ fontFamily: FONT, overflow: "hidden" }}>
      <Sequence>
        <GridBackground />
      </Sequence>
      <Sequence from={0}>
        <GridOverlay />
      </Sequence>

      <Sequence>
        <StatCard
          icon="🧱"
          value="$1.250M"
          label="Presupuestos"
          color={BC.primary}
          delay={55}
          x={60}
          y={210}
          rotate={-6}
        />
        <StatCard
          icon="👷"
          value="24"
          label="Trabajadores"
          color={BC.info}
          delay={85}
          x={940}
          y={150}
          rotate={5}
        />
        <StatCard
          icon="📈"
          value="+18%"
          label="Rentabilidad"
          color={BC.success}
          delay={115}
          x={900}
          y={430}
          rotate={-4}
        />
        <StatCard
          icon="⚠️"
          value="2"
          label="Alertas"
          color={BC.warning}
          delay={145}
          x={60}
          y={430}
          rotate={6}
        />
      </Sequence>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            transform: `translateY(${logoFloat}px)`,
            opacity: titleIn,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 15,
                background: BC.gradientPrimary,
                boxShadow: "0 0 34px rgba(59,130,246,0.55)",
                color: "#fff",
                fontSize: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🏗️
            </div>
          </div>
          <h1
            style={{
              fontFamily: FONT,
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2,
              color: BC.textPrimary,
              margin: "16px 0 6px",
              lineHeight: 1.05,
            }}
          >
            Build
            <span
              style={{
                backgroundImage: BC.gradientPrimary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Control
            </span>
          </h1>
          <div
            style={{
              opacity: 0.75,
              transform: `scaleX(${titleIn})`,
              width: 220,
              height: 5,
              borderRadius: 999,
              background: BC.gradientPrimary,
              margin: "0 auto",
            }}
          />
        </div>

        <p
          style={{
            fontFamily: FONT,
            fontSize: 27,
            color: BC.textSecondary,
            marginTop: 22,
            opacity: subtitleIn,
            maxWidth: 640,
            lineHeight: 1.45,
          }}
        >
          Control total para tus obras: presupuestos, gastos, rentabilidad y
          nómina en una sola plataforma.
        </p>

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 36,
            opacity: ctaIn,
          }}
        >
          <Link
            to="/login?mode=register"
            style={{
              fontFamily: FONT,
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              background: BC.gradientPrimary,
              padding: "15px 30px",
              borderRadius: 12,
              boxShadow: "0 0 26px rgba(59,130,246,0.5)",
              textDecoration: "none",
            }}
          >
            Comenzar gratis →
          </Link>
          <a
            href="#demo"
            style={{
              fontFamily: FONT,
              fontSize: 20,
              fontWeight: 600,
              color: BC.textPrimary,
              border: `1px solid ${BC.borderHover}`,
              padding: "15px 30px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Ver en acción
          </a>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}