import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-xl bg-[#E0E5EC] px-3 py-1 text-base text-slate-700 shadow-neo-pressed transition-all duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 focus:text-ilh-navy-700 focus:shadow-[inset_6px_6px_10px_0_rgba(0,51,102,0.12),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[inset_6px_6px_10px_0_rgba(239,68,68,0.15),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
