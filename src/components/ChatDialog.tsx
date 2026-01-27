import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { responsesApi, type Message } from '@/lib/api';

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseId: number;
  responderName: string;
  currentUserName: string;
}

export const ChatDialog = ({ open, onOpenChange, responseId, responderName, currentUserName }: ChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && responseId) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [open, responseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await responsesApi.getMessages(responseId);
      setMessages(data);
    } catch {
      // Error loading messages
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await responsesApi.sendMessage({
        response_id: responseId,
        sender_name: currentUserName,
        message: newMessage.trim()
      });

      setNewMessage('');
      await loadMessages();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} />
            Чат с {responderName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {loading && messages.length === 0 ? (
            <div className="text-center text-muted-foreground">Загрузка сообщений...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="MessageSquare" size={48} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Начните диалог!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender === currentUserName;
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <Card className={`max-w-[75%] ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <div className="p-3 space-y-1">
                      <p className="text-xs font-medium opacity-80">{msg.sender}</p>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className="text-xs opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
            className="bg-primary hover:bg-primary/90"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};