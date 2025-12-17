"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
}

export function DatePicker({ date, setDate, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
          setDate(selectedDate);
          setIsOpen(false);
      }
  };

  return (
    <div className="relative w-full" ref={ref}>
      {label && (
        <span className="absolute -top-2.5 left-2 bg-[#09090b] px-1 text-[10px] text-gray-500 z-10 pointer-events-none">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-left text-white focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-between text-sm min-h-[42px] hover:bg-white/10 transition-all shadow-sm ${!date && "text-gray-500"}`}
      >
        <span className="truncate">
            {date ? format(date, "dd-MMM-yy") : <span>Pick a date</span>}
        </span>
        <CalendarIcon className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 p-3 bg-[#09090b] border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
           {/* Custom styles override via global style tag since we can't easily configure DayPicker css here otherwise */}
           <style>{`
              .rdp { --rdp-cell-size: 32px; --rdp-accent-color: rgba(255, 255, 255, 0.1); margin: 0; }
              .rdp-day_selected:not([disabled]) { font-weight: bold; border: 1px solid rgba(255,255,255,0.2) !important; color: white !important; background-color: var(--rdp-accent-color) !important; }
              .rdp-day_selected:hover:not([disabled]) { background-color: rgba(255, 255, 255, 0.2) !important; }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(255, 255, 255, 0.05) !important; }
              .rdp-caption_label { color: white; font-weight: 600; }
              .rdp-head_cell { color: #a1a1aa; font-weight: 500; font-size: 0.875rem; text-transform: uppercase; }
              .rdp-day { color: white; font-size: 0.875rem; }
              .rdp-nav_button { color: #a1a1aa; }
              .rdp-nav_button:hover { color: white; background-color: #ffffff20; }
              .rdp-months { justify-content: center; }
           `}</style>
           <DayPicker
            mode="single"
            selected={date}
            onSelect={handleSelect as any} 
            showOutsideDays
            fixedWeeks
            modifiersClassNames={{
                selected: "rdp-day_selected"
            }}

          />
        </div>
      )}
    </div>
  );
}
