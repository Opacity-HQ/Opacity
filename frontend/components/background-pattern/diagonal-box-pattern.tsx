import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DiagonalBoxPatternProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

const DiagonalBoxPattern = forwardRef<HTMLDivElement, DiagonalBoxPatternProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="diagonal-box-pattern"
        className={cn(
          "relative isolate overflow-hidden bg-white dark:bg-[#0a0a0a] [background-image:repeating-linear-gradient(45deg,#f5f5f5_0,#f5f5f5_1px,transparent_0,transparent_50%)] dark:[background-image:repeating-linear-gradient(45deg,#1a1a1a_0,#1a1a1a_1px,transparent_0,transparent_50%)] [background-size:12px_12px]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

DiagonalBoxPattern.displayName = "DiagonalBoxPattern";
export { DiagonalBoxPattern };
