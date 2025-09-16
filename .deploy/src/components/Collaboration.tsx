"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { io, Socket } from "socket.io-client";
import {
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Phone,
  PhoneOff,
  Settings,
  X,
  Send,
  Smile,
} from "lucide-react";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
    file: string;
  };
  isActive: boolean;
}

interface CollaborationProps {
  roomId: string;
  projectName: string;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onCursorUpdate?: (cursor: any) => void;
  onCodeUpdate?: (update: any) => void;
}

export default function Collaboration({
  roomId,
  projectName,
  user,
  onCursorUpdate,
  onCodeUpdate,
}: CollaborationProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const newSocket = io(socketUrl, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to collaboration server");
      setIsConnected(true);
      
      // Join room
      newSocket.emit("join-room", {
        roomId,
        user,
        project: projectName,
      });
    });

    newSocket.on("room-state", (data) => {
      setCollaborators(data.collaborators);
    });

    newSocket.on("collaborator-joined", (data) => {
      setCollaborators(prev => [...prev, data.collaborator]);
    });

    newSocket.on("collaborator-left", (data) => {
      setCollaborators(prev => prev.filter(c => c.id !== data.userId));
      // Clean up peer connection if exists
      const pc = peerConnections.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.userId);
      }
    });

    newSocket.on("cursor-update", (data) => {
      if (onCursorUpdate) {
        onCursorUpdate(data);
      }
      setCollaborators(prev => prev.map(c => 
        c.id === data.userId 
          ? { ...c, cursor: data.cursor }
          : c
      ));
    });

    newSocket.on("code-update", (data) => {
      if (onCodeUpdate) {
        onCodeUpdate(data);
      }
    });

    newSocket.on("chat-update", (data) => {
      setChatMessages(prev => [...prev, data]);
    });

    newSocket.on("call-signal", async (data) => {
      await handleCallSignal(data.fromUserId, data.signal);
    });

    newSocket.on("screen-share-update", (data) => {
      // Handle screen share updates from other users
      console.log(`User ${data.userId} ${data.isSharing ? 'started' : 'stopped'} screen sharing`);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from collaboration server");
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      // Clean up media streams
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      // Clean up peer connections
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [roomId, projectName, user]);

  // Send cursor position
  const sendCursorPosition = (line: number, column: number, file: string) => {
    if (socket && isConnected) {
      socket.emit("cursor-move", {
        roomId,
        cursor: { line, column, file },
      });
    }
  };

  // Send code changes
  const sendCodeChange = (file: string, changes: any, version: number) => {
    if (socket && isConnected) {
      socket.emit("code-change", {
        roomId,
        file,
        changes,
        version,
      });
    }
  };

  // Send chat message
  const sendChatMessage = () => {
    if (socket && isConnected && chatInput.trim()) {
      socket.emit("chat-message", {
        roomId,
        message: chatInput,
      });
      setChatInput("");
    }
  };

  // Start video call
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoOn,
        audio: isAudioOn,
      });
      
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsInCall(true);
      
      // Create peer connections for all collaborators
      collaborators.forEach(collaborator => {
        if (collaborator.id !== socket?.id) {
          createPeerConnection(collaborator.id);
        }
      });
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  // Create peer connection
  const createPeerConnection = (userId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // Add TURN servers for production
      ],
    });

    // Add local stream tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const remoteVideo = remoteVideosRef.current.get(userId);
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("call-signal", {
          roomId,
          targetUserId: userId,
          signal: { type: "ice-candidate", candidate: event.candidate },
        });
      }
    };

    peerConnections.current.set(userId, pc);
    return pc;
  };

  // Handle incoming call signals
  const handleCallSignal = async (fromUserId: string, signal: any) => {
    let pc = peerConnections.current.get(fromUserId);
    
    if (!pc) {
      pc = createPeerConnection(fromUserId);
    }

    if (signal.type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (socket) {
        socket.emit("call-signal", {
          roomId,
          targetUserId: fromUserId,
          signal: answer,
        });
      }
    } else if (signal.type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.type === "ice-candidate") {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        
        // Replace video track in peer connections
        const videoTrack = stream.getVideoTracks()[0];
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => 
            s.track?.kind === "video"
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        setIsScreenSharing(true);
        
        if (socket) {
          socket.emit("screen-share", {
            roomId,
            isSharing: true,
            streamId: stream.id,
          });
        }
        
        // Handle stream end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    // Restore camera stream
    if (localStream.current && isVideoOn) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      peerConnections.current.forEach(pc => {
        const sender = pc.getSenders().find(s => 
          s.track?.kind === "video"
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
    }
    
    setIsScreenSharing(false);
    
    if (socket) {
      socket.emit("screen-share", {
        roomId,
        isSharing: false,
      });
    }
  };

  return (
    <div className="collaboration-panel">
      {/* Collaborators Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-white/10">
        <Users className="h-4 w-4 text-white/60" />
        <span className="text-xs text-white/60">Collaborators:</span>
        <div className="flex items-center gap-1">
          {collaborators.map(collaborator => (
            <div
              key={collaborator.id}
              className="relative group"
              title={collaborator.name}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ backgroundColor: collaborator.color }}
              >
                {collaborator.name.charAt(0).toUpperCase()}
              </div>
              {collaborator.cursor && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
              )}
            </div>
          ))}
        </div>
        
        {/* Connection Status */}
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-white/60">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Collaboration Actions */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="p-1.5 hover:bg-white/10 rounded relative"
          >
            <MessageSquare className="h-4 w-4" />
            {chatMessages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          
          <button
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`p-1.5 hover:bg-white/10 rounded ${isVideoOn ? 'text-green-400' : ''}`}
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setIsAudioOn(!isAudioOn)}
            className={`p-1.5 hover:bg-white/10 rounded ${isAudioOn ? 'text-green-400' : ''}`}
          >
            {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-1.5 hover:bg-white/10 rounded ${isScreenSharing ? 'text-blue-400' : ''}`}
          >
            {isScreenSharing ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={isInCall ? () => setIsInCall(false) : startVideoCall}
            className={`p-1.5 hover:bg-white/10 rounded ${isInCall ? 'text-red-400' : 'text-green-400'}`}
          >
            {isInCall ? <PhoneOff className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="absolute right-4 top-16 w-80 h-96 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-sm font-medium">Team Chat</span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 h-72">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-3">
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    {msg.userName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{msg.userName}</span>
                      <span className="text-xs text-white/40">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 mt-1">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                className="flex-1 bg-white/10 rounded px-3 py-1.5 text-sm outline-none"
                placeholder="Type a message..."
              />
              <button
                onClick={sendChatMessage}
                className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Overlay */}
      {isInCall && (
        <div className="fixed bottom-4 right-4 w-64 h-48 bg-black rounded-lg shadow-xl z-50">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full rounded-lg"
          />
          <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-2 rounded-full ${isVideoOn ? 'bg-white/20' : 'bg-red-500/20'}`}
            >
              {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsAudioOn(!isAudioOn)}
              className={`p-2 rounded-full ${isAudioOn ? 'bg-white/20' : 'bg-red-500/20'}`}
            >
              {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsInCall(false)}
              className="p-2 bg-red-500/20 rounded-full"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}