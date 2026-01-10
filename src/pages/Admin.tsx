import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { announcementsApi, paymentsApi, type Announcement } from '@/lib/api';

const Admin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (password === 'HELP2025') {
      setIsAuthorized(true);
      loadPendingAnnouncements();
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive'
      });
    }
  };

  const loadPendingAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.getAll();
      const pending = data.filter(a => a.status === 'Ожидает оплаты');
      setAnnouncements(pending);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (id: number) => {
    try {
      await paymentsApi.confirmPayment(id, 'HELP2025');
      toast({
        title: 'Успешно',
        description: 'Платёж подтверждён, объявление опубликовано'
      });
      await loadPendingAnnouncements();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подтвердить платёж',
        variant: 'destructive'
      });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Icon name="Lock" size={28} />
              Вход в админ-панель
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="w-full">
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Icon name="Shield" size={32} />
            Панель администратора
          </h1>
          <Button variant="outline" onClick={() => setIsAuthorized(false)}>
            <Icon name="LogOut" size={18} />
            Выйти
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Clock" size={24} />
              Ожидают подтверждения оплаты ({announcements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка...
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет объявлений, ожидающих подтверждения
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <Card key={announcement.id} className="border-warning">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-2">
                            <h3 className="text-lg font-semibold flex-1">
                              {announcement.title}
                            </h3>
                            <Badge variant="outline" className="bg-warning/10">
                              {announcement.type === 'vip' ? 'VIP (100₽)' : 
                               announcement.type === 'boosted' ? 'Поднятое (20₽)' : 
                               'Обычное (10₽)'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {announcement.description}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Icon name="Tag" size={14} />
                              {announcement.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="User" size={14} />
                              {announcement.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              {new Date(announcement.date).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleConfirmPayment(announcement.id)}
                          className="shrink-0"
                        >
                          <Icon name="CheckCircle" size={18} />
                          Подтвердить оплату
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
