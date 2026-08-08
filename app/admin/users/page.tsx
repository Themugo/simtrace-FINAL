"use client";

import React, { useState } from "react";
import { Users, Shield, Lock, Search, UserPlus, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([
    { id: "u1", name: "Inspector Jane Doe", email: "j.doe@police.gov.ke", role: "investigator", org: "National Police Service", status: "Active" },
    { id: "u2", name: "Agent Alex Smith", email: "a.smith@telecom.co.ke", role: "telecom_admin", org: "Safaricom Intelligence", status: "Active" },
    { id: "u3", name: "Supervisor John Tan", email: "j.tan@simtrace.io", role: "admin", org: "SimTrace Enterprise HQ", status: "Active" },
  ]);

  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Governance & Access Control Desk</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">Organization data isolation, investigator permissions, and role management</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
          <UserPlus className="w-4 h-4" /> Provision New User
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between my-6">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">Total Users: {users.length}</div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Organization Isolation</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/50 transition">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-200">{u.name}</div>
                  <div className="text-slate-400">{u.email}</div>
                </td>
                <td className="py-3.5 px-4 font-mono text-blue-400 font-semibold">{u.role}</td>
                <td className="py-3.5 px-4 text-slate-300">{u.org}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-semibold">
                    <CheckCircle className="w-3 h-3" /> {u.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button className="text-slate-400 hover:text-white font-semibold transition">Edit Role</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
