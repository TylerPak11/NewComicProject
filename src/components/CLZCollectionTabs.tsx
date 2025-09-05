'use client';

interface CLZCollectionTabsProps {
  activeCollection: string;
  onCollectionChange: (collection: string) => void;
}

export default function CLZCollectionTabs({ activeCollection, onCollectionChange }: CLZCollectionTabsProps) {
  const collections = [
    { id: 'tyler', name: 'Tyler', active: true },
    { id: 'dad', name: 'Dad', active: false },
    { id: 'wishlist', name: 'Wish list', active: false },
    { id: 'pricecheck', name: 'Price check (singles)', active: false },
    { id: 'trades', name: 'Trades/GN', active: false },
    { id: 'notion', name: 'Notion', active: false },
    { id: 'notionwishlist', name: 'Notion Wishlist', active: false },
    { id: 'orders', name: 'Online orders', active: false }
  ];

  return (
    <div id="collection-tabs" className="collection-tabs bg-white border-t border-gray-200">
      <div className="active-border absolute top-0 left-0 h-0.5 bg-blue-500 transition-all duration-200"></div>
      
      <div id="collection-tabs-content" className="flex">
        <div id="collection-dropdown" className="dropup lg:hidden">
          <button 
            className="btn dropdown-toggle p-3 border-r border-gray-200 hover:bg-gray-50"
            data-toggle="dropdown"
          >
            <span className="fa fa-bars"></span>
          </button>
        </div>

        <ul id="collection-list" className="nav nav-tabs select-list-multiple flex-1 flex overflow-x-auto">
          {collections.map((collection) => (
            <li 
              key={collection.id}
              className={`nav-item user-collection flex-shrink-0 ${collection.active ? 'active' : ''}`}
            >
              <button 
                className={`nav-link px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  collection.active 
                    ? 'text-blue-600 border-blue-600' 
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
                onClick={() => onCollectionChange(collection.id)}
              >
                {collection.name}
              </button>
            </li>
          ))}
        </ul>

        <div id="collection-arrows" className="flex items-center" style={{ visibility: 'hidden' }}>
          <button className="btn left p-2 hover:bg-gray-50">
            <span className="fa fa-caret-left"></span>
          </button>
          <button className="btn right p-2 hover:bg-gray-50">
            <span className="fa fa-caret-right"></span>
          </button>
        </div>
      </div>
    </div>
  );
}