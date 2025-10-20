'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, X } from 'lucide-react';

export interface FilterConfig {
  status?: string;
  bookingCountMin?: number;
  bookingCountMax?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  motStatus?: string;
  yearMin?: number;
  yearMax?: number;
  make?: string;
}

interface FilterOption {
  label: string;
  value: string;
}

interface AdvancedFilterPanelProps {
  type: 'customers' | 'vehicles';
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  onClearFilters: () => void;
  statusOptions?: FilterOption[];
  motStatusOptions?: FilterOption[];
  makeOptions?: FilterOption[];
  sortOptions: FilterOption[];
}

export function AdvancedFilterPanel({
  type,
  filters,
  onFiltersChange,
  onClearFilters,
  statusOptions = [],
  motStatusOptions = [],
  makeOptions = [],
  sortOptions,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (value: string) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleMotStatusChange = (value: string) => {
    onFiltersChange({ ...filters, motStatus: value });
  };

  const handleBookingCountChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, bookingCountMin: min, bookingCountMax: max });
  };

  const handleDateChange = (from: string, to: string) => {
    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
  };

  const handleYearChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, yearMin: min, yearMax: max });
  };

  const handleMakeChange = (value: string) => {
    onFiltersChange({ ...filters, make: value });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== null && v !== '').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-destructive hover:text-destructive"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Filter (Customers) */}
              {type === 'customers' && statusOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  >
                    <option value="">All</option>
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* MOT Status Filter (Vehicles) */}
              {type === 'vehicles' && motStatusOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">MOT Status</label>
                  <select
                    value={filters.motStatus || ''}
                    onChange={(e) => handleMotStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  >
                    <option value="">All</option>
                    {motStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Make Filter (Vehicles) */}
              {type === 'vehicles' && makeOptions.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Make</label>
                  <select
                    value={filters.make || ''}
                    onChange={(e) => handleMakeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  >
                    <option value="">All</option>
                    {makeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Booking Count Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Bookings (Min - Max)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.bookingCountMin || ''}
                    onChange={(e) => handleBookingCountChange(
                      parseInt(e.target.value) || 0,
                      filters.bookingCountMax || 999
                    )}
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.bookingCountMax || ''}
                    onChange={(e) => handleBookingCountChange(
                      filters.bookingCountMin || 0,
                      parseInt(e.target.value) || 999
                    )}
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Year Range (Vehicles) */}
              {type === 'vehicles' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Year (Min - Max)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.yearMin || ''}
                      onChange={(e) => handleYearChange(
                        parseInt(e.target.value) || 1900,
                        filters.yearMax || new Date().getFullYear()
                      )}
                      className="w-1/2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.yearMax || ''}
                      onChange={(e) => handleYearChange(
                        filters.yearMin || 1900,
                        parseInt(e.target.value) || new Date().getFullYear()
                      )}
                      className="w-1/2"
                    />
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date (From - To)</label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => handleDateChange(e.target.value, filters.dateTo || '')}
                    className="w-1/2"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => handleDateChange(filters.dateFrom || '', e.target.value)}
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <select
                  value={filters.sortBy || ''}
                  onChange={(e) => handleSortChange(e.target.value, filters.sortOrder || 'asc')}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                >
                  <option value="">Default</option>
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <select
                  value={filters.sortOrder || 'asc'}
                  onChange={(e) => handleSortChange(filters.sortBy || '', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm"
                >
                  <option value="asc">Ascending (A-Z)</option>
                  <option value="desc">Descending (Z-A)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleStatusChange('')} />
            </Badge>
          )}
          {filters.motStatus && (
            <Badge variant="secondary" className="flex items-center gap-1">
              MOT: {filters.motStatus}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleMotStatusChange('')} />
            </Badge>
          )}
          {filters.make && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Make: {filters.make}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleMakeChange('')} />
            </Badge>
          )}
          {(filters.bookingCountMin || filters.bookingCountMax) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Bookings: {filters.bookingCountMin || 0}-{filters.bookingCountMax || '∞'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleBookingCountChange(0, 999)} />
            </Badge>
          )}
          {(filters.yearMin || filters.yearMax) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Year: {filters.yearMin || 1900}-{filters.yearMax || new Date().getFullYear()}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleYearChange(1900, new Date().getFullYear())} />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date: {filters.dateFrom || '?'} - {filters.dateTo || '?'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleDateChange('', '')} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

