interface SettingsInputProps {
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  suffix?: string;
}

export const SettingsInput = ({
  type = "text",
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled = false,
  className = "",
  suffix,
}: SettingsInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "number") {
      const num = parseInt(e.target.value, 10);
      if (!isNaN(num)) {
        if (min !== undefined && num < min) return;
        if (max !== undefined && num > max) return;
        onChange(num);
      }
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        disabled={disabled}
        className={`px-3 py-2 bg-[#1E1F22] text-white text-sm rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:border-white/20 ${
          type === "number" ? "w-20 text-center tabular-nums" : "w-full"
        } ${suffix ? "pr-8" : ""}`}
      />
      {suffix && (
        <span className="absolute right-3 text-gray-500 text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

