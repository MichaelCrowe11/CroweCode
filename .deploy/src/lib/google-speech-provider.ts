/**
 * Google Cloud Speech & Text-to-Speech Provider
 * Replaces ElevenLabs and browser-based speech services
 */

import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { TranslationServiceClient } from '@google-cloud/translate';

interface VoiceConfig {
  languageCode: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
  ssmlGender?: 'NEUTRAL' | 'MALE' | 'FEMALE';
}

interface TranscriptionConfig {
  encoding?: 'WEBM_OPUS' | 'OGG_OPUS' | 'MP3' | 'LINEAR16';
  sampleRateHertz?: number;
  languageCode?: string;
  maxAlternatives?: number;
  profanityFilter?: boolean;
  enableWordTimeOffsets?: boolean;
  enableAutomaticPunctuation?: boolean;
  model?: 'latest_long' | 'latest_short' | 'command_and_search' | 'phone_call';
}

class GoogleSpeechProvider {
  private speechClient: SpeechClient | null = null;
  private ttsClient: TextToSpeechClient | null = null;
  private translateClient: TranslationServiceClient | null = null;
  private projectId: string;
  private location: string;

  constructor() {
    this.projectId = process.env.GCP_PROJECT_ID || '';
    this.location = process.env.GCP_LOCATION || 'global';
    
    if (this.projectId) {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      // Initialize Speech-to-Text client
      this.speechClient = new SpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      // Initialize Text-to-Speech client
      this.ttsClient = new TextToSpeechClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      // Initialize Translation client
      this.translateClient = new TranslationServiceClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      console.log('Google Speech services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Speech services:', error);
    }
  }

  /**
   * Convert speech to text
   */
  public async transcribeAudio(
    audioContent: Buffer | string,
    config?: TranscriptionConfig
  ): Promise<{
    transcript: string;
    confidence: number;
    alternatives: Array<{ transcript: string; confidence: number }>;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
  }> {
    if (!this.speechClient) {
      throw new Error('Speech client not initialized');
    }

    const request = {
      config: {
        encoding: config?.encoding || 'WEBM_OPUS',
        sampleRateHertz: config?.sampleRateHertz || 48000,
        languageCode: config?.languageCode || 'en-US',
        maxAlternatives: config?.maxAlternatives || 1,
        profanityFilter: config?.profanityFilter ?? false,
        enableWordTimeOffsets: config?.enableWordTimeOffsets ?? false,
        enableAutomaticPunctuation: config?.enableAutomaticPunctuation ?? true,
        model: config?.model || 'latest_long',
        useEnhanced: true,
      },
      audio: {
        content: typeof audioContent === 'string' 
          ? audioContent 
          : audioContent.toString('base64'),
      },
    };

    try {
      const [response] = await this.speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return {
          transcript: '',
          confidence: 0,
          alternatives: [],
        };
      }

      const result = response.results[0];
      const topAlternative = result.alternatives?.[0];

      // Extract word timings if requested
      let words;
      if (config?.enableWordTimeOffsets && topAlternative?.words) {
        words = topAlternative.words.map(word => ({
          word: word.word || '',
          startTime: Number(word.startTime?.seconds || 0) + 
                    Number(word.startTime?.nanos || 0) / 1_000_000_000,
          endTime: Number(word.endTime?.seconds || 0) + 
                  Number(word.endTime?.nanos || 0) / 1_000_000_000,
          confidence: word.confidence || 0,
        }));
      }

      return {
        transcript: topAlternative?.transcript || '',
        confidence: topAlternative?.confidence || 0,
        alternatives: result.alternatives?.map(alt => ({
          transcript: alt.transcript || '',
          confidence: alt.confidence || 0,
        })) || [],
        words,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text with streaming
   */
  public async streamingTranscribe(
    audioStream: NodeJS.ReadableStream,
    config?: TranscriptionConfig
  ) {
    if (!this.speechClient) {
      throw new Error('Speech client not initialized');
    }

    const request = {
      config: {
        encoding: config?.encoding || 'WEBM_OPUS',
        sampleRateHertz: config?.sampleRateHertz || 48000,
        languageCode: config?.languageCode || 'en-US',
        enableAutomaticPunctuation: true,
        model: 'latest_long',
      },
      interimResults: true,
    };

    const recognizeStream = this.speechClient
      .streamingRecognize(request)
      .on('data', (data: any) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          return {
            transcript: data.results[0].alternatives[0].transcript,
            isFinal: data.results[0].isFinal,
            confidence: data.results[0].alternatives[0].confidence,
          };
        }
      });

    audioStream.pipe(recognizeStream);
    return recognizeStream;
  }

