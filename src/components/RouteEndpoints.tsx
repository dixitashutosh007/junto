'use client';

import { ArrowUpDown, Building2 } from 'lucide-react';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';
import { PlaceSuggestion } from '@/lib/services/places-data';
import { CommuteDirection } from '@/types';

/** One end of a trip: the resident's society, or a place picked from suggestions */
export type RouteEndpoint =
  | { kind: 'SOCIETY' }
  | { kind: 'PLACE'; name: string; place: PlaceSuggestion | null };

export const SOCIETY_ENDPOINT: RouteEndpoint = { kind: 'SOCIETY' };
export const EMPTY_PLACE: RouteEndpoint = { kind: 'PLACE', name: '', place: null };

/** Trips that end at the society are return trips */
export function routeDirection(to: RouteEndpoint): CommuteDirection {
  return to.kind === 'SOCIETY' ? 'INBOUND_SOCIETY' : 'OUTBOUND_SOCIETY';
}

interface RouteEndpointsProps {
  societyName: string;
  from: RouteEndpoint;
  to: RouteEndpoint;
  onChange: (from: RouteEndpoint, to: RouteEndpoint) => void;
  /** Whether a place must be filled in (offering a ride, not searching) */
  required?: boolean;
}

/**
 * "From" and "To" fields for a trip. The society is the default start; either
 * end can be changed to another place, and the arrow swaps them for the trip
 * back to the society.
 */
export function RouteEndpoints({ societyName, from, to, onChange, required = false }: RouteEndpointsProps) {
  return (
    <div className="relative space-y-2">
      <EndpointField
        label="From"
        societyName={societyName}
        endpoint={from}
        onChange={(next) => onChange(next, to)}
        required={required}
        // Only one end can be the society
        canUseSociety={to.kind !== 'SOCIETY'}
      />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onChange(to, from)}
          aria-label="Swap start and destination"
          title="Swap start and destination"
          className="p-2 rounded-full bg-white border border-zinc-300 text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-95 transition-all"
        >
          <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <EndpointField
        label="To"
        societyName={societyName}
        endpoint={to}
        onChange={(next) => onChange(from, next)}
        required={required}
        canUseSociety={from.kind !== 'SOCIETY'}
      />
    </div>
  );
}

interface EndpointFieldProps {
  label: string;
  societyName: string;
  endpoint: RouteEndpoint;
  onChange: (endpoint: RouteEndpoint) => void;
  canUseSociety: boolean;
  required: boolean;
}

function EndpointField({ label, societyName, endpoint, onChange, canUseSociety, required }: EndpointFieldProps) {
  if (endpoint.kind === 'SOCIETY') {
    return (
      <div>
        <span className="text-xs font-semibold text-zinc-700 block mb-1">{label}</span>
        <div className="flex items-center gap-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span className="flex-1 font-semibold text-zinc-800 truncate">{societyName}</span>
          <button
            type="button"
            onClick={() => onChange(EMPTY_PLACE)}
            aria-label={`Change ${label.toLowerCase()} location`}
            className="px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-100"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <PlacesAutocompleteInput
        value={endpoint.name}
        onChange={(name, place) => onChange({ kind: 'PLACE', name, place: place ?? null })}
        placeholder="Search tech park, office or metro..."
        label={label}
        required={required}
      />
      {canUseSociety && (
        <button
          type="button"
          onClick={() => onChange(SOCIETY_ENDPOINT)}
          className="text-[11px] font-semibold text-emerald-700 hover:underline"
        >
          Use {societyName} instead
        </button>
      )}
    </div>
  );
}
