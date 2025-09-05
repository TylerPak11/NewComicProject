'use client';

interface HeaderProps {
  onToggleMenu: () => void;
}

export default function Header({ onToggleMenu }: HeaderProps) {
  return (
    <div id="app-bar" className="bg-white border-b border-gray-200">
      <div className="flex items-center h-12 px-4">
        <div className="app-box flex items-center">
          <button 
            className="btn-interface btn-toggle-menu p-2 hover:bg-gray-100 rounded"
            onClick={onToggleMenu}
          >
            <i className="fa fa-fw fa-bars text-gray-600"></i>
          </button>
          <a href="#" className="btn-home app-logo ml-3 flex items-center">
            <img 
              src="https://app-assets.clz.com/static/images/branding/clz-comics-cloud.svg" 
              className="h-6" 
              alt="CLZ Comics"
            />
          </a>
        </div>

        <div className="collection-box flex-1 text-center">
          <span className="text-lg font-medium text-gray-800">TylerPak11's comics</span>
        </div>

        <div className="service-box flex items-center gap-2">
          <button className="btn-interface btn-locale p-2 hover:bg-gray-100 rounded">
            <img 
              src="https://cdn.localizr.io/img/countries/1x1/us.svg" 
              className="w-4 h-4"
              alt="US"
            />
          </button>
          
          <button className="btn-interface btn-toggle-apps p-2 hover:bg-gray-100 rounded">
            <i className="fa fa-fw fa-grid-2 text-gray-600"></i>
          </button>
          
          <button className="btn-interface btn-toggle-user p-2 hover:bg-gray-100 rounded">
            <i className="fa fa-fw fa-user text-gray-600"></i>
          </button>
        </div>
      </div>
    </div>
  );
}