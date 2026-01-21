import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { announcementsApi, paymentsApi, type Announcement } from '@/lib/api';
import { ResponseDialog } from '@/components/ResponseDialog';
import { ResponsesDialog } from '@/components/ResponsesDialog';

const CURRENT_USER = 'Вы';

const CATEGORIES = [
  { value: 'all', label: 'Все категории', icon: 'Grid3x3' },
  { value: 'Строительство', label: 'Строительство', icon: 'Hammer' },
  { value: 'Образование', label: 'Образование', icon: 'GraduationCap' },
  { value: 'Быт', label: 'Быт', icon: 'Home' },
  { value: 'Здоровье', label: 'Здоровье', icon: 'Heart' },
  { value: 'Транспорт', label: 'Транспорт', icon: 'Car' },
  { value: 'Разное', label: 'Разное', icon: 'Package' }
];

const Index = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    category: '',
    author_contact: '',
    type: 'regular' as 'regular' | 'boosted' | 'vip'
  });
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; announcementId: number; title: string }>({
    open: false,
    announcementId: 0,
    title: ''
  });
  const [responsesDialog, setResponsesDialog] = useState<{ open: boolean; announcementId: number; title: string; isAuthor: boolean }>({
    open: false,
    announcementId: 0,
    title: '',
    isAuthor: false
  });

  useEffect(() => {
    loadAnnouncements();
    announcementsApi.trackVisit();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.getAll();
      setAnnouncements(data);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.description) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await paymentsApi.createPayment({
        title: newAnnouncement.title,
        description: newAnnouncement.description,
        category: newAnnouncement.category || 'Разное',
        author_name: CURRENT_USER,
        author_contact: newAnnouncement.author_contact,
        type: newAnnouncement.type
      });

      if (result.payment_url) {
        window.open(result.payment_url, '_blank');
        toast({
          title: 'Инструкция по оплате',
          description: `Переведите ${result.amount}₽ на карту ЮMoney ${result.yoomoney_card}. После оплаты напишите администратору для подтверждения.`,
          duration: 10000
        });
        setNewAnnouncement({ title: '', description: '', category: '', author_contact: '', type: 'regular' });
        setActiveTab('all');
        await loadAnnouncements();
      } else {
        toast({
          title: 'Объявление создано!',
          description: `Сумма: ${result.amount}₽`
        });
        setNewAnnouncement({ title: '', description: '', category: '', author_contact: '', type: 'regular' });
        setActiveTab('all');
        await loadAnnouncements();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать объявление',
        variant: 'destructive'
      });
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'vip':
        return { label: 'VIP', color: 'bg-primary text-white', icon: 'Crown' };
      case 'boosted':
        return { label: 'Поднято', color: 'bg-warning text-foreground', icon: 'TrendingUp' };
      default:
        return { label: '', color: '', icon: '' };
    }
  };

  const openResponseDialog = (id: number, title: string) => {
    setResponseDialog({ open: true, announcementId: id, title });
  };

  const openResponsesDialog = (id: number, title: string, isAuthor: boolean) => {
    setResponsesDialog({ open: true, announcementId: id, title, isAuthor });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Только что';
    if (hours < 24) return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  };

  const filteredAnnouncements = selectedCategory === 'all' 
    ? announcements 
    : announcements.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-xl p-2">
                <Icon name="Heart" className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Помощь Рядом</h1>
                <p className="text-sm text-muted-foreground">Платформа взаимопомощи</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/admin'}
              >
                <Icon name="Shield" size={16} />
              </Button>
              <Button 
                onClick={() => setActiveTab('create')}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Icon name="Plus" className="mr-2" size={20} />
                Создать объявление
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="all">
              <Icon name="Home" className="mr-2" size={18} />
              Все
            </TabsTrigger>
            <TabsTrigger value="my">
              <Icon name="User" className="mr-2" size={18} />
              Мои
            </TabsTrigger>
            <TabsTrigger value="create">
              <Icon name="PenSquare" className="mr-2" size={18} />
              Создать
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="animate-fade-in">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Filter" size={20} className="text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Фильтр по категориям:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={selectedCategory === cat.value ? 'bg-primary text-white' : ''}
                  >
                    <Icon name={cat.icon as any} size={14} className="mr-2" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка объявлений...</div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="SearchX" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Объявлений в этой категории пока нет</p>
                <Button variant="outline" className="mt-4" onClick={() => setSelectedCategory('all')}>
                  Показать все
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAnnouncements.map((item) => {
                  const typeInfo = getTypeInfo(item.type);
                  const isAuthor = item.author === CURRENT_USER;
                  return (
                    <Card 
                      key={item.id} 
                      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 animate-scale-in"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                          {typeInfo.label && (
                            <Badge className={typeInfo.color}>
                              <Icon name={typeInfo.icon as any} size={14} className="mr-1" />
                              {typeInfo.label}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Icon name="User" size={14} />
                          {item.author} • {formatDate(item.date)}
                        </CardDescription>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Icon name="Eye" size={14} />
                          <span>{item.views || 0} просмотров</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="bg-accent/50">
                              <Icon name="Tag" size={12} className="mr-1" />
                              {item.category}
                            </Badge>
                            {item.status === 'Ожидает оплаты' && (
                              <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning">
                                <Icon name="Clock" size={12} className="mr-1" />
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {isAuthor ? (
                              <Button size="sm" variant="ghost" onClick={() => openResponsesDialog(item.id, item.title, true)}>
                                <Icon name="MessageCircle" size={16} className="mr-1" />
                                Отклики
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => openResponseDialog(item.id, item.title)}>
                                <Icon name="MessageCircle" size={16} className="mr-1" />
                                Откликнуться
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Мои объявления</CardTitle>
                  <CardDescription>Объявления, которые вы разместили</CardDescription>
                </CardHeader>
                <CardContent>
                  {announcements.filter(a => a.author === CURRENT_USER).length > 0 ? (
                    <div className="space-y-4">
                      {announcements.filter(a => a.author === CURRENT_USER).map((item) => (
                        <Card key={item.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => openResponsesDialog(item.id, item.title, true)}>
                                <Icon name="MessageCircle" size={14} className="mr-1" />
                                Посмотреть отклики
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Icon name="FileX" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">У вас пока нет объявлений</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Создать объявление</CardTitle>
                      <CardDescription>Расскажите, какая помощь вам нужна</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/payment-guide'}
                    >
                      <Icon name="HelpCircle" size={16} className="mr-1" />
                      Как оплатить?
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Заголовок</label>
                    <Input 
                      placeholder="Кратко опишите вашу проблему"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Описание</label>
                    <Textarea 
                      placeholder="Подробно опишите ситуацию и какая помощь требуется"
                      rows={5}
                      value={newAnnouncement.description}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, description: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Категория</label>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.filter(c => c.value !== 'all').map((cat) => (
                        <Button
                          key={cat.value}
                          type="button"
                          variant={newAnnouncement.category === cat.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setNewAnnouncement({...newAnnouncement, category: cat.value})}
                          className={`justify-start ${newAnnouncement.category === cat.value ? 'bg-primary text-white' : ''}`}
                        >
                          <Icon name={cat.icon as any} size={14} className="mr-2" />
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Контакт для связи</label>
                    <Input 
                      placeholder="Телефон, email или telegram"
                      value={newAnnouncement.author_contact}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, author_contact: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Тип публикации</label>
                    <div className="grid gap-3">
                      <Card 
                        className={`cursor-pointer transition-all ${newAnnouncement.type === 'regular' ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setNewAnnouncement({...newAnnouncement, type: 'regular'})}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">Обычное объявление</p>
                            <p className="text-sm text-muted-foreground">Стандартная публикация</p>
                          </div>
                          <Badge>10₽</Badge>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer transition-all ${newAnnouncement.type === 'boosted' ? 'ring-2 ring-warning' : ''}`}
                        onClick={() => setNewAnnouncement({...newAnnouncement, type: 'boosted'})}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="TrendingUp" className="text-warning" />
                            <div>
                              <p className="font-medium">Поднять в ленте</p>
                              <p className="text-sm text-muted-foreground">Будет выше в списке</p>
                            </div>
                          </div>
                          <Badge className="bg-warning">20₽</Badge>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`cursor-pointer transition-all ${newAnnouncement.type === 'vip' ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setNewAnnouncement({...newAnnouncement, type: 'vip'})}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="Crown" className="text-primary" />
                            <div>
                              <p className="font-medium">VIP объявление</p>
                              <p className="text-sm text-muted-foreground">В топе неделю</p>
                            </div>
                          </div>
                          <Badge className="bg-primary">100₽</Badge>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={handleCreate}
                  >
                    <Icon name="Send" className="mr-2" />
                    Опубликовать объявление
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <section className="bg-white/60 backdrop-blur-sm border-t border-border py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="bg-accent rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Icon name="Shield" className="text-primary" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Безопасно</h3>
              <p className="text-sm text-muted-foreground">Проверка объявлений модераторами</p>
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="bg-accent rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Icon name="Users" className="text-primary" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Сообщество</h3>
              <p className="text-sm text-muted-foreground">Тысячи людей готовых помочь</p>
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="bg-accent rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Icon name="Zap" className="text-primary" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Быстро</h3>
              <p className="text-sm text-muted-foreground">Помощь приходит когда нужна</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.location.href = '/payment-guide'}
            >
              <Icon name="HelpCircle" className="mr-2" size={20} />
              Как разместить объявление и оплатить?
            </Button>
          </div>
        </div>
      </section>

      <ResponseDialog
        open={responseDialog.open}
        onOpenChange={(open) => setResponseDialog({ ...responseDialog, open })}
        announcementId={responseDialog.announcementId}
        announcementTitle={responseDialog.title}
      />

      <ResponsesDialog
        open={responsesDialog.open}
        onOpenChange={(open) => setResponsesDialog({ ...responsesDialog, open })}
        announcementId={responsesDialog.announcementId}
        announcementTitle={responsesDialog.title}
        isAuthor={responsesDialog.isAuthor}
      />
    </div>
  );
};

export default Index;