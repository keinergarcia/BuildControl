import { Navigate, Link } from "react-router-dom";
import { Player } from "@remotion/player";
import type { ComponentType, CSSProperties } from "react";
import {
  Hero,
  HeroDuration,
  Features,
  FeaturesDuration,
  ScreenshotShowcase,
  ShowcaseDuration,
  FPS,
} from "@/features/landing/remotion";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  HardHat,
  TrendingUp,
  Wallet,
  Users,
  FileText,
  PieChart,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const FEATURE_STATIC = [
  {
    icon: Wallet,
    title: "Presupuestos y gastos",
    desc: "Define presupuesto por rubro y compara contra el gasto real en tiempo real.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: PieChart,
    title: "Rentabilidad",
    desc: "Márgenes, utilidad proyectada y alertas automáticas para no perder dinero.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Users,
    title: "Nómina de obra",
    desc: "Trabajadores, tarifas, asignaciones y pagos claros y sin errores.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: FileText,
    title: "Documentos y reportes",
    desc: "Informes en PDF, historial y asistente inteligente para decisiones.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

const STATS = [

  
  { value: "+$1.2B", label: "Obras controladas" },
  { value: "100%", label: "Transparencia financiera" },
  { value: "24/7", label: "Acceso en la nube" },
  { value: "-30%", label: "Incertidumbre de costos" },
];

const RATIO = 1200 / 600;

function AnimatedPlayer({
  component,
  durationInFrames,
  maxWidth = "64rem",
  controls = false,
}: {
  component: ComponentType;
  durationInFrames: number;
  maxWidth?: string;
  controls?: boolean;
}) {
  const wrapperStyle: CSSProperties = {
    width: "100%",
    maxWidth,
    margin: "0 auto",
    aspectRatio: `${RATIO}`,
    position: "relative",
    background: "transparent",
  };
  const playerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    position: "absolute",
    inset: 0,
    background: "transparent",
  };

  return (
    <div style={wrapperStyle}>
      <Player
        component={component}
        durationInFrames={durationInFrames}
        compositionWidth={1200}
        compositionHeight={600}
        fps={FPS}
        loop
        autoPlay
        controls={controls}
        style={playerStyle}
      />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/landing" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-500 shadow-lg glow-blue">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Build<span className="text-primary">Control</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Beneficios</a>
          <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
          <a href="#reportes" className="hover:text-foreground transition-colors">Reportes</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="glow" size="sm">
            <Link to="/login?mode=register">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function LandingPage() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pb-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-1/4 top-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-4 pt-12 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Plataforma inteligente para constructoras
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight md:text-5xl">
            Control total para tus{" "}
            <span className="text-gradient-primary">obras de construcción</span>
          </h1>
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-4 pt-6">
          <div
            style={{
              width: "100%",
              aspectRatio: `${RATIO}`,
              position: "relative",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.4)",
              borderRadius: 20,
            }}
          >
            <Player
              component={Hero}
              durationInFrames={HeroDuration}
              compositionWidth={1200}
              compositionHeight={600}
              fps={FPS}
              loop
              autoPlay
              controls={false}
              clickToPlay={false}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                inset: 0,
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid var(--bc-border)",
              }}
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border/60 bg-background/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-gradient-primary">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Lo que <span className="text-gradient-primary">ofrece</span> BuildControl
          </h2>
          <p className="mt-4 text-muted-foreground">
            Desde el primer día hasta la entrega, controla cada peso y cada
            trabajador de tu obra.
          </p>
        </div>
        <div className="mt-12 w-full">
          <AnimatedPlayer
            component={Features}
            durationInFrames={FeaturesDuration}
            maxWidth="1128px"
          />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_STATIC.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-lg"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO / SCREENSHOTS */}
      <section id="demo" className="border-t border-border/60 bg-background/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <AnimatedPlayer
            component={ScreenshotShowcase}
            durationInFrames={ShowcaseDuration}
            maxWidth="928px"
            controls
          />
        </div>
      </section>

      {/* REPORTES CTA */}
      <section id="reportes" className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-purple-500/10 to-background p-10 text-center md:p-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            <TrendingUp className="h-4 w-4" />
            Toma el control de tus obras
          </div>
          <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            Empieza hoy a construir con
            <span className="text-gradient-primary"> datos, no con suposiciones</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Crea tu cuenta gratis, crea tu primer proyecto y descubre cuánto sabe
            tu obra en cuestión de minutos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="glow" size="xl">
              <Link to="/login?mode=register">
                Crear cuenta gratis <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">
              Build<span className="text-primary">Control</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BuildControl. Control inteligente para la construcción.
          </p>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login" className="cursor-pointer">
              Acceso
            </Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;