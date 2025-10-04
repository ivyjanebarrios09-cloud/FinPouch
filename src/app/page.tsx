"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ArrowRight, Wallet, TrendingUp, Target } from "lucide-react";
import Image from "next/image";
import { useScrollEffect } from "@/hooks/use-scroll-effect";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const { scrollY } = useScrollEffect();
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-background');
  const trackHabitsImage = PlaceHolderImages.find(p => p.id === 'track-habits');
  const gainInsightsImage = PlaceHolderImages.find(p => p.id === 'gain-insights');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 p-4 md:px-6 z-20 bg-background/50 backdrop-blur-sm">
        <Logo />
      </header>
      <main className="flex-1">
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt="Hero background"
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
              style={{
                transform: `translateY(${scrollY * 0.4}px)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          <div className="container px-4 md:px-6 relative text-center">
            <div className="flex flex-col items-center space-y-6">
              <div className="space-y-4">
                <Image src="/llooggoo.png" alt="FinPouch Logo" width={200} height={200} className="rounded-lg mx-auto" />
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                  <Wallet className="inline-block w-4 h-4 mr-2" />
                  Your Financial Companion
                </div>
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

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Track Your Habits</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  FinPouch logs every time you open your wallet, giving you a clear picture of your spending impulses. Become more mindful of your financial actions.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild>
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                </div>
              </div>
              {trackHabitsImage && (
                <Image
                  src={trackHabitsImage.imageUrl}
                  alt="Feature: Track Habits"
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full"
                  data-ai-hint={trackHabitsImage.imageHint}
                />
              )}
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
               {gainInsightsImage && (
                <Image
                  src={gainInsightsImage.imageUrl}
                  alt="Feature: Gain Insights"
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                  data-ai-hint={gainInsightsImage.imageHint}
                />
              )}
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">Analytics</div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Gain Powerful Insights</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  With our intuitive dashboard, visualize your wallet activity. Understand your peak spending times and get AI-powered advice to improve your financial wellness.
                </p>
                <ul className="grid gap-2 py-4">
                    <li>
                        <TrendingUp className="mr-2 inline-block h-4 w-4" />
                        Identify trends with beautiful charts.
                    </li>
                    <li>
                        <Target className="mr-2 inline-block h-4 w-4" />
                        Get personalized AI suggestions.
                    </li>
                </ul>
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
