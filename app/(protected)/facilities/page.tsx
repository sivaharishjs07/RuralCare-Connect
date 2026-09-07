'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import type { Facility } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function displayValue(value: string | null, fallback = 'Not provided') {
  return value?.trim() || fallback;
}

function formatType(type: Facility['type']) {
  if (!type) return 'Type not provided';
  return type.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function FacilityCard({ facility }: { facility: Facility }) {
  const hasCoordinates = facility.latitude !== null && facility.longitude !== null;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-foreground">{facility.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{formatType(facility.type)}</p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 border-t border-border/70 pt-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><dt className="text-xs font-medium uppercase tracking-wide">Location</dt><dd className="mt-1 text-foreground">{displayValue(facility.district)}{facility.region ? `, ${facility.region}` : ''}</dd></div>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><dt className="text-xs font-medium uppercase tracking-wide">Phone</dt><dd className="mt-1 break-words text-foreground">{displayValue(facility.phone)}</dd></div>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div><dt className="text-xs font-medium uppercase tracking-wide">Email</dt><dd className="mt-1 break-words text-foreground">{displayValue(facility.email)}</dd></div>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          {hasCoordinates ? <span>Coordinates: {facility.latitude}, {facility.longitude}</span> : <span>Coordinates not provided</span>}
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Updated {formatDate(facility.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const loadFacilities = async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabaseClient.from('facilities').select('*').order('name', { ascending: true });
    if (queryError) {
      setError(queryError.message);
      setFacilities([]);
    } else {
      setFacilities((data ?? []) as Facility[]);
    }
    setLoading(false);
  };

  useEffect(() => { void loadFacilities(); }, []);

  const types = useMemo(() => Array.from(new Set(facilities.map((facility) => facility.type).filter((type): type is Exclude<Facility['type'], null> => Boolean(type)))).sort(), [facilities]);
  const regions = useMemo(() => Array.from(new Set(facilities.map((facility) => facility.region).filter((region): region is string => Boolean(region)))).sort(), [facilities]);
  const filteredFacilities = useMemo(() => facilities.filter((facility) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || facility.name.toLowerCase().includes(query) || facility.district?.toLowerCase().includes(query) || facility.region?.toLowerCase().includes(query);
    return Boolean(matchesSearch && (typeFilter === 'all' || facility.type === typeFilter) && (regionFilter === 'all' || facility.region === regionFilter));
  }), [facilities, regionFilter, search, typeFilter]);

  const resetFilters = () => { setSearch(''); setTypeFilter('all'); setRegionFilter('all'); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">Care network</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Facility Directory</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Browse healthcare facilities available through your account.</p>
      </div>

      <Card className="mb-6"><CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search facilities" className="pl-9" aria-label="Search facilities" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by facility type"><option value="all">All types</option>{types.map((type) => <option key={type} value={type}>{formatType(type)}</option>)}</select></div><select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" aria-label="Filter by region"><option value="all">All regions</option>{regions.map((region) => <option key={region} value={region}>{region}</option>)}</select><Button type="button" variant="ghost" size="icon" onClick={resetFilters} aria-label="Clear facility filters"><X className="h-4 w-4" /></Button></CardContent></Card>

      {error && <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Unable to load facilities</p><p className="mt-1">{error}</p><Button type="button" variant="outline" size="sm" onClick={() => void loadFacilities()} className="mt-3">Try again</Button></div></div>}
      <div className="mb-4"><h2 className="text-lg font-semibold text-foreground">Available facilities</h2><p className="text-sm text-muted-foreground">{loading ? 'Loading facilities...' : `${filteredFacilities.length} facilit${filteredFacilities.length === 1 ? 'y' : 'ies'} shown`}</p></div>
      {loading && <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card"><Building2 className="h-6 w-6 animate-pulse text-primary" /><span className="ml-2 text-sm text-muted-foreground">Loading facility directory...</span></div>}
      {!loading && !error && filteredFacilities.length === 0 && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center"><Building2 className="h-8 w-8 text-muted-foreground/60" /><h3 className="mt-3 font-semibold text-foreground">{search || typeFilter !== 'all' || regionFilter !== 'all' ? 'No matching facilities' : 'No facilities available'}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{search || typeFilter !== 'all' || regionFilter !== 'all' ? 'Try clearing or changing the filters.' : 'Facility records available to your account will appear here.'}</p></div>}
      {!loading && !error && filteredFacilities.length > 0 && <div className="grid gap-4 md:grid-cols-2">{filteredFacilities.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}</div>}
    </div>
  );
}