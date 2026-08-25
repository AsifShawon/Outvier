'use client';

import { useState } from 'react';
import { WorkspaceCommunication, applicationWorkspaceApi } from '@/lib/api/applicationWorkspace.api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommunicationsThreadProps {
  applicationId: string;
  communications: WorkspaceCommunication[];
  onMessageSent?: () => void;
}

export function CommunicationsThread({
  applicationId,
  communications = [],
  onMessageSent,
}: CommunicationsThreadProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await applicationWorkspaceApi.addCommunication(applicationId, {
        message: message.trim(),
        channel: 'comment',
      });
      setMessage('');
      toast.success('Message sent! 💬');
      if (onMessageSent) onMessageSent();
    } catch {
      toast.error('Failed to post message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Reviewer Feedback & Communications
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {communications.length} Note(s)
        </span>
      </div>

      {/* Messages Feed */}
      {communications.length === 0 ? (
        <p className="text-xs text-muted-foreground italic p-4 bg-muted/20 rounded-xl text-center">
          No feedback or notes posted yet. Use the box below to ask questions to your admissions reviewer.
        </p>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {communications.map((msg, i) => {
            const senderObj = typeof msg.senderId === 'object' && msg.senderId ? msg.senderId : null;
            const senderName = senderObj ? senderObj.name || senderObj.username : 'User';
            const isStaff = msg.senderRole === 'admin' || msg.senderRole === 'reviewer';

            return (
              <div
                key={msg.id || i}
                className={cn(
                  'p-3.5 rounded-xl text-xs space-y-1.5 border',
                  isStaff
                    ? 'bg-primary/5 border-primary/20 ml-4'
                    : 'bg-background border-border mr-4'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isStaff ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="font-bold text-foreground">{senderName}</span>
                    <Badge variant="outline" className="text-[9px] capitalize px-1 py-0 h-4 bg-muted">
                      {msg.senderRole}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-border">
        <Textarea
          placeholder="Ask a question or leave a note for the admissions reviewer..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="text-xs min-h-[70px]"
        />
        <div className="flex items-center justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isSending || !message.trim()}
            className="text-xs h-8 gap-1.5"
          >
            {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
}
