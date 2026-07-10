import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-(--color-primary) text-white hover:bg-(--color-primary-light) focus:ring-(--color-primary)":
            variant === "primary",
          "bg-(--color-accent) text-white hover:bg-(--color-accent-light) focus:ring-(--color-accent)":
            variant === "accent",
          "border-2 border-(--color-accent) text-(--color-accent) hover:bg-(--color-accent) hover:text-white focus:ring-(--color-accent)":
            variant === "outline",
          "text-(--color-primary) hover:bg-(--color-primary)/10 focus:ring-(--color-primary)":
            variant === "ghost",
        },
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-2.5 text-base": size === "md",
          "px-7 py-3 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}