import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/providers";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { MonitorSmartphone, Moon, Sun, LogOut, HardHat, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { canInstall, promptInstall } = usePwaInstall();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
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
