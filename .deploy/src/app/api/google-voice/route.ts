import { NextRequest, NextResponse } from "next/server";
import { googleSpeechProvider } from "@/lib/google-speech-provider";

/**
 * Google Cloud Speech API Route
 * Handles Speech-to-Text, Text-to-Speech, and Translation
 */

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    // Handle audio upload for transcription
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      
      if (!audioFile) {
        return NextResponse.json(
          { error: "No audio file provided" },
          { status: 400 }
        );
      }

      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      
      // Transcribe audio
      const result = await googleSpeechProvider.transcribeAudio(audioBuffer, {
        encoding: 'WEBM_OPUS',
        languageCode: 'en-US',
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        model: 'latest_long',
      });

      return NextResponse.json({
        transcript: result.transcript,
        confidence: result.confidence,
        alternatives: result.alternatives,
        words: result.words,
        timestamp: new Date().toISOString(),
      });
    }

    // Handle JSON requests
    const body = await request.json();
    const { action, text, audioData, targetLanguage, sourceLanguage, voiceConfig } = body;

    // Check if Google Speech is configured
    if (!googleSpeechProvider.isConfigured()) {
      return NextResponse.json(
        { error: "Google Cloud Speech services not configured" },
        { status: 500 }
      );
    }

    // Speech-to-Text
    if (action === 'transcribe' && audioData) {
      const audioBuffer = Buffer.from(audioData, 'base64');
      const result = await googleSpeechProvider.transcribeAudio(audioBuffer, {
        languageCode: sourceLanguage || 'en-US',
        enableAutomaticPunctuation: true,
      });

      return NextResponse.json({
        transcript: result.transcript,
        confidence: result.confidence,
        alternatives: result.alternatives,
      });
    }

    // Text-to-Speech
    if (action === 'synthesize' && text) {
      const audioBuffer = await googleSpeechProvider.synthesizeSpeech(text, {
        languageCode: voiceConfig?.languageCode || 'en-US',
        voiceName: voiceConfig?.voiceName,
        speakingRate: voiceConfig?.speakingRate,
        pitch: voiceConfig?.pitch,
        volumeGainDb: voiceConfig?.volumeGainDb,
        ssmlGender: voiceConfig?.ssmlGender,
      });

      // Return audio as base64 for JSON response
      return NextResponse.json({
        audio: audioBuffer.toString('base64'),
        format: 'mp3',
      });
    }

    // Direct audio response for TTS
    if (action === 'tts' && text) {
      const audioBuffer = await googleSpeechProvider.synthesizeSpeech(text, {
        languageCode: voiceConfig?.languageCode || 'en-US',
        voiceName: voiceConfig?.voiceName || 'en-US-Neural2-F',
      });

      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    }

    // Translation
    if (action === 'translate' && text && targetLanguage) {
      const translatedText = await googleSpeechProvider.translateText(
        text,
        targetLanguage,
        sourceLanguage
      );

      return NextResponse.json({
        originalText: text,
        translatedText,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
      });
    }

    // Language Detection
    if (action === 'detect' && text) {
      const detection = await googleSpeechProvider.detectLanguage(text);
      
      return NextResponse.json({
        text,
        language: detection.language,
        confidence: detection.confidence,
      });
    }

    // List Available Voices
    if (action === 'listVoices') {
      const voices = await googleSpeechProvider.listVoices(
        body.languageCode
      );

      return NextResponse.json({
        voices,
        total: voices.length,
      });
    }

    // Agricultural Command Processing
    if (action === 'agricultural' && audioData) {
      const audioBuffer = Buffer.from(audioData, 'base64');
      const result = await googleSpeechProvider.processAgriculturalCommand(audioBuffer);

      return NextResponse.json({
        command: result.command,
        data: result.data,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing required parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Google Voice API error:", error);
    return NextResponse.json(
      { error: "Voice service error. Please try again later." },
      { status: 500 }
    );
  }
}

// GET endpoint for capabilities and health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'capabilities') {
    const capabilities = googleSpeechProvider.getCapabilities();
    return NextResponse.json(capabilities);
  }

  if (action === 'health') {
    const isConfigured = googleSpeechProvider.isConfigured();
    return NextResponse.json({
      status: isConfigured ? 'healthy' : 'not_configured',
      provider: 'Google Cloud Speech Services',
      configured: isConfigured,
    });
  }

  // Default response
  return NextResponse.json({
    service: 'Google Cloud Voice API',
    status: 'operational',
    endpoints: [
      'POST /api/google-voice - Process voice operations',
      'GET /api/google-voice?action=capabilities - Get service capabilities',
      'GET /api/google-voice?action=health - Health check',
    ],
    actions: [
      'transcribe - Convert speech to text',
      'synthesize - Convert text to speech',
      'translate - Translate text',
      'detect - Detect language',
      'listVoices - List available voices',
      'agricultural - Process agricultural voice commands',
    ],
  });
}
