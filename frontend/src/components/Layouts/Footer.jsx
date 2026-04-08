import React from "react";

const footerBg = "linear-gradient(90deg, #16a085 0%, #1abc9c 100%)";

const FooterLink = ({ href = "#", children }) => (
  <a
    href={href}
    className="inline-flex text-sm text-white/80 transition-colors hover:text-white"
  >
    {children}
  </a>
);

export default function Footer() {
  return (
    <footer style={{ background: footerBg }} className="text-white">
      {/* Main Content */}
      <div className="mx-auto w-full 'max-w-350' px-5 py-12 sm:w-[88%] sm:px-10 lg:w-[86%] lg:px-14">
        <div className="grid grid-cols-4 gap-8">
          {/* Section 1: Logo & Email */}
          <div className="flex flex-col border-r border-white/30 pr-8">
            <div className="flex items-center gap-2 mb-6">
                <img src="/logo.png" alt="Nexio Logo" className="h-20 w-auto object-contain mb-4" width={140} height={80}
              />
              <div className="text-3xl font-bold">
                <span className="text-white">Ne</span>
                <span className="text-yellow-400">xio</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="text-lg">✉</span>
              <span>name@email.com</span>
            </div>

          </div>

            

          {/* Section 2: Marketplace */}
          <div className=" pl-16">
            <div className="flex flex-col gap-3">
              <FooterLink href="#marketplace">Marketplace</FooterLink>
              <FooterLink href="#services">Services</FooterLink>
              <FooterLink href="#announcements">Announcements</FooterLink>
              <FooterLink href="#contact">Contact</FooterLink>
            </div>
          </div>

          {/* Section 3: Login */}
          <div className="border-r border-white/30 pl-16">
            <div className="flex flex-col gap-3">
              <FooterLink href="#login">Login</FooterLink>
              <FooterLink href="#register">Register</FooterLink>
              <FooterLink href="#home">Home</FooterLink>
              <FooterLink href="#qa">Q&A</FooterLink>
            </div>
          </div>

          {/* Section 4: CTA */}
          <div className="pl-0">
            <p className="text-2xl font-light text-white mb-6 leading-relaxed">
              Would like to talk about your future business?
            </p>
            <button className="border-2 border-white text-white px-6 py-2 rounded text-sm font-semibold hover:bg-white hover:text-teal-600 transition-all duration-300">
              Get in touch →
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/30">
        {/* Bottom Section with Grid */}
        <div className="mx-auto w-full 'max-w-350' px-5 py-6 sm:w-[88%] sm:px-10 lg:w-[86%] lg:px-14">
          <div className="grid grid-cols-4 gap-8">
            <div className="border-r border-white/30"></div>
            <div className="border-r border-[#17a78b]"></div>
            <div className="border-r border-white/30"></div>
            <div className="flex items-center text-sm text-white/80">
              © 2026 Nexio.inc.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}