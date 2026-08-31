import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  TrendingUp,
  Plus,
  Receipt,
  CircleDollarSign,
  ArrowDownToLine,
  Sparkles,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const bottomTabs = [
  { name: "Inicio", href: "/", icon: LayoutDashboard },
  { name: "Obras", href: "/projects", icon: FolderKanban },
  { name: "Equipo", href: "/workers", icon: HardHat },
  { name: "IA", href: "/assistant", icon: Sparkles },
  { name: "Ingresos", href: "/income", icon: TrendingUp },
];

const quickActions = [
  { name: "Gasto", href: "/expenses", icon: Receipt, color: "bg-destructive" },
  { name: "Pago", href: "/worker-payments", icon: CircleDollarSign, color: "bg-warning" },
  { name: "Retiro", href: "/withdrawals", icon: ArrowDownToLine, color: "bg-info" },
  { name: "Ingreso", href: "/income", icon: TrendingUp, color: "bg-success" },
  { name: "Foto factura", href: "/expenses?action=ocr", icon: ScanLine, color: "bg-primary" },
];

export function MobileNav() {
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <>
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setShowQuickActions(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl p-3 shadow-lg grid grid-cols-2 gap-2 min-w-[200px]"
            >
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  onClick={() => setShowQuickActions(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white", action.color)}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  {action.name}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar/95 backdrop-blur-lg border-t border-border safe-area-bottom print:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map((tab) => {
            const isActive = location.pathname === tab.href ||
              (tab.href !== "/" && location.pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </div>

        <motion.button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="absolute -top-6 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer glow-blue"
          whileTap={{ scale: 0.92 }}
        >
          <motion.div
            animate={{ rotate: showQuickActions ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="h-6 w-6" />
          </motion.div>
        </motion.button>
      </nav>
    </>
  );
}
