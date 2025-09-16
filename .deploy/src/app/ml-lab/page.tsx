"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  ArrowLeft, Brain, Play, Square, Upload, Download,
  BarChart3, GitBranch, Cpu, Database, Layers,
  FileCode, Terminal, Eye, Settings, Save,
  RefreshCw, Zap, TrendingUp, AlertCircle, Cloud
} from "lucide-react";

// Dynamic import for heavy components
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-white/50">Loading ML editor...</div>
});

export default function MLLabPage() {
  const [activeTab, setActiveTab] = useState('notebook');
  const [isTraining, setIsTraining] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notebookCode, setNotebookCode] = useState(`# CroweCode ML Lab - Interactive Notebook
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

# Load agricultural data
df = pd.read_csv('crop_yield_data.csv')

# Data preprocessing
X = df.drop('yield_category', axis=1)
y = df['yield_category']

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Predictions
y_pred = model.predict(X_test)

# Evaluate
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy:.2%}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))

# Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

# Visualize
plt.figure(figsize=(10, 6))
sns.barplot(data=feature_importance.head(10), x='importance', y='feature')
plt.title('Top 10 Feature Importances')
plt.show()`);

  const [pipelineCode, setPipelineCode] = useState(`# Data Pipeline Configuration
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer

# Define preprocessing pipeline
preprocessing = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

# Define ML pipeline
ml_pipeline = Pipeline([
    ('preprocessing', preprocessing),
    ('classifier', RandomForestClassifier())
])

# Agricultural data specific transformations
def process_agricultural_data(df):
    """Process agricultural sensor data"""
    # Handle timestamps
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour'] = df['timestamp'].dt.hour
    df['day_of_week'] = df['timestamp'].dt.dayofweek
    
    # Calculate rolling averages
    df['temp_rolling_mean'] = df['temperature'].rolling(window=24).mean()
    df['humidity_rolling_mean'] = df['humidity'].rolling(window=24).mean()
    
    # Create interaction features
    df['temp_humidity_interaction'] = df['temperature'] * df['humidity']
    df['vpd'] = calculate_vpd(df['temperature'], df['humidity'])
    
    return df

def calculate_vpd(temp, humidity):
    """Calculate Vapor Pressure Deficit"""
    # Simplified VPD calculation
    svp = 0.6108 * np.exp(17.27 * temp / (temp + 237.3))
    vpd = svp * (1 - humidity / 100)
    return vpd`);

  const handleTrainModel = async () => {
    setIsTraining(true);
    // Simulate model training
    setTimeout(() => {
      setModelMetrics({
        accuracy: 0.94,
        precision: 0.92,
        recall: 0.93,
        f1Score: 0.925,
        trainingTime: '2.3s',
        epochs: 100,
        loss: 0.0823
      });
      setIsTraining(false);
    }, 3000);
  };

  const handleDataUpload = () => {
    fileInputRef.current?.click();
  };

  const datasets = [
    { id: 'crop-yield', name: 'Crop Yield Dataset', size: '2.3 MB', records: 10000 },
    { id: 'sensor-data', name: 'IoT Sensor Data', size: '5.1 MB', records: 50000 },
    { id: 'weather', name: 'Weather Patterns', size: '1.8 MB', records: 8760 },
    { id: 'soil-quality', name: 'Soil Quality Metrics', size: '950 KB', records: 3500 }
  ];

  const models = [
    { name: 'Yield Predictor v2', type: 'RandomForest', accuracy: '94%', status: 'deployed' },
    { name: 'Disease Detector', type: 'CNN', accuracy: '89%', status: 'training' },
    { name: 'Growth Optimizer', type: 'XGBoost', accuracy: '91%', status: 'ready' },
    { name: 'Harvest Timer', type: 'LSTM', accuracy: '87%', status: 'development' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-white">
      <header className="border-b border-white/10">
        <div className="max-w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold">CroweCode ML Lab</h1>
              <p className="text-sm text-white/60">Machine Learning Development Environment</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isTraining 
                  ? 'bg-orange-500 animate-pulse' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
              } text-black`}
            >
              {isTraining ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Train Model
                </>
              )}
            </button>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/10 p-4 space-y-4">
          {/* Datasets */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datasets
            </h3>
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <button
                  key={dataset.id}
                  onClick={() => setSelectedDataset(dataset.id)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                    selectedDataset === dataset.id
                      ? 'bg-emerald-500/20 border border-emerald-500/40'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="font-medium">{dataset.name}</p>
                  <p className="text-xs text-white/60">{dataset.size} • {dataset.records} rows</p>
                </button>
              ))}
              <button
                onClick={handleDataUpload}
                className="w-full p-2 border border-dashed border-white/20 rounded-lg text-sm hover:bg-white/5"
              >
                <Upload className="h-4 w-4 mx-auto mb-1" />
                Upload Dataset
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.parquet"
                className="hidden"
                onChange={(e) => console.log('File selected:', e.target.files)}
              />
            </div>
          </div>

          {/* Models */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Models
            </h3>
            <div className="space-y-2">
              {models.map((model) => (
                <div key={model.name} className="p-2 bg-white/5 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{model.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      model.status === 'deployed' ? 'bg-emerald-500/20 text-emerald-300' :
                      model.status === 'training' ? 'bg-orange-500/20 text-orange-300' :
                      model.status === 'ready' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {model.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    {model.type} • {model.accuracy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-white/10 px-4">
            <div className="flex gap-4">
              {['notebook', 'pipeline', 'visualize', 'deploy'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 capitalize transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  {tab === 'notebook' && <FileCode className="inline h-4 w-4 mr-2" />}
                  {tab === 'pipeline' && <GitBranch className="inline h-4 w-4 mr-2" />}
                  {tab === 'visualize' && <BarChart3 className="inline h-4 w-4 mr-2" />}
                  {tab === 'deploy' && <Zap className="inline h-4 w-4 mr-2" />}
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className="flex-1">
              {activeTab === 'notebook' && (
                <MonacoEditor
                  height="100%"
                  language="python"
                  theme="vs-dark"
                  value={notebookCode}
                  onChange={(value) => setNotebookCode(value || '')}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              )}
              {activeTab === 'pipeline' && (
                <MonacoEditor
                  height="100%"
                  language="python"
                  theme="vs-dark"
                  value={pipelineCode}
                  onChange={(value) => setPipelineCode(value || '')}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              )}
              {activeTab === 'visualize' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Data Visualization</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-medium mb-3">Model Performance</h3>
                      <div className="h-48 flex items-end justify-between gap-2">
                        {[75, 82, 78, 85, 88, 91, 94].map((value, i) => (
                          <div key={i} className="flex-1 bg-emerald-500/50 rounded-t" 
                            style={{ height: `${value}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-medium mb-3">Feature Importance</h3>
                      <div className="space-y-2">
                        {['Temperature', 'Humidity', 'Soil pH', 'Light'].map((feature, i) => (
                          <div key={feature}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{feature}</span>
                              <span>{[0.34, 0.28, 0.22, 0.16][i]}</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${[85, 70, 55, 40][i]}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'deploy' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Model Deployment</h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h3 className="font-medium mb-3">Deployment Options</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg">
                          <Cloud className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm">Cloud API</p>
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg">
                          <Cpu className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm">Edge Device</p>
                        </button>
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-lg">
                          <Database className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm">Batch Process</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Metrics */}
            <div className="w-80 border-l border-white/10 p-4">
              <h3 className="text-sm font-semibold mb-4">Model Metrics</h3>
              {modelMetrics ? (
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white/60">Accuracy</span>
                      <span className="text-sm font-medium">{(modelMetrics.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${modelMetrics.accuracy * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white/60">Precision</span>
                      <span className="text-sm font-medium">{(modelMetrics.precision * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${modelMetrics.precision * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white/60">Recall</span>
                      <span className="text-sm font-medium">{(modelMetrics.recall * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${modelMetrics.recall * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">F1 Score</span>
                      <span>{modelMetrics.f1Score.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Training Time</span>
                      <span>{modelMetrics.trainingTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Epochs</span>
                      <span>{modelMetrics.epochs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Loss</span>
                      <span>{modelMetrics.loss.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg p-4 text-center text-sm text-white/60">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-white/30" />
                  <p>No model trained yet</p>
                  <p className="text-xs mt-1">Click &quot;Train Model&quot; to start</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-left">
                    <Save className="inline h-4 w-4 mr-2" />
                    Save Model
                  </button>
                  <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-left">
                    <Download className="inline h-4 w-4 mr-2" />
                    Export Weights
                  </button>
                  <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-left">
                    <Eye className="inline h-4 w-4 mr-2" />
                    View Logs
                  </button>
                  <button className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-left">
                    <Terminal className="inline h-4 w-4 mr-2" />
                    Open Terminal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}