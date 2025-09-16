"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Activity, PieChart, Download, Calendar } from "lucide-react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('yield');

  const metrics = [
    {
      id: 'yield',
      name: 'Yield per Block',
      value: '3.2 lbs',
      change: '+12%',
      trend: 'up',
      data: [2.8, 2.9, 3.0, 2.9, 3.1, 3.2, 3.2]
    },
    {
      id: 'contamination',
      name: 'Contamination Rate',
      value: '1.8%',
      change: '-0.3%',
      trend: 'down',
      data: [2.1, 2.0, 1.9, 2.0, 1.8, 1.9, 1.8]
    },
    {
      id: 'cycle',
      name: 'Cycle Time',
      value: '42 days',
      change: '-2 days',
      trend: 'down',
      data: [44, 44, 43, 43, 42, 42, 42]
    },
    {
      id: 'efficiency',
      name: 'Production Efficiency',
      value: '87%',
      change: '+5%',
      trend: 'up',
      data: [82, 83, 84, 85, 86, 86, 87]
    }
  ];

  const speciesBreakdown = [
    { name: 'Lion\'s Mane', value: 35, color: 'bg-blue-500' },
    { name: 'Oyster', value: 28, color: 'bg-emerald-500' },
    { name: 'Shiitake', value: 22, color: 'bg-purple-500' },
    { name: 'Reishi', value: 15, color: 'bg-orange-500' }
  ];

  const recentBatches = [
    { id: 'B-2024-047', species: 'Lion\'s Mane', yield: 3.4, status: 'harvested', date: '2024-01-15' },
    { id: 'B-2024-046', species: 'Oyster', yield: 2.9, status: 'fruiting', date: '2024-01-14' },
    { id: 'B-2024-045', species: 'Shiitake', yield: 3.1, status: 'harvested', date: '2024-01-13' },
    { id: 'B-2024-044', species: 'Reishi', yield: 2.2, status: 'colonizing', date: '2024-01-12' },
    { id: 'B-2024-043', species: 'Lion\'s Mane', yield: 3.3, status: 'harvested', date: '2024-01-11' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
              <p className="text-sm text-white/60">Yields, contamination rate, setpoint drift</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="day">24 Hours</option>
              <option value="week">7 Days</option>
              <option value="month">30 Days</option>
              <option value="year">12 Months</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`bg-white/5 border rounded-xl p-5 cursor-pointer transition-all ${
                selectedMetric === metric.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">{metric.name}</span>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className="text-2xl font-semibold mb-1">{metric.value}</p>
              <p className={`text-sm ${
                metric.trend === 'up' ? 'text-emerald-400' : 'text-emerald-400'
              }`}>
                {metric.change} from last {timeRange}
              </p>
              <div className="mt-3 h-12 flex items-end gap-1">
                {metric.data.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-emerald-500/30 rounded-t"
                    style={{ height: `${(value / Math.max(...metric.data)) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Trends
                </h2>
                <div className="flex gap-2">
                  {['yield', 'contamination', 'efficiency'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMetric(type)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        selectedMetric === type
                          ? 'bg-emerald-500 text-black'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Chart Area */}
              <div className="h-64 flex items-end justify-between gap-2">
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} className="flex-1 bg-emerald-500/30 rounded-t hover:bg-emerald-500/50 transition-colors" 
                    style={{ height: `${Math.random() * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-white/40">
                <span>30 days ago</span>
                <span>15 days ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Species Breakdown */}
          <div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Species Distribution
              </h2>
              
              {/* Pie Chart Visualization */}
              <div className="relative h-48 mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-semibold">100%</p>
                    <p className="text-xs text-white/60">Total Production</p>
                  </div>
                </div>
                <svg className="w-full h-full transform -rotate-90">
                  {speciesBreakdown.reduce((acc, species, index) => {
                    const startAngle = acc;
                    const endAngle = acc + (species.value / 100) * 360;
                    return endAngle;
                  }, 0)}
                </svg>
              </div>
              
              <div className="space-y-2">
                {speciesBreakdown.map((species) => (
                  <div key={species.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${species.color}`} />
                      <span className="text-sm">{species.name}</span>
                    </div>
                    <span className="text-sm text-white/60">{species.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Batches Table */}
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Batches
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-sm text-white/60">Batch ID</th>
                  <th className="text-left py-2 text-sm text-white/60">Species</th>
                  <th className="text-left py-2 text-sm text-white/60">Yield (lbs)</th>
                  <th className="text-left py-2 text-sm text-white/60">Status</th>
                  <th className="text-left py-2 text-sm text-white/60">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map((batch) => (
                  <tr key={batch.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 text-sm font-mono">{batch.id}</td>
                    <td className="py-3 text-sm">{batch.species}</td>
                    <td className="py-3 text-sm">{batch.yield}</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        batch.status === 'harvested' ? 'bg-emerald-500/20 text-emerald-300' :
                        batch.status === 'fruiting' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-white/60">{batch.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}