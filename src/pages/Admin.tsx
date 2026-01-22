import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { announcementsApi, paymentsApi, donationsApi, celebritiesApi, type Announcement, type Donation, type CelebrityRequest } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const Admin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [celebrityRequests, setCelebrityRequests] = useState<CelebrityRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_visits: 0,
    unique_visitors: 0,
    today_visits: 0,
    total_announcement_views: 0
  });
  const [editingDonation, setEditingDonation] = useState<{ id: number; assigned_to: string; notes: string } | null>(null);
  const [editingRequest, setEditingRequest] = useState<{ id: number; status: string; notes: string } | null>(null);

  const handleLogin = () => {
    if (password === 'HELP2025') {
      setIsAuthorized(true);
      loadPendingAnnouncements();
      loadStats();
      loadDonations();
      loadCelebrityRequests();
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive'
      });
    }
  };

  const loadStats = async () => {
    try {
      const data = await announcementsApi.getStats('HELP2025');
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const loadPendingAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.getAll();
      setAnnouncements(data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDonations = async () => {
    try {
      const data = await donationsApi.getAll('HELP2025');
      setDonations(data);
    } catch (error) {
      console.error('Ошибка загрузки пожертвований:', error);
    }
  };

  const loadCelebrityRequests = async () => {
    try {
      const data = await celebritiesApi.getAll('HELP2025');
      setCelebrityRequests(data);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
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

  const handleAssignDonation = async () => {
    if (!editingDonation) return;
    
    try {
      await donationsApi.assignDonation(
        editingDonation.id,
        editingDonation.assigned_to,
        editingDonation.notes,
        'HELP2025'
      );
      toast({ title: 'Успешно', description: 'Пожертвование назначено' });
      setEditingDonation(null);
      await loadDonations();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось назначить пожертвование', variant: 'destructive' });
    }
  };

  const handleUpdateCelebrityRequest = async () => {
    if (!editingRequest) return;
    
    try {
      await celebritiesApi.updateStatus(
        editingRequest.id,
        editingRequest.status,
        editingRequest.notes,
        'HELP2025'
      );
      toast({ title: 'Успешно', description: 'Статус обновлён' });
      setEditingRequest(null);
      await loadCelebrityRequests();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось обновить статус', variant: 'destructive' });
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) return;
    
    try {
      await announcementsApi.deleteAnnouncement(id, 'HELP2025');
      toast({ title: 'Успешно', description: 'Объявление удалено' });
      await loadPendingAnnouncements();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить объявление', variant: 'destructive' });
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

        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="Users" size={18} />
                Всего посещений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_visits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="UserCheck" size={18} />
                Уникальных посетителей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.unique_visitors}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="CalendarDays" size={18} />
                Посещений сегодня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.today_visits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon name="Eye" size={18} />
                Просмотров объявлений
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total_announcement_views}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">
              Объявления ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="donations">
              Пожертвования ({donations.length})
            </TabsTrigger>
            <TabsTrigger value="celebrities">
              Знаменитости ({celebrityRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="FileText" size={24} />
                  Все объявления
                </CardTitle>
              </CardHeader>
              <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Загрузка...
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет объявлений
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
                        <div className="flex flex-col gap-2 shrink-0">
                          {announcement.status === 'Ожидает оплаты' && (
                            <Button 
                              onClick={() => handleConfirmPayment(announcement.id)}
                              size="sm"
                            >
                              <Icon name="CheckCircle" size={16} className="mr-1" />
                              Подтвердить
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Icon name="Trash2" size={16} className="mr-1" />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="donations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Heart" size={24} />
                  Управление пожертвованиями
                </CardTitle>
              </CardHeader>
              <CardContent>
                {donations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Пожертвований пока нет
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <Card key={donation.id} className="border-primary/20">
                        <CardContent className="pt-6 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon name="User" size={16} />
                                <span className="font-semibold">{donation.donor_name}</span>
                                <Badge>{donation.amount}₽</Badge>
                              </div>
                              {donation.message && (
                                <p className="text-sm text-muted-foreground italic mb-2">"{donation.message}"</p>
                              )}
                              {donation.donor_contact && (
                                <p className="text-xs text-muted-foreground">Контакт: {donation.donor_contact}</p>
                              )}
                              {donation.assigned_to && (
                                <Badge variant="outline" className="mt-2">
                                  Назначено: {donation.assigned_to}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {editingDonation?.id === donation.id ? (
                            <div className="space-y-2 border-t pt-3">
                              <Input
                                placeholder="Кому назначить пожертвование"
                                value={editingDonation.assigned_to}
                                onChange={(e) => setEditingDonation({ ...editingDonation, assigned_to: e.target.value })}
                              />
                              <Textarea
                                placeholder="Заметки администратора"
                                value={editingDonation.notes}
                                onChange={(e) => setEditingDonation({ ...editingDonation, notes: e.target.value })}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleAssignDonation}>Сохранить</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingDonation(null)}>Отмена</Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingDonation({ 
                                id: donation.id, 
                                assigned_to: donation.assigned_to || '', 
                                notes: donation.admin_notes || '' 
                              })}
                            >
                              <Icon name="Edit" size={14} className="mr-1" />
                              Назначить
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="celebrities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Star" size={24} />
                  Обращения к знаменитостям
                </CardTitle>
              </CardHeader>
              <CardContent>
                {celebrityRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Обращений пока нет
                  </div>
                ) : (
                  <div className="space-y-4">
                    {celebrityRequests.map((request) => (
                      <Card key={request.id} className="border-warning/20">
                        <CardContent className="pt-6 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Icon name="User" size={16} />
                              <span className="font-semibold">{request.requester_name}</span>
                              <Icon name="ArrowRight" size={14} />
                              <Icon name="Star" size={16} className="text-warning" />
                              <span className="font-semibold text-primary">{request.celebrity_name}</span>
                            </div>
                            <p className="text-sm">{request.request_text}</p>
                            {request.requester_contact && (
                              <p className="text-xs text-muted-foreground">Контакт: {request.requester_contact}</p>
                            )}
                            <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                              {request.status === 'pending' ? 'На рассмотрении' : request.status}
                            </Badge>
                          </div>
                          {editingRequest?.id === request.id ? (
                            <div className="space-y-2 border-t pt-3">
                              <select 
                                className="w-full p-2 border rounded"
                                value={editingRequest.status}
                                onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
                              >
                                <option value="pending">На рассмотрении</option>
                                <option value="approved">Одобрено</option>
                                <option value="sent">Отправлено</option>
                                <option value="rejected">Отклонено</option>
                              </select>
                              <Textarea
                                placeholder="Заметки администратора"
                                value={editingRequest.notes}
                                onChange={(e) => setEditingRequest({ ...editingRequest, notes: e.target.value })}
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleUpdateCelebrityRequest}>Сохранить</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingRequest(null)}>Отмена</Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingRequest({ 
                                id: request.id, 
                                status: request.status, 
                                notes: request.admin_notes || '' 
                              })}
                            >
                              <Icon name="Edit" size={14} className="mr-1" />
                              Изменить статус
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;