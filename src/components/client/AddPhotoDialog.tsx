import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useUploadProgressPhoto } from "@/hooks/useClientProgress";
import { toast } from "sonner";
import { Loader2, Camera, Upload, X } from "lucide-react";

interface AddPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const poseTypes = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "side_left", label: "Left Side" },
  { value: "side_right", label: "Right Side" },
  { value: "other", label: "Other" },
];

export function AddPhotoDialog({ open, onOpenChange }: AddPhotoDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [poseType, setPoseType] = useState<string>("front");
  const [notes, setNotes] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split('T')[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = useUploadProgressPhoto();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a photo");
      return;
    }

    try {
      await uploadPhoto.mutateAsync({
        file,
        poseType: poseType as 'front' | 'back' | 'side_left' | 'side_right' | 'other',
        notes: notes || undefined,
        recordedAt,
      });
      toast.success("Photo uploaded successfully!");
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setPoseType("front");
    setNotes("");
    setRecordedAt(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  const clearPhoto = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Add Progress Photo
          </DialogTitle>
          <DialogDescription>
            Upload a photo to document your transformation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photo</Label>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearPhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 10MB
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Date & Pose Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recordedAt">Date</Label>
              <Input
                id="recordedAt"
                type="date"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poseType">Pose Type</Label>
              <Select value={poseType} onValueChange={setPoseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {poseTypes.map((pose) => (
                    <SelectItem key={pose.value} value={pose.value}>
                      {pose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any observations about this photo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!file || uploadPhoto.isPending}
            >
              {uploadPhoto.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
