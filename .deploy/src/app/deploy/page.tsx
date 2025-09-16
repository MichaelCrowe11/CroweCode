"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cloud, Server, Shield, Globe, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function DeployPage() {
  const [deploymentType, setDeploymentType] = useState<'vercel' | 'docker' | 'oracle' | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const deploymentOptions = [
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Deploy to Vercel with automatic CI/CD',
      icon: Globe,
      features: ['Automatic SSL', 'Global CDN', 'Serverless Functions', 'Preview Deployments'],
      command: 'npx vercel deploy'
    },
    {
      id: 'docker',
      name: 'Docker',
      description: 'Containerized deployment for any cloud',
      icon: Server,
      features: ['Full control', 'Multi-cloud', 'Scalable', 'Database included'],
      command: 'docker-compose up -d'
    },
    {
      id: 'oracle',
      name: 'Oracle Cloud',
      description: 'Deploy to Oracle Cloud Infrastructure',
      icon: Cloud,
      features: ['Enterprise ready', 'Oracle Database', 'High performance', 'Free tier available'],
      command: 'oci deploy'
    }
  ];

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false);
    }, 3000);
  };

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
              <h1 className="text-xl font-semibold">Deploy Platform</h1>
              <p className="text-sm text-white/60">Choose your deployment strategy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-white/60">Production Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Deployment Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {deploymentOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => setDeploymentType(option.id as any)}
              className={`bg-white/5 border rounded-xl p-6 cursor-pointer transition-all hover:bg-white/10 ${
                deploymentType === option.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-lg">
                  <option.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{option.name}</h3>
              </div>
              <p className="text-sm text-white/70 mb-4">{option.description}</p>
              <ul className="space-y-2">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Deployment Configuration */}
        {deploymentType && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Deployment Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Environment</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500">
                  <option>Production</option>
                  <option>Staging</option>
                  <option>Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Region</label>
                <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500">
                  <option>US East (N. Virginia)</option>
                  <option>US West (Oregon)</option>
                  <option>EU (Frankfurt)</option>
                  <option>Asia Pacific (Singapore)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Deploy Command</label>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                  {deploymentOptions.find(o => o.id === deploymentType)?.command}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-200 font-medium">Pre-deployment Checklist</p>
                    <ul className="mt-2 space-y-1 text-xs text-yellow-200/70">
                      <li>• Environment variables configured</li>
                      <li>• Database migrations completed</li>
                      <li>• Build successfully compiled</li>
                      <li>• Tests passing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="mt-6 w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Cloud className="h-5 w-5" />
                  Deploy Now
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}