'use client';

import { useState, useEffect } from 'react';
import { ComicSeries, ComicWithIssues, ComicIssue } from '@/types/comic';
import ComicModal from './ComicModal';

interface MainContentProps {
  selectedSeries: ComicSeries | null;
}

export default function MainContent({ selectedSeries }: MainContentProps) {
  const [series, setSeries] = useState<ComicSeries[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<ComicIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/series');
      const data = await response.json();
      setSeries(data);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeriesClick = async (seriesData: ComicSeries) => {
    try {
      const response = await fetch(`/api/series/${seriesData.id}`);
      const seriesWithIssues: ComicWithIssues = await response.json();
      if (seriesWithIssues.issues.length > 0) {
        setSelectedIssue(seriesWithIssues.issues[0]);
      }
    } catch (error) {
      console.error('Error fetching series details:', error);
    }
  };

  const tabs = ['All', 'In Collection', 'For Sale', 'On Wish List', 'Series'];

  const getGradientClass = (title: string) => {
    const gradients = [
      'bg-gradient-to-br from-red-500 to-red-700',      // Amazing Spider-Man
      'bg-gradient-to-br from-blue-600 to-blue-800',    // Batman
      'bg-gradient-to-br from-yellow-500 to-orange-600', // Hellboy
      'bg-gradient-to-br from-purple-500 to-purple-700', // TMNT
      'bg-gradient-to-br from-green-500 to-green-700',   // Walking Dead
      'bg-gradient-to-br from-indigo-500 to-indigo-700'
    ];
    
    const hash = title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex space-x-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Grid</span>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search comics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-md p-1">
                <span className="text-xs text-gray-600 px-2 py-1">All</span>
                {Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i)).map(letter => (
                  <button key={letter} className="text-xs px-1 py-1 hover:bg-white rounded text-gray-600">
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comics Count */}
      <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-600">{series.length} comics</span>
      </div>

      {/* Comics Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {series.map((seriesItem) => (
              <div 
                key={seriesItem.id}
                onClick={() => handleSeriesClick(seriesItem)}
                className="cursor-pointer group transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              >
                <div className="relative">
                  <div className={`aspect-[2/3] rounded-lg shadow-lg overflow-hidden group-hover:shadow-2xl group-hover:brightness-110 transition-all duration-300 ${getGradientClass(seriesItem.title)}`}>
                    <div className="w-full h-full flex flex-col justify-between p-4 text-white">
                      <div className="text-lg font-bold leading-tight">
                        {seriesItem.title}
                      </div>
                      <div className="text-sm">
                        {seriesItem.publisher}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {seriesItem.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {seriesItem.publisher}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comic Detail Modal */}
      {selectedIssue && (
        <ComicModal 
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)} 
        />
      )}
    </div>
  );
}