import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CopyFeedbackButtonProps {
  className?: string;
  disabled?: boolean;
  label: string;
  onCopy: () => boolean | Promise<boolean>;
}

export function CopyFeedbackButton({
  className,
  disabled = false,
  label,
  onCopy,
}: CopyFeedbackButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    const copied = await onCopy();
    if (!copied) return;

    setIsCopied(true);
    window.setTimeout(() => {
      setIsCopied(false);
    }, 1200);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn(
            "bg-white/95 shadow-sm backdrop-blur hover:bg-white",
            className,
          )}
          disabled={disabled}
          aria-label={label}
          onClick={() => void handleCopy()}
        >
          {isCopied ? (
            <Check className="size-4 animate-in zoom-in-50 text-emerald-600 duration-200" />
          ) : (
            <Copy className="size-4 animate-in fade-in-0 duration-150" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
