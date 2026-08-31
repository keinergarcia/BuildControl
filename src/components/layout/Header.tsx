import { useAuth } from "@/features/auth/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Download, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers";

export function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { canInstall, promptInstall } = usePwaInstall();

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="h-16 border-b border-border bg-sidebar/80 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 print:hidden">
      <div className="flex items-center gap-3 md:hidden">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500">
          <span className="text-white font-bold text-xs">BC</span>
        </div>
        <span className="font-bold text-sm">
          Build<span className="text-primary">Control</span>
        </span>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        {canInstall && (
          <Button
            variant="ghost"
            size="sm"
            onClick={promptInstall}
            className="text-muted-foreground hidden md:inline-flex gap-1.5"
          >
            <Download className="h-4 w-4" />
            Instalar
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={signOut}
            className="text-muted-foreground hidden md:flex"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
