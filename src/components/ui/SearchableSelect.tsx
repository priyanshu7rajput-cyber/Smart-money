'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  emptyMessage = 'No matching options found',
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Normalize string for fuzzy/space-agnostic matching
  const normalize = (str?: string) => (str || '').toLowerCase().replace(/\s+/g, '');

  // Filter options
  const filteredOptions = options.filter((opt) => {
    const rawSearch = search.trim();
    if (!rawSearch) return true;
    const cleanSearch = normalize(rawSearch);
    
    // Check both normal inclusion and space-ignored inclusion
    const q = rawSearch.toLowerCase();
    const labelMatch = opt.label.toLowerCase().includes(q) || normalize(opt.label).includes(cleanSearch);
    const subMatch = opt.subtitle?.toLowerCase().includes(q) || normalize(opt.subtitle).includes(cleanSearch);
    const badgeMatch = opt.badge?.toLowerCase().includes(q) || normalize(opt.badge).includes(cleanSearch);
    return labelMatch || subMatch || badgeMatch;
  });

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex h-9.5 w-full items-center justify-between rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 transition-all cursor-pointer select-none',
          isOpen && 'ring-2 ring-blue-500/20 border-blue-600',
          disabled && 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180 text-blue-600')}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto overscroll-contain p-1 text-xs touch-pan-y" style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Direct / Walk-in Option */}
            <div
              onClick={() => handleSelect('')}
              className={cn(
                'flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors',
                !value
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              <span>{placeholder}</span>
              {!value && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
            </div>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-400 text-[11px]">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors group',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    )}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {opt.label}
                      </span>
                      {opt.subtitle && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
