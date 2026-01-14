import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { ProgressPhoto } from "@/hooks/useClientProgress";

interface PhotoGalleryProps {
  photos: ProgressPhoto[];
  compact?: boolean;
}

const poseLabels: Record<string, string> = {
  front: "Front",
  back: "Back",
  side_left: "Left Side",
  side_right: "Right Side",
  other: "Other",
};

// Cache for signed URLs to avoid re-fetching
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

async function getSignedUrl(photoUrl: string): Promise<string> {
  // Check if URL is already a signed URL or doesn't need signing
  if (photoUrl.includes('?') || !photoUrl.includes('blob.core.windows.net')) {
    return photoUrl;
  }

  // Check cache
  const cached = signedUrlCache.get(photoUrl);
  if (cached && cached.expiresAt > Date.now() + 60000) { // 1 minute buffer
    return cached.url;
  }

  try {
    const data = await api.post<{ signedUrl: string; expiresAt: string }>('/api/storage/sas-url', { blobUrl: photoUrl });

    if (!data?.signedUrl) {
      console.error('Failed to get signed URL');
      return photoUrl;
    }

    // Cache the result
    signedUrlCache.set(photoUrl, {
      url: data.signedUrl,
      expiresAt: new Date(data.expiresAt).getTime()
    });

    return data.signedUrl;
  } catch (err) {
    console.error('Error getting signed URL:', err);
    return photoUrl;
  }
}

interface PhotoThumbnailProps {
  photo: ProgressPhoto;
  compact: boolean;
  onClick: () => void;
}

function PhotoThumbnail({ photo, compact, onClick }: PhotoThumbnailProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getSignedUrl(photo.photo_url).then(url => {
      if (mounted) {
        setSignedUrl(url);
      }
    });
    return () => { mounted = false; };
  }, [photo.photo_url]);

  return (
    <div
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {error ? (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs text-center p-2">
            Image unavailable
          </div>
        ) : signedUrl && (
          <img
            src={signedUrl}
            alt={`Progress photo - ${poseLabels[photo.pose_type]}`}
            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${loading ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg" />
      <div className="absolute bottom-2 left-2 right-2">
        <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0">
          {poseLabels[photo.pose_type]}
        </Badge>
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground mt-2">
          {format(new Date(photo.recorded_at), "MMM d, yyyy")}
        </p>
      )}
    </div>
  );
}

export function PhotoGallery({ photos, compact = false }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Get signed URL for lightbox
  useEffect(() => {
    if (selectedPhoto) {
      getSignedUrl(selectedPhoto.photo_url).then(setLightboxUrl);
    } else {
      setLightboxUrl(null);
    }
  }, [selectedPhoto]);

  return (
    <>
      <div className={`grid gap-4 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
        {photos.map((photo) => (
          <PhotoThumbnail
            key={photo.id}
            photo={photo}
            compact={compact}
            onClick={() => setSelectedPhoto(photo)}
          />
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedPhoto && (
            <div className="relative">
              {lightboxUrl ? (
                <img
                  src={lightboxUrl}
                  alt={`Progress photo - ${poseLabels[selectedPhoto.pose_type]}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <Badge variant="secondary" className="bg-white/20 border-0 text-white">
                      {poseLabels[selectedPhoto.pose_type]}
                    </Badge>
                    <p className="text-sm mt-2 opacity-90">
                      {format(new Date(selectedPhoto.recorded_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                  {selectedPhoto.notes && (
                    <p className="text-sm opacity-80 max-w-xs text-right">
                      {selectedPhoto.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
