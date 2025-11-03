import React, { useState, useRef } from 'react';
import { Language, DetectedObject } from '../types';
import { analyzeImageForObjects, playAudio, generateAudio } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import IconButton from './common/IconButton';

interface ImageModeProps {
  language: Language;
  onGoHome: () => void;
}

const ImageMode: React.FC<ImageModeProps> = ({ language, onGoHome }) => {
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<DetectedObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioFor, setPlayingAudioFor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        setResults([]);
        setError(null);
        analyzeImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageDataUrl: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const base64Image = imageDataUrl.split(',')[1];
      const detectedObjects = await analyzeImageForObjects(base64Image, language);
      setResults(detectedObjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (object: DetectedObject) => {
    if (playingAudioFor === object.translation) return;
    setPlayingAudioFor(object.translation);
    try {
      const audio = await generateAudio(object.translation);
      await playAudio(audio);
    } catch (err) {
      setError("Could not play audio.");
    } finally {
      setPlayingAudioFor(null);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-full w-full bg-purple-100 flex flex-col items-center p-4 overflow-y-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <IconButton icon="home" text="Home" onClick={onGoHome} className="bg-blue-500 hover:bg-blue-600"/>
          <h1 className="text-3xl font-bold text-purple-700">Photo Fun</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
          <div className="relative w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center border-4 border-dashed border-purple-300 overflow-hidden">
            {image ? (
              <img src={image} alt="Uploaded" className="object-contain h-full w-full" />
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-xl">Upload a photo to start!</p>
              </div>
            )}
            {isLoading && <LoadingSpinner message="Thinking..." />}
          </div>
          
          <div className="mt-6 flex justify-center">
             <IconButton icon="photo" text="Upload Photo" onClick={triggerFileInput} className="bg-purple-500 hover:bg-purple-600 text-lg px-8 py-4"/>
          </div>
           <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

          {error && <div className="mt-4 text-center text-red-500 font-semibold bg-red-100 p-3 rounded-lg">{error}</div>}

          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-purple-800 text-center mb-4">Look what I found!</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((obj, index) => (
                  <div key={index} className="bg-yellow-100 p-4 rounded-xl shadow-md flex items-center justify-between transform transition-transform hover:scale-105">
                    <div>
                      <p className="text-3xl font-bold text-yellow-800">{obj.translation}</p>
                      <p className="text-sm text-gray-600">{obj.name} / {obj.pronunciation}</p>
                    </div>
                    <button onClick={() => handlePlayAudio(obj)} className="p-3 bg-yellow-400 rounded-full hover:bg-yellow-500 transition-colors disabled:opacity-50" disabled={playingAudioFor === obj.translation}>
                        {playingAudioFor === obj.translation ? (
                            <div className="w-6 h-6 border-2 border-yellow-800 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageMode;