'use client';

import SearchableSelect from './SearchableSelect';
import { SeriesService } from '@/lib/db-service';

interface Series {
  id: number;
  name: string;
  publisherId: number;
  publisherName?: string;
  totalIssues: number;
  locgLink?: string;
  startDate?: string;
  endDate?: string;
}

interface SeriesSearchSelectProps {
  value?: number;
  onChange: (series: Series | null) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  publisherId?: number; // If specified, will pre-select this publisher when creating new series
}

export default function SeriesSearchSelect({
  value,
  onChange,
  label = "Series",
  className,
  disabled = false,
  allowCreate = true,
  publisherId
}: SeriesSearchSelectProps) {
  const handleCreateSeries = async (name: string): Promise<Series> => {
    try {
      // If we have a publisherId, use it, otherwise we need to handle this scenario
      if (!publisherId) {
        throw new Error('Publisher must be selected before creating a new series');
      }

      const response = await fetch('/api/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          publisherId: publisherId,
          totalIssues: 0,
          locgLink: null,
          startDate: null,
          endDate: null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create series');
      }

      const newSeries = await response.json();
      return newSeries;
    } catch (error) {
      console.error('Error creating series:', error);
      throw error;
    }
  };

  const handleChange = (option: any) => {
    onChange(option as Series | null);
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      placeholder="Search for a series..."
      apiEndpoint="/api/series"
      label={label}
      className={className}
      disabled={disabled}
      allowCreate={allowCreate && !!publisherId} // Only allow creation if we have a publisher
      onCreateNew={allowCreate ? handleCreateSeries : undefined}
    />
  );
}