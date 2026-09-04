import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BC, FONT } from "./theme";

const KPIS = [
  { label: "Presupuesto total", value: "$485.000.000", color: BC.primary },
  { label: "Ejecutado", value: "$212.400.000", color: BC.info },
  { label: "Utilidad estimada", value: "$96.500.000", color: BC.success },
];

const BARS = [
  { h: 0.62, color: BC.primary },
  { h: 0.78, color: BC.info },
  { h: 0.5, color: BC.primary },
  { h: 0.9, color: BC.warning },
  { h: 0.68, color: BC.success },
  { h: 0.84, color: BC.primary },
  { h: 0.56, color: BC.info },
  { h: 0.74, color: BC.success },
];

const ROWS = [
  { name: "Cimentación", amount: "$85.000.000", pct: 72, color: BC.success },
  { name: "Fachada", amount: "$64.000.000", pct: 48, color: BC.primary },
  { name: "Instalaciones", amount: "$41.200.000", pct: 30, color: BC.info },
  { name: "Acabados", amount: "$22.200.000", pct: 18, color: BC.warning },
];

function KpiCard({
  kpi,
  index,
}: {
  kpi: (typeof KPIS)[number];
  index: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - (30 + index * 12), fps, config: { damping: 30, mass: 1, stiffness: 100 } });
  return (
    <div
      style={{
        flex: 1,
        background: `${BC.bgCard}`,
        border: `1px solid ${BC.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 24}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 11,
          color: BC.textMuted,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {kpi.label}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 700,
          color: kpi.color,
          marginTop: 4,
        }}
      >
        {kpi.value}
      </div>
    </div>
  );
}

function ChartPanel() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const grow = spring({ frame: frame - 60, fps, config: { damping: 30, mass: 1, stiffness: 90 } });

  const barH = (base: number) =>
    interpolate(grow, [0, 1], [6, base * 150], {
      extrapolateRight: "clamp",
    });

  return (
    <div
      style={{
        flex: 1,
        background: BC.bgCard,
        border: `1px solid ${BC.border}`,
        borderRadius: 12,
        padding: "16px",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          color: BC.textPrimary,
          marginBottom: 14,
        }}
      >
        Avance por rubro
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 160 }}>
        {BARS.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: barH(b.h),
              borderRadius: "6px 6px 0 0",
              background: `linear-gradient(180deg, ${b.color}, ${b.color}66)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const ShowcaseDuration = 210;

export function ScreenshotShowcase() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const windowIn = spring({ frame: frame - 25, fps, config: { damping: 30, mass: 1, stiffness: 95 } });
  const headingIn = spring({ frame: frame - 14, fps, config: { damping: 32, mass: 1, stiffness: 105 } });

  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        background: BC.bgPrimary,
        padding: "40px 60px",
        justifyContent: "center",
        gap: 30,
      }}
    >
      <div style={{ opacity: headingIn, textAlign: "center" }}>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 15,
            fontWeight: 700,
            color: BC.primary,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Panel de control
        </span>
        <h2
          style={{
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 800,
            color: BC.textPrimary,
            margin: "8px 0 6px",
            letterSpacing: -1,
            lineHeight: 1.1,
          }}
        >
          Tu obra, <span style={{ color: BC.primary }}>en tiempo real</span>
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 16,
            color: BC.textSecondary,
            margin: 0,
          }}
        >
          Visualiza presupuesto, gasto y rentabilidad de un vistazo.
        </p>
      </div>

      {/* Mock dashboard window */}
      <div
        style={{
          background: BC.bgTertiary,
          border: `1px solid ${BC.borderHover}`,
          borderRadius: 18,
          padding: "20px",
          transform: `scale(${windowIn})`,
          opacity: windowIn,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 6, background: BC.danger }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: BC.warning }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, background: BC.success }} />
          <div
            style={{
              flex: 1,
              height: 12,
              background: BC.bgSecondary,
              borderRadius: 6,
              marginLeft: 8,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          {KPIS.map((k, i) => (
            <Sequence key={k.label}>
              <KpiCard kpi={k} index={i} />
            </Sequence>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <ChartPanel />
          <div
            style={{
              flex: 1,
              background: BC.bgCard,
              border: `1px solid ${BC.border}`,
              borderRadius: 12,
              padding: "16px",
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: BC.textPrimary,
                marginBottom: 12,
              }}
            >
              Gasto real vs presupuestado
            </div>
            {ROWS.map((row, i) => {
              const enter = spring({
                frame: frame - (70 + i * 10),
                fps,
                config: { damping: 30, mass: 1, stiffness: 95 },
              });
              return (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                    opacity: enter,
                    transform: `translateX(${(1 - enter) * -16}px)`,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: row.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 12,
                      color: BC.textSecondary,
                      width: 90,
                      flexShrink: 0,
                    }}
                  >
                    {row.name}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: BC.bgSecondary,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${row.pct * enter}%`,
                        height: "100%",
                        background: row.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: 12,
                      fontWeight: 600,
                      color: BC.textPrimary,
                      width: 76,
                      textAlign: "right",
                    }}
                  >
                    {row.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}