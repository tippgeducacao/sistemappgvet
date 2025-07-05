
import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'text' | 'fullscreen';
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Carregando...', 
  size = 'md',
  variant = 'spinner'
}) => {
  const spinnerSizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  if (variant === 'text') {
    return <p className="text-gray-600">{message}</p>;
  }

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ppgvet-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ppgvet-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${spinnerSizes[size]} border-4 border-ppgvet-teal border-t-transparent rounded-full animate-spin`}></div>
      {message && <span className="ml-2 text-gray-600">{message}</span>}
    </div>
  );
};

export default LoadingState;
