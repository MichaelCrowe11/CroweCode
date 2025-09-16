"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Box, Calculator, Droplets, Plus, Minus, Info, Download } from "lucide-react";

export default function SubstrateBuilderPage() {
  const [species, setSpecies] = useState('lions-mane');
  const [blocks, setBlocks] = useState(100);
  const [recipe, setRecipe] = useState<any>(null);

  const speciesOptions = [
    { id: 'lions-mane', name: "Lion's Mane", hydration: 65, gypsum: 2 },
    { id: 'oyster', name: 'Oyster', hydration: 60, gypsum: 1 },
    { id: 'shiitake', name: 'Shiitake', hydration: 55, gypsum: 1.5 },
    { id: 'reishi', name: 'Reishi', hydration: 62, gypsum: 2.5 },
    { id: 'king-oyster', name: 'King Oyster', hydration: 58, gypsum: 1 }
  ];

  const baseRecipes = {
    'lions-mane': {
      hardwood: 40,
      soyHull: 40,
      wheatBran: 18,
      gypsum: 2
    },
    'oyster': {
      straw: 70,
      wheatBran: 28,
      gypsum: 1,
      lime: 1
    },
    'shiitake': {
      hardwood: 78,
      wheatBran: 20,
      gypsum: 1.5,
      lime: 0.5
    },
    'reishi': {
      hardwood: 60,
      wheatBran: 38,
      gypsum: 2.5
    },
    'king-oyster': {
      hardwood: 50,
      soyHull: 30,
      wheatBran: 19,
      gypsum: 1
    }
  };

  useEffect(() => {
    calculateRecipe();
  }, [species, blocks]);

  const calculateRecipe = () => {
    const selectedSpecies = speciesOptions.find(s => s.id === species);
    const baseRecipe = baseRecipes[species as keyof typeof baseRecipes];
    const blockWeight = 5; // 5 lbs per block
    const totalWeight = blocks * blockWeight;
    
    const ingredients = Object.entries(baseRecipe).map(([ingredient, percentage]) => ({
      name: ingredient.replace(/([A-Z])/g, ' $1').toLowerCase(),
      percentage,
      weight: (totalWeight * (percentage as number) / 100).toFixed(2)
    }));

    const waterAmount = (totalWeight * (selectedSpecies!.hydration / 100)).toFixed(2);
    
    setRecipe({
      totalWeight,
      waterAmount,
      hydration: selectedSpecies!.hydration,
      ingredients,
      sterilizationTime: blocks <= 50 ? 90 : blocks <= 100 ? 120 : 150,
      colonizationDays: species === 'oyster' ? 10 : species === 'shiitake' ? 21 : 14
    });
  };

  const adjustBlocks = (delta: number) => {
    const newBlocks = Math.max(1, Math.min(1000, blocks + delta));
    setBlocks(newBlocks);
  };

  const exportRecipe = () => {
    const data = {
      species: speciesOptions.find(s => s.id === species)?.name,
      blocks,
      recipe,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `substrate-recipe-${species}-${blocks}blocks.json`;
    a.click();
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
              <h1 className="text-xl font-semibold">Substrate Builder</h1>
              <p className="text-sm text-white/60">Species-tuned recipes with hydration & gypsum hints</p>
            </div>
          </div>
          <button 
            onClick={exportRecipe}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium text-black flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Recipe
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Recipe Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Species</label>
                  <select 
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    {speciesOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-2">Number of Blocks</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => adjustBlocks(-10)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={blocks}
                      onChange={(e) => setBlocks(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-center focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      onClick={() => adjustBlocks(10)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-1">5 lbs per block</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Total Weight</span>
                    <span className="font-medium">{recipe?.totalWeight} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Water Needed</span>
                    <span className="font-medium">{recipe?.waterAmount} lbs</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Target Hydration</span>
                    <span className="font-medium">{recipe?.hydration}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-200 font-medium">Pro Tips</p>
                  <ul className="text-xs text-blue-200/70 mt-2 space-y-1">
                    <li>• Mix dry ingredients first</li>
                    <li>• Add water gradually while mixing</li>
                    <li>• Check hydration with squeeze test</li>
                    <li>• Let substrate rest 30 min before bagging</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Display */}
          <div className="lg:col-span-2">
            {recipe && (
              <>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Substrate Recipe
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-white/70 mb-3">Dry Ingredients</h3>
                      <div className="space-y-2">
                        {recipe.ingredients.map((ingredient: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                              <span className="capitalize">{ingredient.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{ingredient.weight} lbs</span>
                              <span className="text-xs text-white/60 ml-2">({ingredient.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Hydration
                      </h3>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <span>Water Amount</span>
                          <span className="font-medium">{recipe.waterAmount} lbs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Final Moisture</span>
                          <span className="font-medium">{recipe.hydration}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Process Parameters */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      <span className="text-xs text-white/60">Sterilization</span>
                    </div>
                    <p className="text-xl font-semibold">{recipe.sterilizationTime} min</p>
                    <p className="text-xs text-white/40">@ 15 PSI</p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-xs text-white/60">Colonization</span>
                    </div>
                    <p className="text-xl font-semibold">{recipe.colonizationDays} days</p>
                    <p className="text-xs text-white/40">@ 70-75°F</p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs text-white/60">Yield Est.</span>
                    </div>
                    <p className="text-xl font-semibold">{(blocks * 3).toFixed(0)} lbs</p>
                    <p className="text-xs text-white/40">3 lbs/block avg</p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Mixing Instructions</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">1.</span>
                      <span>Combine all dry ingredients in a large mixer or by hand in batches</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">2.</span>
                      <span>Add {recipe.waterAmount} lbs of water gradually while mixing continuously</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">3.</span>
                      <span>Mix thoroughly until no dry pockets remain (10-15 minutes)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">4.</span>
                      <span>Perform squeeze test: water should barely drip when squeezed</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">5.</span>
                      <span>Let substrate rest for 30 minutes to equalize moisture</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">6.</span>
                      <span>Bag into 5 lb blocks using filter patch bags</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-emerald-500 font-medium">7.</span>
                      <span>Sterilize at 15 PSI for {recipe.sterilizationTime} minutes</span>
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}