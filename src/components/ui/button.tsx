import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "cursor-pointer group relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold tracking-tight transition-[background,box-shadow,color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:saturate-75 active:translate-y-0.5 motion-safe:active:scale-[0.99] [&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-foreground shadow-[0_15px_35px_hsl(var(--background)_/_0.85)] hover:bg-primary/90 hover:shadow-[0_20px_45px_hsl(var(--background)_/_0.9)] active:bg-primary/80",
        secondary:
          "bg-foreground text-background shadow-[0_12px_30px_hsl(var(--background)_/_0.35)] hover:bg-foreground/95",
        ghost:
          "border-border/60 bg-transparent text-foreground hover:bg-foreground/10 active:bg-foreground/15",
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
