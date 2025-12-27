import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Scale, Camera, Dumbbell, Utensils, Eye } from 'lucide-react';
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
import checkInService, { CheckIn, CheckInStatus, CheckInType } from '@/services/checkInService';

const typeIcons: Record<CheckInType, typeof Scale> = {
  weight: Scale,
  photos: Camera,
  workout: Dumbbell,
  diet: Utensils,
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
    },
  });

  const selectedCheckIn = useMemo(
    () => allCheckIns.find((c) => c.id === selectedCheckInId) ?? null,
    [allCheckIns, selectedCheckInId],
  );

  const CheckInCard = ({ checkIn }: { checkIn: CheckIn }) => {
    const Icon = typeIcons[checkIn.type];
    
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setSelectedCheckInId(checkIn.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{typeLabels[checkIn.type]}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={checkIn.clientAvatar} />
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
            <div className="text-right">
              <Badge
                className={
                  checkIn.status === 'pending'
                    ? 'bg-energy/20 text-energy border-0'
                    : 'bg-vitality/20 text-vitality border-0'
                }
              >
                {checkIn.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(checkIn.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCheckInDetails = () => {
    if (!selectedCheckIn) return null;

    switch (selectedCheckIn.type) {
      case 'weight':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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
              <div className="p-4 rounded-lg bg-muted text-center">
                <p className="text-sm text-muted-foreground">Waist</p>
                <p className="text-2xl font-bold">
                  {selectedCheckIn.data.waist ?? '—'}
                  {selectedCheckIn.data.waist ? '"' : ''}
                </p>
              </div>
            </div>
          </div>
        );
      case 'workout':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Status</p>
              <Badge className={selectedCheckIn.data.completed ? 'bg-vitality/20 text-vitality' : 'bg-destructive/20 text-destructive'}>
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
          </div>
        );
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
                      <Camera className="h-8 w-8" />
                      <span className="text-xs capitalize">{angle}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Check-ins"
        description="Review and manage client check-ins"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-energy border-energy">
              {pendingCheckIns.length} pending
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

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as CheckInStatus)}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending ({pendingCheckIns.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reviewed ({reviewedCheckIns.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
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
                    return <Icon className="h-5 w-5 text-primary" />;
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
