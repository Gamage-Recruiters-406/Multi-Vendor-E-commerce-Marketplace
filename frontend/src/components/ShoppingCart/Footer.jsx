import { Mail } from 'lucide-react';
export default function Footer() {
  return (
    <footer className="bg-[#20A47B] text-white pt-16 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-start gap-12">
        
        {/* Left */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-white text-[#20A47B] px-3 py-1 rounded-full font-black tracking-wider text-sm">
              NEXIO
            </div>
            <span className="text-yellow-400 font-bold text-xl">Nexio</span>
          </div>
          <div className="flex items-center gap-3 text-emerald-50">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">name@email.com</span>
          </div>
        </div>
        {/* Center Links */}
        <div className="flex-1 flex gap-20">
          <div className="flex flex-col gap-5 text-emerald-50 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Marketplace</a>
            <a href="#" className="hover:text-white transition-colors">Services</a>
            <a href="#" className="hover:text-white transition-colors">Announcements</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex flex-col gap-5 text-emerald-50 text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">Login</a>
            <a href="#" className="hover:text-white transition-colors">Register</a>
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#" className="hover:text-white transition-colors">Q&A</a>
          </div>
        </div>
        {/* Right */}
        <div className="flex-1 md:border-l border-emerald-400/30 md:pl-12">
          <h3 className="text-2xl font-light mb-6 leading-tight">
            Would like to talk about your<br/>future business?
          </h3>
          <button className="border border-white text-white px-6 py-2.5 rounded hover:bg-white hover:text-[#20A47B] transition-colors text-sm font-bold flex items-center gap-2">
            Get in touch <span>→</span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-emerald-400/30 text-emerald-50/70 text-xs font-medium">
        © 2026 Nexio.inc.
      </div>
    </footer>
  );
}