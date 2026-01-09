import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { responsesApi, type Response } from '@/lib/api';
import { ChatDialog } from './ChatDialog';

interface ResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcementId: number;
  announcementTitle: string;
  isAuthor: boolean;
}

export const ResponsesDialog = ({ open, onOpenChange, announcementId, announcementTitle, isAuthor }: ResponsesDialogProps) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (open && announcementId) {
      loadResponses();
    }
  }, [open, announcementId]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const data = await responsesApi.getByAnnouncement(announcementId);
      setResponses(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (response: Response) => {
    setSelectedResponse(response);
    setChatOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Отклики на объявление</DialogTitle>
            <DialogDescription>{announcementTitle}</DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="MessageSquareOff" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Откликов пока нет</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map((response) => (
                <Card key={response.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={16} />
                        <CardTitle className="text-base">{response.responder_name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(response.created_at).toLocaleDateString('ru-RU')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{response.message}</p>
                    {isAuthor && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Icon name="Mail" size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{response.responder_contact}</span>
                      </div>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openChat(response)}
                      className="w-full"
                    >
                      <Icon name="MessageCircle" className="mr-2" size={14} />
                      Открыть чат {response.message_count > 0 && `(${response.message_count})`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedResponse && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          responseId={selectedResponse.id}
          responderName={selectedResponse.responder_name}
          currentUserName={isAuthor ? announcementTitle.split(' ')[0] : selectedResponse.responder_name}
        />
      )}
    </>
  );
};
