"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Box,
  Plus,
  ArrowLeft,
  Droplets,
  Percent,
  Calculator,
  FlaskConical,
  Wheat,
  TreePine,
  Info,
  Copy,
  Save,
} from "lucide-react";

// Species presets with optimal hydration and gypsum ratios
const speciesPresets = {
  "oyster": {
    name: "Oyster (Pleurotus)",
    hydration: 65,
    gypsum: 2,
    substrate: "straw_pellets",
    notes: "High moisture tolerance, fast colonization"
  },
  "lions_mane": {
    name: "Lion's Mane (Hericium)",
    hydration: 60,
    gypsum: 1,
    substrate: "hardwood_sawdust",
    notes: "Prefers hardwood, moderate moisture"
  },
  "shiitake": {
    name: "Shiitake (Lentinula)",
    hydration: 55,
    gypsum: 1.5,
    substrate: "oak_sawdust",
    notes: "Slower colonization, premium yield"
  },
  "reishi": {
    name: "Reishi (Ganoderma)",
    hydration: 58,
    gypsum: 2.5,
    substrate: "hardwood_mix",
    notes: "Long fruiting cycle, medicinal focus"
  },
  "cordyceps": {
    name: "Cordyceps militaris",
    hydration: 70,
    gypsum: 0.5,
    substrate: "brown_rice",
    notes: "Requires light during fruiting"
  },
};

const substrateTypes = [
  { id: "straw_pellets", name: "Straw Pellets", fiber: 45, nitrogen: 0.5 },
  { id: "hardwood_sawdust", name: "Hardwood Sawdust", fiber: 55, nitrogen: 0.3 },
  { id: "oak_sawdust", name: "Oak Sawdust", fiber: 58, nitrogen: 0.4 },
  { id: "hardwood_mix", name: "Hardwood Mix", fiber: 52, nitrogen: 0.35 },
  { id: "brown_rice", name: "Brown Rice", fiber: 10, nitrogen: 1.2 },
  { id: "wheat_bran", name: "Wheat Bran", fiber: 42, nitrogen: 2.4 },
  { id: "soy_hulls", name: "Soy Hulls", fiber: 38, nitrogen: 1.8 },
];

// Mock saved recipes
const savedRecipes = [
  {
    id: "RCP-001",
    name: "High-Yield Oyster",
    species: "oyster",
    substrate: "straw_pellets",
    hydration: 68,
    gypsum: 2.5,
    batchSize: 100,
    lastUsed: "2025-01-03",
    avgYield: "3.2 lb/block",
  },
  {
    id: "RCP-002",
    name: "Premium Shiitake",
    species: "shiitake",
    substrate: "oak_sawdust",
    hydration: 56,
    gypsum: 1.8,
    batchSize: 50,
    lastUsed: "2024-12-28",
    avgYield: "2.8 lb/block",
  },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl shadow-sm border border-white/10 bg-white/5 backdrop-blur-md p-5 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] tracking-wide font-semibold px-2 py-1 rounded-md border border-white/10 bg-white/10">
      {children}
    </span>
  );
}

