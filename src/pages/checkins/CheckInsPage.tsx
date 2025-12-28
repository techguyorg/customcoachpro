import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCheck,
  Scale,
  Camera,
  Dumbbell,
  Utensils,
  Eye,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import checkInService, { CheckIn, CheckInStatus, CheckInType } from "@/services/checkInService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatDistanceToNow } from "date-fns";

const typeIcons = {
  weight: Scale,
  photos: Camera,
  workout: Dumbbell,
  diet: Utensils,
};

const typeLabels: Record<CheckInType, string> = {
  weight: "Weight & Measurements",
  photos: "Progress Photos",
  workout: "Workout Completion",
  diet: "Diet Compliance",
};

type SortOption = "newest" | "oldest" | "client" | "type" | "attention";

type PhotoPreview = {
  src: string;
  label: string;
};

const attentionPriority: Record<string, number> = {
  "Overdue weight check-in": 0,
  "Weight regression": 1,
  "Low diet compliance": 2,
};

const buildPreviousCheckInMap = (checkIns: CheckIn[]) => {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  const lastByClientType = new Map<string, CheckIn>();
  const map: Record<string, CheckIn | undefined> = {};

  sorted.forEach((checkIn) => {
    const key = `${checkIn.clientId}-${checkIn.type}`;
    map[checkIn.id] = lastByClientType.get(key);
    lastByClientType.set(key, checkIn);
  });

  return map;
};

