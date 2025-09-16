"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Power, Settings2, Bell, Timer, Thermometer, Droplets, Wind, AlertTriangle } from "lucide-react";

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState('controls');

  const automations = [
    {
      id: 1,
      name: 'HVAC Control',
      description: 'Maintain temperature between 70-75°F',
      status: 'active',
      icon: Thermometer,
      trigger: 'Temperature sensor',
      action: 'Adjust HVAC setpoint',
      lastTriggered: '2 hours ago'
    },
    {
      id: 2,
      name: 'Humidity Manager',
      description: 'Keep humidity at 85% during fruiting',
      status: 'active',
      icon: Droplets,
      trigger: 'Humidity < 80%',
      action: 'Activate humidifiers',
      lastTriggered: '30 minutes ago'
    },
    {
      id: 3,
      name: 'CO₂ Exchange',
      description: 'Fresh air exchange every 4 hours',
      status: 'active',
      icon: Wind,
      trigger: 'Timer (4h intervals)',
      action: 'Run exhaust fans for 15 min',
      lastTriggered: '1 hour ago'
    },
    {
      id: 4,
      name: 'Contamination Alert',
      description: 'Notify on contamination detection',
      status: 'active',
      icon: AlertTriangle,
      trigger: 'Visual inspection fail',
      action: 'Send email + SMS alert',
      lastTriggered: '3 days ago'
    },
    {
      id: 5,
      name: 'Night Mode',
      description: 'Reduce lighting after 8 PM',
      status: 'paused',
      icon: Timer,
      trigger: 'Time = 8:00 PM',
      action: 'Dim lights to 20%',
      lastTriggered: 'Yesterday'
    }
  ];

  const schedules = [
    { time: '06:00', action: 'Morning inspection', status: 'pending', room: 'All' },
    { time: '08:00', action: 'CO₂ exchange cycle', status: 'pending', room: 'Grow Room 1' },
    { time: '10:00', action: 'Humidity boost', status: 'pending', room: 'Fruiting Chamber' },
    { time: '12:00', action: 'Temperature check', status: 'pending', room: 'All' },
    { time: '14:00', action: 'Misting cycle', status: 'pending', room: 'Grow Room 2' },
    { time: '16:00', action: 'CO₂ exchange cycle', status: 'pending', room: 'Grow Room 1' },
    { time: '18:00', action: 'Evening inspection', status: 'pending', room: 'All' },
    { time: '20:00', action: 'Night mode activation', status: 'pending', room: 'All' }
  ];

  const alerts = [
    { id: 1, type: 'warning', message: 'Humidity dropping in Grow Room 2', time: '10 min ago' },
    { id: 2, type: 'info', message: 'CO₂ exchange completed successfully', time: '1 hour ago' },
    { id: 3, type: 'success', message: 'All systems operating normally', time: '2 hours ago' },
    { id: 4, type: 'warning', message: 'Temperature spike detected', time: '3 hours ago' }
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
              <h1 className="text-xl font-semibold">Automations</h1>
              <p className="text-sm text-white/60">HVAC, humidifiers, CO₂ exchange, alerts</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-black flex items-center gap-2">
            <Zap className="h-4 w-4" />
            New Automation
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['controls', 'schedules', 'alerts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map((automation) => (
              <div key={automation.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      automation.status === 'active' ? 'bg-emerald-500/20' : 'bg-white/10'
                    }`}>
                      <automation.icon className={`h-5 w-5 ${
                        automation.status === 'active' ? 'text-emerald-500' : 'text-white/50'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{automation.name}</h3>
                      <p className="text-sm text-white/60 mt-1">{automation.description}</p>
                    </div>
                  </div>
                  <button className={`p-2 rounded-lg transition-colors ${
                    automation.status === 'active' 
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}>
                    <Power className={`h-4 w-4 ${
                      automation.status === 'active' ? 'text-emerald-500' : 'text-white/50'
                    }`} />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Trigger:</span>
                    <span>{automation.trigger}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Action:</span>
                    <span>{automation.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Last triggered:</span>
                    <span className="text-white/40">{automation.lastTriggered}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10 flex gap-2">
                  <button className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                    Edit
                  </button>
                  <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Today's Schedule
            </h2>
            <div className="space-y-2">
              {schedules.map((schedule, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <span className="text-sm font-mono w-16">{schedule.time}</span>
                  <div className="flex-1">
                    <p className="text-sm">{schedule.action}</p>
                    <p className="text-xs text-white/60">{schedule.room}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    schedule.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                    schedule.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {schedule.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Settings
                </h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm">Email</button>
                  <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm">SMS</button>
                  <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm">Push</button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    alert.type === 'warning' ? 'bg-yellow-500/20' :
                    alert.type === 'success' ? 'bg-emerald-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <Bell className={`h-4 w-4 ${
                      alert.type === 'warning' ? 'text-yellow-500' :
                      alert.type === 'success' ? 'text-emerald-500' :
                      'text-blue-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-white/40 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}