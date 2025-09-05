'use client';

import { useState, useEffect } from 'react';
import { ComicSeries } from '@/types/comic';

interface SidebarProps {
  onSeriesSelect: (series: ComicSeries | null) => void;
  selectedSeries: ComicSeries | null;
}

export default function Sidebar({ onSeriesSelect, selectedSeries }: SidebarProps) {
  const [series, setSeries] = useState<ComicSeries[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [publishersExpanded, setPublishersExpanded] = useState(false);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async (query?: string) => {
    try {
      setLoading(true);
      const url = query ? `/api/series?q=${encodeURIComponent(query)}` : '/api/series';
      const response = await fetch(url);
      const data = await response.json();
      setSeries(data);
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSeries(searchQuery);
  };

  const publishers = [...new Set(series.map(s => s.publisher).filter(Boolean))];
  const publisherCounts = publishers.map(pub => ({
    name: pub,
    count: series.filter(s => s.publisher === pub).length
  }));

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4">
        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">FOLDERS</div>
          
          <div>
            <button
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="flex items-center gap-2 w-full text-left py-1 hover:bg-gray-100 rounded"
            >
              <span className="text-xs">{foldersExpanded ? '▼' : '▶'}</span>
              <span className="text-sm font-medium">Main</span>
            </button>
            
            {foldersExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                <div className="flex items-center gap-2 py-1">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 border border-blue-500 bg-blue-50"></div>
                  </div>
                  <span className="text-sm">Series</span>
                </div>
                <div className="text-sm text-gray-600 ml-6 space-y-1">
                  <div>Publisher</div>
                  <div>Release Year</div>
                  <div>Genre</div>
                  <div className="flex items-center gap-2">
                    <span>Value</span>
                    <span className="text-xs">▼</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Personal</span>
                    <span className="text-xs">▼</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">PUBLISHERS</div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search publishers..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          {publisherCounts.map((pub, index) => (
            <div key={index} className="flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded">
              <span className="font-medium">{pub.name?.charAt(0).toUpperCase()}</span>
              <div className="flex-1 mx-2">
                <div className="text-gray-700">{pub.name}</div>
              </div>
              <span className="text-gray-500 text-xs">{pub.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}