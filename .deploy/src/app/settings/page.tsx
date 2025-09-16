"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Key, Users, Database, Shield, Bell, Moon, Globe, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('api');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Settings</h1>
              <p className="text-sm text-white/60">Keys, models, orgs, roles, data retention</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-black flex items-center gap-2"
          >
            {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2">
              {[
                { id: 'api', name: 'API Keys', icon: Key },
                { id: 'database', name: 'Database', icon: Database },
                { id: 'users', name: 'Users & Roles', icon: Users },
                { id: 'security', name: 'Security', icon: Shield },
                { id: 'notifications', name: 'Notifications', icon: Bell },
                { id: 'appearance', name: 'Appearance', icon: Moon },
                { id: 'localization', name: 'Localization', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm">{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Claude API Key</label>
                      <input
                        type="password"
                        placeholder="sk-ant-..."
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Model Selection</label>
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500">
                        <option>GPT-4 Turbo</option>
                        <option>GPT-3.5 Turbo</option>
                        <option>Claude 3 Opus</option>
                        <option>Claude 3 Sonnet</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-md font-semibold mb-3">Rate Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Requests per minute</label>
                      <input
                        type="number"
                        defaultValue="60"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Tokens per minute</label>
                      <input
                        type="number"
                        defaultValue="90000"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Database Configuration</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Database Type</label>
                      <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500">
                        <option>Oracle Database 23ai</option>
                        <option>PostgreSQL</option>
                        <option>MySQL</option>
                        <option>MongoDB</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Connection String</label>
                      <input
                        type="text"
                        placeholder="localhost:1521/FREE"
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Username</label>
                        <input
                          type="text"
                          placeholder="system"
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Password</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">Test Connection</button>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">Backup Now</button>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-md font-semibold mb-3">Data Retention</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Keep batch records for</span>
                      <select className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm">
                        <option>6 months</option>
                        <option>1 year</option>
                        <option>2 years</option>
                        <option>Forever</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Keep environmental data for</span>
                      <select className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm">
                        <option>30 days</option>
                        <option>90 days</option>
                        <option>1 year</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Users & Roles</h2>
                
                <div className="space-y-3 mb-6">
                  {[
                    { name: 'Admin User', email: 'admin@crowelogic.com', role: 'Administrator', status: 'active' },
                    { name: 'Lab Tech 1', email: 'lab1@crowelogic.com', role: 'Lab Technician', status: 'active' },
                    { name: 'Lab Tech 2', email: 'lab2@crowelogic.com', role: 'Lab Technician', status: 'active' },
                    { name: 'Production Manager', email: 'prod@crowelogic.com', role: 'Manager', status: 'active' }
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-white/60">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/60">{user.role}</span>
                        <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded">
                          {user.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">Add User</button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Two-factor authentication</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Session timeout (minutes)</span>
                      <input type="number" defaultValue="30" className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm" />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">IP whitelist</span>
                      <input type="checkbox" className="toggle" />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Audit logging</span>
                      <input type="checkbox" className="toggle" defaultChecked />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {[
                    'Contamination alerts',
                    'Harvest reminders',
                    'Environmental warnings',
                    'System errors',
                    'Daily reports'
                  ].map((item) => (
                    <div key={item} className="flex items-center justify-between">
                      <span className="text-sm">{item}</span>
                      <div className="flex gap-2">
                        <label className="text-xs">
                          <input type="checkbox" className="mr-1" defaultChecked />
                          Email
                        </label>
                        <label className="text-xs">
                          <input type="checkbox" className="mr-1" />
                          SMS
                        </label>
                        <label className="text-xs">
                          <input type="checkbox" className="mr-1" defaultChecked />
                          Push
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Theme</label>
                    <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
                      <option>Dark</option>
                      <option>Light</option>
                      <option>Auto</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Accent Color</label>
                    <div className="flex gap-2">
                      {['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'].map((color) => (
                        <button key={color} className={`w-8 h-8 rounded ${color}`} />
                      ))}
                    </div>
                  </div>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Compact mode</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'localization' && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Localization</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Language</label>
                    <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Timezone</label>
                    <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
                      <option>Pacific Time (PT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Central Time (CT)</option>
                      <option>Eastern Time (ET)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/70 mb-2">Date Format</label>
                    <select className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg">
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}