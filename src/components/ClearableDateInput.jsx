import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClearableDateInput({
  id,
  label,
  value,
  onChange,
  required = false,
}) {
  return (
    <div className="space-y-2 min-w-0">
      {label && <Label htmlFor={id} className="dark:text-gray-200 break-words">{label}{required ? " *" : ""}</Label>}

      <div className="relative w-full max-w-full overflow-hidden min-w-0">
        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none z-10" />

        <Input
          id={id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="pl-10 w-full max-w-full box-border cursor-pointer"
        />

        {value && (
          <Button
            type="button"
            aria-label="Clear date"
            title="Clear date"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            variant="ghost"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}