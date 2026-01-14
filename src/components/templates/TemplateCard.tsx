import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Zap, MoreVertical, Eye, ClipboardList, Edit, Trash2, Play, Loader2, Dumbbell, Shield } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemplateWithStats } from "@/hooks/useWorkoutTemplates";
import { useStartProgram } from "@/hooks/useStartProgram";

interface TemplateCardProps {
  template: TemplateWithStats;
  onClick: () => void;
  showFavorite?: boolean;
  showQuickActions?: boolean;
  showStartButton?: boolean;
  onAssign?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

const difficultyColors = {
  beginner: "bg-success/20 text-success border-success/30",
  intermediate: "bg-warning/20 text-warning border-warning/30",
  advanced: "bg-destructive/20 text-destructive border-destructive/30",
};

const typeColors: Record<string, string> = {
  push_pull_legs: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  upper_lower: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  full_body: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  bro_split: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  strength: "bg-red-500/20 text-red-400 border-red-500/30",
  hypertrophy: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  powerbuilding: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  sport_specific: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  cardio_conditioning: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  functional: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  bodyweight: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
};

const formatLabel = (value: string) => 
  value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

export function TemplateCard({ 
  template, 
  onClick, 
  showFavorite = true,
  showQuickActions = false,
  showStartButton = true,
  onAssign,
  onEdit,
  onDelete,
  isOwner = false,
}: TemplateCardProps) {
  const startProgram = useStartProgram();
  
  const handleStartProgram = (e: React.MouseEvent) => {
    e.stopPropagation();
    startProgram.mutate({ templateId: template.id });
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 group h-full"
      onClick={onClick}
    >
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Workout Icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm">
                {template.name}
              </h3>
              {template.goal && (
                <p className="text-xs text-primary/80 mt-0.5 line-clamp-1">
                  {template.goal}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {showFavorite && (
              <FavoriteButton itemType="workout_template" itemId={template.id} size="sm" />
            )}
            {showQuickActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onClick}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {onAssign && (
                    <DropdownMenuItem onClick={onAssign}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Assign to Client
                    </DropdownMenuItem>
                  )}
                  {isOwner && onEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onEdit}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </>
                  )}
                  {isOwner && onDelete && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {template.description || "No description available"}
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{template.days_per_week} days/week</span>
          </div>
          {template.duration_weeks && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{template.duration_weeks} weeks</span>
            </div>
          )}
          {template.is_periodized && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary">Periodized</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {template.is_system && (
            <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
              <Shield className="w-3 h-3 mr-1" />
              System
            </Badge>
          )}
          {template.template_type && (
            <Badge 
              variant="outline" 
              className={`text-xs ${typeColors[template.template_type] || ""}`}
            >
              {formatLabel(template.template_type)}
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={`text-xs ${difficultyColors[template.difficulty]}`}
          >
            {formatLabel(template.difficulty)}
          </Badge>
        </div>

        {/* Start Button */}
        {showStartButton && (
          <div className="pt-3 mt-auto" onClick={(e) => e.stopPropagation()}>
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleStartProgram}
              disabled={startProgram.isPending}
            >
              {startProgram.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Program
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}