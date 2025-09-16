import { NextRequest, NextResponse } from "next/server";

/**
 * Voice API Integration
 * Supports ElevenLabs for TTS and ConvAI for voice commands
 */

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const CONVAI_API_URL = "https://api.convai.com/v1";

export async function POST(request: NextRequest) {
  try {
    const { action, text, audioData, voiceId = "default" } = await request.json();

    // Text-to-Speech using ElevenLabs
    if (action === 'tts' && text) {
      if (!process.env.ELEVENLABS_API_KEY) {
        // Fallback to browser's speech synthesis
        return NextResponse.json({
          fallback: true,
          text,
          message: "Using browser TTS (ElevenLabs not configured)"
        });
      }

      const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      });
    }

    // Speech-to-Text and Command Processing
    if (action === 'stt' && audioData) {
      // Process voice command
      const command = await processVoiceCommand(audioData);
      
      return NextResponse.json({
        command,
        timestamp: new Date().toISOString(),
        processed: true
      });
    }

    // Voice Command to Agricultural Data Entry
    if (action === 'agricultural_entry' && text) {
      const parsedData = parseAgriculturalCommand(text);
      
      return NextResponse.json({
        success: true,
        data: parsedData,
        message: "Agricultural data recorded successfully"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Voice API error:", error);
    return NextResponse.json(
      { error: "Voice processing failed", fallback: true },
      { status: 500 }
    );
  }
}

// Parse agricultural voice commands
function parseAgriculturalCommand(text: string): any {
  const lowerText = text.toLowerCase();
  const data: any = {
    timestamp: new Date().toISOString(),
    rawText: text,
    entries: []
  };

  // Parse temperature
  const tempMatch = lowerText.match(/temperature\s+(\d+\.?\d*)/);
  if (tempMatch) {
    data.entries.push({
      type: 'temperature',
      value: parseFloat(tempMatch[1]),
      unit: 'celsius'
    });
  }

  // Parse humidity
  const humidityMatch = lowerText.match(/humidity\s+(\d+\.?\d*)/);
  if (humidityMatch) {
    data.entries.push({
      type: 'humidity',
      value: parseFloat(humidityMatch[1]),
      unit: 'percent'
    });
  }

  // Parse pH
  const phMatch = lowerText.match(/ph\s+(\d+\.?\d*)/);
  if (phMatch) {
    data.entries.push({
      type: 'ph',
      value: parseFloat(phMatch[1]),
      unit: 'ph'
    });
  }

  // Parse yield
  const yieldMatch = lowerText.match(/yield\s+(\d+\.?\d*)\s*(pounds?|lbs?|kilos?|kg?)/i);
  if (yieldMatch) {
    data.entries.push({
      type: 'yield',
      value: parseFloat(yieldMatch[1]),
      unit: yieldMatch[2]
    });
  }

  // Parse field/location
  const fieldMatch = lowerText.match(/field\s+(\w+)|greenhouse\s+(\w+)|location\s+(\w+)/i);
  if (fieldMatch) {
    data.location = fieldMatch[1] || fieldMatch[2] || fieldMatch[3];
  }

  // Parse crop type
  const cropTypes = ['mushroom', 'cannabis', 'tomato', 'lettuce', 'pepper', 'cucumber'];
  for (const crop of cropTypes) {
    if (lowerText.includes(crop)) {
      data.crop = crop;
      break;
    }
  }

  // Parse issues/observations
  const issues = ['pest', 'disease', 'fungus', 'mold', 'deficiency', 'burn', 'wilt'];
  for (const issue of issues) {
    if (lowerText.includes(issue)) {
      if (!data.issues) data.issues = [];
      data.issues.push(issue);
    }
  }

  return data;
}

// Process voice command (placeholder for actual STT)
async function processVoiceCommand(audioData: string): Promise<string> {
  // This would connect to a speech-to-text service
  // For now, return a simulated command
  return "Record temperature 22.5 humidity 75 in greenhouse 1";
}

// WebSocket endpoint for real-time voice streaming
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'capabilities') {
    return NextResponse.json({
      tts: {
        provider: process.env.ELEVENLABS_API_KEY ? 'ElevenLabs' : 'Browser',
        voices: ['default', 'assistant', 'narrator'],
        languages: ['en-US', 'en-GB', 'es-ES']
      },
      stt: {
        provider: 'Browser MediaRecorder API',
        formats: ['webm', 'ogg', 'mp3']
      },
      commands: {
        agricultural: [
          'temperature [value]',
          'humidity [value]',
          'ph [value]',
          'yield [value] [unit]',
          'field [name]',
          'issue [description]'
        ]
      }
    });
  }

  return NextResponse.json({ status: 'Voice API operational' });
}