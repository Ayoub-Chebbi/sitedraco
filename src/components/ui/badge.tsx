import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
        secondary: "bg-gray-700 text-gray-300",
        destructive: "bg-red-600/20 text-red-400 border border-red-600/30",
        success: "bg-green-600/20 text-green-400 border border-green-600/30",
        warning: "bg-yellow-600/20 text-yellow-400 border border-yellow-600/30",
        outline: "border border-gray-600 text-gray-400",
        ps4: "bg-blue-700/20 text-blue-400 border border-blue-700/30",
        ps5: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        xbox: "bg-green-700/20 text-green-400 border border-green-700/30",
        steam: "bg-gray-600/20 text-gray-300 border border-gray-600/30",
        nintendo: "bg-red-600/20 text-red-400 border border-red-600/30",
        mobile: "bg-orange-600/20 text-orange-400 border border-orange-600/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
