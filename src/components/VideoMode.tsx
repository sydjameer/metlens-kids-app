import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Language, DetectedObject } from '../types';
import { analyzeImageForObjects, playAudio, generateAudio } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import IconButton from './common/IconButton';

interface VideoModeProps {
  language: Language;
  onGoHome: () => void;
}

const VideoMode: React.FC<VideoModeProps> = ({ language, onGoHome }) => {
  const [results, setResults] = useState<DetectedObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudioFor, setPlayingAudioFor] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setError(null);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check permissions.");
      setIsCameraOn(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleGoHomeAndStopCamera = () => {
    stopCamera();
    onGoHome();
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if(context){
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
        setIsLoading(true);
        setError(null);
        setResults([]);
        try {
          const base64Image = imageDataUrl.split(',')[1];
          const detectedObjects = await analyzeImageForObjects(base64Image, language);
          setResults(detectedObjects);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
          setIsLoading(false);
        }
    }
  };

  const handlePlayAudio = async (object: DetectedObject) => {
    if (playingAudioFor === object.translation) return;
    setPlayingAudioFor(object.translation);
    try {
        const audio = await generateAudio(object.translation);
        await playAudio(audio);
    } catch (err)
        {
        setError("Could not play audio.");
    } finally {
        setPlayingAudioFor(null);
    }
  };

  return (
    <div className="h-full w-full bg-green-100 flex flex-col items-center p-4 overflow-y-auto">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <IconButton icon="home" text="Home" onClick={handleGoHomeAndStopCamera} className="bg-blue-500 hover:bg-blue-600"/>
          <h1 className="text-3xl font-bold text-green-700 text-center">Video Magic</h1>
          <div className="w-24"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 w-full">
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center border-4 border-green-300 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {!isCameraOn && !error && (
              <div className="text-white text-center">
                <p className="text-xl">Starting camera...</p>
              </div>
            )}
            {isLoading && <LoadingSpinner message="Scanning..." />}
          </div>
          
          <div className="mt-6 flex justify-center">
            {isCameraOn ? (
              <IconButton icon="scan" text="What's This?" onClick={captureAndAnalyze} className="bg-green-500 hover:bg-green-600 text-lg px-8 py-4" disabled={isLoading} />
            ) : (
              <IconButton icon="video" text="Start Camera" onClick={startCamera} className="bg-yellow-500 hover:bg-yellow-600 text-lg px-8 py-4"/>
            )}
          </div>

          {error && <div className="mt-4 text-center text-red-500 font-semibold bg-red-100 p-3 rounded-lg">{error}</div>}

          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-green-800 text-center mb-4">I can see...</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((obj, index) => (
                  <div key={index} className="bg-blue-100 p-4 rounded-xl shadow-md flex items-center justify-between transform transition-transform hover:scale-105 animate-pop-in">
                    <div>
                      <p className="text-3xl font-bold text-blue-800">{obj.translation}</p>
                      <p className="text-sm text-gray-600">{obj.name} / {obj.pronunciation}</p>
                    </div>
                    <button onClick={() => handlePlayAudio(obj)} className="p-3 bg-blue-400 rounded-full hover:bg-blue-500 transition-colors disabled:opacity-50" disabled={playingAudioFor === obj.translation}>
                        {playingAudioFor === obj.translation ? (
                            <div className="w-6 h-6 border-2 border-blue-800 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-900" viewBox="0 0 20 20" fill="currentColor">
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
       <style>{`
          @keyframes pop-in {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop-in { animation: pop-in 0.3s ease-out forwards; }
       `}</style>
    </div>
  );
};

export default VideoMode;
