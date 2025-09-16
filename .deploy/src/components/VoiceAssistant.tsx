"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Activity } from "lucide-react";

interface VoiceAssistantProps {
  onCommand?: (command: string) => void;
  onTranscript?: (text: string) => void;
  context?: 'ide' | 'agriculture' | 'ml' | 'general';
}

export default function VoiceAssistant({ onCommand, onTranscript, context = 'general' }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          processCommand(finalTranscript);
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = new SpeechSynthesisUtterance();
      synthRef.current.rate = 1.0;
      synthRef.current.pitch = 1.0;
      synthRef.current.volume = 1.0;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const processCommand = async (text: string) => {
    setIsProcessing(true);
    const lowerText = text.toLowerCase().trim();

    // Context-specific command processing
    let processedCommand = '';
    
    if (context === 'agriculture') {
      // Agricultural commands
      if (lowerText.includes('temperature') || lowerText.includes('humidity') || lowerText.includes('moisture')) {
        processedCommand = `agricultural_entry: ${text}`;
      } else if (lowerText.includes('yield') || lowerText.includes('harvest')) {
        processedCommand = `yield_record: ${text}`;
      } else if (lowerText.includes('disease') || lowerText.includes('pest')) {
        processedCommand = `issue_report: ${text}`;
      }
    } else if (context === 'ide') {
      // IDE commands
      if (lowerText.includes('create') || lowerText.includes('new file')) {
        processedCommand = `create_file: ${text}`;
      } else if (lowerText.includes('run') || lowerText.includes('execute')) {
        processedCommand = `run_code: ${text}`;
      } else if (lowerText.includes('debug')) {
        processedCommand = `debug: ${text}`;
      } else if (lowerText.includes('commit')) {
        processedCommand = `git_commit: ${text}`;
      }
    } else if (context === 'ml') {
      // ML commands
      if (lowerText.includes('train')) {
        processedCommand = `train_model: ${text}`;
      } else if (lowerText.includes('evaluate')) {
        processedCommand = `evaluate_model: ${text}`;
      } else if (lowerText.includes('predict')) {
        processedCommand = `predict: ${text}`;
      }
    }

    // Send to API for processing
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'agricultural_entry',
          text: text,
          context: context
        })
      });

      const data = await response.json();
      
      if (onCommand) {
        onCommand(processedCommand || text);
      }
      if (onTranscript) {
        onTranscript(text);
      }

      // Speak response
      if (data.response) {
        speak(data.response);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
    }

    setIsProcessing(false);
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      // Fallback to MediaRecorder API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          // Send to API for transcription
          const formData = new FormData();
          formData.append('audio', audioBlob);
          
          try {
            const response = await fetch('/api/voice', {
              method: 'POST',
              body: formData
            });
            const data = await response.json();
            if (data.transcript) {
              setTranscript(data.transcript);
              processCommand(data.transcript);
            }
          } catch (error) {
            console.error('Transcription error:', error);
          }
        };

        mediaRecorderRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Microphone access error:', error);
      }
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const speak = (text: string) => {
    if (synthRef.current && window.speechSynthesis) {
      synthRef.current.text = text;
      setIsSpeaking(true);
      
      synthRef.current.onend = () => {
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(synthRef.current);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled && isListening) {
      stopListening();
    }
  };

  const getContextHint = () => {
    switch (context) {
      case 'agriculture':
        return "Say: temperature 22, humidity 75, yield 3.5 pounds...";
      case 'ide':
        return "Say: create new file, run code, commit changes...";
      case 'ml':
        return "Say: train model, evaluate performance, predict...";
      default:
        return "Speak your command...";
    }
  };

  return (
    <div className="relative">
      {/* Voice Toggle Button */}
      <button
        onClick={toggleVoice}
        className={`p-2 rounded-lg transition-all ${
          voiceEnabled ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'
        }`}
        title="Toggle Voice Assistant"
      >
        {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>

      {/* Voice Assistant Panel */}
      {voiceEnabled && (
        <div className="absolute top-12 right-0 w-80 bg-zinc-900 border border-white/10 rounded-lg shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Voice Assistant</h3>
            <div className="flex items-center gap-2">
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSpeaking && <Activity className="h-4 w-4 animate-pulse text-emerald-500" />}
            </div>
          </div>

          {/* Recording Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`p-6 rounded-full transition-all ${
                isListening 
                  ? 'bg-red-500 animate-pulse scale-110' 
                  : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-105'
              }`}
            >
              {isListening ? (
                <Mic className="h-8 w-8 text-white" />
              ) : (
                <MicOff className="h-8 w-8 text-white" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center mb-4">
            {isListening && (
              <p className="text-sm text-emerald-400 animate-pulse">Listening...</p>
            )}
            {isProcessing && (
              <p className="text-sm text-blue-400">Processing command...</p>
            )}
            {!isListening && !isProcessing && (
              <p className="text-sm text-white/60">{getContextHint()}</p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-white/80">{transcript}</p>
            </div>
          )}

          {/* Voice Settings */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Voice Engine</span>
              <span className="text-white/40">
                {process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY ? 'ElevenLabs' : 'Browser TTS'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-white/60">Context</span>
              <span className="text-white/40 capitalize">{context}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}