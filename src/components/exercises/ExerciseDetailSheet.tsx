import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Dumbbell, 
  Target, 
  Gauge, 
  Zap, 
  ListChecks, 
  Lightbulb, 
  AlertTriangle,
  Play,
  X
} from "lucide-react";
import { useExercise } from "@/hooks/useExercises";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ensureArray } from "@/lib/utils";

interface ExerciseDetailSheetProps {
  exerciseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Exercise {
  name: string;
  video_url?: string | null;
}

const formatLabel = (value: string) => 
  value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

const difficultyColors = {
  beginner: "bg-success/20 text-success border-success/30",
  intermediate: "bg-warning/20 text-warning border-warning/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

// Video player component that actually plays videos
function ExerciseMedia({ exercise }: { exercise: Exercise }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Check if it's a YouTube URL and extract video ID
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  if (exercise.video_url) {
    const youtubeId = getYouTubeId(exercise.video_url);
    
    if (youtubeId) {
      // YouTube video
      return (
        <div className="aspect-video rounded-xl bg-muted overflow-hidden">
          {isPlaying ? (
            <div className="relative w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                title={exercise.name}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 z-10"
                onClick={() => setIsPlaying(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="relative w-full h-full group cursor-pointer"
              onClick={() => setIsPlaying(true)}
            >
              <img 
                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`} 
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Regular video URL
    return (
      <div className="aspect-video rounded-xl bg-muted overflow-hidden">
        {isPlaying ? (
          <div className="relative w-full h-full">
            <video
              src={exercise.video_url}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 z-10"
              onClick={() => setIsPlaying(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div 
            className="relative w-full h-full group cursor-pointer flex items-center justify-center bg-muted"
            onClick={() => setIsPlaying(true)}
          >
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // No video - show placeholder
  return (
    <div className="aspect-video rounded-xl bg-muted flex items-center justify-center">
      <Dumbbell className="w-16 h-16 text-muted-foreground" />
    </div>
  );
}

export function ExerciseDetailSheet({ exerciseId, open, onOpenChange }: ExerciseDetailSheetProps) {
  const { data: exercise, isLoading } = useExercise(exerciseId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            {isLoading ? (
              <ExerciseDetailSkeleton />
            ) : exercise ? (
              <div className="space-y-6">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-2xl">{exercise.name}</SheetTitle>
                </SheetHeader>

                {/* Hero Image/Video */}
                <ExerciseMedia exercise={exercise} />

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <Target className="w-3 h-3" />
                    {formatLabel(exercise.primary_muscle)}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Dumbbell className="w-3 h-3" />
                    {formatLabel(exercise.equipment)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`gap-1.5 ${difficultyColors[exercise.difficulty]}`}
                  >
                    <Gauge className="w-3 h-3" />
                    {formatLabel(exercise.difficulty)}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Zap className="w-3 h-3" />
                    {formatLabel(exercise.exercise_type)}
                  </Badge>
                </div>

                {/* Description */}
                {exercise.description && (
                  <div>
                    <p className="text-muted-foreground leading-relaxed">
                      {exercise.description}
                    </p>
                  </div>
                )}

                {/* Secondary Muscles */}
                {ensureArray(exercise.secondary_muscles).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Secondary Muscles
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ensureArray(exercise.secondary_muscles).map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-xs">
                          {formatLabel(muscle)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Instructions */}
                {ensureArray(exercise.instructions).length > 0 && (
                  <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-3">
                      <ListChecks className="w-5 h-5 text-primary" />
                      Instructions
                    </h4>
                    <ol className="space-y-3">
                      {ensureArray(exercise.instructions).map((instruction, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="text-muted-foreground leading-relaxed">
                            {instruction}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Tips */}
                {ensureArray(exercise.tips).length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-primary">
                      <Lightbulb className="w-5 h-5" />
                      Pro Tips
                    </h4>
                    <ul className="space-y-2">
                      {ensureArray(exercise.tips).map((tip, index) => (
                        <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Common Mistakes */}
                {ensureArray(exercise.common_mistakes).length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Common Mistakes
                    </h4>
                    <ul className="space-y-2">
                      {ensureArray(exercise.common_mistakes).map((mistake, index) => (
                        <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="text-destructive">•</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Exercise not found
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ExerciseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
