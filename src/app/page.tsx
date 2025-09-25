import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ArrowRight, Wallet } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 md:px-6 z-10">
        <Logo />
      </header>
      <main className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 flex items-center justify-center">
          <Image
            src="https://picsum.photos/seed/hero/1920/1080"
            alt="Hero background"
            fill
            className="object-cover"
            data-ai-hint="finance abstract"
            priority
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  <Wallet className="inline-block w-4 h-4 mr-2" />
                  Your Financial Companion
                </div>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-headline text-primary">
                  FinPouch
                </h1>
                <p className="mx-auto max-w-[700px] text-foreground/80 md:text-xl">
                  Build Spending Awareness with Every Wallet Open. Take control of your finances by understanding your habits.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Sign Up <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/login">Log In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FinPouch. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
