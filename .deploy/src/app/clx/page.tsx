"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Plus,
  Filter,
  Download,
  ArrowLeft,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

// Mock data for CLX extracts
const mockExtracts = [
  {
    id: "CLX-2025-001",
    strain: "Cordyceps militaris",
    phase: "DUAL_PHASE",
    lbr: 8.4,
    tier: "GOLD",
    startDate: "2025-01-02",
    status: "active",
    yield: "12.3g",
    purity: "94.2%",
  },
  {
    id: "CLX-2025-002",
    strain: "Lion's Mane",
    phase: "WATER",
    lbr: 6.2,
    tier: "SILVER",
    startDate: "2025-01-04",
    status: "active",
    yield: "8.7g",
    purity: "91.5%",
  },
  {
    id: "CLX-2025-003",
    strain: "Turkey Tail",
    phase: "ETHANOL",
    lbr: 7.8,
    tier: "GOLD",
    startDate: "2024-12-28",
    status: "completed",
    yield: "15.4g",
    purity: "96.8%",
  },
  {
    id: "CLX-2025-004",
    strain: "Reishi",
    phase: "DUAL_PHASE",
    lbr: 5.1,
    tier: "BRONZE",
    startDate: "2025-01-05",
    status: "failed",
    yield: "3.2g",
    purity: "72.3%",
  },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl shadow-sm border border-white/10 bg-white/5 backdrop-blur-md p-5 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: string }) {
  const variants: Record<string, string> = {
    default: "border-white/10 bg-white/10",
    gold: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    silver: "border-gray-400/30 bg-gray-400/10 text-gray-300",
    bronze: "border-orange-600/30 bg-orange-600/10 text-orange-400",
    active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    completed: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    failed: "border-red-500/30 bg-red-500/10 text-red-400",
  };
  
  return (
    <span className={`text-[10px] tracking-wide font-semibold px-2 py-1 rounded-md border ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Clock className="h-4 w-4 text-emerald-400" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-400" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

export default function CLXExtractsPage() {
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [showNewExtractForm, setShowNewExtractForm] = useState(false);

  const filteredExtracts = selectedPhase === "all" 
    ? mockExtracts 
    : mockExtracts.filter(e => e.phase === selectedPhase);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-white/10">
              <Image
                src="/crowe-avatar.png"
                alt="Crowe Logic Avatar"
                width={40}
                height={40}
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">CLX Extracts</h1>
              <p className="text-xs text-white/70">Dual-phase extract tracker • LBR™ scoring</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setShowNewExtractForm(!showNewExtractForm)}
              className="rounded-xl px-4 py-2 text-sm bg-emerald-500/90 hover:bg-emerald-500 text-black font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Extract
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-5 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-white/70">Active Extracts</p>
            <p className="text-2xl font-semibold">2</p>
            <p className="text-xs text-emerald-400 mt-1">↑ 12% this week</p>
          </Card>
          <Card>
            <p className="text-xs text-white/70">Avg LBR Score</p>
            <p className="text-2xl font-semibold">6.9</p>
            <p className="text-xs text-white/50 mt-1">Target: 7.5+</p>
          </Card>
          <Card>
            <p className="text-xs text-white/70">Gold Tier Rate</p>
            <p className="text-2xl font-semibold">50%</p>
            <p className="text-xs text-yellow-400 mt-1">2 of 4 batches</p>
          </Card>
          <Card>
            <p className="text-xs text-white/70">Avg Purity</p>
            <p className="text-2xl font-semibold">88.7%</p>
            <p className="text-xs text-blue-400 mt-1">↑ 3.2% improvement</p>
          </Card>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-5 pt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setSelectedPhase("all")}
            className={`rounded-xl px-4 py-2 text-sm border transition-colors ${
              selectedPhase === "all"
                ? "bg-white/15 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            All Phases
          </button>
          <button
            onClick={() => setSelectedPhase("DUAL_PHASE")}
            className={`rounded-xl px-4 py-2 text-sm border transition-colors ${
              selectedPhase === "DUAL_PHASE"
                ? "bg-white/15 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            Dual Phase
          </button>
          <button
            onClick={() => setSelectedPhase("WATER")}
            className={`rounded-xl px-4 py-2 text-sm border transition-colors ${
              selectedPhase === "WATER"
                ? "bg-white/15 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            Water Only
          </button>
          <button
            onClick={() => setSelectedPhase("ETHANOL")}
            className={`rounded-xl px-4 py-2 text-sm border transition-colors ${
              selectedPhase === "ETHANOL"
                ? "bg-white/15 border-white/20"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            Ethanol Only
          </button>
        </div>
      </section>

      {/* New Extract Form */}
      {showNewExtractForm && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="max-w-7xl mx-auto px-5 pt-6"
        >
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <h3 className="font-semibold mb-4">Start New Extract</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/70 block mb-1">Strain</label>
                <input
                  type="text"
                  placeholder="e.g., Cordyceps militaris"
                  className="w-full rounded-lg px-3 py-2 bg-white/10 border border-white/10 text-sm focus:border-white/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">Extraction Phase</label>
                <select className="w-full rounded-lg px-3 py-2 bg-white/10 border border-white/10 text-sm focus:border-white/20 outline-none">
                  <option value="DUAL_PHASE">Dual Phase</option>
                  <option value="WATER">Water Only</option>
                  <option value="ETHANOL">Ethanol Only</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/70 block mb-1">Starting Material (g)</label>
                <input
                  type="number"
                  placeholder="100"
                  className="w-full rounded-lg px-3 py-2 bg-white/10 border border-white/10 text-sm focus:border-white/20 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="rounded-lg px-4 py-2 text-sm bg-emerald-500 text-black font-medium hover:bg-emerald-400">
                Start Extract
              </button>
              <button
                onClick={() => setShowNewExtractForm(false)}
                className="rounded-lg px-4 py-2 text-sm bg-white/10 border border-white/10 hover:bg-white/15"
              >
                Cancel
              </button>
            </div>
          </Card>
        </motion.section>
      )}

      {/* Extracts Table */}
      <section className="max-w-7xl mx-auto px-5 py-6">
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-xs text-white/70">
                  <th className="text-left p-4">Extract ID</th>
                  <th className="text-left p-4">Strain</th>
                  <th className="text-left p-4">Phase</th>
                  <th className="text-left p-4">LBR™</th>
                  <th className="text-left p-4">Tier</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Yield</th>
                  <th className="text-left p-4">Purity</th>
                  <th className="text-left p-4">Started</th>
                </tr>
              </thead>
              <tbody>
                {filteredExtracts.map((extract, i) => (
                  <motion.tr
                    key={extract.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm">{extract.id}</td>
                    <td className="p-4 text-sm">{extract.strain}</td>
                    <td className="p-4">
                      <Badge>{extract.phase.replace("_", " ")}</Badge>
                    </td>
                    <td className="p-4 text-sm font-semibold">{extract.lbr}</td>
                    <td className="p-4">
                      <Badge variant={extract.tier.toLowerCase()}>{extract.tier}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={extract.status} />
                        <Badge variant={extract.status}>{extract.status}</Badge>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{extract.yield}</td>
                    <td className="p-4 text-sm">{extract.purity}</td>
                    <td className="p-4 text-sm text-white/50">{extract.startDate}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Footer Actions */}
      <section className="max-w-7xl mx-auto px-5 pb-12">
        <div className="flex items-center gap-3">
          <button className="rounded-xl px-4 py-2 text-sm bg-white/10 border border-white/10 hover:bg-white/15 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </button>
          <button className="rounded-xl px-4 py-2 text-sm bg-white/10 border border-white/10 hover:bg-white/15 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="rounded-xl px-4 py-2 text-sm bg-white/10 border border-white/10 hover:bg-white/15 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            View Analytics
          </button>
        </div>
      </section>
    </div>
  );
}