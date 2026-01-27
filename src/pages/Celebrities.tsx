import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { celebritiesApi, type CelebrityRequest } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { CELEBRITIES, POPULAR_CELEBRITIES } from '@/data/celebrities';
import QRCode from 'qrcode';

const Celebrities = () => {
  const navigate = useNavigate();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardNumber = '2204321081688079';
  const [requests, setRequests] = useState<CelebrityRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_contact: '',
    celebrity_name: '',
    request_text: ''
  });

  useEffect(() => {
    loadRequests();
    if (qrCanvasRef.current && showForm) {
      QRCode.toCanvas(qrCanvasRef.current, cardNumber, {
        width: 180,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [showForm]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await celebritiesApi.getAll();
      setRequests(data);
    } catch (error) {
      // Error loading requests
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.requester_name || !formData.celebrity_name || !formData.request_text) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await celebritiesApi.createRequest({
        requester_name: formData.requester_name,
        requester_contact: formData.requester_contact,
        celebrity_name: formData.celebrity_name,
        request_text: formData.request_text
      });

      toast({
        title: 'Обращение создано!',
        description: result.message || `Переведите ${result.amount}₽ на карту Ozon для публикации`,
        duration: 10000
      });

      setFormData({ requester_name: '', requester_contact: '', celebrity_name: '', request_text: '' });
      setShowForm(false);
      await loadRequests();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить обращение',
        variant: 'destructive'
      });
    }
  };

  const filteredCelebrities = searchQuery
    ? CELEBRITIES.filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      approved: { label: 'Одобрено', variant: 'default' },
      sent: { label: 'Отправлено', variant: 'default' },
      rejected: { label: 'Отклонено', variant: 'destructive' }
    };
    const info = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Icon name="Star" size={48} className="text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Обратиться к знаменитости</CardTitle>
            <CardDescription className="text-base mt-2">
              Напишите обращение известному человеку. Мы поможем донести вашу просьбу до адресата.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              size="lg" 
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <Icon name="Send" size={20} />
              {showForm ? 'Скрыть форму' : 'Написать обращение'}
            </Button>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="border-primary/30 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Mail" size={24} />
                Форма обращения
              </CardTitle>
              <CardDescription>
                Выберите знаменитость или укажите своего адресата
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Популярные знаменитости</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {POPULAR_CELEBRITIES.map((celeb) => (
                    <Button
                      key={celeb.name}
                      variant={formData.celebrity_name === celeb.name ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, celebrity_name: celeb.name })}
                      className="justify-start"
                    >
                      <Icon name={celeb.icon as any} size={16} className="mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{celeb.name}</div>
                        <div className="text-xs opacity-70">{celeb.category}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Имя знаменитости * (база из 500+ имён)</label>
                <Input
                  placeholder="Начните вводить имя для поиска..."
                  value={formData.celebrity_name}
                  onChange={(e) => {
                    setFormData({ ...formData, celebrity_name: e.target.value });
                    setSearchQuery(e.target.value);
                  }}
                  onFocus={() => setSearchQuery(formData.celebrity_name)}
                  onBlur={() => setTimeout(() => setSearchQuery(''), 200)}
                />
                {searchQuery && filteredCelebrities.length > 0 && (
                  <Card className="mt-2 max-h-48 overflow-y-auto">
                    <CardContent className="p-2">
                      {filteredCelebrities.slice(0, 10).map((name) => (
                        <Button
                          key={name}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            setFormData({ ...formData, celebrity_name: name });
                            setSearchQuery('');
                          }}
                        >
                          {name}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ваше имя *</label>
                <Input
                  placeholder="Как вас зовут?"
                  value={formData.requester_name}
                  onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Контакт для связи *</label>
                <Input
                  placeholder="Телефон, email или Telegram"
                  value={formData.requester_contact}
                  onChange={(e) => setFormData({ ...formData, requester_contact: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Текст обращения *</label>
                <Textarea
                  placeholder="Опишите вашу ситуацию и что вы хотите попросить..."
                  value={formData.request_text}
                  onChange={(e) => setFormData({ ...formData, request_text: e.target.value })}
                  rows={6}
                />
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="Coins" size={20} />
                    Стоимость обращения: 60₽
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <Icon name="CreditCard" size={28} className="text-primary" />
                      <div>
                        <div className="text-sm font-semibold">Карта Ozon:</div>
                        <div className="text-xl font-mono text-primary">2204 3210 8168 8079</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-xs font-medium mb-2">Отсканируйте QR-код:</div>
                      <canvas ref={qrCanvasRef} className="border-2 border-primary/20 rounded-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  <Icon name="Send" size={18} className="mr-2" />
                  Отправить обращение и оплатить
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="List" size={24} />
              Публичные обращения ({requests.length})
            </CardTitle>
            <CardDescription>
              Обращения других пользователей к знаменитостям
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Star" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет обращений. Будьте первым!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="border-primary/10">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon name="User" size={16} className="text-primary" />
                              <span className="font-semibold">{request.requester_name}</span>
                              <Icon name="ArrowRight" size={16} />
                              <Icon name="Star" size={16} className="text-warning" />
                              <span className="font-semibold text-primary">{request.celebrity_name}</span>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.request_text.length > 200 
                            ? `${request.request_text.slice(0, 200)}...` 
                            : request.request_text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
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

export default Celebrities;