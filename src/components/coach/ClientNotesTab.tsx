import { useState } from "react";
import {
  StickyNote,
  Plus,
  Search,
  Pin,
  Phone,
  Eye,
  Bell,
  Trophy,
  AlertCircle,
  FileText,
  MoreVertical,
  Trash2,
  Edit,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useClientNotes,
  useTogglePinNote,
  useDeleteNote,
  type CoachNote
} from "@/hooks/useCoachNotes";
import { AddNoteDialog } from "@/components/coach/AddNoteDialog";
import { format } from "date-fns";
import { toast } from "sonner";

interface ClientNotesTabProps {
  clientId: string;
  clientName: string;
}

const noteTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  general: { icon: FileText, color: "text-muted-foreground", label: "General" },
  call_notes: { icon: Phone, color: "text-blue-500", label: "Call Notes" },
  observation: { icon: Eye, color: "text-purple-500", label: "Observation" },
  reminder: { icon: Bell, color: "text-orange-500", label: "Reminder" },
  milestone: { icon: Trophy, color: "text-green-500", label: "Milestone" },
  concern: { icon: AlertCircle, color: "text-red-500", label: "Concern" },
};

const priorityConfig: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  urgent: "bg-destructive/20 text-destructive",
};

export function ClientNotesTab({ clientId, clientName }: ClientNotesTabProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CoachNote | null>(null);

  const { data: notes = [], isLoading } = useClientNotes(clientId);
  const togglePin = useTogglePinNote();
  const deleteNote = useDeleteNote();

  const filteredNotes = notes.filter(note => {
    const matchesSearch = !search ||
      note.title?.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "pinned" && note.is_pinned) ||
      note.note_type === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleTogglePin = async (note: CoachNote) => {
    try {
      await togglePin.mutateAsync({ id: note.id, isPinned: note.is_pinned });
      toast.success(note.is_pinned ? "Note unpinned" : "Note pinned");
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDelete = async (note: CoachNote) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNote.mutateAsync({ id: note.id, clientId });
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" />
            Notes for {clientName}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {notes.length} notes • {pinnedNotes.length} pinned
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pinned">Pinned</TabsTrigger>
            <TabsTrigger value="call_notes">Calls</TabsTrigger>
            <TabsTrigger value="concern">Concerns</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="space-y-6">
          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Pinned
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                    onEdit={() => setEditingNote(note)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Other Notes</h4>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={handleTogglePin}
                    onDelete={handleDelete}
                    onEdit={() => setEditingNote(note)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold">No notes yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Keep track of important information about this client
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Note Dialog */}
      <AddNoteDialog
        open={dialogOpen || !!editingNote}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingNote(null);
        }}
        clientId={clientId}
        existingNote={editingNote}
      />
    </div>
  );
}

interface NoteCardProps {
  note: CoachNote;
  onTogglePin: (note: CoachNote) => void;
  onDelete: (note: CoachNote) => void;
  onEdit: () => void;
}

function NoteCard({ note, onTogglePin, onDelete, onEdit }: NoteCardProps) {
  const typeConfig = noteTypeConfig[note.note_type] || noteTypeConfig.general;
  const TypeIcon = typeConfig.icon;

  return (
    <Card className={`relative ${note.is_pinned ? 'border-primary/30 bg-primary/5' : ''}`}>
      {note.is_pinned && (
        <Pin className="absolute top-3 right-3 w-4 h-4 text-primary fill-primary" />
      )}
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
            <Badge variant="outline" className="text-xs">
              {typeConfig.label}
            </Badge>
            {note.priority !== 'normal' && (
              <Badge className={`text-xs ${priorityConfig[note.priority]}`}>
                {note.priority}
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTogglePin(note)}>
                <Pin className="w-4 h-4 mr-2" />
                {note.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(note)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {note.title && (
          <h4 className="font-semibold mb-2">{note.title}</h4>
        )}

        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {note.content}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(new Date(note.created_at), "MMM d, yyyy")}</span>
          {note.reference_date && (
            <span>Ref: {format(new Date(note.reference_date), "MMM d")}</span>
          )}
        </div>

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
