'use client';

interface CLZToolbarProps {
  onCollectionStatusChange: (status: string) => void;
  onLetterFilter: (letter: string) => void;
  onSearch: (query: string) => void;
  activeCollectionStatus: string;
  activeLetter: string;
  searchQuery: string;
}

export default function CLZToolbar({ 
  onCollectionStatusChange, 
  onLetterFilter, 
  onSearch,
  activeCollectionStatus,
  activeLetter,
  searchQuery
}: CLZToolbarProps) {
  const letters = Array.from({length: 26}, (_, i) => String.fromCharCode(65 + i));

  return (
    <div id="toolbar" className="bg-white border-b border-gray-200">
      <div id="toolbar-filtering">
        <div className="toolbar-wrapper toolbar-fullwidth">
          <div className="collection-status-options flex items-center gap-4 px-4 py-3">
            <div className="btn-group">
              <button 
                className="btn btn-divide-right dropdown-toggle flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
                data-toggle="dropdown"
              >
                <span className="collection-status-icon collection-status-all">
                  <img 
                    className="collection-status-selected w-4 h-4" 
                    src="https://app-assets.clz.com/static/images/collection-status-all.svg"
                    alt="All"
                  />
                </span>
                <span className="text hidden-xs hidden-sm">All</span>
                <i className="fa fa-angle-down"></i>
              </button>
            </div>

            <div id="toolbar-alphabet">
              <div className="alphabet-options hidden-xs hidden-sm hidden-md flex items-center gap-1">
                <button 
                  onClick={() => onLetterFilter('none')}
                  className={`btn btn-large available px-3 py-1 text-sm border rounded ${
                    activeLetter === 'none' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => onLetterFilter('1')}
                  className={`btn btn-large available px-3 py-1 text-sm border rounded ${
                    activeLetter === '1' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  0-9
                </button>
                {letters.map(letter => (
                  <button 
                    key={letter}
                    onClick={() => onLetterFilter(letter)}
                    className={`btn available px-2 py-1 text-sm border rounded ${
                      activeLetter === letter ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="search-form px-4 pb-3">
            <form onSubmit={(e) => { e.preventDefault(); }}>
              <div className="relative">
                <input 
                  type="text" 
                  className="form-control w-full px-4 py-2 pr-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Search comics..." 
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                />
                <div className="search-action absolute right-2 top-2">
                  <button type="submit" className="btn p-1 hover:bg-gray-100 rounded">
                    <span className="fa fa-search text-gray-500"></span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}