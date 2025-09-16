"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Zap, Thermometer, Droplets, Wind, Gauge, AlertTriangle, CheckCircle } from "lucide-react";

export default function EIPage() {
  const [selectedSite, setSelectedSite] = useState('grow-room-1');

  const sites = [
    {
      id: 'grow-room-1',
      name: 'Grow Room 1',
      status: 'optimal',
      temp: 72,
      humidity: 85,
      co2: 1200,
      airflow: 'good'
    },
    {
      id: 'grow-room-2', 
      name: 'Grow Room 2',
      status: 'warning',
      temp: 78,
      humidity: 92,
      co2: 800,
      airflow: 'low'
    },
    {
      id: 'lab',
      name: 'Laboratory',
      status: 'optimal',
      temp: 70,
      humidity: 45,
      co2: 400,
      airflow: 'excellent'
    }
  ];

  const currentSite = sites.find(s => s.id === selectedSite);

  const remediationPlans = [
    {
      issue: 'High Humidity Alert',
      severity: 'medium',
      location: 'Grow Room 2',
      actions: [
        'Increase exhaust fan speed to 80%',
        'Activate dehumidifier unit',
        'Check for water leaks',
        'Monitor for next 2 hours'
      ]
    },
    {
      issue: 'Low CO2 Levels',
      severity: 'low',
      location: 'Grow Room 2',
      actions: [
        'Check CO2 generator tank levels',
        'Calibrate CO2 sensor',
        'Adjust injection rate'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Environmental Intelligence</h1>
              <p className="text-sm text-white/60">Mycelium EI site-fit & remediation planner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
            <span className="text-sm text-white/60">Live Monitoring</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Site Selector */}
        <div className="flex gap-2 mb-8">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => setSelectedSite(site.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                selectedSite === site.id
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                site.status === 'optimal' ? 'bg-emerald-400' :
                site.status === 'warning' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              {site.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Environmental Metrics */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Environmental Metrics - {currentSite?.name}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-white/60">Temperature</span>
                  </div>
                  <p className="text-3xl font-semibold">{currentSite?.temp}°F</p>
                  <p className="text-xs text-white/40 mt-1">Target: 70-75°F</p>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500"
                      style={{ width: `${((currentSite?.temp || 0) / 100) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-white/60">Humidity</span>
                  </div>
                  <p className="text-3xl font-semibold">{currentSite?.humidity}%</p>
                  <p className="text-xs text-white/40 mt-1">Target: 80-90%</p>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        (currentSite?.humidity || 0) > 90 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${currentSite?.humidity}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm text-white/60">CO₂ Level</span>
                  </div>
                  <p className="text-3xl font-semibold">{currentSite?.co2}</p>
                  <p className="text-xs text-white/40 mt-1">ppm (Target: 1000-1500)</p>
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500"
                      style={{ width: `${((currentSite?.co2 || 0) / 2000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-5 w-5 text-cyan-500" />
                    <span className="text-sm text-white/60">Airflow</span>
                  </div>
                  <p className="text-3xl font-semibold capitalize">{currentSite?.airflow}</p>
                  <p className="text-xs text-white/40 mt-1">Air exchanges/hour</p>
                  <div className="flex gap-1 mt-2">
                    {['low', 'good', 'excellent'].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level === currentSite?.airflow ? 'bg-cyan-500' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Equipment Status */}
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Equipment Status</h3>
                <div className="grid grid-cols-4 gap-2">
                  {['HVAC', 'Humidifier', 'CO₂ Gen', 'Exhaust'].map((equipment) => (
                    <div key={equipment} className="bg-white/5 rounded-lg p-2 text-center">
                      <Zap className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
                      <p className="text-xs">{equipment}</p>
                      <p className="text-xs text-emerald-400">Active</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Remediation Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Remediation Plans
            </h3>
            <div className="space-y-3">
              {remediationPlans.map((plan, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium">{plan.issue}</h4>
                      <p className="text-xs text-white/60">{plan.location}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      plan.severity === 'high' ? 'bg-red-500/20 text-red-300' :
                      plan.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {plan.severity}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {plan.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-2 text-xs text-white/70">
                        <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Data */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">24-Hour Trend</h3>
          <div className="h-48 flex items-end justify-between gap-1">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 bg-emerald-500/30 rounded-t" 
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-white/40">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>Now</span>
          </div>
        </div>
      </main>
    </div>
  );
}