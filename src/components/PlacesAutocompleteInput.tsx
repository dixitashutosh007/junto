'use client';

import { apiFetch } from '@/lib/api-client';
import React, { useState, useEffect, useId, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { PlaceSuggestion } from '@/lib/services/places-data';

interface PlacesAutocompleteInputProps {
  value: string;
  onChange: (value: string, suggestion?: PlaceSuggestion) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export function PlacesAutocompleteInput({
  value,
  onChange,
  placeholder = 'Search destination (e.g. Manyata, Bagmane, ITPL...)',
  label = 'Destination Hub',
  required = false,
}: PlacesAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/api/v1/places/autocomplete?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setIsOpen(true);
      }
    } catch (e) {
      console.error('Failed to load places suggestions', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim().length > 1) {
      fetchSuggestions(val);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectSuggestion = async (item: PlaceSuggestion) => {
    setIsOpen(false);

    // If item already has non-default coordinates, return immediately
    if (item.lat !== 12.9716 || item.lng !== 77.5946) {
      onChange(item.primaryText, item);
      return;
    }

    // Resolve exact geocode details
    try {
      const res = await apiFetch(`/api/v1/places/autocomplete?placeId=${encodeURIComponent(item.placeId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.location) {
          onChange(item.primaryText, {
            ...item,
            lat: data.location.lat,
            lng: data.location.lng,
            secondaryText: data.location.formattedAddress || item.secondaryText,
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Place details resolution error', e);
    }

    // Coordinates unknown: pass the text only so forms ask for another pick
    onChange(item.primaryText);
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-zinc-700 block">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <MapPin className="w-4 h-4 text-emerald-600" />
        </div>

        <input
          id={inputId}
          type="text"
          required={required}
          value={value}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
            else fetchSuggestions(value);
          }}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 pl-9 pr-8 py-2.5 rounded-xl border border-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white shadow-2xs"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" />}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear location"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg text-xs">
          <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Suggested Tech Parks & Hubs
          </div>
          {suggestions.map((item) => (
            <button
              key={item.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-3 py-2.5 hover:bg-emerald-50/80 flex items-start gap-2.5 border-b border-zinc-100 last:border-b-0 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="font-semibold text-zinc-900 block truncate">
                  {item.primaryText}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate">
                  {item.secondaryText}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
