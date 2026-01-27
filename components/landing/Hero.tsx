"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import boyAndGirl from "@/public/images/boy-and-girl.png";

export default function Hero() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10 lg:py-32 lg:grid-cols-2 lg:gap-10">
      <div className="flex max-w-[980px] flex-col items-start gap-4">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
          Visualize Your <br className="hidden sm:inline" />
          Family Connections
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          Glean Family Tree helps you organize, visualize, and share your family history. 
          Built for teams that care about privacy and long-term ownership of their data.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="h-11 px-8">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[500px] items-center justify-center lg:max-w-none">
        <div className="relative aspect-square w-full max-w-[500px]">
           {/* Fallback or actual image */}
           <Image 
            src={boyAndGirl} 
            alt="Family Illustration" 
            className="object-contain"
            fill
            priority
           />
        </div>
      </div>
    </section>
  );
}
