import { useForm, Controller } from "react-hook-form";
import { toNull } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { clientSchema, type ClientFormData } from "@/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Client } from "@/types";


const DOCUMENT_TYPES = [
  { value: "cc", label: "Cédula de ciudadanía" },
  { value: "nit", label: "NIT" },
  { value: "pasaporte", label: "Pasaporte" },
  { value: "otro", label: "Otro" },
];

function toFormValue(client: Client | null): ClientFormData {
  return {
    name: client?.name ?? "",
    company: client?.company ?? "",
    phone: client?.phone ?? "",
    email: client?.email ?? "",
    document_type: client?.document_type ?? "",
    document_number: client?.document_number ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
  };
}

function buildClientInput(data: ClientFormData) {
  return {
    name: data.name,
    company: toNull(data.company),
    phone: toNull(data.phone),
    email: toNull(data.email),
    document_type: toNull(data.document_type),
    document_number: toNull(data.document_number),
    address: toNull(data.address),
    notes: toNull(data.notes),
  };
}

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  isSubmitting: boolean;
  onSave: (input: ReturnType<typeof buildClientInput>) => void;
  title: string;
  description: string;
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  isSubmitting,
  onSave,
  title,
  description,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: toFormValue(client),
  });

  useEffect(() => {
    reset(toFormValue(client));
  }, [client, open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((data) => onSave(buildClientInput(data)))}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej. María García"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Ej. Constructora XYZ"
                {...register("company")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+57 300 000 0000"
                {...register("phone")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="cliente@email.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Controller
                control={control}
                name="document_type"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">Número de documento</Label>
              <Input
                id="document_number"
                placeholder="Ej. 1234567890"
                {...register("document_number")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Ej. Cra 15 #80-20, Bogotá"
              {...register("address")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas o referencias del cliente"
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="glow" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
