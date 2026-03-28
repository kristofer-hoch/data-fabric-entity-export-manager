import React from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};

export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <main className={cn("min-h-screen bg-background", className)}>
      <Header />
      {container ? (
        <div className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8 lg:py-12", contentClassName)}>{children}</div>
      ) : (
        children
      )}
    </main>
  );
}