const computeAttentionReason = (checkIns: CheckIn[]): string | null => {
  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
  const weightCheckIns = sorted.filter((ci) => ci.type === "weight" && ci.data.weight != null);
  const latestWeight = weightCheckIns[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (!latestWeight || new Date(latestWeight.submittedAt) < sevenDaysAgo) {
    return "Overdue weight check-in";
  }

  if (weightCheckIns.length >= 2) {
    const latestWeightValue = weightCheckIns[0].data.weight!;
    const previousWeightValue = weightCheckIns[1].data.weight!;
    if (latestWeightValue - previousWeightValue >= 1) {
      return "Weight regression";
    }
  }

  const recentCompliance = sorted
    .filter((ci) => ci.type === "diet" && ci.data.complianceRating != null)
    .slice(0, 3)
    .map((ci) => ci.data.complianceRating!)
    .filter((value) => value != null);

  if (recentCompliance.length && recentCompliance.reduce((sum, val) => sum + val, 0) / recentCompliance.length < 6) {
    return "Low diet compliance";
  }

  return null;
};

const formatSubmittedDate = (submittedAt: string) => new Date(submittedAt).toLocaleDateString();

export function CheckInsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoPreview | null>(null);
  const handledCheckInIdRef = useRef<string | null>(null);

  const statusFilter = (searchParams.get("status") as CheckInStatus) ?? "pending";
  const typeFilter = (searchParams.get("type") as CheckInType | null) ?? null;
  const clientIdFilter = searchParams.get("clientId");
  const sortOption = (searchParams.get("sort") as SortOption) ?? "newest";
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const checkInId = searchParams.get("id");
  const tabValue = statusFilter === "reviewed" ? "reviewed" : "pending";

  const queryParams = useMemo(() => {
    const params: Partial<Parameters<typeof checkInService.getCheckIns>[0]> = {
      status: statusFilter,
    };

    if (typeFilter) params.type = typeFilter;
    if (clientIdFilter) params.clientId = clientIdFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    if (sortOption === "newest" || sortOption === "oldest") {
      params.sortBy = "submittedAt";
      params.sortDirection = sortOption === "newest" ? "desc" : "asc";
    } else if (sortOption === "client") {
      params.sortBy = "clientName";
      params.sortDirection = "asc";
    } else if (sortOption === "type") {
      params.sortBy = "type";
      params.sortDirection = "asc";
    }

    return params;
  }, [clientIdFilter, fromDate, sortOption, statusFilter, toDate, typeFilter]);

  const { data: checkIns = [], isLoading, isFetching } = useQuery({
    queryKey: ["check-ins", queryParams],
    queryFn: () => checkInService.getCheckIns(queryParams),
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ["check-ins", "context"],
    queryFn: () => checkInService.getCheckIns({ sortBy: "submittedAt", sortDirection: "desc" }),
  });

  const markReviewed = useMutation({
    mutationFn: (id: string) => checkInService.markReviewed(id),
    onSuccess: () => {
      toast({
        title: "Check-in reviewed",
        description: "Marked as reviewed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["check-ins"] });
      setSelectedCheckIn(null);
    },
    onError: () => {
      toast({
        title: "Unable to mark reviewed",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const contextualCheckIns = allCheckIns.length ? allCheckIns : checkIns;
  const previousCheckInsById = useMemo(
    () => buildPreviousCheckInMap(contextualCheckIns),
    [contextualCheckIns],
  );

  const attentionReasonByClient = useMemo(() => {
    const grouped: Record<string, CheckIn[]> = {};

    contextualCheckIns.forEach((ci) => {
      if (!grouped[ci.clientId]) grouped[ci.clientId] = [];
      grouped[ci.clientId].push(ci);
    });

    const reasons: Record<string, string | null> = {};
    Object.entries(grouped).forEach(([clientId, items]) => {
      reasons[clientId] = computeAttentionReason(items);
    });

    return reasons;
  }, [contextualCheckIns]);

  const sortedCheckIns = useMemo(() => {
    if (sortOption === "attention") {
      return [...checkIns].sort((a, b) => {
        const attentionA = attentionReasonByClient[a.clientId];
        const attentionB = attentionReasonByClient[b.clientId];
        const priorityA = attentionA ? attentionPriority[attentionA] ?? 3 : 10;
        const priorityB = attentionB ? attentionPriority[attentionB] ?? 3 : 10;

        if (priorityA !== priorityB) return priorityA - priorityB;
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
    }

    if (sortOption === "client") {
      return [...checkIns].sort((a, b) => a.clientName.localeCompare(b.clientName));
    }

    if (sortOption === "type") {
      return [...checkIns].sort((a, b) => a.type.localeCompare(b.type));
    }

    if (sortOption === "oldest") {
      return [...checkIns].sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      );
    }

    return [...checkIns].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }, [attentionReasonByClient, checkIns, sortOption]);

  const counts = useMemo(
    () =>
      contextualCheckIns.reduce(
        (acc, ci) => {
          acc[ci.status] += 1;
          return acc;
        },
        { pending: 0, reviewed: 0 } as Record<CheckInStatus, number>,
      ),
    [contextualCheckIns],
  );

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    contextualCheckIns.forEach((ci) => map.set(ci.clientId, ci.clientName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [contextualCheckIns]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
        return params;
      });
    },
    [setSearchParams],
  );

  const handleMarkReviewed = async () => {
    if (!selectedCheckIn) return;
    await markReviewed.mutateAsync(selectedCheckIn.id);
  };

  const renderDelta = (label: string, current?: number, previous?: number, unit?: string) => {
    if (current == null) return null;
    const delta = previous == null ? null : current - previous;

    return (
      <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">
            {current}
            {unit}
          </p>
        </div>
        {delta !== null && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
              delta > 0
                ? "bg-destructive/15 text-destructive"
                : delta < 0
                  ? "bg-icon-success/15 text-icon-success"
                  : "bg-muted-foreground/20 text-foreground",
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : delta < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            <span>
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}
              {unit}
            </span>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!checkInId || !contextualCheckIns.length) return;
    if (handledCheckInIdRef.current === checkInId) return;

    const targetCheckIn = contextualCheckIns.find((ci) => ci.id === checkInId);
    if (!targetCheckIn) return;

    handledCheckInIdRef.current = checkInId;
    if (statusFilter !== targetCheckIn.status) {
      updateParam("status", targetCheckIn.status);
    }
    setSelectedCheckIn(targetCheckIn);
  }, [checkInId, contextualCheckIns, statusFilter, updateParam]);

  const renderSummary = (checkIn: CheckIn) => {
    const previous = previousCheckInsById[checkIn.id];
    const attentionReason = attentionReasonByClient[checkIn.clientId];

    switch (checkIn.type) {
      case "weight": {
        const metrics = [
          renderDelta("Weight", checkIn.data.weight, previous?.data.weight, " lbs"),
          renderDelta("Body fat", checkIn.data.bodyFat, previous?.data.bodyFat, "%"),
          renderDelta("Waist", checkIn.data.waist, previous?.data.waist, " in"),
        ].filter(Boolean);

        return (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {metrics.length ? (
                metrics.map((metric, index) => <div key={index}>{metric}</div>)
              ) : (
                <p className="text-sm text-muted-foreground">No measurements recorded.</p>
              )}
            </div>
            {attentionReason && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-100/70 px-3 py-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">{attentionReason}</span>
              </div>
            )}
          </div>
        );
      }
      case "workout":
        return (
          <div className="space-y-2">
            <Badge
              className={
                checkIn.data.completed
                  ? "border-0 bg-vitality/20 text-vitality"
                  : "border-0 bg-destructive/20 text-destructive"
              }
            >
              {checkIn.data.completed ? "Completed" : "Not completed"}
            </Badge>
            {checkIn.data.workoutNotes || checkIn.notes ? (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {checkIn.data.workoutNotes ?? checkIn.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No notes provided.</p>
            )}
          </div>
        );
      case "diet":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="border-0 bg-primary/10 text-primary">
                Compliance {checkIn.data.complianceRating ?? "—"}/10
              </Badge>
              {attentionReason && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                  {attentionReason}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {checkIn.data.deviations || checkIn.notes || "No deviations reported."}
            </p>
          </div>
        );
      case "photos": {
        const photos = [
          { label: "Front", url: checkIn.data.photos?.front },
          { label: "Side", url: checkIn.data.photos?.side },
          { label: "Back", url: checkIn.data.photos?.back },
        ].filter((p) => p.url) as { label: string; url: string }[];

        if (photos.length === 0) {
          return <p className="text-sm text-muted-foreground">No photos attached.</p>;
        }

        return (
          <div className="flex gap-2">
            {photos.map((photo) => (
              <button
                key={photo.label}
                className="group relative overflow-hidden rounded-md bg-muted focus:outline-none"
                onClick={(event) => {
                  event.stopPropagation();
                  setPreviewPhoto({ src: photo.url, label: `${photo.label} view` });
                }}
              >
                <AspectRatio ratio={3 / 4} className="w-16">
                  <img
                    src={photo.url}
                    alt={photo.label}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </AspectRatio>
              </button>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderCheckInDetails = () => {
    if (!selectedCheckIn) return null;
    const previous = previousCheckInsById[selectedCheckIn.id];

    switch (selectedCheckIn.type) {
      case "weight":
        return (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {renderDelta("Weight", selectedCheckIn.data.weight, previous?.data.weight, " lbs")}
              {renderDelta("Body fat", selectedCheckIn.data.bodyFat, previous?.data.bodyFat, "%")}
              {renderDelta("Waist", selectedCheckIn.data.waist, previous?.data.waist, " in")}
              {renderDelta("Chest", selectedCheckIn.data.chest, previous?.data.chest, " in")}
              {renderDelta("Arms", selectedCheckIn.data.arms, previous?.data.arms, " in")}
              {renderDelta("Thighs", selectedCheckIn.data.thighs, previous?.data.thighs, " in")}
            </div>
            {selectedCheckIn.notes && (
              <p className="text-sm text-muted-foreground">Notes: {selectedCheckIn.notes}</p>
            )}
          </div>
        );
      case "workout":
        return (
          <div className="space-y-3">
            <Badge
              className={
                selectedCheckIn.data.completed
                  ? "border-0 bg-vitality/20 text-vitality"
                  : "border-0 bg-destructive/20 text-destructive"
              }
            >
              {selectedCheckIn.data.completed ? "Completed" : "Not completed"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {selectedCheckIn.data.workoutNotes ?? selectedCheckIn.notes ?? "No notes provided."}
            </p>
          </div>
        );
      case "diet":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-semibold text-primary">
                {selectedCheckIn.data.complianceRating ?? "—"}/10
              </p>
              <p className="text-sm text-muted-foreground">Diet compliance</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedCheckIn.data.deviations ?? selectedCheckIn.notes ?? "No deviations reported."}
            </p>
          </div>
        );
      case "photos": {
        const photos = [
          { label: "Front", url: selectedCheckIn.data.photos?.front },
          { label: "Side", url: selectedCheckIn.data.photos?.side },
          { label: "Back", url: selectedCheckIn.data.photos?.back },
        ];

        return (
          <div className="grid gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.label} className="rounded-lg bg-muted">
                <AspectRatio ratio={3 / 4}>
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="h-full w-full cursor-pointer object-cover"
                      onClick={() => setPreviewPhoto({ src: photo.url!, label: `${photo.label} view` })}
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">{photo.label} photo</span>
                    </div>
                  )}
                </AspectRatio>
              </div>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderCheckInGrid = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading check-ins...
        </div>
      );
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedCheckIns.map((checkIn) => {
            const Icon = typeIcons[checkIn.type];
            return (
              <Card
                key={checkIn.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedCheckIn(checkIn)}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{typeLabels[checkIn.type]}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={checkIn.clientAvatar ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {checkIn.clientName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{checkIn.clientName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          checkIn.status === "pending"
                            ? "border-0 bg-energy/20 text-energy"
                            : "border-0 bg-vitality/20 text-vitality"
                        }
                      >
                        {checkIn.status}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatSubmittedDate(checkIn.submittedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(checkIn.submittedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {renderSummary(checkIn)}
                </CardContent>
              </Card>
            );
          })}
        </div>
        {sortedCheckIns.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No check-ins match these filters.</div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Check-ins"
        description="Review and manage client check-ins"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-energy text-energy">
              {counts.pending} pending
            </Badge>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        }
      />

      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={clientIdFilter ?? "all"}
            onValueChange={(value) => updateParam("clientId", value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {clientOptions.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={typeFilter ?? "all"}
            onValueChange={(value) => updateParam("type", value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(typeLabels) as CheckInType[]).map((type) => (
                <SelectItem key={type} value={type}>
                  {typeLabels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOption} onValueChange={(value: SortOption) => updateParam("sort", value)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="client">Client name</SelectItem>
              <SelectItem value="type">Check-in type</SelectItem>
              <SelectItem value="attention">Needs attention first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate ?? ""}
              onChange={(e) => updateParam("from", e.target.value || null)}
              className="w-[160px]"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={toDate ?? ""}
              onChange={(e) => updateParam("to", e.target.value || null)}
              className="w-[160px]"
            />
          </div>
          {(fromDate || toDate || typeFilter || clientIdFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                ["from", "to", "type", "clientId"].forEach((key) => params.delete(key));
                setSearchParams(params);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tabValue} onValueChange={(value) => updateParam("status", value)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reviewed ({counts.reviewed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">{renderCheckInGrid()}</TabsContent>
        <TabsContent value="reviewed">{renderCheckInGrid()}</TabsContent>
      </Tabs>

      <Dialog open={!!selectedCheckIn} onOpenChange={() => setSelectedCheckIn(null)}>
        <DialogContent className="max-w-2xl">
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
                  Submitted by {selectedCheckIn.clientName} on {formatSubmittedDate(selectedCheckIn.submittedAt)}
                </DialogDescription>
              </DialogHeader>

              {renderCheckInDetails()}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(selectedCheckIn.submittedAt), { addSuffix: true })}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelectedCheckIn(null)}>
                    Close
                  </Button>
                  {selectedCheckIn.status === "pending" && (
                    <Button className="shadow-energy" onClick={handleMarkReviewed} disabled={markReviewed.isPending}>
                      {markReviewed.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Mark as Reviewed
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-3xl">
          {previewPhoto && (
            <div className="space-y-3">
              <DialogHeader>
                <DialogTitle>{previewPhoto.label}</DialogTitle>
              </DialogHeader>
              <AspectRatio ratio={3 / 4}>
                <img
                  src={previewPhoto.src}
                  alt={previewPhoto.label}
                  className="h-full w-full rounded-lg object-cover"
                />
              </AspectRatio>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CheckInsPage;
