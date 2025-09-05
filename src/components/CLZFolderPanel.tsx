'use client';

import { useState } from 'react';

interface CLZFolderPanelProps {
  onFilterChange: (filter: string, value: string) => void;
  isVisible: boolean;
}

export default function CLZFolderPanel({ onFilterChange, isVisible }: CLZFolderPanelProps) {
  const [selectedFolder, setSelectedFolder] = useState('series');
  const [mainExpanded, setMainExpanded] = useState(true);
  const [valueExpanded, setValueExpanded] = useState(false);
  const [editionExpanded, setEditionExpanded] = useState(false);
  const [creatorsExpanded, setCreatorsExpanded] = useState(false);
  const [personalExpanded, setPersonalExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div id="folder-panel" className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div id="folder-toolbar" className="border-b border-gray-200 p-3">
        <div id="folder-selector" className="btn-group mb-3">
          <button className="btn flex items-center gap-2 w-full px-3 py-2 text-left bg-white border border-gray-300 rounded hover:bg-gray-50">
            <i className="fa fa-folder-open text-blue-500"></i>
            <span>Series</span>
            <i className="fa fa-angle-down ml-auto"></i>
          </button>
        </div>
      </div>

      <div id="folder-search" className="p-3 border-b border-gray-200">
        <div className="relative">
          <input 
            type="text" 
            className="form-control w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" 
            placeholder="Search filters..."
          />
          <div className="absolute right-2 top-2">
            <span className="fa fa-search text-gray-400 text-sm"></span>
          </div>
        </div>
      </div>

      <div id="filter-menu" className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1 text-sm">
          {/* Main Group */}
          <li className="dropdown-group">
            <button 
              onClick={() => setMainExpanded(!mainExpanded)}
              className="filter-group w-full flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded text-left"
            >
              <span className="font-medium">Main</span>
              <i className={`fa fa-angle-${mainExpanded ? 'down' : 'right'} text-xs`}></i>
            </button>
            {mainExpanded && (
              <ul className="ml-3 mt-1 space-y-1">
                <li><button onClick={() => onFilterChange('age', 'age')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Age</button></li>
                <li><button onClick={() => onFilterChange('country', 'country')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Country</button></li>
                <li><button onClick={() => onFilterChange('crossover', 'crossover')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Crossover</button></li>
                <li><button onClick={() => onFilterChange('genre', 'genre')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Genre</button></li>
                <li><button onClick={() => onFilterChange('imprint', 'imprint')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Imprint</button></li>
                <li><button onClick={() => onFilterChange('language', 'language')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Language</button></li>
                <li><button onClick={() => onFilterChange('publisher', 'publisher')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Publisher</button></li>
                <li><button onClick={() => onFilterChange('releasedate', 'releasedate')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Release Date</button></li>
                <li><button onClick={() => onFilterChange('releasemonth', 'releasemonth')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Release Month</button></li>
                <li><button onClick={() => onFilterChange('releaseyear', 'releaseyear')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Release Year</button></li>
                <li><button onClick={() => onFilterChange('series', 'series')} className="filter is-selected w-full text-left py-1 px-2 bg-blue-100 text-blue-700 rounded">Series</button></li>
                <li><button onClick={() => onFilterChange('seriesgroup', 'seriesgroup')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Series Group</button></li>
                <li><button onClick={() => onFilterChange('storyarc', 'storyarc')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Story Arc</button></li>
              </ul>
            )}
          </li>

          {/* Value Group */}
          <li className="dropdown-group">
            <button 
              onClick={() => setValueExpanded(!valueExpanded)}
              className="filter-group w-full flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded text-left"
            >
              <span className="font-medium">Value</span>
              <i className={`fa fa-angle-${valueExpanded ? 'down' : 'right'} text-xs`}></i>
            </button>
            {valueExpanded && (
              <ul className="ml-3 mt-1 space-y-1">
                <li><button onClick={() => onFilterChange('customlabel', 'customlabel')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Custom Label</button></li>
                <li><button onClick={() => onFilterChange('solddate', 'solddate')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Date Sold</button></li>
                <li><button onClick={() => onFilterChange('grade', 'grade')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Grade</button></li>
                <li><button onClick={() => onFilterChange('gradingcompany', 'gradingcompany')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Grading Company</button></li>
                <li><button onClick={() => onFilterChange('issigned', 'issigned')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Is Signed</button></li>
                <li><button onClick={() => onFilterChange('iskeycomic', 'iskeycomic')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Key</button></li>
                <li><button onClick={() => onFilterChange('keytype', 'keytype')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Key Category</button></li>
              </ul>
            )}
          </li>

          {/* Edition Group */}
          <li className="dropdown-group">
            <button 
              onClick={() => setEditionExpanded(!editionExpanded)}
              className="filter-group w-full flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded text-left"
            >
              <span className="font-medium">Edition</span>
              <i className={`fa fa-angle-${editionExpanded ? 'down' : 'right'} text-xs`}></i>
            </button>
            {editionExpanded && (
              <ul className="ml-3 mt-1 space-y-1">
                <li><button onClick={() => onFilterChange('coverdate', 'coverdate')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Cover Date</button></li>
                <li><button onClick={() => onFilterChange('covermonth', 'covermonth')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Cover Month</button></li>
                <li><button onClick={() => onFilterChange('coveryear', 'coveryear')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Cover Year</button></li>
                <li><button onClick={() => onFilterChange('format', 'format')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Format</button></li>
              </ul>
            )}
          </li>

          {/* Creators & Characters Group */}
          <li className="dropdown-group">
            <button 
              onClick={() => setCreatorsExpanded(!creatorsExpanded)}
              className="filter-group w-full flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded text-left"
            >
              <span className="font-medium">Creators & Characters</span>
              <i className={`fa fa-angle-${creatorsExpanded ? 'down' : 'right'} text-xs`}></i>
            </button>
            {creatorsExpanded && (
              <ul className="ml-3 mt-1 space-y-1">
                <li><button onClick={() => onFilterChange('allcreators', 'allcreators')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">All Creators</button></li>
                <li><button onClick={() => onFilterChange('artist', 'artist')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Artist</button></li>
                <li><button onClick={() => onFilterChange('characters', 'characters')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Characters</button></li>
                <li><button onClick={() => onFilterChange('colorist', 'colorist')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Colorist</button></li>
                <li><button onClick={() => onFilterChange('writer', 'writer')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Writer</button></li>
              </ul>
            )}
          </li>

          {/* Personal Group */}
          <li className="dropdown-group">
            <button 
              onClick={() => setPersonalExpanded(!personalExpanded)}
              className="filter-group w-full flex items-center justify-between py-1 px-2 hover:bg-gray-100 rounded text-left"
            >
              <span className="font-medium">Personal</span>
              <i className={`fa fa-angle-${personalExpanded ? 'down' : 'right'} text-xs`}></i>
            </button>
            {personalExpanded && (
              <ul className="ml-3 mt-1 space-y-1">
                <li><button onClick={() => onFilterChange('added', 'added')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Added Date</button></li>
                <li><button onClick={() => onFilterChange('status', 'status')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Collection Status</button></li>
                <li><button onClick={() => onFilterChange('modified', 'modified')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Modified Date</button></li>
                <li><button onClick={() => onFilterChange('rating', 'rating')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">My Rating</button></li>
                <li><button onClick={() => onFilterChange('owner', 'owner')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Owner</button></li>
                <li><button onClick={() => onFilterChange('readit', 'readit')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Read</button></li>
                <li><button onClick={() => onFilterChange('location', 'location')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Storage Box</button></li>
                <li><button onClick={() => onFilterChange('tags', 'tags')} className="filter w-full text-left py-1 px-2 hover:bg-gray-100 rounded text-gray-700">Tags</button></li>
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}