import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-10">
      <div className="w-16 h-16 border-8 border-white border-t-yellow-400 rounded-full animate-spin"></div>
      <p className="mt-4 text-white text-xl font-semibold">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
