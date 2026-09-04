import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/app/providers";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { MonitorSmartphone, Moon, Sun, LogOut, HardHat, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import type { FormEvent } from "react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, changePassword } = useAuth();
  const { canInstall, promptInstall } = usePwaInstall();
  const [signingOut, setSigningOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setChangingPassword(true);
    const result = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (result.error) {
      setPasswordError(result.error);
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Contraseña actualizada", {
      description: "La próxima vez que inicies sesión usa tu nueva contraseña.",
    });
  };

  const handleInstall = () => {
    promptInstall();
    toast("Instalación de BuildControl", {
      description: "Confirma en el diálogo del navegador para instalar la app.",
    });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Preferencias, apariencia y detalles de la cuenta
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MonitorSmartphone className="h-4 w-4 text-primary" />
                Aplicación
              </CardTitle>
              <CardDescription>
                Instala BuildControl como app para acceso rápido desde tu teléfono o escritorio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500">
                  <HardHat className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">BuildControl</p>
                  <p className="text-xs text-muted-foreground">
                    Funciona sin conexión en la web instalable
                  </p>
                </div>
                {canInstall ? (
                  <Button variant="glow" size="sm" onClick={handleInstall}>
                    Instalar
                  </Button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {isStandalone() ? "Instalada" : "No disponible"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Una vez instalada puedes abrir BuildControl desde el menú de apps y usarla sin
                conexión (los datos viven en la nube y se sincronizan al volver).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 text-primary" />
                ) : (
                  <Sun className="h-4 w-4 text-warning" />
                )}
                Apariencia
              </CardTitle>
              <CardDescription>Elige el tema de la interfaz.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={toggleTheme} className="w-full">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Cambiar a modo {theme === "dark" ? "claro" : "oscuro"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardHat className="h-4 w-4 text-primary" />
              Cuenta
            </CardTitle>
            <CardDescription>Información de la sesión actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/60 p-3 text-sm">
              <p className="text-muted-foreground">Correo</p>
              <p className="font-medium">{user?.email ?? "—"}</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 rounded-xl border border-border/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4 text-primary" />
                Cambiar contraseña
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <Button type="submit" variant="glow" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {changingPassword ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </form>

            <Button variant="destructive" onClick={() => void handleSignOut()} disabled={signingOut}>
              <LogOut className="h-4 w-4" />
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
