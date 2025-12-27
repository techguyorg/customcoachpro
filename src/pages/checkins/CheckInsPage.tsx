import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Scale,
  Camera,
  Dumbbell,
  Utensils,
  Eye,
  Search,
  Filter,
  CalendarRange,
  SortDesc,
  CheckSquare,
  NotebookPen,
  Sparkles,
  Image,
} from 'lucide-react';
import { format, endOfDay, startOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import checkInService, { CheckIn } from '@/services/checkInService';
import { iconTokens, type IconToken } from '@/config/iconTokens';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import checkInService, { CheckIn, CheckInStatus, CheckInType } from '@/services/checkInService';

const typeIcons: Record<CheckInType, typeof Scale> = {
  weight: Scale,
  photos: Camera,
  workout: Dumbbell,
  diet: Utensils,
} as const;

const typeIconTones: Record<CheckIn['type'], IconToken> = {
  weight: 'analytics',
  photos: 'analytics',
  workout: 'workout',
  diet: 'diet',
};

const typeLabels: Record<CheckInType, string> = {
  weight: 'Weight & Measurements',
  photos: 'Progress Photos',
  workout: 'Workout Completion',
  diet: 'Diet Compliance',
};

export function CheckInsPage() {
  const [activeTab, setActiveTab] = useState<CheckInStatus>('pending');
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<CheckInType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CheckInStatus | 'all'>('pending');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'client' | 'type'>('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['check-ins', 'pending'],
    queryFn: () => checkInService.getCheckIns({ status: 'pending' }),
  });

  const reviewedQuery = useQuery({
    queryKey: ['check-ins', 'reviewed'],
    queryFn: () => checkInService.getCheckIns({ status: 'reviewed' }),
  });

  const activeQuery = activeTab === 'pending' ? pendingQuery : reviewedQuery;

  const pendingCheckIns = pendingQuery.data ?? [];
  const reviewedCheckIns = reviewedQuery.data ?? [];
  const allCheckIns = useMemo(
    () => [...(pendingQuery.data ?? []), ...(reviewedQuery.data ?? [])],
    [pendingQuery.data, reviewedQuery.data],
  );

  const reviewMutation = useMutation({
    mutationFn: (id: string) => checkInService.markReviewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      setSelectedCheckInId(null);
      toast({
        title: 'Check-in reviewed',
        description: 'The client has been notified.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Unable to review check-in',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const bulkReviewMutation = useMutation({
    mutationFn: (ids: string[]) => checkInService.markReviewedBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      setSelectedIds([]);
      toast({
        title: 'Marked as reviewed',
        description: 'Selected check-ins were marked as reviewed.',
      });
    },
    onError: (err) => {
      toast({
        title: 'Bulk review failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const requestUpdateMutation = useMutation({
    mutationFn: ({ ids, message }: { ids: string[]; message?: string }) =>
      checkInService.requestUpdate(ids, message),
    onSuccess: () => {
      toast({
        title: 'Update requested',
        description: 'Clients will be asked for more details.',
      });
      setSelectedIds([]);
    },
    onError: (err) => {
      toast({
        title: 'Request failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const selectedCheckIn = useMemo(
    () => allCheckIns.find((c) => c.id === selectedCheckInId) ?? null,
    [allCheckIns, selectedCheckInId],
  );

  const clients = useMemo(() => {
    const unique = new Map<string, string>();
    checkIns.forEach((checkIn) => {
      unique.set(checkIn.clientId, checkIn.clientName);
    });
    return Array.from(unique.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [checkIns]);

  const baseFilteredCheckIns = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return checkIns.filter((checkIn) => {
      if (typeFilter !== 'all' && checkIn.type !== typeFilter) return false;
      if (clientFilter !== 'all' && checkIn.clientId !== clientFilter) return false;

      if (dateRange?.from && new Date(checkIn.submittedAt) < startOfDay(dateRange.from)) {
        return false;
      }
      if (dateRange?.to && new Date(checkIn.submittedAt) > endOfDay(dateRange.to)) {
        return false;
      }

      if (normalizedSearch) {
        const haystack = `${checkIn.clientName} ${typeLabels[checkIn.type]} ${checkIn.notes ?? ''} ${checkIn.data.workoutNotes ?? ''}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [checkIns, clientFilter, dateRange, searchTerm, typeFilter]);

  const statusCounts = useMemo(
    () =>
      baseFilteredCheckIns.reduce(
        (acc, checkIn) => {
          acc[checkIn.status] += 1;
          return acc;
        },
        { pending: 0, reviewed: 0 } satisfies Record<CheckInStatus, number>,
      ),
    [baseFilteredCheckIns],
  );

  const applySort = useCallback((list: CheckIn[]) => {
    const sorted = [...list];
    switch (sortOption) {
      case 'oldest':
        return sorted.sort(
          (a, b) =>
            new Date(a.submittedAt).getTime() -
            new Date(b.submittedAt).getTime(),
        );
      case 'client':
        return sorted.sort((a, b) => a.clientName.localeCompare(b.clientName));
      case 'type':
        return sorted.sort((a, b) => typeLabels[a.type].localeCompare(typeLabels[b.type]));
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        );
    }
  }, [sortOption]);

  const filteredByStatus = useMemo(
    () => ({
      pending: applySort(baseFilteredCheckIns.filter((c) => c.status === 'pending')),
      reviewed: applySort(baseFilteredCheckIns.filter((c) => c.status === 'reviewed')),
      all: applySort(baseFilteredCheckIns),
    }),
    [applySort, baseFilteredCheckIns],
  );

  const displayedCheckIns =
    filteredByStatus[statusFilter === 'pending' || statusFilter === 'reviewed' ? statusFilter : 'all'];

  const weightDeltaById = useMemo(() => {
    const grouped: Record<string, CheckIn[]> = {};
    checkIns
      .filter((c) => c.type === 'weight')
      .forEach((checkIn) => {
        grouped[checkIn.clientId] = grouped[checkIn.clientId] ?? [];
        grouped[checkIn.clientId].push(checkIn);
      });

    const deltas: Record<string, number | null> = {};

    Object.values(grouped).forEach((list) => {
      const sorted = [...list].sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      );

      sorted.forEach((item, idx) => {
        const previous = sorted[idx - 1];
        if (
          previous &&
          item.data.weight !== undefined &&
          previous.data.weight !== undefined
        ) {
          deltas[item.id] = Number((item.data.weight - previous.data.weight).toFixed(1));
        } else {
          deltas[item.id] = null;
        }
      });
    });

    return deltas;
  }, [checkIns]);

  const pendingTotal = useMemo(
    () => checkIns.filter((checkIn) => checkIn.status === 'pending').length,
    [checkIns],
  );

  useEffect(() => {
    setSelectedIds((ids) => ids.filter((id) => displayedCheckIns.some((c) => c.id === id)));
  }, [displayedCheckIns]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (displayedCheckIns.length === 0) return;
    const visibleIds = displayedCheckIns.map((c) => c.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : visibleIds);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setClientFilter('all');
    setDateRange(undefined);
    setStatusFilter('pending');
  };

  const CheckInCard = ({ checkIn }: { checkIn: CheckIn }) => {
    const Icon = typeIcons[checkIn.type];
    const tone = iconTokens[typeIconTones[checkIn.type]];
    const weightDelta = weightDeltaById[checkIn.id];
    const photos = checkIn.data.photos ?? {};
    const notePreview = checkIn.notes ?? checkIn.data.workoutNotes ?? '';

    const renderHighlights = () => {
      switch (checkIn.type) {
        case 'weight':
          return (
            <>
              <Badge variant="secondary" className="capitalize">
                Weight: {checkIn.data.weight ? `${checkIn.data.weight} lbs` : '—'}
              </Badge>
              {checkIn.data.bodyFat !== undefined && (
                <Badge variant="outline">Body Fat: {checkIn.data.bodyFat}%</Badge>
              )}
              <Badge
                className={cn(
                  'border-0',
                  weightDelta === null
                    ? 'bg-muted text-foreground'
                    : weightDelta !== undefined && weightDelta > 0
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-vitality/20 text-vitality',
                )}
              >
                {weightDelta === null
                  ? 'First entry'
                  : weightDelta === undefined
                    ? '—'
                    : `${weightDelta > 0 ? '+' : ''}${weightDelta} lbs since last`}
              </Badge>
            </>
          );
        case 'diet':
          return (
            <>
              <Badge className="bg-primary/10 text-primary border-0">
                Compliance: {checkIn.data.complianceRating ?? '—'}/10
              </Badge>
              {checkIn.data.deviations && (
                <Badge variant="outline">Deviations logged</Badge>
              )}
            </>
          );
        case 'workout':
          return (
            <>
              <Badge
                className={
                  checkIn.data.completed ? 'bg-vitality/20 text-vitality border-0' : 'bg-destructive/15 text-destructive border-0'
                }
              >
                {checkIn.data.completed ? 'Completed' : 'Not completed'}
              </Badge>
              {checkIn.data.workoutNotes && (
                <Badge variant="outline">Notes attached</Badge>
              )}
            </>
          );
        case 'photos':
          return (
            <>
              <Badge variant="secondary">Photos: {Object.values(photos).filter(Boolean).length}/3</Badge>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow border',
          selectedIds.includes(checkIn.id) && 'ring-2 ring-primary border-primary/30',
        )}
        onClick={() => setSelectedCheckInId(checkIn.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", tone.background)}>
                <Icon className={cn("h-5 w-5", tone.icon)} />
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedIds.includes(checkIn.id)}
                onCheckedChange={() => toggleSelect(checkIn.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{typeLabels[checkIn.type]}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={checkIn.clientAvatar ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {checkIn.clientName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {checkIn.clientName}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge
                className={
                  checkIn.status === 'pending'
                    ? 'bg-icon-warning/15 text-icon-warning border-0'
                    : 'bg-icon-success/15 text-icon-success border-0'
                }
              >
                {checkIn.status}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {format(new Date(checkIn.submittedAt), 'PP')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">{renderHighlights()}</div>

          {notePreview && (
            <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2">
              <NotebookPen className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground line-clamp-2">{notePreview}</p>
            </div>
          )}

          {checkIn.type === 'photos' && (
            <div className="flex gap-2">
              {(['front', 'side', 'back'] as const).map((angle) => (
                <div
                  key={angle}
                  className="h-14 w-12 rounded-md border bg-muted overflow-hidden flex items-center justify-center"
                >
                  {photos[angle] ? (
                    <img
                      src={photos[angle] ?? undefined}
                      alt={`${angle} thumbnail`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[10px] text-muted-foreground">
                      <Image className="h-4 w-4 mb-1" />
                      <span className="capitalize">{angle}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCheckInDetails = () => {
    if (!selectedCheckIn) return null;
    const weightDelta = weightDeltaById[selectedCheckIn.id];
    const sharedNotes = selectedCheckIn.notes ?? null;

    switch (selectedCheckIn.type) {
      case 'weight':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="text-2xl font-bold">
                  {selectedCheckIn.data.weight ?? '—'} {selectedCheckIn.data.weight ? 'lbs' : ''}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Body Fat</p>
                <p className="text-2xl font-bold">
                  {selectedCheckIn.data.bodyFat ?? '—'}
                  {selectedCheckIn.data.bodyFat ? '%' : ''}
                </p>
              </div>
              {(selectedCheckIn.data.waist ?? selectedCheckIn.data.chest ?? selectedCheckIn.data.arms ?? selectedCheckIn.data.thighs) && (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">Waist</p>
                  <p className="text-2xl font-bold">
                    {selectedCheckIn.data.waist ?? '—'}
                    {selectedCheckIn.data.waist ? '"' : ''}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Change vs last check-in</p>
                <p
                  className={cn(
                    'text-xl font-semibold',
                    weightDelta !== undefined && weightDelta > 0
                      ? 'text-destructive'
                      : 'text-vitality',
                  )}
                >
                  {weightDelta === null
                    ? 'First entry'
                    : weightDelta === undefined
                      ? '—'
                      : `${weightDelta > 0 ? '+' : ''}${weightDelta} lbs`}
                </p>
              </div>
              {sharedNotes && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p>{sharedNotes}</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'workout':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge className={selectedCheckIn.data.completed ? 'bg-icon-success/15 text-icon-success' : 'bg-destructive/20 text-destructive'}>
                {selectedCheckIn.data.completed ? 'Completed' : 'Not Completed'}
              </Badge>
            </div>
            {(selectedCheckIn.data.workoutNotes || selectedCheckIn.notes) && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p>{selectedCheckIn.data.workoutNotes ?? selectedCheckIn.notes}</p>
              </div>
            )}
          </div>
        );
      case 'diet':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted text-center">
              <p className="text-sm text-muted-foreground">Compliance Rating</p>
              <p className="text-4xl font-bold text-primary">
                {selectedCheckIn.data.complianceRating ?? '—'}
                {selectedCheckIn.data.complianceRating ? '/10' : ''}
              </p>
            </div>
            {selectedCheckIn.data.deviations && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Deviations</p>
                <p>{String(selectedCheckIn.data.deviations)}</p>
              </div>
            )}
            {sharedNotes && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p>{sharedNotes}</p>
              </div>
            )}
          </div>
        );
      case 'photos': {
        const photos = selectedCheckIn.data.photos ?? {};
        return (
          <div className="space-y-4">
      case 'photos':
        {
          const photos = selectedCheckIn.data.photos ?? {};
          return (
            <div className="grid grid-cols-3 gap-4">
              {(['front', 'side', 'back'] as const).map((angle) => (
                <div
                  key={angle}
                  className="aspect-[3/4] rounded-lg bg-muted flex items-center justify-center overflow-hidden"
                >
                  {photos[angle] ? (
                    <img
                      src={photos[angle] ?? undefined}
                      alt={`${angle} progress`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Camera className="h-8 w-8 text-icon-analytics" />
                      <Camera className="h-8 w-8" />
                      <span className="text-xs capitalize">{angle}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {sharedNotes && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p>{sharedNotes}</p>
              </div>
            )}
          </div>
        );
      }
          );
        }
      default:
        return null;
    }
  };

  const renderCheckInGrid = (items: CheckIn[], status: 'pending' | 'reviewed' | 'all') => {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20 ml-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      const messages: Record<'pending' | 'reviewed' | 'all', string> = {
        pending: 'No pending check-ins match your filters.',
        reviewed: 'No reviewed check-ins match your filters.',
        all: 'No check-ins found for these filters.',
      };

      return (
        <div className="text-center py-12 text-muted-foreground">
          {messages[status]}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((checkIn) => (
          <CheckInCard key={checkIn.id} checkIn={checkIn} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Check-ins"
        description="Review and manage client check-ins"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-icon-warning border-icon-warning">
              {pendingCheckIns.length} pending
            <Badge variant="outline" className="text-energy border-energy">
              {pendingTotal} pending
            </Badge>
          </div>
        }
      />

      {activeQuery.isError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-destructive">
          {activeQuery.error instanceof Error
            ? activeQuery.error.message
            : 'Unable to load check-ins right now.'}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => activeQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative w-full sm:w-64">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client, notes, or type"
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as CheckInStatus | 'all');
                setSelectedIds([]);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as CheckInType | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="weight">Weight & Measurements</SelectItem>
                <SelectItem value="photos">Progress Photos</SelectItem>
                <SelectItem value="workout">Workout Completion</SelectItem>
                <SelectItem value="diet">Diet Compliance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={clientFilter} onValueChange={(value) => setClientFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start sm:w-52',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarRange className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select
              value={sortOption}
              onValueChange={(value) =>
                setSortOption(value as 'newest' | 'oldest' | 'client' | 'type')
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="client">Client name</SelectItem>
                <SelectItem value="type">Check-in type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {baseFilteredCheckIns.length} matching
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ClipboardCheck className="h-3 w-3" />
              Pending: {statusCounts.pending}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Reviewed: {statusCounts.reviewed}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={displayedCheckIns.length === 0}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {selectedIds.length === displayedCheckIns.length && selectedIds.length > 0
                ? 'Clear selection'
                : 'Select all'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedIds.length || bulkReviewMutation.isPending}
              onClick={() => bulkReviewMutation.mutate(selectedIds)}
            >
              {bulkReviewMutation.isPending ? 'Marking...' : 'Mark reviewed'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedIds.length || requestUpdateMutation.isPending}
              onClick={() =>
                requestUpdateMutation.mutate({
                  ids: selectedIds,
                  message: 'Please refresh this check-in with updated details.',
                })
              }
            >
              <NotebookPen className="mr-2 h-4 w-4" />
              {requestUpdateMutation.isPending ? 'Requesting...' : 'Request update'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={statusFilter === 'pending' || statusFilter === 'reviewed' ? statusFilter : 'all'}
        onValueChange={(value) => {
          setStatusFilter(value as CheckInStatus | 'all');
          setSelectedIds([]);
        }}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CheckInStatus)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-icon-warning" />
            Pending ({pendingCheckIns.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-icon-success" />
            Reviewed ({reviewedCheckIns.length})
            <ClipboardCheck className="h-4 w-4" />
            Pending ({statusCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reviewed ({statusCounts.reviewed})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <SortDesc className="h-4 w-4" />
            All ({baseFilteredCheckIns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {renderCheckInGrid(filteredByStatus.pending, 'pending')}
          {pendingQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingCheckIns.map((checkIn) => (
                  <CheckInCard key={checkIn.id} checkIn={checkIn} />
                ))}
              </div>
              {pendingCheckIns.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No pending check-ins. You're all caught up!
                </div>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="reviewed">
          {renderCheckInGrid(filteredByStatus.reviewed, 'reviewed')}
        </TabsContent>
        <TabsContent value="all">
          {renderCheckInGrid(filteredByStatus.all, 'all')}
          {reviewedQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviewedCheckIns.map((checkIn) => (
                  <CheckInCard key={checkIn.id} checkIn={checkIn} />
                ))}
              </div>
              {reviewedCheckIns.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No reviewed check-ins yet.
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Check-in Detail Dialog */}
      <Dialog open={!!selectedCheckIn} onOpenChange={() => setSelectedCheckInId(null)}>
        <DialogContent className="max-w-lg">
          {selectedCheckIn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcons[selectedCheckIn.type];
                    const tone = iconTokens[typeIconTones[selectedCheckIn.type]];
                    return <Icon className={cn("h-5 w-5", tone.icon)} />;
                  })()}
                  {typeLabels[selectedCheckIn.type]}
                </DialogTitle>
                <DialogDescription>
                  Submitted by {selectedCheckIn.clientName} on{' '}
                  {new Date(selectedCheckIn.submittedAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              {renderCheckInDetails()}

              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-4">
                <div className="text-sm text-muted-foreground">
                  {selectedCheckIn.status === 'pending'
                    ? 'Waiting for review'
                    : 'Reviewed'}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedCheckInId(null)}>
                    Close
                  </Button>
                  {selectedCheckIn.status === 'pending' && (
                    <Button
                      className="shadow-energy"
                      onClick={() => reviewMutation.mutate(selectedCheckIn.id)}
                      disabled={reviewMutation.isPending}
                    >
                      {reviewMutation.isPending ? 'Marking...' : 'Mark as Reviewed'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CheckInsPage;
