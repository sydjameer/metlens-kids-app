import { DetectedObject, Language } from '../types';

async function apiFetch(action: string, payload: any) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorResult = await response.json().catch(() => ({ error: 'An unknown error occurred.' }));
    throw new Error(errorResult.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}


export async function analyzeImageForObjects(base64Image: string, language: Language): Promise<DetectedObject[]> {
  try {
    const result = await apiFetch('analyzeImage', { base64Image, language });
    return result as DetectedObject[];
  } catch (error) {
     console.error("Error analyzing image:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}

export async function generateAudio(text: string): Promise<string> {
   try {
    const result = await apiFetch('generateAudio', { text });
    if (!result.audio) {
      throw new Error("No audio data received from server.");
    }
    return result.audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw new Error("Failed to generate audio pronunciation.");
  }
}

// Audio decoding utilities (client-side only)
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
