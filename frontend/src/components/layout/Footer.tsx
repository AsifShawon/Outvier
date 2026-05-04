import Link from 'next/link';
import { Globe, MapPin, Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-auto pt-16 pb-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          {/* Brand & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20 group-hover:shadow-primary-600/40 transition-all duration-300">
                <Globe className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
                Out<span className="text-primary-600 dark:text-primary-400">vier</span>
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
              Empowering students worldwide to make data-driven decisions about their study-abroad journey. Find the right university, compare programs, and plan your budget.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons placeholders */}
              {['twitter', 'linkedin', 'facebook'].map((social) => (
                <a key={social} href={`#${social}`} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-primary-100 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 transition-colors">
                  <Globe className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Product</h3>
            <ul className="space-y-4">
              {[
                { href: '/universities', label: 'Universities' },
                { href: '/programs', label: 'Programs' },
                { href: '/compare', label: 'Compare Tool' },
                { href: '/budget', label: 'Cost Estimator' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Study In</h3>
            <ul className="space-y-4">
              {['Australia', 'Canada', 'United Kingdom', 'United States', 'New Zealand'].map((country) => (
                <li key={country}>
                  <Link href={`/universities?country=${country.toLowerCase()}`} className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
                    {country}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-500 dark:text-slate-400 font-medium">
                <MapPin className="w-5 h-5 shrink-0 text-slate-400" />
                <span>123 Global Education Blvd<br />Sydney, NSW 2000</span>
              </li>
              <li className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium hover:text-primary-600 transition-colors cursor-pointer">
                <Mail className="w-5 h-5 shrink-0 text-slate-400" />
                <span>hello@outvier.com</span>
              </li>
              <li className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium hover:text-primary-600 transition-colors cursor-pointer">
                <Phone className="w-5 h-5 shrink-0 text-slate-400" />
                <span>+61 2 1234 5678</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Outvier. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/admin" className="hover:text-slate-900 dark:hover:text-white transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
