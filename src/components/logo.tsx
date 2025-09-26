import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-headline", className)}>
      <Image src="/loogoo.jpg" alt="FinPouch Logo" width={32} height={32} className="rounded-md" />
      <span className="text-xl font-bold text-foreground">FinPouch</span>
    </div>
  );
}
