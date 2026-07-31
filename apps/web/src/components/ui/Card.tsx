import { ReactNode } from 'react';
import clsx from 'clsx';

/** DESIGN_SYSTEM.md §4 "Standard Card": white bg, 12px radius, 1px border, subtle shadow, 20px padding. */
export function Card({
  children,
  title,
  action,
  className,
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('rounded-card border border-border bg-card p-5 shadow-card', className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-card-title font-semibold text-text-primary">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
