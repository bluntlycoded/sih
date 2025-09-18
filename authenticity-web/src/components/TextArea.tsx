import React from "react";

type Props = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  className?: string;
  mono?: boolean;
  required?: boolean;
  disabled?: boolean;
};

export default function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  error,
  className = "",
  mono = true,
  required = false,
  disabled = false,
}: Props) {
  const id = React.useId();
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`w-full rounded-lg border px-3 py-2 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-50 ${
          mono ? "font-mono" : ""
        } ${error ? "border-red-500" : "border-gray-300"}`}
        spellCheck={false}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
