"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus, Search, Calendar, Tag, FlaskConical as Flask, Microscope, FileText } from "lucide-react";

export default function ELNPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'All Entries', count: 47 },
    { id: 'cultures', name: 'Cultures', count: 12 },
    { id: 'plates', name: 'Plates', count: 18 },
    { id: 'lc', name: 'LC Runs', count: 8 },
    { id: 'batch', name: 'Batch Notes', count: 9 }
  ];

  const entries = [
    {
      id: 1,
      type: 'culture',
      title: 'Lion\'s Mane Culture #LM-024',
      date: '2024-01-15',
      tags: ['primary', 'healthy', 'gen-3'],
      notes: 'Strong mycelium growth, ready for transfer. No contamination observed.',
      author: 'Lab Tech 1'
    },
    {
      id: 2,
      type: 'plate',
      title: 'Agar Plate Batch #AP-112',
      date: '2024-01-14',
      tags: ['MEA', 'sterile', 'production'],
      notes: '24 plates prepared with MEA. All passed sterility check after 48h incubation.',
      author: 'Lab Tech 2'
    },
    {
      id: 3,
      type: 'lc',
      title: 'Liquid Culture #LC-089',
      date: '2024-01-13',
      tags: ['oyster', '4%honey', 'expanding'],
      notes: 'Inoculated 500ml LC jars from plate. Visible growth after 3 days.',
      author: 'Lab Tech 1'
    },
    {
      id: 4,
      type: 'batch',
      title: 'Production Batch #PB-456',
      date: '2024-01-12',
      tags: ['shiitake', '100-blocks', 'fruiting'],
      notes: 'Moved to fruiting room. First pins observed. Expecting harvest in 5-7 days.',
      author: 'Production Manager'
    },
    {
      id: 5,
      type: 'culture',
      title: 'Reishi Culture #RE-015',
      date: '2024-01-11',
      tags: ['slow-growth', 'monitoring', 'gen-2'],
      notes: 'Slower than expected growth rate. Increased incubation temp to 28°C.',
      author: 'Lab Tech 2'
    }
  ];

  const filteredEntries = entries.filter(entry => {
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'cultures' && entry.type === 'culture') ||
      (selectedCategory === 'plates' && entry.type === 'plate') ||
      (selectedCategory === 'lc' && entry.type === 'lc') ||
      (selectedCategory === 'batch' && entry.type === 'batch');
    
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'culture': return <Flask className="h-4 w-4" />;
      case 'plate': return <Microscope className="h-4 w-4" />;
      case 'lc': return <Flask className="h-4 w-4" />;
      case 'batch': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
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
              <h1 className="text-xl font-semibold">Electronic Lab Notebook</h1>
              <p className="text-sm text-white/60">Cultures, plates, LC runs, batch notes</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-black flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Entry
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === category.id
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm">{category.name}</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Entries</span>
                  <span>47</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">This Week</span>
                  <span className="text-emerald-400">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Active Cultures</span>
                  <span>8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Success Rate</span>
                  <span className="text-emerald-400">94%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        {getTypeIcon(entry.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{entry.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {entry.date}
                          </span>
                          <span>{entry.author}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/80 mb-3">{entry.notes}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag, index) => (
                      <span key={index} className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 rounded">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredEntries.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-white/30" />
                <p className="text-white/60">No entries found</p>
                <p className="text-sm text-white/40 mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}