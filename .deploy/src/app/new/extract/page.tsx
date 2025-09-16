"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical, Droplets, Timer, AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";

export default function NewExtractPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    source: '',
    method: '',
    solvent: '',
    temperature: 70,
    duration: 120,
    volume: 0,
    notes: ''
  });

  const sources = [
    { id: 'lions-mane-fruit', name: "Lion's Mane Fruiting Bodies", type: 'Fresh', moisture: '90%' },
    { id: 'reishi-fruit', name: 'Reishi Fruiting Bodies', type: 'Dried', moisture: '10%' },
    { id: 'cordyceps-mycelium', name: 'Cordyceps Mycelium', type: 'Cultured', moisture: '75%' },
    { id: 'turkey-tail-fruit', name: 'Turkey Tail Fruiting Bodies', type: 'Dried', moisture: '12%' }
  ];

  const methods = [
    { id: 'hot-water', name: 'Hot Water Extraction', temp: '70-90°C', time: '2-4 hours' },
    { id: 'dual', name: 'Dual Extraction', temp: 'Variable', time: '2-7 days' },
    { id: 'alcohol', name: 'Alcohol Tincture', temp: 'Room temp', time: '14-30 days' },
    { id: 'ultrasonic', name: 'Ultrasonic Assisted', temp: '40-60°C', time: '30-60 min' }
  ];

  const solvents = [
    { id: 'water', name: 'Distilled Water', polarity: 'Polar' },
    { id: 'ethanol-50', name: '50% Ethanol', polarity: 'Semi-polar' },
    { id: 'ethanol-70', name: '70% Ethanol', polarity: 'Semi-polar' },
    { id: 'ethanol-95', name: '95% Ethanol', polarity: 'Non-polar' }
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    console.log('Submitting extract batch:', formData);
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
              <h1 className="text-xl font-semibold">New Extract Batch</h1>
              <p className="text-sm text-white/60">Start a new extraction process</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-500" />
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
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Source Material */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Source Material</h2>
              <p className="text-white/60">Select the mushroom material for extraction</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => setFormData({ ...formData, source: source.id })}
                  className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${
                    formData.source === source.id 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{source.name}</h3>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-white/60">Type: {source.type}</span>
                        <span className="text-xs text-white/60">Moisture: {source.moisture}</span>
                      </div>
                    </div>
                    {formData.source === source.id && (
                      <CheckCircle className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Extraction Method */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Extraction Method</h2>
              <p className="text-white/60">Choose your extraction technique</p>
            </div>

            <div className="space-y-3">
              {methods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setFormData({ ...formData, method: method.id })}
                  className={`bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${
                    formData.method === method.id 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{method.name}</h3>
                      <div className="flex gap-4 mt-1">
                        <span className="text-sm text-white/60">Temp: {method.temp}</span>
                        <span className="text-sm text-white/60">Time: {method.time}</span>
                      </div>
                    </div>
                    {formData.method === method.id && (
                      <CheckCircle className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Droplets className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-200 font-medium">Solvent Selection</p>
                  <p className="text-xs text-blue-200/70 mt-1">
                    Different solvents extract different bioactive compounds. Water for polysaccharides, alcohol for triterpenes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Process Parameters */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Process Parameters</h2>
              <p className="text-white/60">Configure extraction parameters</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Solvent Type</label>
                <select 
                  value={formData.solvent}
                  onChange={(e) => setFormData({ ...formData, solvent: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select solvent...</option>
                  {solvents.map((solvent) => (
                    <option key={solvent.id} value={solvent.id}>
                      {solvent.name} ({solvent.polarity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Temperature (°C)</label>
                  <input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Volume (liters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="e.g., 5.0"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="Any special observations or parameters..."
                />
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-200 font-medium">Safety Reminder</p>
                  <p className="text-xs text-yellow-200/70 mt-1">
                    Ensure proper ventilation when using alcohol solvents. Always use appropriate PPE.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Review & Confirm</h2>
              <p className="text-white/60">Review your extraction parameters before starting</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Source Material</span>
                <span className="font-medium">
                  {sources.find(s => s.id === formData.source)?.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Method</span>
                <span className="font-medium">
                  {methods.find(m => m.id === formData.method)?.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Solvent</span>
                <span className="font-medium">
                  {solvents.find(s => s.id === formData.solvent)?.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Temperature</span>
                <span className="font-medium">{formData.temperature}°C</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Duration</span>
                <span className="font-medium">{formData.duration} minutes</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Volume</span>
                <span className="font-medium">{formData.volume} L</span>
              </div>
              {formData.notes && (
                <div className="pt-2">
                  <span className="text-white/60 block mb-2">Notes</span>
                  <p className="text-sm">{formData.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Timer className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm text-purple-200 font-medium">Estimated Completion</p>
                  <p className="text-xs text-purple-200/70 mt-1">
                    This extraction will complete in approximately {formData.duration} minutes
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
                (step === 1 && !formData.source) ||
                (step === 2 && !formData.method) ||
                (step === 3 && (!formData.solvent || !formData.volume))
              }
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-black transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium text-black transition-colors flex items-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Start Extraction
            </button>
          )}
        </div>
      </main>
    </div>
  );
}