'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Hospital,
  Loader2,
  Package,
  Pencil,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { isHealthcareStaff } from '@/lib/auth/roles';
import { supabaseClient } from '@/lib/supabase/client';
import type {
  Facility,
  FacilityMedicineInventory,
  Medicine,
} from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type StockFilter = 'all' | 'low' | 'normal';

function formatDateTime(value: string | null) {
  if (!value) return 'Not recorded';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function isLowStock(inventory: FacilityMedicineInventory) {
  return (
    inventory.minimum_stock !== null &&
    inventory.available_quantity <= inventory.minimum_stock
  );
}

function stockLabel(inventory: FacilityMedicineInventory) {
  if (inventory.minimum_stock === null) {
    return 'Threshold unavailable';
  }

  return isLowStock(inventory) ? 'Low stock' : 'Normal stock';
}

function stockClasses(inventory: FacilityMedicineInventory) {
  if (inventory.minimum_stock === null) {
    return 'border-border bg-muted text-muted-foreground';
  }

  return isLowStock(inventory)
    ? 'border-warning/40 bg-warning/10 text-warning-foreground'
    : 'border-success/30 bg-success/10 text-success';
}

function InventoryUpdateForm({
  inventory,
  medicine,
  facilityName,
  saving,
  error,
  onSubmit,
  onCancel,
}: {
  inventory: FacilityMedicineInventory;
  medicine?: Medicine;
  facilityName: string;
  saving: boolean;
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border/70">
        <div>
          <CardTitle className="text-lg">Update quantity</CardTitle>
          <CardDescription className="mt-1">
            {medicine?.name ?? 'Medicine'} at {facilityName}
          </CardDescription>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Close inventory update form"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-5 pt-6">
          {error && (
            <div
              className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inventory-quantity">
              Available quantity
            </Label>

            <Input
              id="inventory-quantity"
              name="available_quantity"
              type="number"
              min="0"
              step="1"
              defaultValue={inventory.available_quantity}
              required
              autoFocus
            />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Updating the available quantity will save the change directly to
            the facility medicine inventory.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save quantity
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}

function InventoryCard({
  inventory,
  medicine,
  facilityName,
  canManage,
  onEdit,
}: {
  inventory: FacilityMedicineInventory;
  medicine?: Medicine;
  facilityName: string;
  canManage: boolean;
  onEdit: (inventory: FacilityMedicineInventory) => void;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-semibold text-foreground">
                {medicine?.name ?? 'Medicine record unavailable'}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {medicine?.manufacturer || 'Manufacturer not provided'}
              </p>
            </div>
          </div>

          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(inventory)}
              aria-label={`Update quantity for ${
                medicine?.name ?? 'medicine'
              }`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-4 border-t border-border/70 pt-4 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Hospital className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{facilityName}</span>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </p>

            <p className="mt-1 text-foreground">
              {medicine?.category || 'Not provided'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Available quantity
            </p>

            <p className="mt-1 text-lg font-bold text-foreground">
              {inventory.available_quantity}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Minimum stock
            </p>

            <p className="mt-1 text-foreground">
              {inventory.minimum_stock ?? 'Not provided'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${stockClasses(
              inventory
            )}`}
          >
            {stockLabel(inventory)}
          </span>

          <span className="text-xs text-muted-foreground">
            Updated {formatDateTime(inventory.last_updated)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MedicinesPage() {
  const { user, role } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [inventory, setInventory] = useState<
    FacilityMedicineInventory[]
  >([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingInventory, setEditingInventory] =
    useState<FacilityMedicineInventory | null>(null);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [stockFilter, setStockFilter] =
    useState<StockFilter>('all');

  const canManage = isHealthcareStaff(role);

  const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const [
      medicineResult,
      inventoryResult,
      facilityResult,
    ] = await Promise.all([
      supabaseClient
        .from('medicines')
        .select('id, name, category, manufacturer, created_at')
        .order('name', { ascending: true }),

      supabaseClient
        .from('facility_medicine_inventory')
        .select(
          'id, facility_id, medicine_id, available_quantity, minimum_stock, last_updated'
        )
        .order('last_updated', { ascending: false }),

      supabaseClient
        .from('facilities')
        .select('*')
        .order('name', { ascending: true }),
    ]);

    const coreFailure =
      medicineResult.error ?? inventoryResult.error;

    if (coreFailure) {
      setError(coreFailure.message);
    } else {
      setMedicines(
        (medicineResult.data ?? []) as Medicine[]
      );

      setInventory(
        (inventoryResult.data ?? []) as FacilityMedicineInventory[]
      );

      setFacilities(
        facilityResult.error
          ? []
          : ((facilityResult.data ?? []) as Facility[])
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      void loadData();
    }
  }, [user]);

  const medicineMap = useMemo(
    () =>
      new Map(
        medicines.map((medicine) => [medicine.id, medicine])
      ),
    [medicines]
  );

  const facilityMap = useMemo(
    () =>
      new Map(
        facilities.map((facility) => [
          facility.id,
          facility.name,
        ])
      ),
    [facilities]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          medicines
            .map((medicine) => medicine.category)
            .filter(
              (category): category is string =>
                Boolean(category)
            )
        )
      ).sort(),
    [medicines]
  );

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const medicine = medicineMap.get(item.medicine_id);
      const query = search.trim().toLowerCase();

      const medicineName =
        medicine?.name?.toLowerCase() ?? '';

      const manufacturer =
        medicine?.manufacturer?.toLowerCase() ?? '';

      const category =
        medicine?.category?.toLowerCase() ?? '';

      const matchesSearch =
        !query ||
        medicineName.includes(query) ||
        manufacturer.includes(query) ||
        category.includes(query);

      const matchesCategory =
        categoryFilter === 'all' ||
        medicine?.category === categoryFilter;

      const matchesFacility =
        facilityFilter === 'all' ||
        item.facility_id === facilityFilter;

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && isLowStock(item)) ||
        (stockFilter === 'normal' &&
          item.minimum_stock !== null &&
          !isLowStock(item));

      return Boolean(
        matchesSearch &&
          matchesCategory &&
          matchesFacility &&
          matchesStock
      );
    });
  }, [
    categoryFilter,
    facilityFilter,
    inventory,
    medicineMap,
    search,
    stockFilter,
  ]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setFacilityFilter('all');
    setStockFilter('all');
  };

  const updateQuantity = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingInventory || !user || !canManage) {
      return;
    }

    setSaving(true);
    setFormError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);

    const rawQuantity = String(
      formData.get('available_quantity') ?? ''
    ).trim();

    const quantity = Number(rawQuantity);

    if (
      !rawQuantity ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      setFormError(
        'Quantity must be a valid non-negative whole number.'
      );
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabaseClient
      .from('facility_medicine_inventory')
      .update({
        available_quantity: quantity,
        last_updated: new Date().toISOString(),
      })
      .eq('id', editingInventory.id);

    if (updateError) {
      setFormError(
        `Unable to update inventory: ${updateError.message}`
      );
    } else {
      setNotice(
        'Inventory quantity updated successfully.'
      );

      setEditingInventory(null);

      await loadData();
    }

    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Facility coordination
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Medicine Inventory
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review medicine availability across facilities using
            the inventory records available to your account.
          </p>
        </div>

        {!canManage && (
          <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Read-only access
          </div>
        )}
      </div>

      {notice && (
        <div
          className="mb-6 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,25rem)]">
        <section className="min-w-0 space-y-5">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search medicine"
                  className="pl-9"
                  aria-label="Search medicines"
                />
              </div>

              <select
                value={facilityFilter}
                onChange={(event) =>
                  setFacilityFilter(event.target.value)
                }
                className={selectClass}
                aria-label="Filter by facility"
              >
                <option value="all">All facilities</option>

                {facilities.map((facility) => (
                  <option
                    key={facility.id}
                    value={facility.id}
                  >
                    {facility.name}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                className={selectClass}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  value={stockFilter}
                  onChange={(event) =>
                    setStockFilter(
                      event.target.value as StockFilter
                    )
                  }
                  className={selectClass}
                  aria-label="Filter by stock level"
                >
                  <option value="all">
                    All stock states
                  </option>

                  <option value="low">Low stock</option>

                  <option value="normal">
                    Normal stock
                  </option>
                </select>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetFilters}
                  aria-label="Clear inventory filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to load medicine inventory
                </p>

                <p className="mt-1">{error}</p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadData()}
                  className="mt-3"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Inventory records
            </h2>

            <p className="text-sm text-muted-foreground">
              {loading
                ? 'Loading records...'
                : `${filteredInventory.length} record${
                    filteredInventory.length === 1
                      ? ''
                      : 's'
                  } shown`}
            </p>
          </div>

          {loading && !error && (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-border/70 bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />

              <span className="ml-2 text-sm text-muted-foreground">
                Loading medicine inventory...
              </span>
            </div>
          )}

          {!loading &&
            !error &&
            filteredInventory.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center">
                <Package className="h-8 w-8 text-muted-foreground/60" />

                <h3 className="mt-3 font-semibold text-foreground">
                  No inventory records found
                </h3>

                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {search ||
                  categoryFilter !== 'all' ||
                  facilityFilter !== 'all' ||
                  stockFilter !== 'all'
                    ? 'Try clearing or changing the filters.'
                    : 'Medicine inventory available to your account will appear here.'}
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredInventory.length > 0 && (
              <div className="space-y-4">
                {filteredInventory.map((item) => (
                  <InventoryCard
                    key={item.id}
                    inventory={item}
                    medicine={medicineMap.get(
                      item.medicine_id
                    )}
                    facilityName={
                      facilityMap.get(item.facility_id) ??
                      'Facility unavailable'
                    }
                    canManage={canManage}
                    onEdit={(selected) => {
                      setFormError(null);
                      setNotice(null);
                      setEditingInventory(selected);
                    }}
                  />
                ))}
              </div>
            )}
        </section>

        <aside>
          {editingInventory && canManage && (
            <InventoryUpdateForm
              inventory={editingInventory}
              medicine={medicineMap.get(
                editingInventory.medicine_id
              )}
              facilityName={
                facilityMap.get(
                  editingInventory.facility_id
                ) ?? 'Facility unavailable'
              }
              saving={saving}
              error={formError}
              onSubmit={updateQuantity}
              onCancel={() => {
                if (!saving) {
                  setEditingInventory(null);
                  setFormError(null);
                }
              }}
            />
          )}

          {!editingInventory && canManage && (
            <Card className="hidden border-dashed border-border/80 bg-card/50 lg:block">
              <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                <Package className="h-8 w-8 text-primary/70" />

                <h2 className="mt-4 font-semibold text-foreground">
                  Inventory control
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Authorized healthcare management users can
                  update available quantities. Changes are saved
                  directly to the existing inventory records.
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}