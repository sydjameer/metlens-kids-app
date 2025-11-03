import React, { useState, useCallback } from 'react';
import { Language, AppMode } from './types';
import ImageMode from './components/ImageMode';
import VideoMode from './components/VideoMode';
import IconButton from './components/common/IconButton';

const HomeScreen: React.FC<{ onStart: (lang: Language, mode: AppMode) => void }> = ({ onStart }) => {
  const [language, setLanguage] = useState<Language>(Language.Arabic);

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-yellow-100 p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-2xl transform transition-all hover:scale-105">
        <h1 className="text-5xl md:text-6xl font-bold text-blue-500 mb-2">METLens Kids</h1>
        <p className="text-gray-600 text-lg mb-8">Learn new words in a fun way!</p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Choose a Language</h2>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setLanguage(Language.Arabic)}
              className={`px-8 py-3 text-xl font-bold rounded-full transition-all duration-300 ${language === Language.Arabic ? 'bg-green-500 text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-green-200'}`}
            >
              Arabic
            </button>
            <button
              onClick={() => setLanguage(Language.Malay)}
              className={`px-8 py-3 text-xl font-bold rounded-full transition-all duration-300 ${language === Language.Malay ? 'bg-orange-500 text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-orange-200'}`}
            >
              Malay
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Choose a Mode</h2>
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
            <IconButton
              icon="photo"
              text="Photo Fun"
              onClick={() => onStart(language, AppMode.Image)}
              className="bg-purple-500 hover:bg-purple-600"
            />
            <IconButton
              icon="video"
              text="Video Magic"
              onClick={() => onStart(language, AppMode.Video)}
              className="bg-red-500 hover:bg-red-600"
            />
          </div>
        </div>
      </div>
       <footer className="absolute bottom-4 left-0 right-0 text-center text-gray-500 text-xs">
        Made with ❤️ in SG for MET learners
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Home);
  const [language, setLanguage] = useState<Language>(Language.Arabic);

  const handleStart = useCallback((lang: Language, selectedMode: AppMode) => {
    setLanguage(lang);
    setMode(selectedMode);
  }, []);
  
  const handleGoHome = useCallback(() => {
    setMode(AppMode.Home);
  }, []);

  const renderContent = () => {
    switch (mode) {
      case AppMode.Image:
        return <ImageMode language={language} onGoHome={handleGoHome} />;
      case AppMode.Video:
        return <VideoMode language={language} onGoHome={handleGoHome} />;
      default:
        return <HomeScreen onStart={handleStart} />;
    }
  };

  return <div className="w-full h-full">{renderContent()}</div>;
};

export default App;
