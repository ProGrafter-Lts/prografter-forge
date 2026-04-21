import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TradeDateFieldProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
  inputClassName: string;
  popoverClassName?: string;
  disabled?: (date: Date) => boolean;
}

const TradeDateField = ({
  value,
  onChange,
  placeholder,
  inputClassName,
  popoverClassName,
  disabled,
}: TradeDateFieldProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            inputClassName,
            "flex items-center justify-between text-left",
            !value && "text-cream/40",
          )}
        >
          {value ? format(value, "dd MMM yyyy") : placeholder}
          <CalendarIcon className="w-4 h-4 text-cream/40" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", popoverClassName)} align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
};

export default TradeDateField;