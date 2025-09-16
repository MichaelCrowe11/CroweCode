"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Leaf, Droplets, Sun, Wind, Thermometer, 
  Activity, Mic, MicOff, Volume2, Wifi, WifiOff,
  TreePine, Wheat, Cloud, AlertTriangle, TrendingUp,
  Calendar, Map, BarChart3, Database, Cpu
} from "lucide-react";

export default function AgricultureTrackingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('mushrooms');
  const [realTimeData, setRealTimeData] = useState<any>(null);

  // Simulated real-time sensor data
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData({
        temperature: (20 + Math.random() * 10).toFixed(1),
        humidity: (60 + Math.random() * 20).toFixed(1),
        soilMoisture: (40 + Math.random() * 30).toFixed(1),
        ph: (6.0 + Math.random() * 1.5).toFixed(1),
        light: Math.floor(500 + Math.random() * 1000),
        co2: Math.floor(400 + Math.random() * 200),
        timestamp: new Date().toLocaleTimeString()
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const crops = [
    {
      id: 'mushrooms',
      name: 'Mushroom Cultivation',
      icon: '🍄',
      fields: [
        { id: 'GH-01', name: 'Greenhouse 1', size: '2000 sq ft', status: 'optimal', yield: '320 lbs/week' },
        { id: 'GH-02', name: 'Greenhouse 2', size: '1500 sq ft', status: 'warning', yield: '240 lbs/week' }
      ]
    },
    {
      id: 'cannabis',
      name: 'Cannabis Production',
      icon: '🌿',
      fields: [
        { id: 'IND-01', name: 'Indoor Facility A', size: '5000 sq ft', status: 'optimal', yield: '50 lbs/month' },
        { id: 'OUT-01', name: 'Outdoor Field 1', size: '2 acres', status: 'optimal', yield: '200 lbs/harvest' }
      ]
    },
    {
      id: 'vegetables',
      name: 'Organic Vegetables',
      icon: '🥬',
      fields: [
        { id: 'FLD-01', name: 'North Field', size: '10 acres', status: 'optimal', yield: '5 tons/month' },
        { id: 'FLD-02', name: 'South Field', size: '8 acres', status: 'monitoring', yield: '4 tons/month' }
      ]
    }
  ];

  const handleVoiceCommand = async () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start voice recording
      try {
        // This would connect to ElevenLabs API
        console.log('Starting voice recording...');
      } catch (error) {
        console.error('Voice recording error:', error);
      }
    }
  };

  const currentCrop = crops.find(c => c.id === selectedCrop);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Agriculture Intelligence™</h1>
              <p className="text-sm text-white/60">IoT Sensor Network • Voice-First Data Entry • ML Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'bg-emerald-500 text-black' : 'bg-white/10'
              }`}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
              <Wifi className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Voice Command Interface */}
        {voiceEnabled && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVoiceCommand}
                  className={`p-4 rounded-full transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  <Mic className="h-6 w-6 text-white" />
                </button>
                <div>
                  <p className="font-medium">Voice Command Active</p>
                  <p className="text-sm text-white/60">
                    {isRecording ? 'Listening... Say your command' : 'Click to record field data'}
                  </p>
                </div>
              </div>
              <div className="text-sm text-white/60">
                Powered by ElevenLabs + ConvAI
              </div>
            </div>
          </div>
        )}

        {/* Crop Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {crops.map((crop) => (
            <button
              key={crop.id}
              onClick={() => setSelectedCrop(crop.id)}
              className={`p-4 rounded-xl border transition-all ${
                selectedCrop === crop.id
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-3xl mb-2">{crop.icon}</div>
              <h3 className="font-semibold">{crop.name}</h3>
              <p className="text-sm text-white/60 mt-1">{crop.fields.length} active fields</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Sensor Data */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Real-time Sensor Data
              </h2>
              
              {realTimeData && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-white/60">Temperature</span>
                    </div>
                    <p className="text-2xl font-semibold">{realTimeData.temperature}°C</p>
                    <p className="text-xs text-white/40 mt-1">Optimal: 20-25°C</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-white/60">Humidity</span>
                    </div>
                    <p className="text-2xl font-semibold">{realTimeData.humidity}%</p>
                    <p className="text-xs text-white/40 mt-1">Optimal: 70-85%</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm text-white/60">Soil Moisture</span>
                    </div>
                    <p className="text-2xl font-semibold">{realTimeData.soilMoisture}%</p>
                    <p className="text-xs text-white/40 mt-1">Optimal: 50-60%</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-white/60">pH Level</span>
                    </div>
                    <p className="text-2xl font-semibold">{realTimeData.ph}</p>
                    <p className="text-xs text-white/40 mt-1">Optimal: 6.0-7.0</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-white/60">Light</span>
                    </div>
                    <p className="text-2xl font-semibold">{realTimeData.light}</p>
                    <p className="text-xs text-white/40 mt-1">lux</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Cloud className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-white/60">CO₂</span>
                    </div>
                    <p className="text-2xl font-semibold">{realTimeData.co2}</p>
                    <p className="text-xs text-white/40 mt-1">ppm</p>
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-white/40">
                Last updated: {realTimeData?.timestamp}
              </div>
            </div>

            {/* Field Status */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Field Status</h3>
              <div className="space-y-3">
                {currentCrop?.fields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium">{field.name}</p>
                      <p className="text-sm text-white/60">{field.size} • {field.yield}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-sm ${
                      field.status === 'optimal' ? 'bg-emerald-500/20 text-emerald-300' :
                      field.status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {field.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ML Predictions & Analytics */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-500" />
                ML Predictions
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/60">Yield Forecast</span>
                    <span className="text-sm font-medium">+15%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/60">Disease Risk</span>
                    <span className="text-sm font-medium text-yellow-400">Medium</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white/60">Optimization Score</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Active Alerts
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-medium text-yellow-300">High Humidity Warning</p>
                  <p className="text-xs text-white/60 mt-1">Greenhouse 2 - Risk of fungal growth</p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm font-medium text-blue-300">Irrigation Scheduled</p>
                  <p className="text-xs text-white/60 mt-1">North Field - In 2 hours</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-sm text-left">
                  📊 Generate ML Report
                </button>
                <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm text-left">
                  🎤 Voice Entry Mode
                </button>
                <button className="w-full px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm text-left">
                  🤖 Train Custom Model
                </button>
                <button className="w-full px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-sm text-left">
                  📡 Sync IoT Devices
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}