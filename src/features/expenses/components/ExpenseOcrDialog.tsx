import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadDocumentFile, createDocument } from "@/features/documents/api/documents";
import { useProjects } from "@/features/projects/api/useProjects";
import { useSuppliers } from "@/features/suppliers/api/useSuppliers";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useCreateExpense,
  useBudgetCategories,
  useExpenseCategories,
} from "@/features/expenses/api/useExpenses";
import { runOcr, imageToDataUrl } from "@/features/expenses/api/ocr";
import { updateExpense } from "@/features/expenses/api/expenses";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types";
import { todayStr } from "@/utils/date";
import { Loader2, Camera, Upload, ScanLine, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] })
);

export function ExpenseOcrDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects({});
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useBudgetCategories();
  const { data: expenseCategories = [] } = useExpenseCategories();
  const createExpense = useCreateExpense();

  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasOcr, setHasOcr] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);

  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState(todayStr());
  const [supplierId, setSupplierId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseCategoryId, setExpenseCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setPreview(null);
    setScanning(false);
    setHasOcr(false);
    setAiAvailable(null);
    setProjectId("");
    setAmount(null);
    setDate(todayStr());
    setSupplierId("");
    setCategoryId("");
    setExpenseCategoryId("");
    setPaymentMethod("");
    setDescription("");
    setNotes("");
  };

  const handleToggle = (v: boolean) => {
    onOpenChange(v);
    if (!v) reset();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await imageToDataUrl(file);
    setPreview(url);
    setHasOcr(false);
    setScanning(true);
    const out = await runOcr(url);
    setScanning(false);
    setAiAvailable(out.served);
    if (out.served && out.parsed) {
      const parsed = out.parsed;
      setHasOcr(true);
      if (parsed.total != null) setAmount(parsed.total);
      if (parsed.date) setDate(parsed.date);
      if (parsed.supplier) {
        const match = suppliers.find((s) =>
          s.name.toLowerCase().includes((parsed.supplier ?? "").toLowerCase())
        );
        setSupplierId(match?.id ?? "");
        setDescription(parsed.description ?? parsed.supplier);
      } else {
        setDescription(parsed.description ?? "");
      }
    }
  };

  const handleSubmit = async () => {
    if (!projectId) return toast.error("Selecciona el proyecto");
    if (amount == null || amount <= 0) return toast.error("Indica el valor del gasto");

    const displayAmount = amount;

    try {
      const expense = await createExpense.mutateAsync({
        project_id: projectId,
        description: description || "Gasto registrado desde factura",
        amount: displayAmount,
        category_id: categoryId || null,
        expense_category_id: expenseCategoryId || null,
        supplier_id: supplierId || null,
        expense_date: date,
        payment_method: (paymentMethod as never) || null,
        notes: notes || null,
      });

      if (preview && user) {
        try {
          const blob = await (await fetch(preview)).blob();
          const file = new File([blob], `factura-${Date.now()}.jpg`, { type: "image/jpeg" });
          const path = await uploadDocumentFile(file, user.id);
          await createDocument({
            project_id: projectId || null,
            name: description || "Factura escaneada",
            file_url: path,
            file_type: "factura",
            related_entity: "expense",
            related_entity_id: expense.id,
          });
          await updateExpense(expense.id, { ...expense, receipt_url: path });
        } catch {
          toast.error("No se pudo guardar la foto de la factura", {
            description: "El gasto ya se registró sin el adjunto.",
          });
        }
      }

      toast.success("Gasto registrado");
      handleToggle(false);
    } catch {
      toast.error("No se pudo registrar el gasto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleToggle}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Registrar gasto desde factura
          </DialogTitle>
          <DialogDescription>
            Toma o sube una foto de la factura para leer sus datos automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          {!preview && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-accent/30"
            >
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Tocar o arrastrar la foto de la factura</span>
              <span className="text-xs text-muted-foreground">JPG o PNG</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />

          {/* Preview + scanning */}
          {preview && (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={preview} alt="Factura" className="max-h-56 w-full object-contain bg-black/5" />
                {scanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="flex items-center gap-2 rounded-lg bg-background px-4 py-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Leyendo factura…
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Cambiar foto
                </Button>
                {!hasOcr && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={scanning}
                    onClick={async () => {
                      if (!preview) return;
                      setScanning(true);
                      const out = await runOcr(preview);
                      setScanning(false);
                      setAiAvailable(out.served);
                      if (out.served && out.parsed) {
                        setHasOcr(true);
                        if (out.parsed.total != null) setAmount(out.parsed.total);
                        if (out.parsed.date) setDate(out.parsed.date);
                        if (out.parsed.supplier) setDescription(out.parsed.supplier);
                      } else {
                        toast.error("No se pudo leer la factura", {
                          description:
                            "Completa los campos manualmente o configura la capa IA.",
                        });
                      }
                    }}
                  >
                    {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                    Escanear
                  </Button>
                )}
              </div>

              {hasOcr && (
                <p className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Datos leídos: revísalos y corrígelos si hace falta.
                </p>
              )}
              {aiAvailable === false && !hasOcr && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" /> Capa IA no configurada: completa los campos manualmente.
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Proyecto *</Label>
              <Select value={projectId || undefined} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ocr-amount">Valor *</Label>
                <MoneyInput
                  id="ocr-amount"
                  value={amount}
                  onChange={setAmount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ocr-date">Fecha</Label>
                <Input id="ocr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={supplierId || undefined} onValueChange={(v) => setSupplierId(v === "_none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Sin proveedor</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rubro</Label>
                <Select value={categoryId || undefined} onValueChange={(v) => setCategoryId(v === "_none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Rubro del presupuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin rubro</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {expenseCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Categoría propia</Label>
                  <Select value={expenseCategoryId || undefined} onValueChange={(v) => setExpenseCategoryId(v === "_none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sin categoría</SelectItem>
                      {expenseCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={paymentMethod || undefined} onValueChange={(v) => setPaymentMethod(v === "_none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Sin método</SelectItem>
                    {PAYMENT_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ocr-desc">Descripción</Label>
              <Input
                id="ocr-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Cemento, bloque, arena"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ocr-notes">Observaciones</Label>
              <Textarea
                id="ocr-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleToggle(false)}>
              Cancelar
            </Button>
            <Button disabled={createExpense.isPending} onClick={() => void handleSubmit()}>
              {createExpense.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar gasto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
