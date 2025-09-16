"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Rocket, Code2, Database, Cloud, CheckCircle, ChevronRight } from "lucide-react";

export default function QuickStartPage() {
  const steps = [
    {
      title: "1. Environment Setup",
      description: "Configure your development environment",
      tasks: [
        "Install Node.js 18+ and npm",
        "Clone the repository",
        "Install dependencies with npm install",
        "Set up environment variables"
      ],
      icon: Code2,
      status: "completed"
    },
    {
      title: "2. Database Configuration",
      description: "Set up Oracle or PostgreSQL database",
      tasks: [
        "Install database (Oracle/PostgreSQL)",
        "Configure connection string",
        "Run database migrations",
        "Verify connection"
      ],
      icon: Database,
      status: "in-progress"
    },
    {
      title: "3. Cloud Integration",
      description: "Connect to cloud services",
      tasks: [
        "Configure AWS/OCI credentials",
        "Set up storage buckets",
        "Configure API endpoints",
        "Test cloud connectivity"
      ],
      icon: Cloud,
      status: "pending"
    },
    {
      title: "4. Launch Platform",
      description: "Start the development server",
      tasks: [
        "Run npm run dev",
        "Access localhost:3000",
        "Test core features",
        "Deploy to production"
      ],
      icon: Rocket,
      status: "pending"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Quick Start Guide</h1>
              <p className="text-sm text-white/60">Get up and running in minutes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-white/60">Setup Progress</span>
            <span className="text-sm text-white/60">25% Complete</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`bg-white/5 border rounded-xl p-6 transition-all ${
                step.status === 'completed' 
                  ? 'border-emerald-500/50 bg-emerald-500/5' 
                  : step.status === 'in-progress'
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  step.status === 'completed' 
                    ? 'bg-emerald-500/20' 
                    : step.status === 'in-progress'
                    ? 'bg-blue-500/20'
                    : 'bg-white/10'
                }`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold">{step.title}</h2>
                    {step.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-white/70 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-center gap-3 text-sm">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          step.status === 'completed' 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-white/30'
                        }`}></div>
                        <span className={step.status === 'completed' ? 'text-white/90' : 'text-white/60'}>
                          {task}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <ChevronRight className="h-5 w-5 text-white/30" />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link 
            href="/ide"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
          >
            Open IDE
          </Link>
          <Link 
            href="/settings"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
          >
            Configure Settings
          </Link>
        </div>
      </main>
    </div>
  );
}