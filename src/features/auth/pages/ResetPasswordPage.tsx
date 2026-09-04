import { useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat, KeyRound, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { FormEvent } from "react";

export function ResetPasswordPage() {
  const { user, loading, setNewPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Solo debe accederse con un enlace de recuperación válido (sesión temporal).
  const recoveryActive = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, "?"));
    return params.get("type") === "recovery" && !!params.get("access_token");
  }, []);

  // Sin token de recuperación: no hay nada que hacer aquí.
  if (!loading && !recoveryActive) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setSubmitting(true);
    const result = await setNewPassword(password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    // Si la recuperación lo permite, la sesión queda activa; llevamos al usuario
    // a la app. Si Supabase no creó sesión, OnAuthStateChange la invalidará.
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
            Define tu nueva contraseña
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Nueva contraseña</CardTitle>
            <CardDescription>
              Elige una nueva contraseña para tu cuenta {user?.email ? `(${user.email})` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" variant="glow" className="w-full" disabled={submitting || !password || !confirm}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {submitting ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}