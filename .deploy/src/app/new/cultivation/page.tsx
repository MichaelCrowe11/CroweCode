"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Leaf, Package, Calendar, AlertCircle, ChevronRight, CheckCircle } from "lucide-react";

export default function NewCultivationPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    species: '',
    substrate: '',
    blocks: 0,
    inoculationDate: '',
    notes: ''
  });

  const species = [
    { id: 'lions-mane', name: "Lion's Mane", scientificName: 'Hericium erinaceus', difficulty: 'Medium' },
    { id: 'oyster', name: 'Oyster', scientificName: 'Pleurotus ostreatus', difficulty: 'Easy' },
    { id: 'shiitake', name: 'Shiitake', scientificName: 'Lentinula edodes', difficulty: 'Medium' },
    { id: 'reishi', name: 'Reishi', scientificName: 'Ganoderma lucidum', difficulty: 'Hard' },
    { id: 'blue-oyster', name: 'Blue Oyster', scientificName: 'Pleurotus columbinus', difficulty: 'Easy' }
  ];

  const substrates = [
    { id: 'masters-mix', name: "Master's Mix", composition: '50% Hardwood, 50% Soy Hull' },
    { id: 'hardwood', name: 'Hardwood Pellets', composition: '100% Oak/Maple' },
    { id: 'straw', name: 'Straw Pellets', composition: '100% Wheat Straw' },
    { id: 'supplemented', name: 'Supplemented Sawdust', composition: '80% Hardwood, 20% Bran' }
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log('Submitting cultivation batch:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">New Cultivation Batch</h1>
              <p className="text-sm text-white/60">Start a new mushroom cultivation run</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-white/60">Step {step} of 4</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-white/60">Setup Progress</span>
            <span className="text-xs text-white/60">{(step / 4 * 100).toFixed(0)}% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Species Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Select Species</h2>
              <p className="text-white/60">Choose the mushroom species for this cultivation batch</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {species.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setFormData({ ...formData, species: s.id })}
                  className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${
                    formData.species === s.id 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      <p className="text-sm text-white/60 italic">{s.scientificName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      s.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-300' :
                      s.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {s.difficulty}
                    </span>
                  </div>
                  {formData.species === s.id && (
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Substrate Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Choose Substrate</h2>
              <p className="text-white/60">Select the growing medium for your mushrooms</p>
            </div>

            <div className="space-y-3">
              {substrates.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setFormData({ ...formData, substrate: sub.id })}
                  className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${
                    formData.substrate === sub.id 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{sub.name}</h3>
                      <p className="text-sm text-white/60">{sub.composition}</p>
                    </div>
                    {formData.substrate === sub.id && (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-200 font-medium">Substrate Preparation</p>
                  <p className="text-xs text-yellow-200/70 mt-1">
                    Ensure substrate is properly hydrated to 60-65% moisture content before sterilization
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Batch Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Batch Details</h2>
              <p className="text-white/60">Configure the specifics of your cultivation batch</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Number of Blocks</label>
                <input
                  type="number"
                  value={formData.blocks}
                  onChange={(e) => setFormData({ ...formData, blocks: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., 100"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Inoculation Date</label>
                <input
                  type="date"
                  value={formData.inoculationDate}
                  onChange={(e) => setFormData({ ...formData, inoculationDate: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                  rows={4}
                  placeholder="Any special notes or observations..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Review & Confirm</h2>
              <p className="text-white/60">Review your cultivation batch details before creating</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Species</span>
                <span className="font-medium">
                  {species.find(s => s.id === formData.species)?.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Substrate</span>
                <span className="font-medium">
                  {substrates.find(s => s.id === formData.substrate)?.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Number of Blocks</span>
                <span className="font-medium">{formData.blocks}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Inoculation Date</span>
                <span className="font-medium">{formData.inoculationDate}</span>
              </div>
              {formData.notes && (
                <div className="pt-2">
                  <span className="text-white/60 block mb-2">Notes</span>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm text-emerald-200 font-medium">Ready to Create</p>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    This batch will be added to your active cultivation runs and tracked automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.species) ||
                (step === 2 && !formData.substrate) ||
                (step === 3 && (!formData.blocks || !formData.inoculationDate))
              }
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-black transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-black transition-colors flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Create Batch
            </button>
          )}
        </div>
      </main>
    </div>
  );
}