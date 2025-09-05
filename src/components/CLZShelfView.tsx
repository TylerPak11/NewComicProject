'use client';

import { useState } from 'react';
import { ComicSeries, ComicIssue } from '@/types/comic';

interface CLZShelfViewProps {
  series: ComicSeries[];
  onSeriesClick: (series: ComicSeries) => void;
  onIssueClick: (issue: ComicIssue) => void;
}

export default function CLZShelfView({ series, onSeriesClick, onIssueClick }: CLZShelfViewProps) {
  const getGradientClass = (title: string) => {
    const gradients = [
      'bg-gradient-to-br from-red-500 to-red-700',      
      'bg-gradient-to-br from-blue-600 to-blue-800',    
      'bg-gradient-to-br from-yellow-500 to-orange-600', 
      'bg-gradient-to-br from-purple-500 to-purple-700', 
      'bg-gradient-to-br from-green-500 to-green-700',   
      'bg-gradient-to-br from-indigo-500 to-indigo-700'
    ];
    
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div id="view-content" className="shelf-3 bg-gray-100 min-h-0 flex-1">
      <div id="item-body" className="page p-6">
        {/* Shelf container */}
        <div className="shelf-container space-y-12">
          {/* Create shelves - group comics by rows */}
          {Array.from({ length: Math.ceil(series.length / 6) }, (_, rowIndex) => (
            <div key={rowIndex} className="shelf-row relative">
              {/* Shelf background */}
              <div className="shelf-bg absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg shadow-lg"></div>
              <div className="shelf-edge absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-400 to-gray-600 rounded-lg"></div>
              
              {/* Comics on shelf */}
              <div className="shelf-items flex items-end justify-start gap-2 pb-8 relative z-10">
                {series.slice(rowIndex * 6, (rowIndex + 1) * 6).map((seriesItem, index) => (
                  <div 
                    key={seriesItem.id}
                    onClick={() => onSeriesClick(seriesItem)}
                    className="comic-spine cursor-pointer transform hover:scale-110 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:brightness-110"
                    style={{ 
                      height: `${120 + (index % 3) * 20}px`,
                      width: '80px'
                    }}
                  >
                    <div className={`h-full w-full rounded-t-sm shadow-lg ${getGradientClass(seriesItem.title)} flex flex-col justify-between p-2 text-white relative`}>
                      {/* Comic spine content */}
                      <div className="comic-title transform -rotate-90 origin-center absolute inset-0 flex items-center justify-center">
                        <div className="text-xs font-bold leading-tight text-center whitespace-nowrap overflow-hidden max-w-20">
                          {seriesItem.title.substring(0, 20)}
                        </div>
                      </div>
                      
                      {/* Publisher logo at bottom */}
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="text-xs text-center bg-black bg-opacity-30 rounded px-1 py-0.5">
                          {seriesItem.publisher?.substring(0, 8) || 'Comics'}
                        </div>
                      </div>
                      
                      {/* Issue count badge */}
                      <div className="absolute top-1 right-1">
                        <div className="bg-black bg-opacity-50 text-white text-xs rounded px-1 py-0.5 min-w-4 text-center">
                          {seriesItem.issueCount}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}