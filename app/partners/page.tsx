"use client";

import React, { useState } from "react";
import {
  Globe,
  Handshake,
  Award,
  Plus,
  Search,
  CheckCircle2,
  Building,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users
} from "lucide-react";
import {
  GrowthBusinessService,
  PartnerProfile,
} from "../../services/growthBusiness.service";

export default function PartnersPortalPage() {
  const [partners, setPartners] = useState<PartnerProfile[]>(GrowthBusinessService.getPartners());

  // Application Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PartnerProfile["type"]>("TELECOM");
  const [country, setCountry] = useState("Kenya");

  const handleApplyPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    GrowthBusinessService.registerPartner({
      name,
      type,
      country,
    });

    setPartners([...GrowthBusinessService.getPartners()]);
    setName("");
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 space-y-6">
      
      {/* Hero Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-[#2563EB] text-xs font-bold rounded-full">
            <Handshake className="w-3.5 h-3.5" /> SIMTRACE Global Ecosystem & Partner Program
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Partner with SIMTRACE for Telecom & Forensics Excellence
          </h1>
          <p className="text-xs text-slate-500">
            Join our global reseller, technology, telecom, and consulting network to deliver sovereign SIM swap & telecom intelligence platforms to law enforcement worldwide.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Apply as Enterprise Partner
        </button>
      </div>

      {showModal && (
        <form onSubmit={handleApplyPartner} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#2563EB]" /> Partner Application Registration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Company / Organization Name</label>
              <input
                type="text"
                placeholder="e.g. Acme Cyber Security Ltd"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-[#2563EB]"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Partner Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="TELECOM">TELECOM OPERATOR</option>
                <option value="TECHNOLOGY">TECHNOLOGY INTEGRATOR</option>
                <option value="CONSULTING">CONSULTING FIRM</option>
                <option value="RESELLER">RESELLER</option>
                <option value="GOVERNMENT">GOVERNMENT ENTITY</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Primary Country of Operation</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-medium">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm">
              Submit Application
            </button>
          </div>
        </form>
      )}

      {/* Certified Partner Directory */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600" /> Active Certified Enterprise Partners Directory
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((p) => (
            <div key={p.id} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md">
                  {p.status}
                </span>
              </div>
              <div className="text-slate-500">
                Type: <span className="text-slate-800 font-semibold">{p.type}</span> | Region: <span className="text-slate-800 font-medium">{p.country}</span>
              </div>
              <div className="text-slate-400 font-mono text-[10px]">Referral ID: {p.referralCode}</div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                <span className="text-slate-500">Active Deals: <strong className="text-blue-600 font-bold">{p.activeDealsCount}</strong></span>
                <span className="text-slate-500">Revenue Contribution: <strong className="text-emerald-600 font-bold">${p.revenueGenerated.toLocaleString()} USD</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
