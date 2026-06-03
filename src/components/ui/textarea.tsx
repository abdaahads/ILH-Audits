import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl bg-[#E0E5EC] px-3 py-2 text-base text-slate-700 shadow-neo-pressed transition-all duration-200 outline-none placeholder:text-slate-400 focus:text-ilh-navy-700 focus:shadow-[inset_6px_6px_10px_0_rgba(0,51,102,0.12),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:shadow-[inset_6px_6px_10px_0_rgba(239,68,68,0.15),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
