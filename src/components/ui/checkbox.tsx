"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox } 