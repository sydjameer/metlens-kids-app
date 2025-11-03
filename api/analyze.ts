import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";

// This function will run on the server, not in the browser
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: "API_KEY environment variable not set on the server" });
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const { action, payload } = req.body;

  try {
    if (action === 'analyzeImage') {
      const { base64Image, language } = payload;
      const imageAnalysisModel = 'gemini-2.5-flash';
      const prompt = `You are an expert in identifying objects for a children's language learning app. Analyze the provided image. Identify up to 5 main objects that a child would be interested in. For each object, provide its name in English, and its translation in ${language}. Also provide a simple phonetic pronunciation guide for the ${language} word. Respond ONLY with the JSON array.`;
      
      const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
      const textPart = { text: prompt };
      const responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            translation: { type: Type.STRING },
            pronunciation: { type: Type.STRING }
          },
          required: ["name", "translation", "pronunciation"],
        },
      };

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
      return res.status(200).json(result);

    } else if (action === 'generateAudio') {
      const { text } = payload;
      const ttsModel = 'gemini-2.5-flash-preview-tts';
      const response = await ai.models.generateContent({
        model: ttsModel,
        contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data received from API.");
      }
      return res.status(200).json({ audio: base64Audio });

    } else {
      return res.status(400).json({ error: 'Invalid action specified' });
    }
  } catch (error) {
    console.error("Error in serverless function:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred on the server.";
    return res.status(500).json({ error: message });
  }
}
