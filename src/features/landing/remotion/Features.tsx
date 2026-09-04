import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BC, FONT } from "./theme";

const FEATURES = [
  {
    icon: "📋",
    title: "Presupuestos por rubro",
    desc: "Define y compara el presupuesto contra el gasto real del proyecto.",
    color: BC.primary,
  },
  {
    icon: "💸",
    title: "Control de gastos",
    desc: "Registra costos, órdenes y facturas con cálculo automático de utilidad.",
    color: BC.warning,
  },
  {
    icon: "👷",
    title: "Nómina de obra",
    desc: "Pagos a trabajadores, contratos y tarifas diarias sin errores.",
    color: BC.info,
  },
  {
    icon: "📊",
    title: "Informes y rentabilidad",
    desc: "Dashboards claros y reportes en PDF de cada proyecto.",
    color: BC.success,
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - (20 + index * 16),
    fps,
    config: { damping: 26, mass: 1, stiffness: 120 },
  });

  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(145deg, ${BC.bgCard}, ${BC.bgTertiary})`,
        border: `1px solid ${BC.border}`,
        borderRadius: 16,
        padding: "22px 20px",
        textAlign: "left",
        transform: `translateY(${(1 - enter) * 46}px)`,
        opacity: enter,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: feature.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          boxShadow: `0 0 20px ${feature.color}44`,
          marginBottom: 14,
        }}
      >
        {feature.icon}
      </div>
      <h3
        style={{
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          color: BC.textPrimary,
          margin: "0 0 8px",
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 14,
          color: BC.textSecondary,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {feature.desc}
      </p>
    </div>
  );
}

export const FeaturesDuration = 210;

export function Features() {
  return (
    <AbsoluteFill
      style={{
        fontFamily: FONT,
        background: "transparent",
        padding: "16px 20px",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 28,
        }}
      >
        {FEATURES.map((f, i) => (
          <Sequence key={f.title}>
            <FeatureCard feature={f} index={i} />
          </Sequence>
        ))}
      </div>
    </AbsoluteFill>
  );
}