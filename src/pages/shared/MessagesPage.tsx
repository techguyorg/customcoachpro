import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ArrowLeft, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  type Conversation,
} from "@/hooks/useMessages";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { format, isToday, isYesterday } from "date-fns";

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedPartnerId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  const selectedConversation = conversations?.find(
    (c) => c.partnerId === selectedPartnerId
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (messages && selectedPartnerId) {
      const unreadIds = messages
        .filter((m) => m.recipient_id === user?.id && !m.read_at)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead.mutate(unreadIds);
      }
    }
  }, [messages, selectedPartnerId, user?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartnerId) return;
    try {
      await sendMessage.mutateAsync({
        recipientId: selectedPartnerId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
  };

  const formatConversationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const handleNewConversationStarted = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <Button size="sm" onClick={() => setShowNewConversation(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Message
        </Button>
      </div>

      <NewConversationDialog
        open={showNewConversation}
        onOpenChange={setShowNewConversation}
        onConversationStarted={handleNewConversationStarted}
      />

      <div className="flex-1 flex border border-border rounded-lg overflow-hidden bg-card">
        {/* Conversation List */}
        <div
          className={cn(
            "w-full md:w-80 border-r border-border flex flex-col",
            selectedPartnerId && "hidden md:flex"
          )}
        >
          <div className="p-3 border-b border-border">
            <h2 className="font-semibold text-sm">Conversations</h2>
          </div>
          <ScrollArea className="flex-1">
            {loadingConversations ? (
              <div className="p-3 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.partnerId}
                    conversation={conv}
                    isSelected={selectedPartnerId === conv.partnerId}
                    onClick={() => setSelectedPartnerId(conv.partnerId)}
                    formatTime={formatConversationTime}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">
                  Click "New Message" to start a conversation
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            !selectedPartnerId && "hidden md:flex"
          )}
        >
          {selectedPartnerId && selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-3 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedPartnerId(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedConversation.partnerAvatar || undefined} />
                  <AvatarFallback className="text-xs">
                    {(selectedConversation.partnerName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">
                  {selectedConversation.partnerName || "Unknown"}
                </span>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton
                        key={i}
                        className={cn("h-12 w-48", i % 2 === 0 && "ml-auto")}
                      />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={cn("flex", isMine && "justify-end")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-3 py-2",
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isMine
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isSelected,
  onClick,
  formatTime,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (date: string) => string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left hover:bg-muted/50 transition-colors flex gap-3",
        isSelected && "bg-muted"
      )}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={conversation.partnerAvatar || undefined} />
        <AvatarFallback className="text-sm">
          {(conversation.partnerName || "?").charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">
            {conversation.partnerName || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {conversation.lastMessage}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
