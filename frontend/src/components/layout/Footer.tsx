import Link from 'next/link';
import { GraduationCap, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/50 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-display">
                Out<span className="text-primary">vier</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              A comparative analytics dashboard for discovering and comparing university programs across Australia.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Explore</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/universities', label: 'Universities' },
                { href: '/programs', label: 'Programs' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Admin</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/login', label: 'Login' },
                { href: '/admin', label: 'Dashboard' },
                { href: '/admin/uploads', label: 'CSV Upload' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border/60 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Outvier. Built for ICT801 research.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://australia.gov.au"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
