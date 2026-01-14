import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSendMessage } from "@/hooks/useMessages";
import { useMyCoach } from "@/hooks/useMyCoach";
import { toast } from "sonner";
import { Loader2, MessageSquarePlus } from "lucide-react";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationStarted: (partnerId: string) => void;
}

export function NewConversationDialog({ 
  open, 
  onOpenChange,
  onConversationStarted 
}: NewConversationDialogProps) {
  const [selectedUser, setSelectedUser] = useState<{ userId: string; name: string; avatar: string | null } | null>(null);
  const [message, setMessage] = useState("");

  const { data: myCoach } = useMyCoach();
  const sendMessage = useSendMessage();

  const handleSend = async () => {
    if (!selectedUser || !message.trim()) {
      toast.error("Please select a recipient and enter a message");
      return;
    }

    try {
      await sendMessage.mutateAsync({
        recipientId: selectedUser.userId,
        content: message.trim(),
      });
      toast.success("Message sent!");
      onConversationStarted(selectedUser.userId);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setMessage("");
  };

  const handleSelectCoach = () => {
    if (myCoach) {
      setSelectedUser({
        userId: myCoach.coachId,
        name: myCoach.fullName,
        avatar: myCoach.avatarUrl,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5" />
            New Conversation
          </DialogTitle>
          <DialogDescription>
            Start a conversation with your coach
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Contact: My Coach */}
          {myCoach && !selectedUser && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Your Coach</Label>
              <button
                onClick={handleSelectCoach}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={myCoach.avatarUrl || undefined} />
                  <AvatarFallback>
                    {myCoach.fullName?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {myCoach.fullName || "Your Coach"}
                  </p>
                  <p className="text-xs text-muted-foreground">Click to message</p>
                </div>
              </button>
            </div>
          )}

          {!myCoach && !selectedUser && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">You don't have a coach assigned yet.</p>
              <p className="text-xs mt-1">Find a coach in the marketplace to start messaging.</p>
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">To</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {selectedUser.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{selectedUser.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setSelectedUser(null)}
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Message */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Write your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {selectedUser && (
              <Button 
                onClick={handleSend} 
                disabled={!message.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Message
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
