import React from 'react';

interface WaveformProps {
  isSpeaking: boolean;
  colorClass?: string;
}

export const Waveform: React.FC<WaveformProps> = ({ isSpeaking, colorClass = 'bg-teal-400' }) => {
  if (!isSpeaking) {
    return (
      <div className="flex items-center gap-0.5 h-6">
        <div className={`w-0.75 h-1 rounded-full ${colorClass} opacity-40`} />
        <div className={`w-0.75 h-1 rounded-full ${colorClass} opacity-40`} />
        <div className={`w-0.75 h-1 rounded-full ${colorClass} opacity-40`} />
        <div className={`w-0.75 h-1 rounded-full ${colorClass} opacity-40`} />
        <div className={`w-0.75 h-1 rounded-full ${colorClass} opacity-40`} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 h-7">
      <div className={`w-0.75 rounded-full ${colorClass} animate-wave-1`} />
      <div className={`w-0.75 rounded-full ${colorClass} animate-wave-2`} />
      <div className={`w-0.75 rounded-full ${colorClass} animate-wave-3`} />
      <div className={`w-0.75 rounded-full ${colorClass} animate-wave-4`} />
      <div className={`w-0.75 rounded-full ${colorClass} animate-wave-5`} />
    </div>
  );
};
