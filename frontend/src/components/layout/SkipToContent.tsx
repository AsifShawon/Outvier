'use client';

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-xl focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary text-xs font-bold transition-all"
    >
      Skip to main content
    </a>
  );
}
