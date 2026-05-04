import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatDateLabel,
  formatDateValue,
  getCalendarDays,
  parseDateValue,
} from "../utils/translation-history.utils";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

interface TranslationHistoryDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function TranslationHistoryDatePicker({
  value,
  onChange,
}: TranslationHistoryDatePickerProps) {
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(selectedDate ?? new Date());
  const calendarDays = getCalendarDays(monthDate);

  const updateMonth = (offset: number) => {
    setMonthDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start bg-white text-left font-normal"
        >
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {formatDateLabel(value)}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => updateMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-semibold">
            {monthDate.toLocaleDateString("vi-VN", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => updateMonth(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="size-8" />;
            }

            const date = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              day,
            );
            const nextValue = formatDateValue(date);
            const isSelected = nextValue === value;

            return (
              <Button
                key={nextValue}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                size="icon-sm"
                className="size-8"
                onClick={() => {
                  onChange(nextValue);
                  setOpen(false);
                }}
              >
                {day}
              </Button>
            );
          })}
        </div>

        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-center"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <X className="size-4" />
            Xóa ngày
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
