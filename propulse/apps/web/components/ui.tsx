import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Image from "next/image";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export const buttonVariants = cva("button", {
  variants: { variant: { primary: "button-primary", outline: "button-outline", ghost: "button-ghost" } },
  defaultVariants: { variant: "primary" },
});

export function Button({ className, variant, ...props }: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("input", className)} {...props} />;
}

export function Brand() {
  return <span className="brand"><Image className="brand-mark" src="/propulse.svg" width={34} height={34} alt="" unoptimized />PROPULSE</span>;
}
