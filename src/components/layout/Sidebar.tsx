import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileSignature,
  Receipt,
  Wallet,
  TrendingUp,
  UserCog,
  CircleDollarSign,
  ArrowDownToLine,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  HardHat,
  Sparkles,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Proyectos", href: "/projects", icon: FolderKanban },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Contratos", href: "/contracts", icon: FileSignature },
  { name: "Presupuesto", href: "/budgets", icon: Wallet },
  { name: "Gastos", href: "/expenses", icon: Receipt },
  { name: "Trabajadores", href: "/workers", icon: HardHat },
  { name: "Pagos", href: "/worker-payments", icon: CircleDollarSign },
  { name: "Ingresos", href: "/income", icon: TrendingUp },
  { name: "Retiros", href: "/withdrawals", icon: ArrowDownToLine },
  { name: "Proveedores", href: "/suppliers", icon: UserCog },
  { name: "Documentos", href: "/documents", icon: FileText },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Asistente", href: "/assistant", icon: Sparkles },
  { name: "Historial", href: "/historial", icon: History },
];

const bottomNav = [
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-300 relative z-30 print:hidden",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
        layout
      >
        <div className="flex items-center h-16 px-4 gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 shrink-0">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-lg tracking-tight"
            >
              Build<span className="text-primary">Control</span>
            </motion.span>
          )}
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.name}>{linkContent}</div>;
          })}
        </nav>

        <Separator />

        <div className="py-3 px-2 space-y-0.5">
          {bottomNav.map((item) => {
            const isActive = location.pathname === item.href;
            const linkContent = (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.name}</TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.name}>{linkContent}</div>;
          })}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-50 cursor-pointer",
          )}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}
