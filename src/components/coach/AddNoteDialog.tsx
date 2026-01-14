import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAddNote, useUpdateNote, type CoachNote } from "@/hooks/useCoachNotes";
import { toast } from "sonner";
import { Loader2, StickyNote } from "lucide-react";
import { useEffect } from "react";

const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Note content is required"),
  note_type: z.enum(['general', 'call_notes', 'observation', 'reminder', 'milestone', 'concern']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  is_pinned: z.boolean(),
  reference_date: z.string().optional().nullable(),
  tags: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  existingNote?: CoachNote | null;
}

const noteTypes = [
  { value: 'general', label: 'General Note' },
  { value: 'call_notes', label: 'Call Notes' },
  { value: 'observation', label: 'Observation' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'concern', label: 'Concern' },
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function AddNoteDialog({ open, onOpenChange, clientId, existingNote }: AddNoteDialogProps) {
  const addNote = useAddNote();
  const updateNote = useUpdateNote();
  const isEditing = !!existingNote;

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      note_type: 'general',
      priority: 'normal',
      is_pinned: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingNote) {
      form.reset({
        title: existingNote.title || "",
        content: existingNote.content,
        note_type: existingNote.note_type,
        priority: existingNote.priority,
        is_pinned: existingNote.is_pinned,
        reference_date: existingNote.reference_date || "",
        tags: existingNote.tags.join(", "),
      });
    } else {
      form.reset({
        title: "",
        content: "",
        note_type: 'general',
        priority: 'normal',
        is_pinned: false,
        reference_date: "",
        tags: "",
      });
    }
  }, [existingNote, form]);

  const onSubmit = async (data: NoteFormData) => {
    try {
      const noteData = {
        client_id: clientId,
        title: data.title || null,
        content: data.content,
        note_type: data.note_type,
        priority: data.priority,
        is_pinned: data.is_pinned,
        reference_date: data.reference_date || null,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };

      if (isEditing && existingNote) {
        await updateNote.mutateAsync({ id: existingNote.id, ...noteData });
        toast.success("Note updated");
      } else {
        await addNote.mutateAsync(noteData);
        toast.success("Note added");
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Failed to update note" : "Failed to add note");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            {isEditing ? "Edit Note" : "Add Note"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Note title..."
              {...form.register("title")}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your note here..."
              className="min-h-[120px]"
              {...form.register("content")}
            />
            {form.formState.errors.content && (
              <p className="text-xs text-destructive">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select 
                value={form.watch("note_type")} 
                onValueChange={(value) => form.setValue("note_type", value as NoteFormData['note_type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={form.watch("priority")} 
                onValueChange={(value) => form.setValue("priority", value as NoteFormData['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Date */}
          <div className="space-y-2">
            <Label htmlFor="reference_date">Reference Date (optional)</Label>
            <Input
              id="reference_date"
              type="date"
              {...form.register("reference_date")}
            />
            <p className="text-xs text-muted-foreground">
              e.g., date of a call or meeting this note is about
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="nutrition, progress, goals"
              {...form.register("tags")}
            />
          </div>

          {/* Pin */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="is_pinned">Pin this note</Label>
              <p className="text-xs text-muted-foreground">Pinned notes appear at the top</p>
            </div>
            <Switch
              id="is_pinned"
              checked={form.watch("is_pinned")}
              onCheckedChange={(checked) => form.setValue("is_pinned", checked)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addNote.isPending || updateNote.isPending}>
              {(addNote.isPending || updateNote.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Update Note" : "Add Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
