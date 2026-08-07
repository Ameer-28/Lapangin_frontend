import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0F172A] text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#16A34A] rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">F</span></div>
              <span className="text-white font-bold text-lg">Lapang.in</span>
            </div>
            <p className="text-sm leading-relaxed">The easiest way to book futsal fields across Indonesia. Real-time availability, secure payments, happy players.</p>
            <div className="flex items-center gap-3 mt-5">
              {[MapPin, Phone, Mail].map((Icon, i) => (
                <button key={i} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"><Icon className="w-4 h-4" /></button>
              ))}
            </div>
          </div>
          {[
            { title: "Company",  links: ["About Us","Careers","Press","Blog"] },
            { title: "Support",  links: ["Help Center","Contact Us","Privacy Policy","Terms"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <button className="text-sm hover:text-white transition-colors">{l}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-white font-semibold mb-4">Newsletter</h4>
            <p className="text-sm mb-4">Get the latest news and promo codes.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Your email" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-[#16A34A]" />
              <button className="bg-[#16A34A] text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#15803d]">Sub</button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm">
          <p>© 2026 Lapang.in. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" /> All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
