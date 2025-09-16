"use client";

import React, { useState, useEffect } from "react";
import { 
  Container,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Plus,
  Download,
  HardDrive,
  Network,
  Layers,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Terminal,
  Eye,
  Copy,
  MoreVertical
} from "lucide-react";

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports?: string;
  created?: string;
}

interface DockerImage {
  repository: string;
  tag: string;
  size: string;
  id?: string;
}

export default function DockerPanel() {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [volumes, setVolumes] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'containers' | 'images' | 'volumes' | 'networks'>('containers');
  const [isLoading, setIsLoading] = useState(false);
  const [dockerAvailable, setDockerAvailable] = useState(true);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [key: string]: { cpu: string; memory: string } }>({});

  // Load Docker data
  const loadDockerData = async () => {
    setIsLoading(true);
    try {
      // Load containers
      const containersRes = await fetch('/api/docker?action=ps');
      const containersData = await containersRes.json();
      
      if (containersData.dockerAvailable === false) {
        setDockerAvailable(false);
        return;
      }

      if (containersData.success && containersData.output) {
        const lines = containersData.output.split('\\n').filter(Boolean);
        const containersList: DockerContainer[] = [];
        
        // Skip header and parse each line
        lines.slice(1).forEach((line: string) => {
          const parts = line.split('\\t');
          if (parts.length >= 4) {
            containersList.push({
              id: parts[0],
              image: parts[1],
              status: parts[2],
              name: parts[3]
            });
          }
        });
        setContainers(containersList);
      }

      // Load images
      const imagesRes = await fetch('/api/docker?action=images');
      const imagesData = await imagesRes.json();
      
      if (imagesData.success && imagesData.output) {
        const lines = imagesData.output.split('\\n').filter(Boolean);
        const imagesList: DockerImage[] = [];
        
        lines.slice(1).forEach((line: string) => {
          const parts = line.split('\\t');
          if (parts.length >= 3) {
            imagesList.push({
              repository: parts[0],
              tag: parts[1],
              size: parts[2]
            });
          }
        });
        setImages(imagesList);
      }

      // Load volumes
      const volumesRes = await fetch('/api/docker?action=volumes');
      const volumesData = await volumesRes.json();
      
      if (volumesData.success && volumesData.output) {
        const lines = volumesData.output.split('\\n').filter(Boolean);
        setVolumes(lines.slice(1)); // Skip header
      }

      // Load networks
      const networksRes = await fetch('/api/docker?action=networks');
      const networksData = await networksRes.json();
      
      if (networksData.success && networksData.output) {
        const lines = networksData.output.split('\\n').filter(Boolean);
        setNetworks(lines.slice(1)); // Skip header
      }

      // Load stats
      const statsRes = await fetch('/api/docker?action=stats');
      const statsData = await statsRes.json();
      
      if (statsData.success && statsData.output) {
        const lines = statsData.output.split('\\n').filter(Boolean);
        const statsMap: typeof stats = {};
        
        lines.slice(1).forEach((line: string) => {
          const parts = line.split('\\t');
          if (parts.length >= 3) {
            statsMap[parts[0]] = {
              cpu: parts[1],
              memory: parts[2]
            };
          }
        });
        setStats(statsMap);
      }

      setDockerAvailable(true);
    } catch (error) {
      console.error('Failed to load Docker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDockerData();
    const interval = setInterval(loadDockerData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleContainerAction = async (action: string, container: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, container }),
      });
      
      if (response.ok) {
        await loadDockerData();
      }
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunImage = async (image: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/docker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', image }),
      });
      
      if (response.ok) {
        await loadDockerData();
      }
    } catch (error) {
      console.error('Failed to run image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('Up')) return <CheckCircle className="h-3 w-3 text-green-400" />;
    if (status.includes('Exited')) return <XCircle className="h-3 w-3 text-red-400" />;
    return <AlertCircle className="h-3 w-3 text-yellow-400" />;
  };

  if (!dockerAvailable) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <Container className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-sm text-white/50 mb-2">Docker is not available</p>
        <p className="text-xs text-white/30">
          Make sure Docker Desktop is installed and running
        </p>
        <button
          onClick={loadDockerData}
          className="mt-4 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Container className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium">Docker</span>
        </div>
        <button
          onClick={loadDockerData}
          className="p-1 hover:bg-white/10 rounded"
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('containers')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs transition-colors ${
            activeTab === 'containers' 
              ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="h-3 w-3" />
          Containers ({containers.length})
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs transition-colors ${
            activeTab === 'images' 
              ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <HardDrive className="h-3 w-3" />
          Images ({images.length})
        </button>
        <button
          onClick={() => setActiveTab('volumes')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs transition-colors ${
            activeTab === 'volumes' 
              ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <HardDrive className="h-3 w-3" />
          Volumes ({volumes.length})
        </button>
        <button
          onClick={() => setActiveTab('networks')}
          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs transition-colors ${
            activeTab === 'networks' 
              ? 'bg-zinc-800 text-white border-b-2 border-blue-400' 
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          <Network className="h-3 w-3" />
          Networks ({networks.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'containers' && (
          <div className="space-y-2">
            {containers.length === 0 ? (
              <div className="text-xs text-white/30 text-center py-4">
                No containers running
              </div>
            ) : (
              containers.map(container => (
                <div 
                  key={container.id}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(container.status)}
                      <span className="text-xs font-medium">{container.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {container.status.includes('Up') ? (
                        <button
                          onClick={() => handleContainerAction('stop', container.id)}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Stop container"
                        >
                          <Square className="h-3 w-3 text-red-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleContainerAction('start', container.id)}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Start container"
                        >
                          <Play className="h-3 w-3 text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleContainerAction('restart', container.id)}
                        className="p-1 hover:bg-white/10 rounded"
                        title="Restart container"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleContainerAction('remove', container.id)}
                        className="p-1 hover:bg-white/10 rounded"
                        title="Remove container"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-white/50">
                    <div>Image: {container.image}</div>
                    <div>Status: {container.status}</div>
                    {stats[container.name] && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          CPU: {stats[container.name].cpu}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          Mem: {stats[container.name].memory}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-2">
            {images.length === 0 ? (
              <div className="text-xs text-white/30 text-center py-4">
                No images found
              </div>
            ) : (
              images.map((image, index) => (
                <div 
                  key={index}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium">
                        {image.repository}:{image.tag}
                      </div>
                      <div className="text-xs text-white/50">
                        Size: {image.size}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRunImage(`${image.repository}:${image.tag}`)}
                      className="p-1.5 bg-blue-500 hover:bg-blue-600 rounded text-xs"
                      title="Run image"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'volumes' && (
          <div className="space-y-2">
            {volumes.length === 0 ? (
              <div className="text-xs text-white/30 text-center py-4">
                No volumes found
              </div>
            ) : (
              volumes.map((volume, index) => (
                <div 
                  key={index}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                >
                  <div className="text-xs">{volume}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'networks' && (
          <div className="space-y-2">
            {networks.length === 0 ? (
              <div className="text-xs text-white/30 text-center py-4">
                No networks found
              </div>
            ) : (
              networks.map((network, index) => (
                <div 
                  key={index}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded border border-white/10"
                >
                  <div className="text-xs">{network}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t border-white/10 p-2">
        <div className="flex items-center gap-2">
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 hover:bg-blue-600 rounded text-xs">
            <Plus className="h-3 w-3" />
            Pull Image
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs">
            <Terminal className="h-3 w-3" />
            Compose
          </button>
        </div>
      </div>
    </div>
  );
}