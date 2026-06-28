"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, ChevronDown, Plus } from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface CreatableMultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function CreatableMultiSelect({ options: initialOptions, value, onChange, placeholder }: CreatableMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(initialOptions);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      addValue(inputValue);
    }
  };

  const addValue = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
      if (!options.find(o => o.value === trimmed)) {
        setOptions([...options, { label: trimmed, value: trimmed }]);
      }
    }
  };

  const removeValue = (val: string) => {
    onChange(value.filter(v => v !== val));
  };

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(o.value)
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-lg focus-within:ring-2 focus-within:ring-white/20 min-h-[42px] transition-all">
        {value.map(v => (
          <span key={v} className="flex items-center gap-1 bg-[#222] text-gray-200 px-2 py-0.5 rounded text-sm border border-white/10 shadow-sm animate-in fade-in zoom-in duration-200">
            {v}
            <button type="button" onClick={() => removeValue(v)} className="hover:text-white text-gray-400 transition-colors"><X size={14} /></button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent border-none outline-none text-white placeholder-gray-500 flex-1 min-w-[120px] text-sm"
          placeholder={value.length === 0 ? placeholder : ""}
        />
      </div>

      {isOpen && (inputValue || filteredOptions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => addValue(option.value)}
              className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white text-sm rounded-lg transition-colors"
            >
              {option.label}
            </button>
          ))}
          {inputValue && !filteredOptions.find(o => o.label.toLowerCase() === inputValue.toLowerCase()) && (
            <button
              type="button"
              onClick={() => addValue(inputValue)}
              className="w-full text-left px-3 py-2 text-white hover:bg-white/10 text-sm flex items-center gap-2 rounded-lg transition-colors mt-1 border-t border-white/5"
            >
              <Plus size={14} /> Create "{inputValue}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  creatable?: boolean;
}

export function Select({ options: initialOptions, value, onChange, placeholder, creatable = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(initialOptions);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setInputValue("");
  };

  const handleCreate = () => {
    if (inputValue.trim() && creatable) {
      const newVal = inputValue.trim();
      setOptions([...options, { label: newVal, value: newVal }]);
      onChange(newVal);
      setIsOpen(false);
      setInputValue("");
    }
  };

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-left text-white focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-between text-sm min-h-[42px] hover:bg-white/10 transition-all shadow-sm whitespace-nowrap"
      >
        <span className={!value ? "text-gray-500" : ""}>{selectedLabel || placeholder}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 min-w-[160px]">
          {creatable && (
              <input
                 autoFocus
                 type="text"
                 className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2 focus:outline-none focus:border-white/30 placeholder-gray-600"
                 placeholder={creatable ? "Search or type new..." : "Search..."}
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && creatable) {
                     e.preventDefault();
                     handleCreate();
                   }
                 }}
              />
          )}
          
          <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
            {options.filter(o => o.label.toLowerCase().includes(inputValue.toLowerCase())).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${value === option.value ? "bg-white/10 text-white font-medium" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
              >
                {option.label}
                {value === option.value && <Check size={14} className="text-white" />}
              </button>
            ))}
            {creatable && inputValue && !options.find(o => o.label.toLowerCase() === inputValue.toLowerCase()) && (
               <button
                type="button"
                onClick={handleCreate}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 mt-1 border-t border-white/5"
               >
                 <Plus size={14} /> Create "{inputValue}"
               </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Export for backward compatibility or strict creatable usage
export const CreatableSelect = (props: SelectProps) => <Select {...props} creatable={true} />;
