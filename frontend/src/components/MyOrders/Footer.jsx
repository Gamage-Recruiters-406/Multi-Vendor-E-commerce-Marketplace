import React from 'react'
import { Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#229B71] text-white mt-16 relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-white/10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand & Contact */}
          <div className="space-y-6 z-10 relative">
            <div className="flex items-center gap-2">
              <div className="bg-white text-[#229B71] px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                NEXIO
              </div>
              <span className="font-bold text-2xl tracking-tight text-yellow-400">
                Nexio
              </span>
            </div>

            <div className="pt-4 border-t border-white/20">
              <a
                href="mailto:name@email.com"
                className="flex items-center gap-2 hover:text-yellow-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>name@email.com</span>
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="z-10 relative">
            <ul className="space-y-4 text-emerald-50">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Marketplace
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Services
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Announcements
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="z-10 relative">
            <ul className="space-y-4 text-emerald-50">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Register
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Q&A
                </a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="z-10 relative border-l border-white/20 pl-0 lg:pl-8">
            <h3 className="text-xl font-medium mb-6 leading-snug">
              Would like to talk about your future business?
            </h3>
            <button className="border border-white hover:bg-white hover:text-[#229B71] transition-colors px-6 py-2 rounded text-sm font-medium flex items-center gap-2">
              Get in touch &rarr;
            </button>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/20 text-sm text-emerald-100 z-10 relative">
          &copy; 2026 Nexio.inc.
        </div>
      </div>
    </footer>
  )
}