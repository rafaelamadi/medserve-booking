import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "cn"

const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-input bg-transparent transition-colors outline-none file:inline-flex file:border-0 file:bg-transparent file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        sm: "h-8 px-2.5 py-1 text-xs file:h-6 file:text-xs",
        default: "h-9 px-3 py-1.5 text-sm file:h-7 file:text-sm",
        lg: "h-11 px-3.5 py-2 text-base md:text-sm file:h-8 file:text-sm",
        xl: "h-12 px-4 py-2.5 text-base file:h-9 file:text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "sm" | "default" | "lg" | "xl" | number | null;
}

function Input({
  className,
  type,
  size = "default",
  ...props
}: InputProps) {
  const sizeVariant = typeof size === "string" ? size : "default";
  const htmlSize = typeof size === "number" ? size : undefined;

  return (
    <input
      type={type}
      size={htmlSize}
      data-slot="input"
      data-size={sizeVariant}
      className={cn(inputVariants({ size: sizeVariant as "sm" | "default" | "lg" | "xl", className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
