import { CheckIcon, ChevronsUpDownIcon, SearchIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ComboboxOption = {
  label: string;
  value: string;
};

type ComboboxProps = {
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  emptyMessage?: string;
  id?: string;
  onValueChange: (value: string) => void;
  options: readonly ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
};

function normalizeComboboxSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Combobox({
  className,
  contentClassName,
  disabled,
  emptyMessage = "Không có kết quả",
  id,
  onValueChange,
  options,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  value,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const selectedOption = options.find((option) => option.value === value);
  const normalizedSearch = normalizeComboboxSearch(searchValue);
  const filteredOptions = normalizedSearch
    ? options.filter((option) =>
        normalizeComboboxSearch(`${option.label} ${option.value}`).includes(
          normalizedSearch,
        ),
      )
    : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-background px-2.5 font-normal",
            !selectedOption && "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 truncate">
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn(
          "w-(--radix-popover-trigger-width) p-0",
          contentClassName,
        )}
      >
        <div className="border-b p-1.5">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-8 w-full rounded-sm border border-input bg-transparent pr-2 pl-8 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                  option.value === value && "bg-accent/60",
                )}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  setSearchValue("");
                }}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                <CheckIcon
                  className={cn(
                    "size-4 shrink-0",
                    option.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            ))
          ) : (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { Combobox, type ComboboxOption };
