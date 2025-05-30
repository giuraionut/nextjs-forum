'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSortContext } from './PostSortingContext';

export function SortingControls() {
  const { currentSort, setSortOption, availableSortOptions, showSortOptions } =
    useSortContext();
  if (!showSortOptions) return null; // Return null if showSortOptions is false
  return (
    <div className='flex justify-between items-center gap-4'>
      <h1>{'Sort by'}</h1>
      <Select value={currentSort} onValueChange={setSortOption}>
        <SelectTrigger className='w-[180px] cursor-pointer'>
          <SelectValue placeholder='Sort by' />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(availableSortOptions).map(([key, option]) => (
            <SelectItem key={key} value={key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
