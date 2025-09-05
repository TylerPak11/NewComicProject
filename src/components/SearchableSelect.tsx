'use client';

import { useState, useEffect, useRef } from 'react';

interface Option {
  id: number;
  name: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  value?: number | string;
  onChange: (option: Option | null) => void;
  placeholder: string;
  apiEndpoint: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreateNew?: (name: string) => Promise<Option>;
}

export default function SearchableSelect({
  value,
  onChange,
  placeholder,
  apiEndpoint,
  label,
  className = '',
  disabled = false,
  allowCreate = false,
  onCreateNew
}: SearchableSelectProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [creating, setCreating] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch initial options and set selected option
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiEndpoint);
        if (response.ok) {
          const data = await response.json();
          setOptions(data);
          setFilteredOptions(data);
          
          // Find and set the selected option based on the value prop
          if (value) {
            const selected = data.find((option: Option) => option.id === value || option.id === Number(value));
            if (selected) {
              setSelectedOption(selected);
              setSearchTerm(selected.name);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [apiEndpoint, value]);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset search term to selected option name if no option is selected
        if (selectedOption) {
          setSearchTerm(selectedOption.name);
        } else {
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleOptionSelect = (option: Option) => {
    setSelectedOption(option);
    setSearchTerm(option.name);
    setIsOpen(false);
    onChange(option);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setSearchTerm('');
    onChange(null);
    inputRef.current?.focus();
  };

  const handleCreateNew = async () => {
    if (!allowCreate || !onCreateNew || !searchTerm.trim()) return;
    
    setCreating(true);
    try {
      const newOption = await onCreateNew(searchTerm.trim());
      setOptions(prev => [...prev, newOption]);
      setSelectedOption(newOption);
      setSearchTerm(newOption.name);
      setIsOpen(false);
      onChange(newOption);
    } catch (error) {
      console.error('Error creating new option:', error);
    } finally {
      setCreating(false);
    }
  };

  const showCreateOption = allowCreate && 
    searchTerm.trim() && 
    !filteredOptions.some(option => 
      option.name.toLowerCase() === searchTerm.trim().toLowerCase()
    );

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="px-4 py-2 text-gray-500">Loading...</div>
            ) : (
              <>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      <div className="font-medium">{option.name}</div>
                      {option.publisherName && (
                        <div className="text-sm text-gray-500">{option.publisherName}</div>
                      )}
                    </button>
                  ))
                ) : searchTerm && !showCreateOption ? (
                  <div className="px-4 py-2 text-gray-500">No results found</div>
                ) : null}
                
                {showCreateOption && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    disabled={creating}
                    className="w-full px-4 py-2 text-left hover:bg-green-50 focus:bg-green-50 focus:outline-none border-t border-gray-200 text-green-700"
                  >
                    {creating ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      <>+ Create "{searchTerm}"</>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}