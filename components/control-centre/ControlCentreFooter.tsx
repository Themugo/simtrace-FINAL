"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useSiteConfig } from "../SiteConfigContext";

export default function ControlCentreFooter() {
  const { config } = useSiteConfig();

  return (
    <footer className="border-t border-[#1769FF]/20 bg-[#05132B] pt-12 pb-16 text-slate-300 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
          
          {/* Col 1: Platform */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <ShieldCheck className="w-5 h-5 text-[#18C8FF]" />
              <span>{config.brandName}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              {config.footerText}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ● ALL SYSTEMS OPERATIONAL
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links from SiteConfig */}
          <div className="space-y-3">
            <div className="font-mono text-white font-bold text-xs uppercase tracking-wider">
              NAVIGATION
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 font-mono">
              {config.navigation.filter(n => n.visible).map((nav) => (
                <li key={nav.id}>
                  <Link href={nav.route} className="hover:text-[#18C8FF] transition flex items-center gap-1.5">
                    <span>{nav.label}</span>
                    {nav.badge && (
                      <span className="px-1.5 py-0.2 rounded bg-[#1769FF]/20 text-[#18C8FF] text-[9px] font-bold">
                        {nav.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Network Ecosystem */}
          <div className="space-y-3">
            <div className="font-mono text-white font-bold text-xs uppercase tracking-wider">
              NETWORK
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 font-mono">
              <li><Link href="/telecom-portal" className="hover:text-[#18C8FF] transition">Telecom Partners</Link></li>
              <li><Link href="/advertise" className="hover:text-[#18C8FF] transition">Marketplace Trust</Link></li>
              <li><Link href="/community" className="hover:text-[#18C8FF] transition">Community Mesh</Link></li>
              <li><Link href="/police/dashboard" className="hover:text-[#18C8FF] transition">Authorized Recovery</Link></li>
              <li><Link href="/partners" className="hover:text-[#18C8FF] transition">Global Ecosystem</Link></li>
            </ul>
          </div>

          {/* Col 4: Developers */}
          <div className="space-y-3">
            <div className="font-mono text-white font-bold text-xs uppercase tracking-wider">
              DEVELOPERS
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 font-mono">
              <li><Link href="/developer" className="hover:text-[#18C8FF] transition">Developer Portal</Link></li>
              <li><Link href="/docs" className="hover:text-[#18C8FF] transition">API Documentation</Link></li>
              <li><Link href="/imei" className="hover:text-[#18C8FF] transition">IMEI Verification API</Link></li>
              <li><Link href="/status" className="hover:text-[#18C8FF] transition">System Status</Link></li>
            </ul>
          </div>

          {/* Col 5: Governance & Admin Studio */}
          <div className="space-y-3">
            <div className="font-mono text-white font-bold text-xs uppercase tracking-wider">
              ADMINISTRATIVE
            </div>
            <ul className="space-y-2 text-[11px] text-slate-400 font-mono">
              <li><Link href="/admin" className="text-amber-300 font-bold hover:text-amber-200 transition">★ Admin Redesign Studio</Link></li>
              <li><Link href="/trust-platform" className="hover:text-[#18C8FF] transition">Trust Center</Link></li>
              <li><Link href="/compliance" className="hover:text-[#18C8FF] transition">Regulatory Compliance</Link></li>
              <li><Link href="/evidence" className="hover:text-[#18C8FF] transition">Chain of Custody</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-400">
          <div>
            {config.copyrightText}
          </div>
          <div className="flex items-center gap-4">
            <span>{config.version}</span>
            <span>•</span>
            <span className="text-emerald-400">SOC 2 / ISO 27001</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
