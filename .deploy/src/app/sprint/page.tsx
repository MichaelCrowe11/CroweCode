"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Target, CheckSquare, Clock, Users, TrendingUp, AlertCircle } from "lucide-react";

export default function SprintPage() {
  const [selectedWeek, setSelectedWeek] = useState(1);

  const weeklyTasks: Record<number, { title: string; tasks: Array<{ name: string; status: string; priority: string }> }> = {
    1: {
      title: "Week 1: Setup & Preparation",
      tasks: [
        { name: "Lab deep clean and sterilization", status: "completed", priority: "high" },
        { name: "Prepare substrate materials", status: "completed", priority: "high" },
        { name: "Inoculate first batch", status: "in-progress", priority: "high" },
        { name: "Update SOPs documentation", status: "pending", priority: "medium" }
      ]
    },
    2: {
      title: "Week 2: Production Ramp-up",
      tasks: [
        { name: "Monitor colonization rates", status: "pending", priority: "high" },
        { name: "Prepare fruiting chambers", status: "pending", priority: "high" },
        { name: "Second batch inoculation", status: "pending", priority: "medium" },
        { name: "Quality control checks", status: "pending", priority: "medium" }
      ]
    },
    3: {
      title: "Week 3: Harvest & Processing",
      tasks: [
        { name: "First harvest window", status: "pending", priority: "high" },
        { name: "Extract processing", status: "pending", priority: "high" },
        { name: "Package and label products", status: "pending", priority: "medium" },
        { name: "Update inventory system", status: "pending", priority: "low" }
      ]
    },
    4: {
      title: "Week 4: Optimization & Shipping",
      tasks: [
        { name: "Analyze yield metrics", status: "pending", priority: "medium" },
        { name: "Prepare shipping logistics", status: "pending", priority: "high" },
        { name: "Customer order fulfillment", status: "pending", priority: "high" },
        { name: "Sprint retrospective", status: "pending", priority: "medium" }
      ]
    }
  };

  const okrs = [
    {
      objective: "Achieve 95% contamination-free rate",
      keyResults: [
        { result: "Implement new sterilization protocol", progress: 75 },
        { result: "Daily monitoring logs completed", progress: 100 },
        { result: "Staff training on aseptic technique", progress: 60 }
      ]
    },
    {
      objective: "Increase yield by 20%",
      keyResults: [
        { result: "Optimize substrate formulation", progress: 50 },
        { result: "Improve environmental controls", progress: 40 },
        { result: "Reduce time to harvest by 2 days", progress: 30 }
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
              <h1 className="text-xl font-semibold">Sprint Planning</h1>
              <p className="text-sm text-white/60">30/60/90 day objectives and weekly blocks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-white/60">Sprint 1 - Week {selectedWeek}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Week Selector */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedWeek === week
                  ? 'bg-emerald-500 text-black'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {weeklyTasks[selectedWeek].title}
              </h2>
              <div className="space-y-3">
                {weeklyTasks[selectedWeek].tasks.map((task, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <CheckSquare className={`h-5 w-5 ${
                      task.status === 'completed' ? 'text-emerald-500' :
                      task.status === 'in-progress' ? 'text-blue-500' :
                      'text-white/30'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{task.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-white/40">{task.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* OKRs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              OKRs
            </h3>
            {okrs.map((okr, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3">{okr.objective}</h4>
                <div className="space-y-2">
                  {okr.keyResults.map((kr, krIndex) => (
                    <div key={krIndex}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{kr.result}</span>
                        <span>{kr.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${kr.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sprint Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-white/60">Velocity</span>
            </div>
            <p className="text-2xl font-semibold">32</p>
            <p className="text-xs text-white/40">story points/week</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-white/60">Team</span>
            </div>
            <p className="text-2xl font-semibold">4</p>
            <p className="text-xs text-white/40">active members</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-white/60">Completed</span>
            </div>
            <p className="text-2xl font-semibold">18</p>
            <p className="text-xs text-white/40">tasks this sprint</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-white/60">Blockers</span>
            </div>
            <p className="text-2xl font-semibold">2</p>
            <p className="text-xs text-white/40">need resolution</p>
          </div>
        </div>
      </main>
    </div>
  );
}