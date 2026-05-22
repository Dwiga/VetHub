import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TimelineEvent {
  status: string;
  date: string;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
  content?: React.ReactNode;
  onDetailsClick?: () => void;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = '' }) => {
  return (
    <div className={`space-y-10 ${className}`}>
      {events.map((event, index) => (
        <div key={index} className="relative flex items-start group">
          {/* Vertical Line */}
          {index !== events.length - 1 && (
            <div 
              className="absolute left-[18px] top-10 bottom-[-40px] w-0.5 bg-gray-200" 
              aria-hidden="true" 
            />
          )}

          {/* Icon Container */}
          <div 
            className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full ring-8 ring-white shrink-0 shadow-sm"
            style={{ backgroundColor: event.color || '#e5e7eb' }}
          >
            {event.icon ? (
              <div className="text-white w-5 h-5 flex items-center justify-center">
                {event.icon}
              </div>
            ) : (
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            )}
          </div>

          {/* Content */}
          <div className="ml-4 min-w-0 flex-1 pt-1.5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900 leading-none">{event.status}</h3>
                <time className="text-[11px] text-gray-400 font-medium uppercase mt-1 block tracking-wider">{event.date}</time>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {event.description && (
                <p className="leading-relaxed mb-2">{event.description}</p>
              )}
              
              {event.content && (
                <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-100 mb-3 shadow-inner">
                  {event.content}
                </div>
              )}

              {event.onDetailsClick && (
                <button 
                  onClick={event.onDetailsClick}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center transition-colors"
                >
                  Lihat Detail
                  <svg className="ml-1 w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
