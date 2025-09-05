'use client';

import SearchableSelect from './SearchableSelect';

interface Publisher {
  id: number;
  name: string;
}

interface PublisherSearchSelectProps {
  value?: number;
  onChange: (publisher: Publisher | null) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  allowCreate?: boolean;
}

export default function PublisherSearchSelect({
  value,
  onChange,
  label = "Publisher",
  className,
  disabled = false,
  allowCreate = true
}: PublisherSearchSelectProps) {
  const handleCreatePublisher = async (name: string): Promise<Publisher> => {
    try {
      const response = await fetch('/api/publishers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim()
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create publisher');
      }

      const newPublisher = await response.json();
      return newPublisher;
    } catch (error) {
      console.error('Error creating publisher:', error);
      throw error;
    }
  };

  const handleChange = (option: any) => {
    onChange(option as Publisher | null);
  };

  return (
    <SearchableSelect
      value={value}
      onChange={handleChange}
      placeholder="Search for a publisher..."
      apiEndpoint="/api/publishers"
      label={label}
      className={className}
      disabled={disabled}
      allowCreate={allowCreate}
      onCreateNew={allowCreate ? handleCreatePublisher : undefined}
    />
  );
}