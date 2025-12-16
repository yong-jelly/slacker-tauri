import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SettingsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
}

export const SettingsSelect = ({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
}: SettingsSelectProps) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none w-full px-3 py-2 pr-8 bg-[#1E1F22] text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all hover:border-white/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

