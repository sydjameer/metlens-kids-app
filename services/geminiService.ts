import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { DetectedObject, Language } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const imageAnalysisModel = 'gemini-2.5-flash';
const ttsModel = 'gemini-2.5-flash-preview-tts';

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'The English name of the object.',
      },
      translation: {
        type: Type.STRING,
        description: 'The translation of the object name in the target language.',
      },
      pronunciation: {
        type: Type.STRING,
        description: 'A simple phonetic guide for the translated word.'
      }
    },
    required: ["name", "translation", "pronunciation"],
  },
};

export async function analyzeImageForObjects(base64Image: string, language: Language): Promise<DetectedObject[]> {
  const prompt = `You are an expert in identifying objects for a children's language learning app. Analyze the provided image. Identify up to 5 main objects that a child would be interested in. For each object, provide its name in English, and its translation in ${language}. Also provide a simple phonetic pronunciation guide for the ${language} word. Respond ONLY with the JSON array.`;

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  
  const textPart = { text: prompt };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: imageAnalysisModel,
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result as DetectedObject[];
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image. The model may not have been able to identify objects or returned an unexpected format.");
  }
}

export async function generateAudio(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio pronunciation.");
  }
}

// Audio decoding utilities
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

export async function playAudio(base64Audio: string) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    const decodedData = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedData, audioContext);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
}