import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const cardVariants = cva(
  "group relative flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-card text-card-foreground shadow-[0_25px_65px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/10",
  {
    variants: {
      variant: {
        elevated:
          "bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-900/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-black/60",
        subtle: "border-white/5 bg-muted/20 shadow-[0_15px_45px_rgba(0,0,0,0.35)]",
        outline: "border-dashed border-white/15 bg-transparent shadow-none",
        glass:
          "border-white/10 bg-white/5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.55)] supports-[backdrop-filter]:backdrop-blur-2xl",
      },
      interactive: {
        true: "hover:-translate-y-1 hover:shadow-[0_35px_85px_rgba(0,0,0,0.6)] focus-within:-translate-y-1",
        false: "",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "elevated",
      interactive: false,
      padding: "none",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, padding, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, interactive, padding, className }))} {...props} />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-2 px-6 pb-4 pt-6 text-left", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm leading-relaxed text-muted-foreground/90", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("px-6 pb-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-6 py-4 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
