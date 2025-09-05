'use client';

import React, { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Menu,
  Search,
  Globe,
  User,
  ChevronDown,
  Grid2x2,
  List,
  Star,
  LayoutPanelTop,
  LayoutGrid,
  BookOpen,
  X,
  Pencil,
  Check,
  Plus,
  CheckCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import SeriesSearchSelect from '@/components/SeriesSearchSelect';
import PublisherSearchSelect from '@/components/PublisherSearchSelect';

interface Comic {
  id: string;
  series: string;
  issue: number;
  publisher: string;
  year: number;
  upc?: string;
  releaseDate?: string;
  variantDescription?: string;
  coverUrl?: string;
  locgLink?: string;
  plot?: string;
}

// Helpers
const ALPHABET = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const SHELF_SKINS: Record<string, string> = {
  "glass": "from-slate-50 to-slate-100",
  "wood-light": "from-amber-100 to-amber-200",
  "wood-dark": "from-amber-800 to-amber-900",
  "metal": "from-zinc-200 to-zinc-400",
  "white": "from-white to-slate-50",
  "carbon": "from-neutral-800 to-neutral-900",
};

function CLZComicsApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // UI state
  const [search, setSearch] = useState("");
  const [alpha, setAlpha] = useState<string>("All");
  const [selected, setSelected] = useState<Comic | null>(null);
  const [publisher, setPublisher] = useState<string>("All");
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddIssueModal, setShowAddIssueModal] = useState(false);
  const [newIssueCoverUrl, setNewIssueCoverUrl] = useState('');
  const [newIssueSeriesName, setNewIssueSeriesName] = useState('');
  const [newIssuePublisher, setNewIssuePublisher] = useState('');
  const [seriesDropdownOpen, setSeriesDropdownOpen] = useState(false);
  const [publisherDropdownOpen, setPublisherDropdownOpen] = useState(false);
  const [showSeriesSyncModal, setShowSeriesSyncModal] = useState(false);
  const [seriesSyncStep, setSeriesSyncStep] = useState<'upload' | 'validate' | 'complete'>('upload');
  const [seriesSyncData, setSeriesSyncData] = useState<any>(null);
  const [seriesValidationResults, setSeriesValidationResults] = useState<any>(null);
  const [seriesSyncResults, setSeriesSyncResults] = useState<any>(null);
  const [showIssuesSyncModal, setShowIssuesSyncModal] = useState(false);
  const [issuesSyncStep, setIssuesSyncStep] = useState<'upload' | 'validate' | 'complete'>('upload');
  const [issuesSyncData, setIssuesSyncData] = useState<any>(null);
  const [issuesValidationResults, setIssuesValidationResults] = useState<any>(null);
  const [issuesSyncResults, setIssuesSyncResults] = useState<any>(null);
  const [currentView, setCurrentView] = useState<"all-issues" | "series" | "publishers">("all-issues");
  const [series, setSeries] = useState<any[]>([]);
  const [wishlistSeries, setWishlistSeries] = useState<any[]>([]);
  const [combinedSeries, setCombinedSeries] = useState<any[]>([]);
  const [selectedSeriesForModal, setSelectedSeriesForModal] = useState<any | null>(null);
  const [seriesModalData, setSeriesModalData] = useState<any | null>(null);
  const [loadingSeriesModal, setLoadingSeriesModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [crawlerStatus, setCrawlerStatus] = useState('');
  const [crawling, setCrawling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingComic, setEditingComic] = useState<Comic | null>(null);
  const [stateRestored, setStateRestored] = useState(false);
  const [collectionType, setCollectionType] = useState<"comics" | "wishlist">("comics");
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [currentPublisherId, setCurrentPublisherId] = useState<number | undefined>(undefined);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkCart, setBulkCart] = useState<any[]>([]);
  const [newIssueNumber, setNewIssueNumber] = useState('');
  const [newIssueYear, setNewIssueYear] = useState('');
  const [newIssueUpc, setNewIssueUpc] = useState('');
  const [newIssueReleaseDate, setNewIssueReleaseDate] = useState('');
  const [newIssueVariant, setNewIssueVariant] = useState('');
  const [newIssueLocgLink, setNewIssueLocgLink] = useState('');

  // URL State Management Functions
  const updateURL = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${window.location.pathname}${query}`, { scroll: false });
  };

  const saveStateToStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(`clz-comics-${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  };

  const getStateFromStorage = (key: string) => {
    try {
      const stored = localStorage.getItem(`clz-comics-${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  };

  // State Restoration Effect - runs after data is loaded
  useEffect(() => {
    if (!stateRestored && comics.length > 0 && series.length > 0) {
      restoreState();
      setStateRestored(true);
    }
  }, [comics.length, series.length, stateRestored]);

  const restoreState = async () => {
    // Restore view from URL params
    const view = searchParams.get('view') as "all-issues" | "series" | "publishers";
    if (view && ['all-issues', 'series', 'publishers'].includes(view)) {
      setCurrentView(view);
    }

    // Restore comic modal
    const comicId = searchParams.get('comic');
    if (comicId) {
      const comic = comics.find(c => c.id === comicId);
      if (comic) {
        setSelected(comic);
      }
    }

    // Restore series modal
    const seriesId = searchParams.get('series');
    if (seriesId) {
      const currentSeriesList = collectionType === "comics" ? series : wishlistSeries;
      const seriesItem = currentSeriesList.find(s => s.id.toString() === seriesId);
      if (seriesItem) {
        handleSeriesClick(seriesItem);
      }
    }

    // Restore filters from URL
    const searchQuery = searchParams.get('search');
    if (searchQuery) setSearch(searchQuery);

    const alphaFilter = searchParams.get('alpha');
    if (alphaFilter) setAlpha(alphaFilter);

    const publisherFilter = searchParams.get('publisher');
    if (publisherFilter) setPublisher(publisherFilter);

    // Restore collection type from URL
    const collection = searchParams.get('collection');
    if (collection === 'wishlist') {
      setCollectionType('wishlist');
    } else {
      setCollectionType('comics');
    }
  };

  // State management wrapper functions
  const changeView = (view: "all-issues" | "series" | "publishers") => {
    setCurrentView(view);
    updateURL({ 
      view: view === "all-issues" ? null : view,
      comic: null, // Close any open comic modal when changing views
      series: null, // Close any open series modal when changing views
      collection: collectionType === 'comics' ? null : collectionType
    });
  };
  
  const changeCollectionType = (type: 'comics' | 'wishlist') => {
    setCollectionType(type);
    // If switching to wishlist and currently on publishers view, switch to all-issues (series is now allowed)
    if (type === 'wishlist' && currentView === 'publishers') {
      setCurrentView('all-issues');
    }
    updateURL({
      collection: type === 'comics' ? null : type,
      view: type === 'wishlist' && currentView === 'publishers' ? null : (currentView === 'all-issues' ? null : currentView)
    });
  };

  const selectComic = (comic: Comic | null) => {
    setSelected(comic);
    setIsEditing(false);
    setEditingComic(null);
    // Reset transfer states when modal is closed or changed
    setIsTransferring(false);
    setTransferError(null);
    setTransferSuccess(false);
    updateURL({ 
      comic: comic?.id || null,
      series: null, // Close series modal if open
      collection: collectionType === 'comics' ? null : collectionType
    });
  };

  const selectSeries = (series: any | null) => {
    setSelectedSeriesForModal(series);
    if (!series) {
      setSeriesModalData(null);
      setLoadingSeriesModal(false);
    }
    updateURL({ 
      series: series?.id?.toString() || null,
      comic: null, // Close comic modal if open
      collection: collectionType === 'comics' ? null : collectionType
    });
  };

  // Update URL when search/filter states change (with debounce for search)
  useEffect(() => {
    if (!stateRestored) return;
    
    const timer = setTimeout(() => {
      const currentView = searchParams.get('view');
      const currentComic = searchParams.get('comic');
      const currentSeries = searchParams.get('series');
      
      updateURL({
        view: currentView,
        comic: currentComic,
        series: currentSeries,
        collection: collectionType === 'comics' ? null : collectionType,
        search: search || null,
        alpha: alpha === 'All' ? null : alpha,
        publisher: publisher === 'All' ? null : publisher,
      });
    }, 300); // Debounce search updates

    return () => clearTimeout(timer);
  }, [search, alpha, publisher, collectionType, stateRestored]);

  // Fetch comics and wishlist from API
  useEffect(() => {
    fetchComics();
    fetchSeries();
    fetchWishlist();
    fetchWishlistSeries();
    fetchCombinedSeries();
  }, []);

  const fetchComics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/issues');
      const issuesData = await response.json();
      
      // Issues are already in the correct format
      setComics(issuesData);
    } catch (error) {
      console.error('Error fetching comics:', error);
      setComics([]); // No fallback data - show empty state
    } finally {
      setLoading(false);
    }
  };

  const fetchSeries = async () => {
    try {
      console.log('Fetching series...');
      const response = await fetch('/api/series');
      const seriesData = await response.json();
      console.log('Series data received:', seriesData?.length, 'series');
      console.log('First series:', seriesData?.[0]);
      setSeries(seriesData);
    } catch (error) {
      console.error('Error fetching series:', error);
      setSeries([]);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      const wishlistData = await response.json();
      setWishlistItems(wishlistData);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    }
  };

  const fetchWishlistSeries = async () => {
    try {
      const response = await fetch('/api/wishlist-series');
      const wishlistSeriesData = await response.json();
      setWishlistSeries(wishlistSeriesData);
    } catch (error) {
      console.error('Error fetching wishlist series:', error);
      setWishlistSeries([]);
    }
  };

  const fetchCombinedSeries = async () => {
    try {
      const response = await fetch('/api/combined-series');
      const combinedSeriesData = await response.json();
      setCombinedSeries(combinedSeriesData);
    } catch (error) {
      console.error('Error fetching combined series:', error);
      setCombinedSeries([]);
    }
  };

  const handleSeriesClick = async (series: any) => {
    try {
      selectSeries(series); // Use wrapper function
      setLoadingSeriesModal(true);
      
      // Always use combined API for all series clicks to show collection + wishlist + missing issues
      let combinedId = '';
      if (series.id && series.wishlistId) {
        combinedId = `combined-${series.id}-${series.wishlistId}`;
      } else if (series.id) {
        combinedId = `regular-${series.id}`;
      } else if (series.wishlistId) {
        combinedId = `wishlist-${series.wishlistId}`;
      }
      
      const apiUrl = `/api/combined-series/${combinedId}`;
      const response = await fetch(apiUrl);
      const seriesWithIssues = await response.json();
      
      setSeriesModalData(seriesWithIssues);
    } catch (error) {
      console.error('Error fetching series details:', error);
    } finally {
      setLoadingSeriesModal(false);
    }
  };

  const closeSeriesModal = () => {
    selectSeries(null); // Use wrapper function
    setSeriesModalData(null);
    setLoadingSeriesModal(false);
  };

  const handleEditClick = () => {
    if (selected) {
      setEditingComic({ ...selected });
      setIsEditing(true);
      // Reset currentPublisherId - it will be set when publisher is selected
      setCurrentPublisherId(undefined);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingComic) return;

    try {
      // First, resolve publisher and series names to IDs
      let publisherId = undefined;
      let seriesId = undefined;

      // Look up publisher ID if publisher name was changed
      if (editingComic.publisher) {
        try {
          const publisherResponse = await fetch(`/api/publishers?q=${encodeURIComponent(editingComic.publisher)}`);
          if (publisherResponse.ok) {
            const publishers = await publisherResponse.json();
            const publisher = publishers.find((p: any) => p.name === editingComic.publisher);
            if (publisher) {
              publisherId = publisher.id;
            }
          }
        } catch (error) {
          console.error('Error looking up publisher ID:', error);
        }
      }

      // Look up series ID if series name was changed
      if (editingComic.series) {
        try {
          const seriesResponse = await fetch(`/api/series?q=${encodeURIComponent(editingComic.series)}`);
          if (seriesResponse.ok) {
            const seriesList = await seriesResponse.json();
            const seriesData = seriesList.find((s: any) => s.name === editingComic.series);
            if (seriesData) {
              seriesId = seriesData.id;
            }
          }
        } catch (error) {
          console.error('Error looking up series ID:', error);
        }
      }

      // Determine which endpoint to use based on collection type
      const endpoint = collectionType === 'wishlist' 
        ? `/api/wishlist/${editingComic.id}`
        : `/api/issues/${editingComic.id}`;

      const requestBody: any = {
        name: `${editingComic.series} #${editingComic.issue}`, // Store the full name
        issueNo: editingComic.issue,
        variantDescription: editingComic.variantDescription,
        coverUrl: editingComic.coverUrl,
        releaseDate: editingComic.releaseDate,
        upc: editingComic.upc,
        locgLink: editingComic.locgLink,
        plot: editingComic.plot,
      };

      // Add IDs if we found them
      if (publisherId !== undefined) {
        requestBody.publisherId = publisherId;
      }
      if (seriesId !== undefined) {
        requestBody.seriesId = seriesId;
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        // Update the selected comic with the edited data
        selectComic(editingComic);
        // Refresh the appropriate list
        if (collectionType === 'wishlist') {
          fetchWishlist();
        } else {
          fetchComics();
        }
        setIsEditing(false);
        setEditingComic(null);
        setCurrentPublisherId(undefined); // Reset publisher ID
      } else {
        const errorData = await response.json();
        console.error('Failed to save comic changes:', errorData);
        alert(`Failed to save changes: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving comic changes:', error);
      alert('Error saving changes. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingComic(null);
    setCurrentPublisherId(undefined);
  };

  const handleDeleteComic = async () => {
    if (!editingComic) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${editingComic.series} #${editingComic.issue}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      // Determine which endpoint to use based on collection type
      const endpoint = collectionType === 'wishlist' 
        ? `/api/wishlist/${editingComic.id}`
        : `/api/issues/${editingComic.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Close the detail modal
        selectComic(null);
        setIsEditing(false);
        setEditingComic(null);
        setCurrentPublisherId(undefined);
        
        // Refresh the appropriate list
        if (collectionType === 'wishlist') {
          fetchWishlist();
        } else {
          fetchComics();
        }
        
        alert('Comic deleted successfully!');
      } else {
        const errorData = await response.json();
        console.error('Failed to delete comic:', errorData);
        alert(`Failed to delete comic: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting comic:', error);
      alert('Error deleting comic. Please try again.');
    }
  };

  const clearNewIssueForm = () => {
    setNewIssueCoverUrl('');
    setNewIssueSeriesName('');
    setNewIssuePublisher('');
    setNewIssueNumber('');
    setNewIssueYear('');
    setNewIssueUpc('');
    setNewIssueReleaseDate('');
    setNewIssueVariant('');
    setNewIssueLocgLink('');
    setSeriesDropdownOpen(false);
    setPublisherDropdownOpen(false);
  };

  const addToCart = () => {
    // Validate required fields
    if (!newIssueSeriesName.trim() || !newIssuePublisher.trim() || !newIssueNumber.trim()) {
      alert('Please fill in all required fields: Series Name, Issue Number, and Publisher');
      return;
    }

    // Create cart item
    const cartItem = {
      id: Date.now(), // temporary ID for cart
      seriesName: newIssueSeriesName.trim(),
      issueNo: parseFloat(newIssueNumber) || 0,
      publisherName: newIssuePublisher.trim(),
      year: parseInt(newIssueYear) || new Date().getFullYear(),
      upc: newIssueUpc.trim(),
      releaseDate: newIssueReleaseDate,
      variantDescription: newIssueVariant.trim(),
      coverUrl: newIssueCoverUrl.trim(),
      locgLink: newIssueLocgLink.trim(),
      name: `${newIssueSeriesName.trim()} #${newIssueNumber}`
    };

    // Add to cart
    setBulkCart(prev => [...prev, cartItem]);
    
    // Clear form for next entry
    clearNewIssueForm();
    
    // Show success message
    alert(`Added "${cartItem.name}" to cart! Cart now has ${bulkCart.length + 1} items.`);
  };

  const removeFromCart = (itemId: number) => {
    setBulkCart(prev => prev.filter(item => item.id !== itemId));
  };

  const bulkImportItems = async () => {
    if (bulkCart.length === 0) {
      alert('Cart is empty! Add some items first.');
      return;
    }

    try {
      // Import all items in the cart
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const item of bulkCart) {
        try {
          // Create series and publisher if they don't exist
          // This logic would need to be implemented based on your API
          const endpoint = collectionType === 'wishlist' ? '/api/wishlist' : '/api/issues';
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorData = await response.json();
            errors.push(`${item.name}: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`${item.name}: ${error instanceof Error ? error.message : 'Network error'}`);
        }
      }

      // Show results
      let message = `Bulk import completed!\n\n`;
      message += `✅ Successfully imported: ${successCount}\n`;
      if (errorCount > 0) {
        message += `❌ Failed to import: ${errorCount}\n\n`;
        message += `Errors:\n${errors.join('\n')}`;
      }
      
      alert(message);

      // Clear cart and close modal if all succeeded
      if (errorCount === 0) {
        setBulkCart([]);
        setShowAddIssueModal(false);
        setIsBulkMode(false);
        
        // Refresh the appropriate list
        if (collectionType === 'wishlist') {
          fetchWishlist();
        } else {
          fetchComics();
        }
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Failed to complete bulk import. Please try again.');
    }
  };

  const handleAddToCollection = async () => {
    if (!selected || collectionType !== 'wishlist') {
      return;
    }

    setIsTransferring(true);
    setTransferError(null);
    setTransferSuccess(false);

    try {
      const wishlistItemId = parseInt(selected.id);
      console.log('Transferring wishlist item to collection:', wishlistItemId);

      const response = await fetch('/api/transfer/wishlist-to-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wishlistItemId }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Transfer successful:', result);
        setTransferSuccess(true);
        
        // Refresh data and close modal after a brief delay
        setTimeout(async () => {
          await Promise.all([
            fetchComics(),
            fetchWishlist(),
            fetchSeries(),
            fetchWishlistSeries(),
            fetchCombinedSeries()
          ]);
          
          // Close the modal
          selectComic(null);
          setIsEditing(false);
          setEditingComic(null);
          
          // Reset transfer states
          setIsTransferring(false);
          setTransferSuccess(false);
          setTransferError(null);
        }, 1500);
        
      } else {
        console.error('Transfer failed:', result);
        setTransferError(result.error || 'Unknown error occurred');
        setIsTransferring(false);
      }
    } catch (error) {
      console.error('Error during transfer:', error);
      setTransferError('Network error occurred. Please try again.');
      setIsTransferring(false);
    }
  };

  const handleFieldChange = (field: keyof Comic, value: string | number) => {
    if (editingComic) {
      setEditingComic({
        ...editingComic,
        [field]: value
      });
      
      // Special handling for publisher changes
      if (field === 'publisher') {
        // When publisher changes, we need to fetch the publisher ID for the SeriesSearchSelect
        // For now, we'll set it to undefined and let the SeriesSearchSelect handle it
        setCurrentPublisherId(undefined);
      }
    }
  };


  const formatReleaseDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      const formatted = date.toLocaleDateString('en-US', options);
      // Convert "Aug 20, 2024" to "Aug 20th, 2024"
      return formatted.replace(/(\d+),/, (match, day) => {
        const num = parseInt(day);
        const suffix = num % 10 === 1 && num !== 11 ? 'st' :
                      num % 10 === 2 && num !== 12 ? 'nd' :
                      num % 10 === 3 && num !== 13 ? 'rd' : 'th';
        return `${day}${suffix},`;
      });
    } catch {
      return dateString; // Return original if parsing fails
    }
  };

  const filtered = useMemo(() => {
    let rows = collectionType === "comics" ? comics : wishlistItems;
    if (alpha !== "All") {
      rows = rows.filter((c) => {
        if (alpha === "0-9") return /^\d/.test(c.series);
        return c.series.toUpperCase().startsWith(alpha);
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (c) =>
          c.series.toLowerCase().includes(q) ||
          `${c.issue}`.includes(q) ||
          c.publisher.toLowerCase().includes(q)
      );
    }
    if (publisher !== "All") {
      rows = rows.filter((c) => c.publisher === publisher);
    }
    return rows;
  }, [alpha, search, publisher, comics, wishlistItems, collectionType]);

  const crawlSeries = async (seriesId: number, credentials: { username: string; password: string }) => {
    if (crawling) return;
    
    setCrawling(true);
    setShowLoginModal(false);
    setShowStatusModal(true);
    setCrawlerStatus('Initializing crawler...');
    
    try {
      const response = await fetch(`/api/crawler/locg/${seriesId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCrawlerStatus(`🎉 Crawl Successful!\n\nRegular Issues: ${result.regularIssues || 'Unknown'}\nAnnuals: ${result.annuals || 'Unknown'}\nTotal: ${result.issueCount} issues found${result.run ? `\nYears: ${result.run}` : ''}\n\nYou can close this modal now.`);
        console.log(`Crawler successful: Found ${result.issueCount} issues`);
        
        // Update the series data with the crawl results
        if (result.series) {
          setSelectedSeriesForModal(result.series);
          setSeriesModalData(prev => ({
            ...prev,
            locgIssueCount: result.series.locgIssueCount,
            lastCrawled: result.series.lastCrawled
          }));
        }
        
        // Don't auto-close - let user close manually
      } else {
        setCrawlerStatus(`❌ Crawl Failed\n\nError: ${result.error}\n\nYou can close this modal and try again.`);
        console.error(`Crawler failed: ${result.error}`);
        
        // Don't auto-close - let user close manually
      }
    } catch (error) {
      setCrawlerStatus(`❌ Network Error\n\nCould not connect to the server.\nPlease check your connection and try again.\n\nYou can close this modal now.`);
      console.error('Crawler error:', error);
      
      // Don't auto-close - let user close manually
    } finally {
      setCrawling(false);
    }
  };

  const filteredSeries = useMemo(() => {
    let rows = collectionType === "comics" ? series : combinedSeries;
    if (alpha !== "All") {
      rows = rows.filter((s) => {
        const title = s.name || s.title;
        if (alpha === "0-9") return /^\d/.test(title);
        return title.toUpperCase().startsWith(alpha);
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (s) =>
          (s.name || s.title).toLowerCase().includes(q) ||
          (s.publisherName || s.publisher).toLowerCase().includes(q)
      );
    }
    if (publisher !== "All") {
      rows = rows.filter((s) => (s.publisherName || s.publisher) === publisher);
    }
    return rows;
  }, [alpha, search, publisher, series, combinedSeries, collectionType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="text-2xl font-semibold text-slate-700 mb-2">Loading Comics...</div>
          <div className="text-slate-500">Fetching your collection</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      {/* App Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://img.freepik.com/free-vector/comic-style-wallpaper_79603-1248.jpg?semt=ais_hybrid&w=740&q=80)'
          }}
        ></div>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 relative z-10">
          <div></div>
          <div className="text-center">
            <div className="text-sm text-slate-500">Collection</div>
            <div className="text-lg font-semibold leading-none">TylerPak11&apos;s comics</div>
          </div>
          <div className="flex items-center gap-4">
            {/* Comic/Wishlist Toggle Switch */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => changeCollectionType("comics")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  collectionType === "comics"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Comics Collection"
              >
                <img src="/comic.png" alt="Comics" className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Comics</span>
              </button>
              <button
                onClick={() => changeCollectionType("wishlist")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  collectionType === "wishlist"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Wishlist"
              >
                <img src="/wishlist.png" alt="Wishlist" className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Wishlist</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[260px_1fr]">
        {/* Folder Panel */}
        <aside className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-lg lg:block">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-100 to-slate-50 p-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <div className="text-sm font-semibold text-slate-700">Navigation</div>
            </div>
          </div>
          <div className="p-2">
            <div className="space-y-1">
              <button 
                onClick={() => changeView("all-issues")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === "all-issues" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-700 hover:bg-white hover:shadow-sm hover:text-blue-600"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                {collectionType === "comics" ? "All Issues" : "All Items"}
              </button>
              <button 
                onClick={() => changeView("series")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === "series" 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-700 hover:bg-white hover:shadow-sm hover:text-blue-600"
                }`}
              >
                <Grid2x2 className="h-4 w-4" />
                Series
              </button>
            </div>
          </div>

          {/* Publisher Directory */}
          <div className="border-t border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publishers</div>
              {publisher !== "All" && (
                <button
                  onClick={() => setPublisher("All")}
                  className="text-xs font-medium text-sky-700 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <PublisherDirectory
              data={comics}
              selected={publisher}
              onSelect={(p) => setPublisher(p)}
            />
          </div>
        </aside>

        {/* View Panel */}
        <section className="space-y-3">
          {/* Search Bar */}
          <div className="flex justify-end">
            <label className="relative w-full max-w-xs">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search comics..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </label>
          </div>

          {/* Alphabet bar */}
          <div className="no-scrollbar flex gap-0.5 overflow-x-auto rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-1.5 shadow-sm">
            <button
              onClick={() => setAlpha("All")}
              className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                alpha === "All" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-700 hover:bg-white hover:shadow-sm hover:text-blue-600 bg-transparent"
              }`}
            >
              All
            </button>
            {ALPHABET.map((ch) => (
              <button
                key={ch}
                onClick={() => setAlpha(ch)}
                className={`flex-shrink-0 w-6 h-6 text-xs font-medium rounded-md transition-all duration-200 ${
                  alpha === ch 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-700 hover:bg-white hover:shadow-sm hover:text-blue-600 bg-transparent"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Item count + layout */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {currentView === "all-issues" && (
                <><span className="font-semibold">{filtered.length}</span> {collectionType === "comics" ? "comics" : "wishlist items"}</>
              )}
              {currentView === "series" && (
                <><span className="font-semibold">{filteredSeries.length}</span> series</>
              )}
              {currentView === "publishers" && (
                <><span className="font-semibold">{[...new Set(comics.map(c => c.publisher))].length}</span> publishers</>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentView === "series" ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const seriesData = currentView === "series" ? filteredSeries : [];
                      const dataToExport = {
                        exportDate: new Date().toISOString(),
                        collectionType: collectionType,
                        totalSeries: seriesData.length,
                        series: seriesData
                      };
                      
                      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${collectionType}-series-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded-xl p-2 hover:bg-slate-100 transition-colors" 
                    title="Download Series Data as JSON"
                  >
                    <img src="/download.png" alt="Download" className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setShowSeriesSyncModal(true)}
                    className="rounded-xl p-2 hover:bg-slate-100 transition-colors" 
                    title="Upload and Sync Series Data"
                  >
                    <img src="/exchange.png" alt="Exchange" className="w-6 h-6" />
                  </button>
                </div>
              ) : currentView === "all-issues" ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const issuesData = filtered.map(issue => {
                        const { color, key, ...cleanIssue } = issue;
                        return cleanIssue;
                      });
                      const dataToExport = {
                        exportDate: new Date().toISOString(),
                        collectionType: collectionType,
                        totalIssues: issuesData.length,
                        issues: issuesData
                      };
                      
                      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
                        type: 'application/json'
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${collectionType}-issues-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="rounded-xl p-2 hover:bg-slate-100 transition-colors" 
                    title="Download Issues Data as JSON"
                  >
                    <img src="/download.png" alt="Download" className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setShowIssuesSyncModal(true)}
                    className="rounded-xl p-2 hover:bg-slate-100 transition-colors" 
                    title="Upload and Sync Issues Data"
                  >
                    <img src="/exchange.png" alt="Exchange" className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setShowAddIssueModal(true)}
                    className="rounded-xl p-2 hover:bg-slate-100 transition-colors" 
                    title="Add Single Issue"
                  >
                    <img src="/book.png" alt="Add Issue" className="w-6 h-6" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowImportModal(true)}
                    className="rounded-xl bg-sky-600 text-white px-3 py-2 text-sm font-medium hover:bg-sky-700 transition-colors" 
                    title={`Import ${collectionType === 'comics' ? 'Comics' : 'Wishlist Items'}`}
                  >
                    Import {collectionType === 'comics' ? 'Comics' : 'Wishlist Items'}
                  </button>
                  <button 
                    onClick={() => setShowAddIssueModal(true)}
                    className="rounded-xl bg-green-600 text-white px-3 py-2 text-sm font-medium hover:bg-green-700 transition-colors" 
                    title="Add Single Issue"
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Add Single Issue
                  </button>
                </>
              )}
            </div>
          </div>

          {/* View Content */}
          <div
            className={`rounded-2xl border border-slate-200 bg-gradient-to-b ${SHELF_SKINS["glass"]} p-3 shadow-sm h-screen max-h-screen overflow-y-auto`}
          >
            {currentView === "all-issues" && (
              <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              >
                {filtered.map((c) => (
                  <CoverCard key={c.id} c={c} size={160} onOpen={() => selectComic(c)} />
                ))}
              </div>
            )}
            
            {currentView === "series" && (
              <div className="space-y-6">
                {/* Series Stats Header */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Series Collection</h2>
                        <p className="text-slate-600">Browse and manage your comic book series</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{filteredSeries.length}</div>
                      <div className="text-sm text-slate-600">Series Found</div>
                    </div>
                  </div>
                </div>

                {filteredSeries.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredSeries.map((s) => (
                      <SeriesCard key={s.id} series={s} onOpen={() => handleSeriesClick(s)} comics={comics} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="text-xl font-semibold text-slate-900 mb-2">No Series Found</div>
                    <p className="text-slate-600 max-w-md mx-auto">
                      {search.trim() 
                        ? `No series match "${search.trim()}". Try a different search term.` 
                        : 'Loading series data or no series available in your collection.'}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {currentView === "publishers" && (
              <div className="text-center py-12">
                <div className="text-lg font-medium text-slate-700 mb-2">Publishers View</div>
                <div className="text-slate-500">Coming soon...</div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-end bg-black/40 backdrop-blur-sm p-0 sm:items-stretch sm:p-6 animate-in fade-in-0 duration-300">
          <div className="h-full w-full sm:w-2/3 lg:w-3/5 xl:w-1/2 rounded-t-2xl bg-gradient-to-br from-white via-white to-blue-50 shadow-2xl border-t-4 border-blue-500 sm:rounded-2xl sm:border-2 sm:border-blue-500/20 animate-in slide-in-from-bottom-full sm:slide-in-from-right-full duration-500 ease-out flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b-2 border-gradient-to-r from-blue-100 to-purple-100 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-3 backdrop-blur-sm">
              <div className="min-w-0 flex-1 pr-4">
                <div className="text-sm font-semibold text-slate-600 tracking-wide">{selected.publisher} • <span className="text-blue-600 font-bold">{selected.year}</span></div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent leading-tight drop-shadow-sm">{isEditing ? editingComic?.series : selected.series}</div>
                <div className="text-lg font-bold text-slate-700 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">#{isEditing ? editingComic?.issue : selected.issue}</div>
                {(isEditing ? editingComic?.variantDescription : selected.variantDescription) && (
                  <div className="text-xs font-medium text-slate-500 bg-gradient-to-r from-slate-100 to-blue-50 px-2 py-1 rounded-full mt-1 inline-block">{isEditing ? editingComic?.variantDescription : selected.variantDescription}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="rounded-xl p-2.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-green-300/50"
                      aria-label="Save changes"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-xl p-2.5 bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-slate-300/50"
                      aria-label="Cancel edit"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDeleteComic}
                      className="rounded-xl p-2.5 bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-red-300/50"
                      aria-label="Delete comic"
                      title="Delete this comic permanently"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                ) : (
                  <>
                    {collectionType === 'wishlist' && (
                      <button
                        onClick={handleAddToCollection}
                        disabled={isTransferring || transferSuccess}
                        className={`rounded-xl p-2.5 transition-all duration-300 shadow-lg border-2 ${
                          transferSuccess 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-300/50 cursor-default' 
                            : isTransferring 
                              ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border-blue-300/50 cursor-not-allowed animate-pulse'
                              : 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white border-emerald-300/50 hover:shadow-xl hover:scale-105'
                        }`}
                        aria-label="Add to Collection"
                        title={
                          transferSuccess 
                            ? 'Successfully added to collection!' 
                            : isTransferring 
                              ? 'Adding to collection...'
                              : 'Add to Collection'
                        }
                      >
                        {transferSuccess ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : isTransferring ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleEditClick}
                      className="rounded-xl p-2.5 bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-blue-300/50"
                      aria-label="Edit comic"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        selectComic(null);
                        setIsEditing(false);
                        setEditingComic(null);
                      }}
                      className="rounded-xl p-2.5 bg-gradient-to-r from-red-400 to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-red-300/50"
                      aria-label="Close details"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Transfer Error Display */}
            {transferError && (
              <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Transfer Failed</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{transferError}</p>
                <button 
                  onClick={() => setTransferError(null)}
                  className="text-red-600 hover:text-red-800 text-xs underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}
            
            <div className="flex-1 p-6 space-y-6 bg-gradient-to-br from-white/80 via-blue-50/30 to-purple-50/30 relative overflow-y-auto">
              {/* Comic book dots pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_0)] bg-[size:20px_20px]"></div>
              </div>
              
              <div className="flex gap-6 relative">
                <div
                  className="aspect-[2/3] w-64 shrink-0 overflow-hidden rounded-2xl shadow-2xl border-4 border-gradient-to-br from-blue-200/50 to-purple-200/50 relative transform hover:scale-105 transition-transform duration-300"
                >
                  {selected.coverUrl ? (
                    <img 
                      src={selected.coverUrl} 
                      alt={`${selected.series} #${selected.issue}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
                      <div className="absolute bottom-0 left-0 right-0 flex h-full items-end p-4 text-white">
                        <div className="line-clamp-3 text-sm font-bold drop-shadow-lg bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2 rounded-lg">{selected.series}</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-4 text-sm relative">
                  <InfoRow 
                    label="Series" 
                    value={isEditing ? editingComic?.series : selected.series} 
                    isEditing={isEditing}
                    onEdit={(field, value) => handleFieldChange('series' as keyof Comic, value)}
                    fieldKey="series"
                    publisherId={currentPublisherId}
                  />
                  <InfoRow 
                    label="Issue" 
                    value={`#${isEditing ? editingComic?.issue : selected.issue}`} 
                    isEditing={isEditing}
                    onEdit={(field, value) => {
                      const numValue = parseFloat(value.replace('#', ''));
                      if (!isNaN(numValue)) {
                        handleFieldChange('issue' as keyof Comic, numValue);
                      }
                    }}
                    fieldKey="issue"
                  />
                  <InfoRow 
                    label="Publisher" 
                    value={isEditing ? editingComic?.publisher : selected.publisher} 
                    isEditing={isEditing}
                    onEdit={(field, value) => handleFieldChange('publisher' as keyof Comic, value)}
                    fieldKey="publisher"
                    onPublisherIdChange={(publisherId) => setCurrentPublisherId(publisherId)}
                  />
                  <InfoRow 
                    label="UPC" 
                    value={(isEditing ? editingComic?.upc : selected.upc) || "Not available"} 
                    isEditing={isEditing}
                    onEdit={(field, value) => handleFieldChange('upc' as keyof Comic, value)}
                    fieldKey="upc"
                  />
                  <InfoRow 
                    label="Release Date" 
                    value={isEditing ? editingComic?.releaseDate : (formatReleaseDate(selected.releaseDate) || "Unknown")} 
                    isEditing={isEditing}
                    onEdit={(field, value) => handleFieldChange('releaseDate' as keyof Comic, value)}
                    fieldKey="releaseDate"
                  />
                  {isEditing && (
                    <>
                      <InfoRow 
                        label="Variant" 
                        value={(isEditing ? editingComic?.variantDescription : selected.variantDescription) || "None"} 
                        isEditing={isEditing}
                        onEdit={(field, value) => handleFieldChange('variantDescription' as keyof Comic, value)}
                        fieldKey="variantDescription"
                      />
                      <InfoRow 
                        label="Cover URL" 
                        value={(isEditing ? editingComic?.coverUrl : selected.coverUrl) || "None"} 
                        isEditing={isEditing}
                        onEdit={(field, value) => handleFieldChange('coverUrl' as keyof Comic, value)}
                        fieldKey="coverUrl"
                      />
                      <InfoRow 
                        label="LOCG Link" 
                        value={(isEditing ? editingComic?.locgLink : selected.locgLink) || "None"} 
                        isEditing={isEditing}
                        onEdit={(field, value) => handleFieldChange('locgLink' as keyof Comic, value)}
                        fieldKey="locgLink"
                      />
                      <InfoRow 
                        label="Plot" 
                        value={(isEditing ? editingComic?.plot : selected.plot) || "No plot available"} 
                        isEditing={isEditing}
                        onEdit={(field, value) => handleFieldChange('plot' as keyof Comic, value)}
                        fieldKey="plot"
                      />
                    </>
                  )}
                  <div className="flex justify-center pt-6">
                    {selected.locgLink ? (
                      <button
                        onClick={() => window.open(selected.locgLink, '_blank')}
                        className="h-40 w-40 object-contain hover:scale-110 transition-all duration-300 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 p-3 shadow-lg hover:shadow-2xl border-2 border-blue-200/50 hover:border-blue-300/70"
                        title="View on League of Comic Geeks"
                      >
                        <img 
                          src="/LOCG.png" 
                          alt="LOCG"
                          className="w-full h-full object-contain drop-shadow-sm"
                        />
                      </button>
                    ) : (
                      <div className="h-40 w-40 object-contain opacity-40 p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200/50">
                        <img 
                          src="/LOCG.png" 
                          alt="LOCG (Not available)"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 relative">
                <div className="mb-2">
                  <span className="inline-block bg-gradient-to-r from-blue-500 via-purple-600 to-blue-700 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full shadow-md border border-white/20 transform hover:scale-105 transition-transform duration-300">📚 Plot Synopsis</span>
                </div>
                <div className="border border-blue-200 rounded-lg p-4 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-sm relative overflow-hidden">
                  {/* Decorative comic book elements */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-400 rounded-full opacity-20"></div>
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-red-400 rounded-full opacity-20"></div>
                  
                  <p className="text-sm text-slate-700 m-0 font-medium leading-relaxed relative z-10">
                    {selected.plot || "🦸‍♂️ This comic is part of your collection! Add a plot synopsis to enhance your collection tracking. Use the edit button to add detailed information about this issue's storyline."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && <ImportModal collectionType={collectionType} onClose={() => setShowImportModal(false)} onSuccess={() => {
        fetchComics();
        fetchWishlist();
        fetchSeries();
        fetchWishlistSeries();
        fetchCombinedSeries();
      }} />}

      {/* Series Sync Modal */}
      {showSeriesSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-slate-900">
                {seriesSyncStep === 'upload' && 'Upload Series Data'}
                {seriesSyncStep === 'validate' && 'Review Changes'}
                {seriesSyncStep === 'complete' && 'Sync Complete'}
              </h2>
              <button
                onClick={() => {
                  setShowSeriesSyncModal(false);
                  setSeriesSyncStep('upload');
                  setSeriesSyncData(null);
                  setSeriesValidationResults(null);
                  setSeriesSyncResults(null);
                }}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {seriesSyncStep === 'upload' && (
                <>
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Series JSON File</h3>
                    <p className="text-slate-600 mb-4">Select a JSON file exported from this application to sync series data</p>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      id="series-file-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const jsonData = JSON.parse(event.target?.result as string);
                              
                              // Validate JSON structure
                              if (!jsonData.series || !Array.isArray(jsonData.series)) {
                                alert('Invalid JSON format. Expected a \"series\" array.');
                                return;
                              }
                              
                              // Process and validate the series data
                              const currentSeriesNames = new Set(filteredSeries.map(s => s.name || s.title));
                              const newSeries: any[] = [];
                              const existingSeries: any[] = [];
                              const errors: any[] = [];
                              
                              jsonData.series.forEach((series: any, index: number) => {
                                const seriesName = series.name;
                                if (!seriesName) {
                                  errors.push(`Series at index ${index} has no name/title`);
                                  return;
                                }
                                
                                if (currentSeriesNames.has(seriesName)) {
                                  existingSeries.push(series);
                                } else {
                                  newSeries.push(series);
                                }
                              });
                              
                              const validationResults = {
                                totalSeries: jsonData.series.length,
                                newSeries: newSeries.length,
                                existingSeries: existingSeries.length,
                                errors: errors.length,
                                errorList: errors,
                                summary: {
                                  seriesWillBeCreated: newSeries.length,
                                  seriesWillBeUpdated: existingSeries.length,
                                  errors: errors.length
                                }
                              };
                              
                              setSeriesSyncData(jsonData);
                              setSeriesValidationResults(validationResults);
                              setSeriesSyncStep('validate');
                            } catch (error) {
                              console.error('Invalid JSON file:', error);
                              alert('Invalid JSON file. Please check your file format.');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="series-file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  <div className="mt-6 text-sm text-slate-600">
                    <h4 className="font-medium mb-2">Supported Operations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Update existing series information</li>
                      <li>Add new series from the uploaded data</li>
                      <li>Detect and resolve conflicts</li>
                      <li>Preview all changes before applying</li>
                    </ul>
                  </div>
                </>
              )}
              
              {seriesSyncStep === 'validate' && seriesValidationResults && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Validation Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900">New Series</div>
                        <div className="text-2xl font-bold text-blue-600">{seriesValidationResults.summary.seriesWillBeCreated}</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="font-medium text-yellow-900">Updates</div>
                        <div className="text-2xl font-bold text-yellow-600">{seriesValidationResults.summary.seriesWillBeUpdated}</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-medium text-red-900">Errors</div>
                        <div className="text-2xl font-bold text-red-600">{seriesValidationResults.summary.errors}</div>
                      </div>
                    </div>
                    
                    {seriesValidationResults.errorList.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-red-900 mb-2">Errors Found:</h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {seriesValidationResults.errorList.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-red-700">{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setSeriesSyncStep('upload');
                        setSeriesSyncData(null);
                        setSeriesValidationResults(null);
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Back to Upload
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Starting series sync...', seriesSyncData);
                          
                          const response = await fetch('/api/series/sync', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              series: seriesSyncData.series,
                              collectionType: collectionType
                            }),
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            setSeriesSyncResults(result);
                            setSeriesSyncStep('complete');
                            // Refresh series data
                            fetchSeries();
                            fetchCombinedSeries();
                          } else {
                            alert('Sync failed: ' + result.error);
                          }
                        } catch (error) {
                          console.error('Sync error:', error);
                          alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      disabled={seriesValidationResults.summary.errors > 0}
                    >
                      Sync Series Data
                    </button>
                  </div>
                </>
              )}
              
              {seriesSyncStep === 'complete' && seriesSyncResults && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Sync Completed Successfully!</h3>
                    <p className="text-slate-600">Your series data has been synchronized.</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-slate-900 mb-4">Sync Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-900">Series Created</div>
                        <div className="text-2xl font-bold text-green-600">{seriesSyncResults.summary.seriesCreated}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900">Series Updated</div>
                        <div className="text-2xl font-bold text-blue-600">{seriesSyncResults.summary.seriesUpdated}</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-medium text-red-900">Errors</div>
                        <div className="text-2xl font-bold text-red-600">{seriesSyncResults.summary.errors}</div>
                      </div>
                    </div>
                    
                    {seriesSyncResults.details.errors.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-red-900 mb-2">Errors:</h5>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {seriesSyncResults.details.errors.map((error: any, index: number) => (
                            <div key={index} className="text-sm text-red-700 mb-1">
                              <span className="font-medium">{error.series.name}:</span> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {seriesSyncResults.details.created.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-900 mb-2">New Series Created ({seriesSyncResults.details.created.length}):</h5>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {seriesSyncResults.details.created.map((series: any, index: number) => (
                            <div key={index} className="text-sm text-green-700">{series.name} ({series.publisherNameName})</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {seriesSyncResults.details.updated.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-900 mb-2">Series Updated ({seriesSyncResults.details.updated.length}):</h5>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {seriesSyncResults.details.updated.map((series: any, index: number) => (
                            <div key={index} className="text-sm text-blue-700">{series.name} ({series.publisherNameName})</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setShowSeriesSyncModal(false);
                        setSeriesSyncStep('upload');
                        setSeriesSyncData(null);
                        setSeriesValidationResults(null);
                        setSeriesSyncResults(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Issues Sync Modal */}
      {showIssuesSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
              <h2 className="text-xl font-semibold text-slate-900">
                {issuesSyncStep === 'upload' && 'Upload Issues Data'}
                {issuesSyncStep === 'validate' && 'Review Changes'}
                {issuesSyncStep === 'complete' && 'Sync Complete'}
              </h2>
              <button
                onClick={() => {
                  setShowIssuesSyncModal(false);
                  setIssuesSyncStep('upload');
                  setIssuesSyncData(null);
                  setIssuesValidationResults(null);
                  setIssuesSyncResults(null);
                }}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {issuesSyncStep === 'upload' && (
                <>
                  <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Issues JSON File</h3>
                    <p className="text-slate-600 mb-4">Select a JSON file exported from this application to sync issues data</p>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      id="issues-file-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const jsonData = JSON.parse(event.target?.result as string);
                              
                              if (!jsonData.issues || !Array.isArray(jsonData.issues)) {
                                alert('Invalid JSON format. Expected an \"issues\" array.');
                                return;
                              }
                              
                              const currentIssueKeys = new Set(filtered.map(issue => `${issue.series}-${issue.issue}`));
                              const newIssues: any[] = [];
                              const existingIssues: any[] = [];
                              const errors: any[] = [];
                              
                              jsonData.issues.forEach((issue: any, index: number) => {
                                const seriesName = issue.series;
                                const issueNumber = issue.issue;
                                if (!seriesName || (issueNumber === undefined || issueNumber === null || issueNumber === '')) {
                                  errors.push(`Issue at index ${index} has no series name or issue number`);
                                  return;
                                }
                                
                                const issueKey = `${seriesName}-${issueNumber}`;
                                if (currentIssueKeys.has(issueKey)) {
                                  existingIssues.push(issue);
                                } else {
                                  newIssues.push(issue);
                                }
                              });
                              
                              const validationResults = {
                                totalIssues: jsonData.issues.length,
                                newIssues: newIssues.length,
                                existingIssues: existingIssues.length,
                                errors: errors.length,
                                errorList: errors,
                                summary: {
                                  issuesWillBeCreated: newIssues.length,
                                  issuesWillBeUpdated: existingIssues.length,
                                  errors: errors.length
                                }
                              };
                              
                              setIssuesSyncData(jsonData);
                              setIssuesValidationResults(validationResults);
                              setIssuesSyncStep('validate');
                            } catch (error) {
                              console.error('Invalid JSON file:', error);
                              alert('Invalid JSON file. Please check your file format.');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <label
                      htmlFor="issues-file-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  <div className="mt-6 text-sm text-slate-600">
                    <h4 className="font-medium mb-2">Supported Operations:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Update existing issue information</li>
                      <li>Add new issues from the uploaded data</li>
                      <li>Detect and resolve conflicts</li>
                      <li>Preview all changes before applying</li>
                    </ul>
                  </div>
                </>
              )}
              
              {issuesSyncStep === 'validate' && issuesValidationResults && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-slate-900 mb-4">Validation Results</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900">New Issues</div>
                        <div className="text-2xl font-bold text-blue-600">{issuesValidationResults.summary.issuesWillBeCreated}</div>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="font-medium text-yellow-900">Updates</div>
                        <div className="text-2xl font-bold text-yellow-600">{issuesValidationResults.summary.issuesWillBeUpdated}</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-medium text-red-900">Errors</div>
                        <div className="text-2xl font-bold text-red-600">{issuesValidationResults.summary.errors}</div>
                      </div>
                    </div>
                    
                    {issuesValidationResults.errorList.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-red-900 mb-2">Errors Found:</h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {issuesValidationResults.errorList.map((error: string, index: number) => (
                            <div key={index} className="text-sm text-red-700">{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIssuesSyncStep('upload');
                        setIssuesSyncData(null);
                        setIssuesValidationResults(null);
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                    >
                      Back to Upload
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          console.log('Starting issues sync...', issuesSyncData);
                          
                          const response = await fetch('/api/issues/sync', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              issues: issuesSyncData.issues,
                              collectionType: collectionType
                            }),
                          });
                          
                          const result = await response.json();
                          
                          if (result.success) {
                            setIssuesSyncResults(result);
                            setIssuesSyncStep('complete');
                            fetchComics();
                            fetchSeries();
                          } else {
                            alert('Sync failed: ' + result.error);
                          }
                        } catch (error) {
                          console.error('Sync error:', error);
                          alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      disabled={issuesValidationResults.summary.errors > 0}
                    >
                      Sync Issues Data
                    </button>
                  </div>
                </>
              )}
              
              {issuesSyncStep === 'complete' && issuesSyncResults && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Sync Completed Successfully!</h3>
                    <p className="text-slate-600">Your issues data has been synchronized.</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-slate-900 mb-4">Sync Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-green-900">Issues Created</div>
                        <div className="text-2xl font-bold text-green-600">{issuesSyncResults.summary.issuesCreated}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-blue-900">Issues Updated</div>
                        <div className="text-2xl font-bold text-blue-600">{issuesSyncResults.summary.issuesUpdated}</div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-medium text-red-900">Errors</div>
                        <div className="text-2xl font-bold text-red-600">{issuesSyncResults.summary.errors}</div>
                      </div>
                    </div>
                    
                    {issuesSyncResults.details.errors.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-red-900 mb-2">Errors:</h5>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {issuesSyncResults.details.errors.map((error: any, index: number) => (
                            <div key={index} className="text-sm text-red-700 mb-1">
                              <span className="font-medium">{error.issue.series || error.issue.name}:</span> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {issuesSyncResults.details.created.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-900 mb-2">New Issues Created ({issuesSyncResults.details.created.length}):</h5>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {issuesSyncResults.details.created.map((issue: any, index: number) => (
                            <div key={index} className="text-sm text-green-700">{issue.seriesName} #{issue.issueNo} ({issue.publisherName})</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {issuesSyncResults.details.updated.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-900 mb-2">Issues Updated ({issuesSyncResults.details.updated.length}):</h5>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {issuesSyncResults.details.updated.map((issue: any, index: number) => (
                            <div key={index} className="text-sm text-blue-700">{issue.seriesName} #{issue.issueNo} ({issue.publisherName})</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        setShowIssuesSyncModal(false);
                        setIssuesSyncStep('upload');
                        setIssuesSyncData(null);
                        setIssuesValidationResults(null);
                        setIssuesSyncResults(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Single Issue Modal */}
      {showAddIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  {isBulkMode ? 'Bulk Add' : 'Add Single'} {collectionType === 'comics' ? 'Comic Issue' : 'Wishlist Item'}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Bulk Mode</span>
                  <button
                    type="button"
                    onClick={() => setIsBulkMode(!isBulkMode)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isBulkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isBulkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddIssueModal(false);
                  setIsBulkMode(false);
                  setBulkCart([]);
                  // Clear all form fields
                  setNewIssueCoverUrl('');
                  setNewIssueSeriesName('');
                  setNewIssuePublisher('');
                  setNewIssueNumber('');
                  setNewIssueYear('');
                  setNewIssueUpc('');
                  setNewIssueReleaseDate('');
                  setNewIssueVariant('');
                  setNewIssueLocgLink('');
                  setSeriesDropdownOpen(false);
                  setPublisherDropdownOpen(false);
                }}
                className="rounded-xl p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Series Name *</label>
                    <input
                      type="text"
                      value={newIssueSeriesName}
                      onChange={(e) => {
                        setNewIssueSeriesName(e.target.value);
                        setSeriesDropdownOpen(e.target.value.length > 0);
                      }}
                      onFocus={() => setSeriesDropdownOpen(newIssueSeriesName.length > 0)}
                      onBlur={() => setTimeout(() => setSeriesDropdownOpen(false), 200)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter or search series name"
                    />
                    {seriesDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {(() => {
                          const allSeriesNames = [...new Set([
                            ...combinedSeries.map(s => s.title || s.name),
                            ...series.map(s => s.name || s.title)
                          ])].filter(Boolean);
                          
                          const filteredSeries = allSeriesNames.filter(name => 
                            name && name.toLowerCase().includes(newIssueSeriesName.toLowerCase())
                          );
                          
                          return (
                            <>
                              {filteredSeries.slice(0, 8).map((seriesName, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setNewIssueSeriesName(seriesName);
                                    setSeriesDropdownOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                                >
                                  {seriesName}
                                </button>
                              ))}
                              {filteredSeries.length === 0 && (
                                <div className="px-3 py-2 text-sm text-slate-500 bg-green-50">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-green-600" />
                                    <span>Create new series: "{newIssueSeriesName}"</span>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Issue Number *</label>
                    <input
                      type="text"
                      value={newIssueNumber}
                      onChange={(e) => setNewIssueNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="e.g. 1, 2.5, 10"
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Publisher *</label>
                    <input
                      type="text"
                      value={newIssuePublisher}
                      onChange={(e) => {
                        setNewIssuePublisher(e.target.value);
                        setPublisherDropdownOpen(e.target.value.length > 0);
                      }}
                      onFocus={() => setPublisherDropdownOpen(newIssuePublisher.length > 0)}
                      onBlur={() => setTimeout(() => setPublisherDropdownOpen(false), 200)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter or search publisher name"
                    />
                    {publisherDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {(() => {
                          const allPublishers = [...new Set([
                            ...comics.map(c => c.publisher),
                            ...series.map(s => s.publisherName)
                          ])].filter(Boolean);
                          const filteredPublishers = allPublishers.filter(publisher => 
                            publisher && publisher.toLowerCase().includes(newIssuePublisher.toLowerCase())
                          );
                          
                          return (
                            <>
                              {filteredPublishers.slice(0, 8).map((publisherName, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setNewIssuePublisher(publisherName);
                                    setPublisherDropdownOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                                >
                                  {publisherName}
                                </button>
                              ))}
                              {filteredPublishers.length === 0 && (
                                <div className="px-3 py-2 text-sm text-slate-500 bg-green-50">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-green-600" />
                                    <span>Create new publisher: "{newIssuePublisher}"</span>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                    <input
                      type="number"
                      value={newIssueYear}
                      onChange={(e) => setNewIssueYear(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="2024"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">UPC</label>
                    <input
                      type="text"
                      value={newIssueUpc}
                      onChange={(e) => setNewIssueUpc(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter UPC code"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Release Date</label>
                    <input
                      type="date"
                      value={newIssueReleaseDate}
                      onChange={(e) => setNewIssueReleaseDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Variant Description</label>
                    <input
                      type="text"
                      value={newIssueVariant}
                      onChange={(e) => setNewIssueVariant(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter variant description (optional)"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cover URL</label>
                    <input
                      type="url"
                      value={newIssueCoverUrl}
                      onChange={(e) => setNewIssueCoverUrl(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter cover image URL (optional)"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">LOCG Link</label>
                    <input
                      type="url"
                      value={newIssueLocgLink}
                      onChange={(e) => setNewIssueLocgLink(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter LOCG link (optional)"
                    />
                  </div>
                </div>
                
                {/* Cover Preview */}
                <div className="hidden lg:block">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cover Preview</label>
                  <div className="w-full h-72 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                    {newIssueCoverUrl ? (
                      <img 
                        src={newIssueCoverUrl} 
                        alt="Cover preview"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block';
                          const errorDiv = (e.target as HTMLImageElement).nextElementSibling;
                          if (errorDiv) errorDiv.classList.add('hidden');
                        }}
                      />
                    ) : (
                      <div className="text-center text-slate-500">
                        <div className="text-4xl mb-2">📖</div>
                        <div className="text-sm">No cover image</div>
                        <div className="text-xs">Enter URL above</div>
                      </div>
                    )}
                    <div className="hidden text-center text-slate-500">
                      <div className="text-4xl mb-2">⚠️</div>
                      <div className="text-sm">Invalid image URL</div>
                      <div className="text-xs">Check the URL</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bulk Mode Cart Display */}
              {isBulkMode && bulkCart.length > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-medium text-slate-900 mb-4">
                    Cart ({bulkCart.length} items)
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {bulkCart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.publisherName} • {item.year}
                            {item.variantDescription && ` • ${item.variantDescription}`}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove from cart"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddIssueModal(false);
                    setIsBulkMode(false);
                    setBulkCart([]);
                    clearNewIssueForm();
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                
                {isBulkMode ? (
                  <>
                    <button
                      onClick={addToCart}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                    {bulkCart.length > 0 && (
                      <button
                        onClick={bulkImportItems}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Finish Import ({bulkCart.length} items)
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={async () => {
                      // Validate required fields
                      if (!newIssueSeriesName.trim() || !newIssuePublisher.trim() || !newIssueNumber.trim()) {
                        alert('Please fill in all required fields: Series Name, Issue Number, and Publisher');
                        return;
                      }

                      try {
                        const newItem = {
                          seriesName: newIssueSeriesName.trim(),
                          issueNo: parseFloat(newIssueNumber) || 0,
                          publisherName: newIssuePublisher.trim(),
                          year: parseInt(newIssueYear) || new Date().getFullYear(),
                          upc: newIssueUpc.trim(),
                          releaseDate: newIssueReleaseDate,
                          variantDescription: newIssueVariant.trim(),
                          coverUrl: newIssueCoverUrl.trim(),
                          locgLink: newIssueLocgLink.trim(),
                          name: `${newIssueSeriesName.trim()} #${newIssueNumber}`
                        };

                        const endpoint = collectionType === 'wishlist' ? '/api/wishlist' : '/api/issues';
                        
                        const response = await fetch(endpoint, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(newItem)
                        });

                        if (response.ok) {
                          alert(`Successfully added "${newItem.name}"!`);
                          
                          // Clear form and close modal
                          clearNewIssueForm();
                          setShowAddIssueModal(false);
                          
                          // Refresh the appropriate list
                          if (collectionType === 'wishlist') {
                            fetchWishlist();
                          } else {
                            fetchComics();
                          }
                        } else {
                          const errorData = await response.json();
                          alert(`Failed to add item: ${errorData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error('Error adding item:', error);
                        alert('Error adding item. Please try again.');
                      }
                    }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Add {collectionType === 'comics' ? 'Issue' : 'Item'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Series Modal */}
      {selectedSeriesForModal && (
        <SeriesModal 
          series={selectedSeriesForModal}
          seriesData={seriesModalData}
          loading={loadingSeriesModal}
          onClose={closeSeriesModal}
          showLoginModal={showLoginModal}
          setShowLoginModal={setShowLoginModal}
          crawling={crawling}
          onIssueClick={(issue) => {
            // Convert issue to comic format for the existing detail modal
            const comic = {
              id: issue.id.toString(),
              series: selectedSeriesForModal.title,
              issue: issue.issueNumber,
              publisher: selectedSeriesForModal.publisher,
              year: new Date(issue.releaseDate || '2024').getFullYear(),
              coverUrl: issue.coverImage,
              variantDescription: issue.variantDescription || (issue.variant ? 'Variant' : undefined),
              releaseDate: issue.releaseDate,
              upc: issue.upc,
              locgLink: issue.locgLink,
            };
            selectComic(comic);
            closeSeriesModal();
          }}
        />
      )}

      {/* Crawler Modals */}
      <CrawlerModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onStart={(credentials) => crawlSeries(selectedSeriesForModal?.id, credentials)}
      />
      
      <CrawlerStatusModal 
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        status={crawlerStatus}
        crawling={crawling}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          Comic Collection • Next.js + Tailwind • © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

// Components
function CrawlerModal({ 
  isOpen, 
  onClose, 
  onStart 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onStart: (credentials: { username: string; password: string }) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onStart({ username, password });
      setUsername('');
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">LOCG Login Required</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <p className="text-slate-600 mb-6 text-sm">
          Please provide your League of Comic Geeks credentials to crawl series data accurately (without variants/reprints).
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your LOCG username"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your LOCG password"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              disabled={!username || !password}
            >
              Start Crawling
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CrawlerStatusModal({ 
  isOpen, 
  onClose, 
  status, 
  progress,
  crawling
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  status: string;
  progress?: { current: number; total: number; };
  crawling: boolean;
}) {
  if (!isOpen) return null;

  const isComplete = status.includes('🎉') || status.includes('❌');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            {isComplete ? (
              <div className="text-2xl">
                {status.includes('🎉') ? '🎉' : '❌'}
              </div>
            ) : (
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {isComplete ? (status.includes('🎉') ? 'Crawl Complete!' : 'Crawl Failed') : 'Crawling LOCG'}
          </h2>
          
          <div className="text-slate-600 text-sm mb-4 whitespace-pre-line text-left bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {status}
          </div>
          
          {progress && !isComplete && (
            <div className="mb-4">
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {progress.current} of {progress.total} steps completed
              </p>
            </div>
          )}
          
          <button
            onClick={onClose}
            className={`px-4 py-2 transition-colors text-sm rounded-lg ${
              isComplete 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {isComplete ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SeriesModal({ 
  series, 
  seriesData, 
  loading, 
  onClose, 
  onIssueClick,
  showLoginModal,
  setShowLoginModal,
  crawling
}: { 
  series: any; 
  seriesData: any; 
  loading: boolean; 
  onClose: () => void; 
  onIssueClick: (issue: any) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  crawling: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-7xl max-h-[90vh] rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-2xl border border-slate-200/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
           style={{
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
           }}>
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border-b border-slate-300/50 px-8 py-6 flex-shrink-0 relative overflow-hidden">
          {/* Comic Book Dots Pattern Overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">{series.name}</h2>
                <div className="flex items-center gap-3 text-slate-600 mt-2">
                  <span className="text-sm font-semibold bg-slate-100 px-3 py-1 rounded-full border">{series.publisherName}</span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  <span className="text-sm font-medium">{series.totalIssues || 0} issues</span>
                  {series.run && (
                    <>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      <span className="text-sm font-semibold bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">{series.run}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Always show crawler button */}
              <button
                onClick={() => setShowLoginModal(true)}
                disabled={crawling}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 border border-green-300 hover:from-green-500 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-600 disabled:border-gray-300 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 group"
                title="Crawl LOCG for issue count"
              >
                {crawling ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="text-white text-lg">🔄</span>
                )}
              </button>
              
              {/* Show LOCG link button only if link exists */}
              {series.locgLink && (
                <a
                  href={series.locgLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 border border-orange-300 hover:from-orange-500 hover:to-orange-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 group"
                  title="View on League of Comic Geeks"
                >
                  <img 
                    src="/LOCG.png" 
                    alt="LOCG" 
                    className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                  />
                </a>
              )}
                <button
                onClick={onClose}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 border border-red-300 hover:from-red-500 hover:to-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 group"
                aria-label="Close"
              >
                <X className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-16 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                <div className="relative">
                  <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                  <div className="absolute inset-0 animate-ping w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full opacity-30"></div>
                </div>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Loading Issues</div>
              <p className="text-slate-600 animate-pulse">Fetching all issues in this series...</p>
              <div className="mt-4 flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : seriesData ? (
            <div className="space-y-8">
              {/* Enhanced Stats Summary - Comic Book Panels Style */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 shadow-inner border border-slate-200/50 relative overflow-hidden">
                {/* Comic dots background */}
                <div className="absolute inset-0 opacity-3" style={{
                  backgroundImage: 'radial-gradient(circle, #1e293b 0.5px, transparent 0.5px)',
                  backgroundSize: '15px 15px'
                }}></div>
                
                {seriesData.stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                    {/* Collection Panel */}
                    <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-1">{seriesData.stats.collectionCount}</div>
                      <div className="text-xs text-green-700 font-bold uppercase tracking-wider">📚 In Collection</div>
                    </div>
                    
                    {/* Wishlist Panel */}
                    <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-1">{seriesData.stats.wishlistCount}</div>
                      <div className="text-xs text-purple-700 font-bold uppercase tracking-wider">⭐ On Wishlist</div>
                    </div>
                    
                    {/* Missing Panel - Only show if there are missing issues */}
                    {seriesData.stats.missingCount > 0 && (
                      <div className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                        <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-1">{seriesData.stats.missingCount}</div>
                        <div className="text-xs text-red-700 font-bold uppercase tracking-wider">❗ Missing</div>
                      </div>
                    )}
                    
                    {/* Total Panel */}
                    <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">{seriesData.stats.totalCount}</div>
                      <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">🎯 Total</div>
                    </div>
                    
                    {/* Test Total Issues Panel */}
                    <div className="text-center bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border-2 border-teal-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                      <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent mb-1">
                        {seriesData.locgIssueCount ?? 'N/A'}
                      </div>
                      <div className="text-xs text-teal-700 font-bold uppercase tracking-wider">📊 LOCG Issues</div>
                      {seriesData.lastCrawled && (
                        <div className="text-xs text-teal-600 mt-1 opacity-75">
                          Last crawled: {new Date(seriesData.lastCrawled).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 mb-1">{seriesData.issues?.length || 0}</div>
                    <div className="text-slate-600">issues in your collection</div>
                    {seriesData.totalIssues > 0 && (
                      <div className="text-sm text-slate-500 mt-1">
                        {seriesData.totalIssues} total issues published
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Collection Issues */}
              {seriesData.collectionIssues && seriesData.collectionIssues.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Collection</h3>
                      <p className="text-sm text-slate-600">{seriesData.collectionIssues.length} issues in your collection</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {seriesData.collectionIssues.map((issue: any) => (
                      <SeriesIssueCard 
                        key={`collection-${issue.id}`} 
                        issue={issue} 
                        series={series}
                        onOpen={() => onIssueClick(issue)} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Issues (for backwards compatibility) */}
              {seriesData.issues && !seriesData.collectionIssues && (
                <div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {seriesData.issues.map((issue: any) => (
                      <SeriesIssueCard 
                        key={issue.id} 
                        issue={issue} 
                        series={series}
                        onOpen={() => onIssueClick(issue)} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlist Items */}
              {seriesData.wishlistItems && seriesData.wishlistItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">Wishlist</h3>
                      <p className="text-sm text-slate-600">{seriesData.wishlistItems.length} items on your wishlist</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {seriesData.wishlistItems.map((item: any) => (
                      <div key={`wishlist-${item.id}`} className="relative group">
                        <SeriesIssueCard 
                          issue={item} 
                          series={series}
                          onOpen={() => {}} // No click action for wishlist items in this view
                        />
                        <div className="absolute top-3 right-3">
                          <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                            Wishlist
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Issues */}
              {seriesData.missingIssues && seriesData.missingIssues.length > 0 && (
                <div>
                  <div className="border-t border-slate-200 pt-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <X className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">Missing Issues</h3>
                        <p className="text-sm text-slate-600">{seriesData.missingIssues.length} issues missing from your collection</p>
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-6">
                      <div className="flex flex-wrap gap-3">
                        {seriesData.missingIssues.map((issueNum: number) => (
                          <span 
                            key={issueNum}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-white text-red-700 border border-red-200 shadow-sm"
                          >
                            #{issueNum}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <div className="text-xl font-semibold text-slate-900 mb-2">No Issues Found</div>
              <p className="text-slate-600 max-w-sm mx-auto">This series doesn't have any issues in your collection or wishlist yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SeriesIssueCard({ 
  issue, 
  series, 
  onOpen 
}: { 
  issue: any; 
  series: any; 
  onOpen: () => void;
}) {

  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2"
      style={{ height: 240, width: 160 }}
      aria-label={`Open ${series.name} #${issue.issueNumber}`}
    >
      {issue.coverImage ? (
        <img 
          src={issue.coverImage} 
          alt={`${series.name} #${issue.issueNumber}`}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        </>
      )}
      <div className="absolute bottom-0 w-full translate-y-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-left">
        <div className="line-clamp-2 text-xs font-semibold text-white drop-shadow">
          {series.name}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-200">
          <span>#{issue.issueNumber}</span>
          {issue.variant && <span>Variant</span>}
        </div>
      </div>
    </button>
  );
}

function FolderGroup({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : "rotate-0"}`} />
      </button>
      {open && <div className="px-1 pb-2">{children}</div>}
    </div>
  );
}

function FolderLink({ label, icon, active = false, onClick }: { label: string; icon?: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
        active ? "bg-sky-50 font-medium text-sky-700" : "text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {icon && <span className="text-slate-500">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function SeriesCard({ series, onOpen, comics }: { series: any; onOpen: () => void; comics: any[] }) {
  const getPublisherColor = (publisher: string) => {
    const colors: Record<string, string> = {
      'Marvel Comics': 'from-red-500 to-red-600',
      'DC Comics': 'from-blue-500 to-blue-600', 
      'Image Comics': 'from-green-500 to-green-600',
      'Dark Horse Comics': 'from-orange-500 to-orange-600',
      'IDW Publishing': 'from-purple-500 to-purple-600',
    };
    return colors[publisher] || 'from-slate-500 to-slate-600';
  };

  const getSeriesBadges = () => {
    const hasStartDate = series.startDate;
    const hasEndDate = series.endDate;
    const totalIssues = series.totalIssues || 0;
    
    // Get collected issues count for this series from the comics data
    const seriesName = series.name || series.title;
    const publisherName = series.publisherName || series.publisher;
    
    const collectedIssues = comics ? comics.filter(comic => 
      comic.series === seriesName && 
      comic.publisher === publisherName
    ).length : 0;

    const badges = [];

    // One-Shot (exactly 1 total issue)
    if (totalIssues === 1) {
      badges.push({
        text: "⚡ One-Shot",
        className: "bg-gradient-to-r from-orange-400 to-orange-600 text-white border-orange-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
      });
    }

    // Completed Run (have all issues for series with more than 1 total issue)
    else if (totalIssues > 1 && collectedIssues >= totalIssues && totalIssues > 0) {
      badges.push({
        text: "✅ Completed Run",
        className: "bg-gradient-to-r from-green-400 to-green-600 text-white border-green-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 animate-pulse"
      });
    }

    // Missing Issues (have some but not all issues, and total issues > 1)
    else if (totalIssues > 1 && collectedIssues > 0 && collectedIssues < totalIssues) {
      badges.push({
        text: "⚠️ Missing Issues",
        className: "bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
      });
    }

    // Series Ended (has both start and end date) - can show alongside collection badges
    if (hasStartDate && hasEndDate) {
      badges.push({
        text: "🏁 Series Ended",
        className: "bg-gradient-to-r from-red-400 to-red-600 text-white border-red-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
      });
    }

    // Ongoing Series (has start date but no end date) - can show alongside collection badges
    else if (hasStartDate && !hasEndDate) {
      badges.push({
        text: "🔄 Ongoing Series",
        className: "bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
      });
    }

    return badges;
  };

  const badges = getSeriesBadges();

  const getSeriesRun = () => {
    const startDate = series.startDate;
    const endDate = series.endDate;
    
    if (!startDate) {
      return "—";
    }
    
    // Format dates (handle both string dates and numeric years)
    const formatDate = (dateValue: any) => {
      if (!dateValue) return null;
      
      // If it's already a number (like 2021.0), just convert to integer
      if (typeof dateValue === 'number') {
        return Math.floor(dateValue).toString();
      }
      
      // If it's a string that looks like a number
      if (typeof dateValue === 'string' && /^\d+(\.\d+)?$/.test(dateValue)) {
        return Math.floor(parseFloat(dateValue)).toString();
      }
      
      // Try to parse as a date
      try {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.getFullYear().toString();
        }
      } catch {}
      
      // If date parsing fails, extract year from string if possible
      if (typeof dateValue === 'string') {
        const yearMatch = dateValue.match(/\d{4}/);
        return yearMatch ? yearMatch[0] : dateValue;
      }
      
      return dateValue.toString();
    };
    
    const startYear = formatDate(startDate);
    const endYear = endDate ? formatDate(endDate) : "Present";
    
    // If start and end year are the same, just show the year once
    if (endYear !== "Present" && startYear === endYear) {
      return startYear;
    }
    
    return `${startYear} - ${endYear}`;
  };

  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-50 shadow-lg hover:shadow-2xl border border-slate-200 hover:border-slate-300 transition-all duration-500 hover:scale-110 hover:-translate-y-3 p-6 text-left transform-gpu hover:rotate-1"
      style={{
        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
      aria-label={`Open ${series.name} series`}
    >
      {/* Enhanced Publisher Color Bar */}
      <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${getPublisherColor(series.publisherName)} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-pulse"></div>
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-105 drop-shadow-sm">
            {series.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getPublisherColor(series.publisherName)} shadow-sm group-hover:scale-110 transition-transform duration-300`}></div>
            <p className="text-sm font-medium text-slate-600 group-hover:text-slate-700 transition-colors duration-300">{series.publisherName}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-blue-100 group-hover:to-blue-200 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 shadow-sm">
            <BookOpen className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors duration-300" />
          </div>
        </div>
      </div>
      
      {/* Series Badges */}
      {badges && badges.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {badges.map((badge, index) => (
            <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
              {badge.text}
            </span>
          ))}
        </div>
      )}
      
      {/* Enhanced Stats */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 mb-3 shadow-inner group-hover:from-slate-100 group-hover:to-slate-150 transition-all duration-300">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="group-hover:scale-105 transition-transform duration-300">
            <div className="text-2xl font-bold text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-purple-700 transition-all duration-300">{series.totalIssues || 0}</div>
            <div className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Issues</div>
          </div>
          <div className="group-hover:scale-105 transition-transform duration-300">
            <div className="text-lg font-bold text-slate-900 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent group-hover:from-green-700 group-hover:to-blue-700 transition-all duration-300">{getSeriesRun()}</div>
            <div className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Run</div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Hover Indicator */}
      <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
        <div className="text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-full shadow-lg border border-white/20 backdrop-blur-sm animate-pulse">
          ✨ Click to view issues
        </div>
      </div>
      
      {/* Enhanced Status Indicator */}
      <div className="absolute top-4 right-4 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-md group-hover:scale-125 transition-transform duration-300">
          <div className="w-full h-full rounded-full bg-green-400 opacity-75 animate-ping"></div>
        </div>
      </div>
    </button>
  );
}

function CoverCard({ c, size, onOpen }: { c: Comic; size: number; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-2"
      style={{ height: size * 1.5, width: size }}
      aria-label={`Open ${c.series} #${c.issue}`}
    >
      {c.coverUrl ? (
        <img 
          src={c.coverUrl} 
          alt={`${c.series} #${c.issue}`}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        </>
      )}
      <div className="absolute bottom-0 w-full translate-y-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-left">
        <div className="line-clamp-2 text-xs font-semibold text-white drop-shadow">
          {c.series}
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-slate-200">
          <span>#{c.issue}</span>
          <span>{c.publisher}</span>
        </div>
      </div>
    </button>
  );
}

function InfoRow({ 
  label, 
  value, 
  isEditing = false, 
  onEdit,
  fieldKey,
  publisherId,
  onPublisherIdChange
}: { 
  label: string; 
  value: React.ReactNode; 
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
  fieldKey?: string;
  publisherId?: number;
  onPublisherIdChange?: (publisherId: number) => void;
}) {
  const [editValue, setEditValue] = useState(value?.toString() || '');

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  const handleChange = (newValue: string) => {
    setEditValue(newValue);
    if (onEdit && fieldKey) {
      onEdit(fieldKey, newValue);
    }
  };

  // Special handling for Series and Publisher fields with smart search
  const renderEditField = () => {
    if (fieldKey === 'publisher') {
      return (
        <div className="-mt-2"> {/* Adjust spacing to match original layout */}
          <PublisherSearchSelect
            value={undefined} // We'll determine current value from the text value
            onChange={(publisher) => {
              if (onEdit && fieldKey) {
                onEdit(fieldKey, publisher?.name || '');
                // Update the publisher ID for the series search
                if (publisher && onPublisherIdChange) {
                  onPublisherIdChange(publisher.id);
                }
              }
            }}
            className="w-full"
            allowCreate={true}
          />
        </div>
      );
    } else if (fieldKey === 'series') {
      return (
        <div className="-mt-2"> {/* Adjust spacing to match original layout */}
          <SeriesSearchSelect
            value={undefined} // We'll determine current value from the text value
            onChange={(seriesData) => {
              if (onEdit && fieldKey) {
                onEdit(fieldKey, seriesData?.name || '');
              }
            }}
            publisherId={publisherId}
            className="w-full"
            allowCreate={true}
          />
        </div>
      );
    } else {
      // Regular text input for other fields
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => handleChange(e.target.value)}
          className="text-sm text-slate-800 leading-tight border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      );
    }
  };

  return (
    <div className="grid grid-cols-[80px_1fr] items-start gap-2">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      {isEditing && onEdit && fieldKey ? renderEditField() : (
        <div className="text-sm text-slate-800 leading-tight break-words">{value}</div>
      )}
    </div>
  );
}

function PublisherDirectory({
  data,
  selected,
  onSelect,
}: {
  data: Comic[];
  selected: string;
  onSelect: (p: string) => void;
}) {
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of data) {
      map.set(c.publisher, (map.get(c.publisher) || 0) + 1);
    }
    return map;
  }, [data]);

  const list = useMemo(() => {
    const names = Array.from(counts.keys());
    const q = query.trim().toLowerCase();
    const filtered = q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
    return filtered.sort((a, b) => a.localeCompare(b));
  }, [counts, query]);

  const groups = useMemo(() => {
    const g = new Map<string, string[]>();
    for (const name of list) {
      const letter = /[A-Za-z]/.test(name[0]) ? name[0].toUpperCase() : "0-9";
      if (!g.has(letter)) g.set(letter, []);
      g.get(letter)!.push(name);
    }
    return Array.from(g.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [list]);

  return (
    <div>
      <label className="relative mb-2 block">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search publishers..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </label>
      <div className="no-scrollbar max-h-[380px] overflow-y-auto pr-1">
        {groups.map(([letter, names]) => (
          <div key={letter} className="mb-2">
            <div className="sticky top-0 z-10 mb-1 rounded bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-500">
              {letter}
            </div>
            <ul className="space-y-1">
              {names.map((name) => (
                <li key={name}>
                  <button
                    onClick={() => onSelect(name)}
                    className={[
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm",
                      selected === name
                        ? "bg-sky-50 font-medium text-sky-700"
                        : "text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="truncate">{name}</span>
                    <span className={selected === name ? "text-sky-700" : "text-slate-500"}>{counts.get(name)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-500">No publishers</div>
        )}
      </div>
    </div>
  );
}

function ImportModal({ collectionType, onClose, onSuccess }: { collectionType: 'comics' | 'wishlist'; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'download' | 'upload' | 'preview' | 'processing' | 'results'>('download');
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  const downloadTemplate = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const endpoint = format === 'json' ? '/api/import/json/template' : '/api/import/template';
      console.log(`Downloading ${format} template from ${endpoint}?collectionType=${collectionType}`);
      
      const response = await fetch(`${endpoint}?collectionType=${collectionType}`);
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob created:', blob.size, 'bytes, type:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'json' ? 'json' : 'csv';
      const filename = collectionType === 'wishlist' ? `wishlist_import_template.${extension}` : `comics_import_template.${extension}`;
      a.download = filename;
      a.style.display = 'none';
      
      console.log('Triggering download for:', filename);
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a brief delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      setStep('upload');
    } catch (error) {
      console.error('Error downloading template:', error);
      alert(`Error downloading template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && (uploadedFile.type === 'text/csv' || uploadedFile.type === 'application/json' || uploadedFile.name.endsWith('.json'))) {
      setFile(uploadedFile);
    }
  };

  const validateImport = async () => {
    if (!file) return;
    
    setLoading(true);
    setValidationProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setValidationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Determine endpoint based on file type
    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const endpoint = isJson ? '/api/import/json/validate' : '/api/import/validate';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      // Complete progress and transition
      clearInterval(progressInterval);
      setValidationProgress(100);
      
      // Brief delay to show completion, then transition
      setTimeout(() => {
        setValidationResults(result);
        setStep('preview');
        setLoading(false);
        setValidationProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error validating import:', error);
      clearInterval(progressInterval);
      setValidationResults({ success: false, error: 'Failed to validate import' });
      setStep('preview');
      setLoading(false);
      setValidationProgress(0);
    }
  };

  const processImport = async () => {
    if (!file) return;
    
    setLoading(true);
    setStep('processing');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('collectionType', collectionType);
    
    // Determine endpoint based on file type
    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const endpoint = isJson ? '/api/import/json/process' : '/api/import/process';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      setResults(result);
      setStep('results');
    } catch (error) {
      console.error('Error processing import:', error);
      setResults({ success: false, error: 'Failed to process import' });
      setStep('results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-900">Import {collectionType === 'comics' ? 'Comics' : 'Wishlist Items'}</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'download' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Download Import Template</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Download the template file, fill in your comic data, and upload it back to import your wishlist items.
                </p>
                
                <button
                  onClick={() => downloadTemplate('json')}
                  className="inline-flex items-center gap-3 rounded-xl bg-emerald-600 text-white px-8 py-4 font-medium hover:bg-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900 mb-1">JSON Format</p>
                      <p className="text-sm text-blue-800">Uses reliable JSON format that handles special characters and complex data seamlessly.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 bg-slate-50 rounded-lg p-6">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Template Fields
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">name</span>
                      <span className="text-slate-600">Comic issue name</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">series_name</span>
                      <span className="text-slate-600">Series name</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">publisher_name</span>
                      <span className="text-slate-600">Publisher name</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">issue_no</span>
                      <span className="text-slate-600">Issue number</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">variant_description</span>
                      <span className="text-slate-500 italic">optional</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">cover_url</span>
                      <span className="text-slate-500 italic">optional</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">release_date</span>
                      <span className="text-slate-500 italic">optional</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">upc</span>
                      <span className="text-slate-500 italic">optional</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">locg_link</span>
                      <span className="text-slate-500 italic">optional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {step === 'upload' && !loading && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Upload Your Template</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Upload your completed template file. We'll process it and create any missing publishers or series.
                </p>
                
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-12 transition-colors duration-200">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center group"
                  >
                    <div className="w-12 h-12 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200">
                      <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-slate-700 font-medium mb-1">Click to select your JSON template file</div>
                    <div className="text-slate-500 text-sm">or drag and drop it here</div>
                  </label>
                </div>
                {file && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-green-800 font-medium">{file.name}</p>
                        <p className="text-green-700 text-sm">Ready to upload</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setStep('download')}
                  className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={validateImport}
                  disabled={!file || loading}
                  className="rounded-xl bg-sky-600 text-white px-6 py-2 font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {loading ? 'Validating...' : 'Preview Import'}
                </button>
              </div>
            </div>
          )}
          
          {step === 'upload' && loading && (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="w-full bg-gray-200 rounded-full h-3 mx-auto max-w-xs mb-2">
                  <div 
                    className="bg-sky-600 h-3 rounded-full transition-all duration-300 ease-out" 
                    style={{width: `${validationProgress}%`}}
                  ></div>
                </div>
                <div className="text-xs text-slate-500">{Math.round(validationProgress)}% complete</div>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Validating Import...</h3>
              <div className="space-y-1 text-sm text-slate-600 max-w-md mx-auto">
                <p className={validationProgress > 10 ? "text-green-600" : ""}>
                  {validationProgress > 10 ? "✓" : "⏳"} Parsing CSV file
                </p>
                <p className={validationProgress > 30 ? "text-green-600" : validationProgress > 10 ? "animate-pulse" : "text-slate-400"}>
                  {validationProgress > 30 ? "✓" : validationProgress > 10 ? "⏳" : "⏳"} Validating headers and data
                </p>
                <p className={validationProgress > 60 ? "text-green-600" : validationProgress > 30 ? "animate-pulse" : "text-slate-400"}>
                  {validationProgress > 60 ? "✓" : validationProgress > 30 ? "⏳" : "⏳"} Checking for existing records
                </p>
                <p className={validationProgress > 90 ? "text-green-600" : validationProgress > 60 ? "animate-pulse" : "text-slate-400"}>
                  {validationProgress > 90 ? "✓" : validationProgress > 60 ? "⏳" : "⏳"} Analyzing duplicates and conflicts
                </p>
              </div>
            </div>
          )}
          
          {step === 'preview' && validationResults && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Step 3: Review Import Preview</h3>
                <p className="text-slate-600 mb-6">
                  Review the changes that will be made. Check for any errors or issues before proceeding.
                </p>
              </div>
              
              {validationResults.success ? (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900">Issues to Add</div>
                      <div className="text-2xl font-bold text-blue-600">{validationResults.summary.issuesWillBeAdded}</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-900">Series to Create</div>
                      <div className="text-2xl font-bold text-purple-600">{validationResults.summary.seriesWillBeCreated}</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-900">Publishers to Create</div>
                      <div className="text-2xl font-bold text-green-600">{validationResults.summary.publishersWillBeCreated}</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium text-orange-900">Duplicates/Errors</div>
                      <div className="text-2xl font-bold text-orange-600">{validationResults.summary.duplicates + validationResults.summary.errors}</div>
                    </div>
                  </div>

                  {/* Details Sections */}
                  <div className="max-h-80 overflow-y-auto space-y-3 border rounded-lg p-4 bg-slate-50">
                    {validationResults.details.newPublishers.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <h4 className="font-medium text-green-800 mb-2">New Publishers ({validationResults.details.newPublishers.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {validationResults.details.newPublishers.map((pub: string, idx: number) => (
                            <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {pub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {validationResults.details.newSeries.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <h4 className="font-medium text-purple-800 mb-2">New Series ({validationResults.details.newSeries.length})</h4>
                        <div className="space-y-1">
                          {validationResults.details.newSeries.map((series: any, idx: number) => (
                            <div key={idx} className="text-xs bg-purple-50 p-2 rounded">
                              <span className="font-medium">{series.name}</span> <span className="text-purple-600">({series.publisherName})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {validationResults.details.duplicates.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <h4 className="font-medium text-orange-800 mb-2">Duplicate Issues ({validationResults.details.duplicates.length})</h4>
                        <div className="space-y-1">
                          {validationResults.details.duplicates.map((dup: any, idx: number) => (
                            <div key={idx} className="text-xs bg-orange-50 p-2 rounded">
                              {dup.series} #{dup.issue}{dup.variant ? ` (${dup.variant})` : ''} - <span className="text-orange-600">Already exists</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {validationResults.details.errors.length > 0 && (
                      <div className="border rounded-lg p-3 bg-white">
                        <h4 className="font-medium text-red-800 mb-2">Errors ({validationResults.details.errors.length})</h4>
                        <div className="space-y-1">
                          {validationResults.details.errors.map((error: any, idx: number) => (
                            <div key={idx} className="text-xs bg-red-50 p-2 rounded">
                              <span className="font-medium">Row {error.row}:</span> {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-red-800">{validationResults.error || 'Validation failed'}</p>
                </div>
              )}
              
            </div>
          )}
          
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Processing Import...</h3>
              <p className="text-slate-600">Please wait while we process your comics data.</p>
            </div>
          )}
          
          {step === 'results' && results && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Import Results</h3>
                {results.success ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">Import successful!</p>
                    </div>
                    {results.summary && (
                      <div className="text-left space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="font-medium text-blue-900">Issues Added</div>
                            <div className="text-2xl font-bold text-blue-600">{results.summary.issuesAdded}</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="font-medium text-purple-900">Series Created</div>
                            <div className="text-2xl font-bold text-purple-600">{results.summary.seriesCreated}</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="font-medium text-green-900">Publishers Created</div>
                            <div className="text-2xl font-bold text-green-600">{results.summary.publishersCreated}</div>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="font-medium text-orange-900">Errors</div>
                            <div className="text-2xl font-bold text-orange-600">{results.summary.errors}</div>
                          </div>
                        </div>
                        {results.issues && results.issues.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-slate-900 mb-2">Issues Found:</h4>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {results.issues.map((issue: string, index: number) => (
                                <div key={index} className="text-sm text-orange-700 bg-orange-50 px-3 py-1 rounded">
                                  {issue}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-800">{results.error || 'Import failed'}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    if (results.success) {
                      onSuccess(); // Refresh the comics list
                    }
                    onClose(); // Close the modal
                  }}
                  className="rounded-xl bg-sky-600 text-white px-6 py-2 font-medium hover:bg-sky-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Sticky Footer for Preview Step */}
        {step === 'preview' && validationResults && (
          <div className="border-t border-slate-200 px-6 py-4 flex-shrink-0 bg-white">
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setStep('upload')}
                className="rounded-xl border border-slate-300 px-4 py-2 hover:bg-slate-50"
              >
                Back
              </button>
              {validationResults.success && validationResults.summary.issuesWillBeAdded > 0 && (
                <button
                  onClick={processImport}
                  className="rounded-xl bg-green-600 text-white px-6 py-2 font-medium hover:bg-green-700 transition-colors"
                >
                  Confirm & Import ({validationResults.summary.issuesWillBeAdded} issues)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CLZComicsApp />
    </Suspense>
  );
}