'use client';

import React, { useState } from 'react';
import { Car, Plus } from 'lucide-react';
import { apiErrorMessage, apiFetch } from '@/lib/api-client';
import { validateIndianRegistration } from '@/lib/utils/indian-vehicle';
import { Vehicle } from '@/types';

interface VehiclesSectionProps {
  vehicles: Vehicle[];
  onAdded: () => Promise<void>;
  notify: (type: 'success' | 'error', text: string) => void;
}

const inputClass = 'w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none';

/**
 * Registered vehicles and the add-vehicle form. Rendered inside the profile
 * form, so its controls are plain buttons rather than a nested <form>.
 */
export function VehiclesSection({ vehicles, onAdded, notify }: VehiclesSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<'CAR' | 'TWO_WHEELER'>('CAR');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [registration, setRegistration] = useState('');
  const [capacity, setCapacity] = useState(3);
  const [mileage, setMileage] = useState('15');
  const [saving, setSaving] = useState(false);

  const addVehicle = async () => {
    if (!make.trim() || !model.trim() || !registration.trim()) {
      notify('error', 'Please fill in make, model and registration number.');
      return;
    }
    const regCheck = validateIndianRegistration(registration);
    if (!regCheck.isValid) {
      notify('error', regCheck.error || 'Please enter a valid Indian vehicle number (e.g. KA-04-MB-1234).');
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/v1/user/vehicles', {
        json: {
          type,
          make: make.trim(),
          model: model.trim(),
          color: color.trim() || undefined,
          registrationNumber: registration.toUpperCase(),
          capacity: type === 'TWO_WHEELER' ? 1 : capacity,
          mileageKmPerLitre: mileage ? Number(mileage) : undefined,
        },
      });
      if (!res.ok) {
        notify('error', await apiErrorMessage(res, 'Failed to add vehicle'));
        return;
      }
      setShowAdd(false);
      setMake('');
      setModel('');
      setColor('');
      setRegistration('');
      await onAdded();
      notify('success', 'Vehicle registered successfully!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="vehicles-heading"
      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="vehicles-heading" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Registered Vehicles
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Required to offer rides (cars and 2-wheelers)</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          aria-expanded={showAdd}
          className="py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <Car className="w-6 h-6 text-slate-500 mx-auto mb-1" aria-hidden="true" />
          <p className="text-xs font-bold text-slate-700">No vehicles added</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Add your car or bike to offer rides to fellow residents.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {vehicles.map((v) => (
            <li key={v.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs"
                  aria-hidden="true"
                >
                  {v.type === 'TWO_WHEELER' ? '🛵' : '🚗'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {[v.color, v.make, v.model].filter(Boolean).join(' ')}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-500">
                    {v.registrationNumber} · {v.capacity} seat{v.capacity > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <fieldset className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
          <legend className="text-xs font-bold text-emerald-950 px-1">New Vehicle Details</legend>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold" role="group" aria-label="Vehicle type">
            {(
              [
                ['CAR', '🚗 Car / 4-Wheeler', 3],
                ['TWO_WHEELER', '🛵 2-Wheeler / Bike', 1],
              ] as const
            ).map(([value, label, seats]) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => {
                  setType(value);
                  setCapacity(seats);
                }}
                className={`py-2 px-2 rounded-lg border text-center cursor-pointer transition-all ${
                  type === value ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-emerald-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-600">
              Make
              <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Hyundai" className={`${inputClass} mt-1`} />
            </label>
            <label className="text-[10px] font-bold text-slate-600">
              Model
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Creta" className={`${inputClass} mt-1`} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-600">
              Registration number
              <input
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                placeholder="KA-04-MB-1234"
                className={`${inputClass} mt-1 font-mono font-bold uppercase`}
              />
            </label>
            <label className="text-[10px] font-bold text-slate-600">
              Colour
              <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. White" className={`${inputClass} mt-1`} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold text-slate-600">
              Seats for residents
              <select
                value={type === 'TWO_WHEELER' ? 1 : capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                disabled={type === 'TWO_WHEELER'}
                className={`${inputClass} mt-1`}
              >
                {type === 'TWO_WHEELER' ? (
                  <option value={1}>1 pillion seat</option>
                ) : (
                  [1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} seat{n > 1 ? 's' : ''}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-600">
              Fuel mileage (km/L)
              <input
                type="number"
                min="5"
                max="60"
                step="0.5"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addVehicle}
              disabled={saving}
              className="flex-1 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 shadow-2xs disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Vehicle'}
            </button>
          </div>
        </fieldset>
      )}
    </section>
  );
}
