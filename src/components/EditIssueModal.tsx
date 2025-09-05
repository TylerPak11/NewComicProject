'use client';

import { useState, useEffect } from 'react';
import { Issue } from '@/types/comic';
import SeriesSearchSelect from './SeriesSearchSelect';
import PublisherSearchSelect from './PublisherSearchSelect';

interface EditIssueModalProps {
  issue: Issue;
  onClose: () => void;
  onSave: (updatedIssue: Partial<Issue>) => Promise<void>;
}

export default function EditIssueModal({ issue, onClose, onSave }: EditIssueModalProps) {
  const [formData, setFormData] = useState({
    name: issue.name || '',
    seriesId: issue.seriesId,
    publisherId: issue.publisherId,
    issueNo: issue.issueNo,
    variantDescription: issue.variantDescription || '',
    coverUrl: issue.coverUrl || '',
    releaseDate: issue.releaseDate || '',
    upc: issue.upc || '',
    locgLink: issue.locgLink || '',
    plot: issue.plot || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.seriesId || !formData.publisherId) {
      alert('Please select both a series and publisher');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        id: issue.id,
        ...formData
      });
      onClose();
    } catch (error) {
      console.error('Error saving issue:', error);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePublisherChange = (publisher: any) => {
    handleChange('publisherId', publisher?.id || null);
    // If publisher changes, clear series selection as it may no longer be valid
    if (publisher?.id !== formData.publisherId) {
      handleChange('seriesId', null);
    }
  };

  const handleSeriesChange = (series: any) => {
    handleChange('seriesId', series?.id || null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Issue</h2>
              <p className="text-sm text-gray-600">
                {issue.seriesName} #{issue.issueNo}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Publisher Selection */}
            <PublisherSearchSelect
              value={formData.publisherId}
              onChange={handlePublisherChange}
              label="Publisher *"
              allowCreate={true}
            />

            {/* Series Selection */}
            <SeriesSearchSelect
              value={formData.seriesId}
              onChange={handleSeriesChange}
              label="Series *"
              publisherId={formData.publisherId}
              allowCreate={true}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="issueNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Number *
                </label>
                <input
                  type="number"
                  id="issueNo"
                  value={formData.issueNo}
                  onChange={(e) => handleChange('issueNo', parseInt(e.target.value) || 0)}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="variantDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Variant Description
              </label>
              <input
                type="text"
                id="variantDescription"
                value={formData.variantDescription}
                onChange={(e) => handleChange('variantDescription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Josh Burns Variant"
              />
            </div>

            <div>
              <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Cover URL
              </label>
              <input
                type="url"
                id="coverUrl"
                value={formData.coverUrl}
                onChange={(e) => handleChange('coverUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/cover.jpg"
              />
            </div>

            <div>
              <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                Release Date
              </label>
              <input
                type="date"
                id="releaseDate"
                value={formData.releaseDate}
                onChange={(e) => handleChange('releaseDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="upc" className="block text-sm font-medium text-gray-700 mb-2">
                UPC
              </label>
              <input
                type="text"
                id="upc"
                value={formData.upc}
                onChange={(e) => handleChange('upc', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="787790290469001100"
              />
            </div>

            <div>
              <label htmlFor="locgLink" className="block text-sm font-medium text-gray-700 mb-2">
                LOCG Link
              </label>
              <input
                type="url"
                id="locgLink"
                value={formData.locgLink}
                onChange={(e) => handleChange('locgLink', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://leagueofcomicgeeks.com/..."
              />
            </div>

            <div>
              <label htmlFor="plot" className="block text-sm font-medium text-gray-700 mb-2">
                Plot
              </label>
              <textarea
                id="plot"
                rows={4}
                value={formData.plot}
                onChange={(e) => handleChange('plot', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter plot description..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}