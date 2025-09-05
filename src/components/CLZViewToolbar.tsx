'use client';

interface CLZViewToolbarProps {
  itemCount: number;
  onViewTypeChange: (viewType: string) => void;
  onSortChange: (sort: string) => void;
  currentViewType: string;
}

export default function CLZViewToolbar({ 
  itemCount, 
  onViewTypeChange, 
  onSortChange, 
  currentViewType 
}: CLZViewToolbarProps) {
  return (
    <div id="view-toolbar" className="bg-white border-b border-gray-200">
      <div id="toolbar-viewoptions" className="flex items-center justify-between px-4 py-3">
        <div className="view-options flex items-center gap-2">
          <div className="btn-group view-types">
            <button 
              className="btn dropdown-toggle btn-divide-right flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
              data-toggle="dropdown"
            >
              <i className="far fa-fw fa-container-storage fa-rotate-90"></i>
              <span className="fa fa-angle-down"></span>
            </button>
          </div>

          <div className="btn-group flex items-center border border-gray-300 rounded overflow-hidden">
            <button 
              className="btn option-left px-3 py-2 bg-white hover:bg-gray-50 border-r border-gray-300"
              title="Change Sorting"
            >
              <i className="fa fa-fw fa-sort-alpha-down"></i>
            </button>
            <button 
              className="btn option-right dropdown-toggle px-2 py-2 bg-white hover:bg-gray-50"
              data-toggle="dropdown"
              title="Sorting Favorites"
            >
              <span className="fa fa-angle-down"></span>
            </button>
          </div>

          <div className="cover-size flex items-center gap-2">
            <input
              type="range"
              min="110"
              max="330"
              defaultValue="151"
              className="input-range w-24"
            />
          </div>

          <div className="btn-group">
            <button 
              className="btn dropdown-toggle btn-divide-left flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
              data-toggle="dropdown"
              title="Shelf Style"
            >
              <span className="preview preview-shelf-3 w-4 h-3 bg-gradient-to-b from-gray-200 to-gray-400 rounded-sm"></span>
              <span className="fa fa-angle-down"></span>
            </button>
          </div>
        </div>

        <div className="item-count">
          <span className="nr-items font-medium">{itemCount}</span>{' '}
          <span className="item-label text-gray-600">comics</span>
        </div>

        <div className="other-options comic flex items-center gap-2">
          <button 
            className="btn px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
            title="Jump!"
          >
            <i className="far fa-fw fa-crosshairs"></i>
          </button>
          
          <div className="btn-group">
            <button 
              className="btn dropdown-toggle btn-divide-left flex items-center gap-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
              data-toggle="dropdown"
              title="Layout"
            >
              <i className="fa fa-fw fa-window-maximize fa-rotate-180"></i>
              <span className="fa fa-angle-down"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}