"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PurchaseOrderItem, InboundFormData, MasterSku } from "@/lib/types";
import { isExpiryWarning, formatDate, cn } from "@/lib/utils";
import {
  CalendarDays,
  Minus,
  Plus,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ---------- Custom Date Picker with Month/Year Dropdowns ----------

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

interface DatePickerDropdownProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  minDate?: Date;
}

function DatePickerDropdown({ selected, onSelect, minDate }: DatePickerDropdownProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());

  // Generate year options: current year to +5 years
  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, [today]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const date = new Date(viewYear, viewMonth, day);
    return date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === viewMonth &&
      selected.getFullYear() === viewYear
    );
  };

  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === viewMonth &&
      today.getFullYear() === viewYear
    );
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3 sm:p-4 space-y-3 max-w-sm mx-auto w-full">
      {/* Month/Year selectors */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 flex items-center justify-center gap-2">
          {/* Month dropdown */}
          <div className="relative">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value))}
              className="h-9 pl-3 pr-7 rounded-lg bg-accent border border-border/50 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground rotate-90 pointer-events-none" />
          </div>

          {/* Year dropdown */}
          <div className="relative">
            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value))}
              className="h-9 pl-3 pr-7 rounded-lg bg-accent border border-border/50 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground rotate-90 pointer-events-none" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors shrink-0"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground select-none"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const disabled = isDateDisabled(day);
          const selectedDay = isSelected(day);
          const todayDay = isToday(day);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
              className={cn(
                "aspect-square rounded-lg text-sm font-medium transition-all",
                "flex items-center justify-center",
                disabled
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : "hover:bg-accent cursor-pointer",
                selectedDay &&
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                todayDay && !selectedDay && "bg-muted text-foreground",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Inbound Form ----------

interface InboundFormProps {
  isOpen: boolean;
  onClose: () => void;
  poItem: PurchaseOrderItem | null;
  sku: MasterSku | null;
  onSubmit: (data: InboundFormData) => Promise<{ success: boolean; message: string }>;
}

export function InboundForm({
  isOpen,
  onClose,
  poItem,
  sku,
  onSubmit,
}: InboundFormProps) {
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [qtyGood, setQtyGood] = useState(1);
  const [qtyReject, setQtyReject] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const resetForm = useCallback(() => {
    setExpiryDate(undefined);
    setShowCalendar(false);
    setQtyGood(1);
    setQtyReject(0);

    setIsSubmitting(false);
    setSubmitResult(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!poItem || !expiryDate) return;

    setIsSubmitting(true);
    try {
      const data: InboundFormData = {
        po_item_id: poItem.id,
        expiry_date: expiryDate.toISOString().split("T")[0],
        qty_good: qtyGood,
        qty_reject: qtyReject,
      };

      const result = await onSubmit(data);
      setSubmitResult(result);

      if (result.success) {
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch {
      setSubmitResult({
        success: false,
        message: "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [poItem, expiryDate, qtyGood, qtyReject, onSubmit, handleClose]);

  const expiryWarning =
    expiryDate && isExpiryWarning(expiryDate.toISOString().split("T")[0]);

  const isFormValid = expiryDate && (qtyGood > 0 || qtyReject > 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-3xl border-t border-border/50 bg-background p-0 overflow-hidden"
      >
        {/* Success overlay */}
        {submitResult?.success && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 animate-count-up">
              <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <p className="text-lg font-semibold text-success">
                Berhasil Disimpan!
              </p>
              <p className="text-sm text-muted-foreground">
                Data inbound telah diperbarui
              </p>
            </div>
          </div>
        )}

        {/* Scrollable inner wrapper */}
        <div className="flex-1 overflow-y-auto">
          <SheetHeader className="px-5 pt-5 pb-3 sticky top-0 bg-background z-10">
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
            <SheetTitle className="text-left text-base">
              Detail Inbound
            </SheetTitle>
            <SheetDescription className="text-left text-xs">
              Lengkapi data penerimaan barang
            </SheetDescription>
          </SheetHeader>

        <div className="px-5 pb-8 space-y-5">
          {/* SKU Info */}
          {sku && (
            <div className="rounded-xl bg-card border border-border/50 p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {sku.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {sku.sku_code} • {sku.barcode}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-border/30" />

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Tanggal Kedaluwarsa
            </Label>

            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className={cn(
                "w-full h-12 px-4 rounded-xl border text-left text-sm touch-target transition-all",
                "bg-card border-border/50 hover:border-primary/30",
                expiryDate ? "text-foreground" : "text-muted-foreground/60",
                expiryWarning && "border-warning/50 bg-warning/5"
              )}
            >
              {expiryDate
                ? formatDate(expiryDate.toISOString())
                : "Pilih tanggal kedaluwarsa..."}
            </button>

            {expiryWarning && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                <p className="text-[11px] text-warning font-medium">
                  Peringatan: Kedaluwarsa kurang dari 6 bulan!
                </p>
              </div>
            )}

            {showCalendar && (
              <DatePickerDropdown
                selected={expiryDate}
                onSelect={(date) => {
                  setExpiryDate(date);
                  setShowCalendar(false);
                }}
                minDate={new Date()}
              />
            )}
          </div>

          <Separator className="bg-border/30" />

          {/* Quantity Inputs */}
          <div className="grid grid-cols-2 gap-4">
            {/* Qty Good */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-success">
                Qty Good (Layak)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg touch-target shrink-0"
                  onClick={() => setQtyGood(Math.max(0, qtyGood - 1))}
                  disabled={qtyGood <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={qtyGood}
                  onChange={(e) =>
                    setQtyGood(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="h-10 text-center rounded-lg bg-card border-border/50 text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg touch-target shrink-0"
                  onClick={() => setQtyGood(qtyGood + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Qty Reject */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-destructive">
                Qty Reject (Rusak)
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg touch-target shrink-0"
                  onClick={() => setQtyReject(Math.max(0, qtyReject - 1))}
                  disabled={qtyReject <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={qtyReject}
                  onChange={(e) =>
                    setQtyReject(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="h-10 text-center rounded-lg bg-card border-border/50 text-lg font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={0}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-lg touch-target shrink-0"
                  onClick={() => setQtyReject(qtyReject + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>



          {/* Submit Error */}
          {submitResult && !submitResult.success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive font-medium">
                {submitResult.message}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full h-14 rounded-xl text-sm font-semibold touch-target bg-primary hover:bg-primary/90 gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Menyimpan..." : "Simpan & Update"}
          </Button>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
