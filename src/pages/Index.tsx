import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

interface Announcement {
  id: number;
  title: string;
  description: string;
  category: string;
  author: string;
  date: string;
  type: 'regular' | 'boosted' | 'vip';
  image?: string;
}

const Index = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Нужна помощь с ремонтом крыши',
      description: 'После урагана повредило кровлю на доме. Нужны специалисты или материалы для починки.',
      category: 'Строительство',
      author: 'Мария К.',
      date: '2 часа назад',
      type: 'vip'
    },
    {
      id: 2,
      title: 'Ищу репетитора по математике',
      description: 'Нужна помощь ребенку 7 класс, подготовка к контрольной. Желательно опыт работы.',
      category: 'Образование',
      author: 'Алексей П.',
      date: '5 часов назад',
      type: 'boosted'
    },
    {
      id: 3,
      title: 'Помогите с переездом',
      description: 'Переезжаю в новую квартиру, нужна помощь с погрузкой мебели. Есть грузовик.',
      category: 'Быт',
      author: 'Дмитрий Л.',
      date: '1 день назад',
      type: 'regular'
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    description: '',
    category: '',
    type: 'regular' as 'regular' | 'boosted' | 'vip'
  });

  const handleCreate = () => {
    if (!newAnnouncement.title || !newAnnouncement.description) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    const announcement: Announcement = {
      id: Date.now(),
      title: newAnnouncement.title,
      description: newAnnouncement.description,
      category: newAnnouncement.category || 'Разное',
      author: 'Вы',
      date: 'Только что',
      type: newAnnouncement.type
    };

    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: '', description: '', category: '', type: 'regular' });
    setActiveTab('all');
    
    const prices = { regular: 10, boosted: 20, vip: 100 };
    toast({
      title: 'Объявление создано!',
      description: `К оплате: ${prices[newAnnouncement.type]}₽`
    });
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((item) => {
                const typeInfo = getTypeInfo(item.type);
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
                        {item.author} • {item.date}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-accent/50">
                          <Icon name="Tag" size={12} className="mr-1" />
                          {item.category}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Icon name="MessageCircle" size={16} className="mr-1" />
                          Откликнуться
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="my" className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Мои объявления</CardTitle>
                  <CardDescription>Объявления, которые вы разместили</CardDescription>
                </CardHeader>
                <CardContent>
                  {announcements.filter(a => a.author === 'Вы').length > 0 ? (
                    <div className="space-y-4">
                      {announcements.filter(a => a.author === 'Вы').map((item) => (
                        <Card key={item.id}>
                          <CardHeader>
                            <CardTitle className="text-base">{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Icon name="Edit" size={14} className="mr-1" />
                                Редактировать
                              </Button>
                              <Button size="sm" variant="outline">
                                <Icon name="Trash2" size={14} className="mr-1" />
                                Удалить
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
                  <CardTitle>Создать объявление</CardTitle>
                  <CardDescription>Расскажите, какая помощь вам нужна</CardDescription>
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
                    <Input 
                      placeholder="Например: Быт, Образование, Здоровье"
                      value={newAnnouncement.category}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
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
        </div>
      </section>
    </div>
  );
};

export default Index;
