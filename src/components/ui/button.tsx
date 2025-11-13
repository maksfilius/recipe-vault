import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold tracking-tight transition-[background,box-shadow,color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:saturate-75 active:translate-y-0.5 motion-safe:active:scale-[0.99] [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:bg-primary/90 hover:shadow-[0_20px_45px_rgba(0,0,0,0.35)] active:bg-primary/80",
        secondary:
          "bg-muted text-foreground/90 shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:bg-muted/80 hover:text-foreground",
        accent:
          "bg-gradient-to-b from-primary/95 via-primary to-primary/80 text-white shadow-[0_18px_45px_rgba(23,37,84,0.55)] hover:from-primary hover:to-primary/70 dark:from-primary/80 dark:to-primary/60",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_15px_35px_rgba(159,18,57,0.45)] hover:bg-destructive/90",
        outline:
          "border-white/20 bg-transparent text-foreground shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:border-white/40 hover:bg-white/5 dark:border-white/10",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground active:bg-white/15",
        link: "border-none bg-transparent px-0 py-0 text-primary underline-offset-4 hover:underline focus-visible:underline",
      },
      size: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-5 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "ghost",
        size: "icon",
        class: "rounded-full",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
