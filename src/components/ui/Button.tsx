"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            isLoading = false,
            leftIcon,
            rightIcon,
            children,
            disabled,
            className = "",
            ...props
        },
        ref
    ) => {
        return (
            <button
                ref={ref}
                className={`btn btn-${variant} btn-${size} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                <style jsx>{`
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-2);
            font-weight: var(--font-medium);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-fast);
            white-space: nowrap;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* Variants */
          .btn-primary {
            background: var(--color-accent-secondary);
            border: none;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background: var(--color-accent-secondary-hover);
          }

          .btn-secondary {
            background: var(--color-bg-tertiary);
            border: 1px solid var(--color-border-default);
            color: var(--color-text-primary);
          }

          .btn-secondary:hover:not(:disabled) {
            background: var(--color-bg-hover);
            border-color: var(--color-border-strong);
          }

          .btn-danger {
            background: var(--color-error);
            border: none;
            color: white;
          }

          .btn-danger:hover:not(:disabled) {
            background: hsl(0, 84%, 50%);
          }

          .btn-ghost {
            background: transparent;
            border: none;
            color: var(--color-text-secondary);
          }

          .btn-ghost:hover:not(:disabled) {
            background: var(--color-bg-tertiary);
            color: var(--color-text-primary);
          }

          /* Sizes */
          .btn-sm {
            padding: var(--space-1) var(--space-3);
            font-size: var(--text-xs);
          }

          .btn-md {
            padding: var(--space-2) var(--space-4);
            font-size: var(--text-sm);
          }

          .btn-lg {
            padding: var(--space-3) var(--space-6);
            font-size: var(--text-base);
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
                {isLoading && <Loader2 size={16} className="spinner" />}
                {!isLoading && leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        );
    }
);

Button.displayName = "Button";
