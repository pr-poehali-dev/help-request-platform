import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { responsesApi } from '@/lib/api';

interface ResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcementId: number;
  announcementTitle: string;
  currentUserName: string;
}

export const ResponseDialog = ({ open, onOpenChange, announcementId, announcementTitle, currentUserName }: ResponseDialogProps) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !contact || !message) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await responsesApi.createResponse({
        announcement_id: announcementId,
        responder_name: name,
        responder_contact: contact,
        message
      });

      toast({
        title: 'Отклик отправлен!',
        description: 'Автор объявления свяжется с вами'
      });

      setName('');
      setContact('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить отклик',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Откликнуться на объявление</DialogTitle>
          <DialogDescription>{announcementTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Ваше имя</label>
            <Input 
              placeholder="Как к вам обращаться?"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Контакт для связи</label>
            <Input 
              placeholder="Телефон, email или telegram"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Сообщение</label>
            <Textarea 
              placeholder="Расскажите, как вы можете помочь"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <Button 
            className="w-full bg-primary hover:bg-primary/90" 
            onClick={handleSubmit}
            disabled={loading}
          >
            <Icon name="Send" className="mr-2" size={16} />
            {loading ? 'Отправка...' : 'Отправить отклик'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};