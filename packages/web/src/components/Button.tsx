import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-gray-200 text-gray-800 border border-gray-300 hover:border-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
