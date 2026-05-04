import { cn } from "@srdl/ui/lib/utils";
import type { ComponentProps } from "react";

type LogoProps = Omit<ComponentProps<"img">, "src">;

export function Logo({ alt = "SRDL logo", className, ...props }: LogoProps) {
  return (
    <img
      alt={alt}
      className={cn("block h-8 w-auto object-contain", className)}
      src="/logo.svg"
      {...props}
    />
  );
}

export default Logo;
