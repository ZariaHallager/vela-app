import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Use the darker mauve glass variant instead of the light champagne default */
  dark?: boolean;
  /** Pulses a soft pink border-glow to draw attention */
  glow?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, dark = false, glow = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          dark ? 'glass-dark text-champagne' : 'glass text-mauve',
          glow && 'animate-glow-border ring-1 ring-pink-300/20',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
