interface SettingsToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const SettingsToggle = ({
  checked,
  onChange,
  disabled = false,
  className = "",
}: SettingsToggleProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-[#2B2D31]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? "bg-green-500" : "bg-gray-600"}
        ${className}
      `}
    >
      <span
        className={`
          absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm
          transition-all duration-200 ease-in-out
          ${checked ? "left-7" : "left-1"}
        `}
      />
    </button>
  );
};
