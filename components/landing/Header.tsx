"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Glean Family Tree</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Features
          </Link>
          <Link href="#how-it-works" className="transition-colors hover:text-foreground/80 text-foreground/60">
            How it Works
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/dashboard">
            <Button variant="default" size="sm">
              Open Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
