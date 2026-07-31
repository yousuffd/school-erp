import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

/** DESIGN_SYSTEM.md §4 "Buttons": primary = accent fill/white text; secondary = white bg/border/dark text. 8px radius. */
export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-button px-4 py-2 text-body font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent/90',
        variant === 'secondary' && 'border border-border bg-card text-text-primary hover:bg-canvas',
        className,
      )}
      {...props}
    />
  );
}
