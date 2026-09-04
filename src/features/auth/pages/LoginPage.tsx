import { useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import type { FormEvent } from "react";

type FormMode = "login" | "register" | "forgot";

export function LoginPage() {
  const { user, signIn, signUp, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<FormMode>(
    searchParams.get("mode") === "register" ? "register" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    if (mode === "forgot") {
      const result = await requestPasswordReset(email);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(
        `Te enviamos un enlace de recuperación a ${email}. Revisa tu bandeja de entrada (y la carpeta de spam).`
      );
      return;
    }

    const result = mode === "register"
      ? await signUp(email, password, fullName)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setLoading(false);

    if (mode === "register" && "needsVerification" in result && result.needsVerification) {
      setNotice(
        `Te enviamos un enlace de confirmación a ${email}. Revisa tu bandeja de entrada (y la carpeta de spam) antes de iniciar sesión.`
      );
      setMode("login");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 mb-4 shadow-lg glow-blue">
            <HardHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Build<span className="text-primary">Control</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-center">
            Control total para tus obras de construcción
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>
              {mode === "register"
                ? "Crear cuenta"
                : mode === "forgot"
                  ? "Recuperar contraseña"
                  : "Iniciar sesión"}
            </CardTitle>
            <CardDescription>
              {mode === "register"
                ? "Regístrate para empezar a controlar tus obras"
                : mode === "forgot"
                  ? "Te enviaremos un enlace para restablecer tu contraseña"
                  : "Ingresa tus credenciales para acceder"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
              )}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setNotice("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              {notice && (
                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                  {notice}
                </div>
              )}

              <Button type="submit" variant="glow" className="w-full" disabled={loading}>
                {loading
                  ? "Cargando..."
                  : mode === "register"
                    ? "Crear cuenta"
                    : mode === "forgot"
                      ? "Enviar enlace"
                      : "Entrar"}
              </Button>

              {mode === "forgot" ? (
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); setNotice(""); }}
                  className="flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver a iniciar sesión
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "register" ? "login" : "register");
                    setError("");
                    setNotice("");
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {mode === "register"
                    ? "¿Ya tienes cuenta? Inicia sesión"
                    : "¿No tienes cuenta? Regístrate"}
                </button>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