export default function SubstrateMatrixPage() {
  const [selectedSpecies, setSelectedSpecies] = useState("oyster");
  const [hydration, setHydration] = useState(65);
  const [gypsum, setGypsum] = useState(2);
  const [batchSize, setBatchSize] = useState(10); // kg
  const [selectedSubstrate, setSelectedSubstrate] = useState("straw_pellets");

  const handleSpeciesChange = (species: string) => {
    setSelectedSpecies(species);
    const preset = speciesPresets[species as keyof typeof speciesPresets];
    if (preset) {
      setHydration(preset.hydration);
      setGypsum(preset.gypsum);
      setSelectedSubstrate(preset.substrate);
    }
  };

  // Calculate recipe amounts
  const waterAmount = (batchSize * hydration / 100).toFixed(1);
  const gypsumAmount = (batchSize * gypsum / 100 * 1000).toFixed(0); // in grams
  const dryWeight = batchSize;
  const wetWeight = (batchSize * (1 + hydration / 100)).toFixed(1);

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
              <h1 className="text-lg font-semibold leading-tight">Substrate Matrix</h1>
              <p className="text-xs text-white/70">Species-tuned recipes • Hydration autopilot</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="rounded-xl px-4 py-2 text-sm bg-emerald-500/90 hover:bg-emerald-500 text-black font-medium flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Recipe
            </button>
          </div>
        </div>
      </header>

      {/* Recipe Builder */}
      <section className="max-w-7xl mx-auto px-5 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Species Selection */}
            <Card>
              <h3 className="font-semibold mb-4">Species Selection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(speciesPresets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleSpeciesChange(key)}
                    className={`rounded-xl px-4 py-3 text-sm border transition-all ${
                      selectedSpecies === key
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium">{preset.name.split(" (")[0]}</p>
                      <p className="text-xs text-white/60 mt-1">{preset.notes.split(",")[0]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Substrate Type */}
            <Card>
              <h3 className="font-semibold mb-4">Substrate Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {substrateTypes.map((substrate) => (
                  <button
                    key={substrate.id}
                    onClick={() => setSelectedSubstrate(substrate.id)}
                    className={`rounded-xl px-4 py-3 text-sm border transition-all text-left ${
                      selectedSubstrate === substrate.id
                        ? "bg-blue-500/20 border-blue-500/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-medium">{substrate.name}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-white/60">Fiber: {substrate.fiber}%</span>
                      <span className="text-xs text-white/60">N: {substrate.nitrogen}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Parameters */}
            <Card>
              <h3 className="font-semibold mb-4">Recipe Parameters</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Hydration Rate
                    </label>
                    <span className="text-sm font-mono">{hydration}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="80"
                    value={hydration}
                    onChange={(e) => setHydration(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>40% (Dry)</span>
                    <span>80% (Wet)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Gypsum Addition
                    </label>
                    <span className="text-sm font-mono">{gypsum}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={gypsum}
                    onChange={(e) => setGypsum(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>0% (None)</span>
                    <span>5% (Max)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Batch Size
                    </label>
                    <span className="text-sm font-mono">{batchSize} kg</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>1 kg</span>
                    <span>100 kg</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {/* Calculated Recipe */}
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Calculated Recipe
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-white/70">Dry Substrate</span>
                  <span className="font-mono font-semibold">{dryWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/70">Water Required</span>
                  <span className="font-mono font-semibold">{waterAmount} L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/70">Gypsum</span>
                  <span className="font-mono font-semibold">{gypsumAmount} g</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/70">Final Weight</span>
                    <span className="font-mono font-semibold text-emerald-400">{wetWeight} kg</span>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 rounded-lg px-4 py-2 text-sm bg-emerald-500 text-black font-medium hover:bg-emerald-400 flex items-center justify-center gap-2">
                <Copy className="h-4 w-4" />
                Copy Recipe
              </button>
            </Card>

            {/* Tips */}
            <Card>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Pro Tips
              </h3>
              <div className="space-y-2 text-xs text-white/70">
                <p>• Mix substrate thoroughly before hydration</p>
                <p>• Let hydrated substrate rest 1-2 hours</p>
                <p>• Target field capacity: squeeze test</p>
                <p>• Sterilize at 15 PSI for 90-120 min</p>
                <p>• Cool to room temp before inoculation</p>
              </div>
            </Card>

            {/* Species Notes */}
            <Card>
              <h3 className="font-semibold mb-3">Species Notes</h3>
              <p className="text-sm text-white/80">
                {speciesPresets[selectedSpecies as keyof typeof speciesPresets]?.notes}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>[SUBSTRATE]</Badge>
                <Badge>[YIELD]</Badge>
                <Badge>[CONSISTENCY]</Badge>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Saved Recipes */}
      <section className="max-w-7xl mx-auto px-5 py-8">
        <h2 className="text-xl font-semibold mb-4">Saved Recipes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedRecipes.map((recipe) => (
            <Card key={recipe.id} className="hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">{recipe.name}</h4>
                <span className="text-xs text-white/50">{recipe.id}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Species</span>
                  <span>{speciesPresets[recipe.species as keyof typeof speciesPresets]?.name.split(" (")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Hydration</span>
                  <span>{recipe.hydration}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Avg Yield</span>
                  <span className="text-emerald-400">{recipe.avgYield}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-white/50">Last: {recipe.lastUsed}</span>
                <button className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15">
                  Load
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}