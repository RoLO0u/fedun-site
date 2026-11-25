"use client"
 
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
 
import { Button } from "@/components/ui/button"
 
export function ModeToggle() {

  const { resolvedTheme, setTheme } = useTheme()

  function switchTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="outline" size="icon" onClick={switchTheme}
      className="header-outline-control hover:cursor-pointer"
    >
      <Sun
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
      />
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
      />
      <svg className="header-outline-ring size-full" viewBox="0 0 40 40" aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" rx="8" pathLength="100" />
      </svg>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}