  /**
   * Convert text to speech
   */
  public async synthesizeSpeech(
    text: string,
    config?: VoiceConfig
  ): Promise<Buffer> {
    if (!this.ttsClient) {
      throw new Error('TTS client not initialized');
    }

    // Check if text is SSML or plain text
    const inputType = text.includes('<speak>') ? 'ssml' : 'text';

    const request = {
      input: inputType === 'ssml' ? { ssml: text } : { text },
      voice: {
        languageCode: config?.languageCode || 'en-US',
        name: config?.voiceName || 'en-US-Neural2-F',
        ssmlGender: config?.ssmlGender || 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: config?.speakingRate || 1.0,
        pitch: config?.pitch || 0.0,
        volumeGainDb: config?.volumeGainDb || 0.0,
        effectsProfileId: ['headphone-class-device'],
      },
    };

    try {
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio content received');
      }

      // Convert to Buffer if it's a string
      const audioBuffer = typeof response.audioContent === 'string'
        ? Buffer.from(response.audioContent, 'base64')
        : response.audioContent as Buffer;

      return audioBuffer;
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  /**
   * Get available voices
   */
  public async listVoices(languageCode?: string): Promise<Array<{
    name: string;
    languageCodes: string[];
    ssmlGender: string;
    naturalSampleRateHertz: number;
  }>> {
    if (!this.ttsClient) {
      throw new Error('TTS client not initialized');
    }

    try {
      const [response] = await this.ttsClient.listVoices({
        languageCode,
      });

      return response.voices?.map(voice => ({
        name: voice.name || '',
        languageCodes: voice.languageCodes || [],
        ssmlGender: voice.ssmlGender as string || 'NEUTRAL',
        naturalSampleRateHertz: voice.naturalSampleRateHertz || 24000,
      })) || [];
    } catch (error) {
      console.error('Error listing voices:', error);
      return [];
    }
  }

  /**
   * Translate text
   */
  public async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    if (!this.translateClient) {
      throw new Error('Translation client not initialized');
    }

    const request = {
      parent: `projects/${this.projectId}/locations/${this.location}`,
      contents: [text],
      mimeType: 'text/plain',
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
    };

    try {
      const [response] = await this.translateClient.translateText(request);
      return response.translations?.[0]?.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  /**
   * Detect language
   */
  public async detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
  }> {
    if (!this.translateClient) {
      throw new Error('Translation client not initialized');
    }

    const request = {
      parent: `projects/${this.projectId}/locations/${this.location}`,
      content: text,
    };

    try {
      const [response] = await this.translateClient.detectLanguage(request);
      const detection = response.languages?.[0];
      
      return {
        language: detection?.languageCode || 'unknown',
        confidence: detection?.confidence || 0,
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return { language: 'unknown', confidence: 0 };
    }
  }

  /**
   * Process voice command for agricultural data
   */
  public async processAgriculturalCommand(
    audioContent: Buffer | string
  ): Promise<{
    command: string;
    data: Record<string, any>;
    confidence: number;
  }> {
    // Transcribe the audio
    const { transcript, confidence } = await this.transcribeAudio(audioContent, {
      model: 'command_and_search',
      languageCode: 'en-US',
    });

    // Parse agricultural commands
    const commandPatterns = {
      temperature: /temperature\s+(\d+(?:\.\d+)?)/i,
      humidity: /humidity\s+(\d+(?:\.\d+)?)/i,
      ph: /ph\s+(\d+(?:\.\d+)?)/i,
      yield: /yield\s+(\d+(?:\.\d+)?)\s*(\w+)?/i,
      field: /field\s+(\w+)/i,
      issue: /issue\s+(.+)/i,
    };

    const data: Record<string, any> = {};
    let matchedCommand = '';

    for (const [command, pattern] of Object.entries(commandPatterns)) {
      const match = transcript.match(pattern);
      if (match) {
        matchedCommand = command;
        if (command === 'yield') {
          data.value = parseFloat(match[1]);
          data.unit = match[2] || 'kg';
        } else if (command === 'issue' || command === 'field') {
          data.value = match[1];
        } else {
          data.value = parseFloat(match[1]);
        }
        break;
      }
    }

    return {
      command: matchedCommand || 'unknown',
      data,
      confidence,
    };
  }

  /**
   * Check if services are configured
   */
  public isConfigured(): boolean {
    return !!(this.speechClient && this.ttsClient && this.projectId);
  }

  /**
   * Get service capabilities
   */
  public getCapabilities() {
    return {
      speechToText: {
        provider: 'Google Cloud Speech-to-Text',
        models: ['latest_long', 'latest_short', 'command_and_search', 'phone_call'],
        languages: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'pt-BR', 'zh-CN'],
        features: ['streaming', 'word-timing', 'punctuation', 'profanity-filter'],
      },
      textToSpeech: {
        provider: 'Google Cloud Text-to-Speech',
        voiceTypes: ['Standard', 'WaveNet', 'Neural2', 'News', 'Studio'],
        languages: ['100+ languages'],
        features: ['SSML', 'custom-voice', 'audio-profiles'],
      },
      translation: {
        provider: 'Google Cloud Translation',
        languages: ['100+ languages'],
        features: ['auto-detect', 'batch-translation'],
      },
    };
  }
}

// Singleton instance
export const googleSpeechProvider = new GoogleSpeechProvider();

// Export for testing
export default GoogleSpeechProvider;
