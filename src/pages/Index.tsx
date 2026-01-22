import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { announcementsApi, paymentsApi, type Announcement } from '@/lib/api';
import { ResponseDialog } from '@/components/ResponseDialog';
import { ResponsesDialog } from '@/components/ResponsesDialog';
import { Header } from '@/components/index/Header';
import { FilterBar } from '@/components/index/FilterBar';
import { AnnouncementCard } from '@/components/index/AnnouncementCard';
import { CreateForm } from '@/components/index/CreateForm';

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

      toast({
        title: 'Объявление создано!',
        description: result.message || `Переведите ${result.amount}₽ на карту Ozon для публикации`,
        duration: 10000
      });
      
      setNewAnnouncement({ title: '', description: '', category: '', author_contact: '', type: 'regular' });
      setActiveTab('all');
      await loadAnnouncements();
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

  const handleAnnouncementFieldChange = (field: string, value: string) => {
    setNewAnnouncement(prev => ({ ...prev, [field]: value }));
  };

  const handleTrackView = (id: number) => {
    announcementsApi.trackView(id);
  };

  const filteredAnnouncements = selectedCategory === 'all' 
    ? announcements 
    : announcements.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20">
      <Header onCreateClick={() => setActiveTab('create')} />

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
            <FilterBar 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={CATEGORIES}
            />
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Загрузка объявлений...</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="SearchX" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Объявлений не найдено</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAnnouncements.map((item) => (
                  <AnnouncementCard
                    key={item.id}
                    announcement={item}
                    currentUser={CURRENT_USER}
                    onTrackView={handleTrackView}
                    onOpenResponse={openResponseDialog}
                    onOpenResponses={openResponsesDialog}
                    formatDate={formatDate}
                    getTypeInfo={getTypeInfo}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="animate-fade-in">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : announcements.filter(a => a.author === CURRENT_USER).length === 0 ? (
              <div className="text-center py-12">
                <Icon name="Inbox" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">У вас пока нет объявлений</p>
                <Button onClick={() => setActiveTab('create')}>
                  <Icon name="Plus" className="mr-2" size={18} />
                  Создать первое объявление
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {announcements.filter(a => a.author === CURRENT_USER).map((item) => (
                  <AnnouncementCard
                    key={item.id}
                    announcement={item}
                    currentUser={CURRENT_USER}
                    onTrackView={handleTrackView}
                    onOpenResponse={openResponseDialog}
                    onOpenResponses={openResponsesDialog}
                    formatDate={formatDate}
                    getTypeInfo={getTypeInfo}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="animate-fade-in">
            <CreateForm
              announcement={newAnnouncement}
              onChange={handleAnnouncementFieldChange}
              onSubmit={handleCreate}
              categories={CATEGORIES}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-12 flex justify-center gap-4 flex-wrap">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/payment-guide'}
            className="gap-2"
          >
            <Icon name="HelpCircle" size={20} />
            Как разместить объявление?
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/charity'}
            className="gap-2"
          >
            <Icon name="Heart" size={20} />
            Благотворительность
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/celebrities'}
            className="gap-2"
          >
            <Icon name="Star" size={20} />
            Обратиться к знаменитости
          </Button>
        </div>
      </main>

      <ResponseDialog
        open={responseDialog.open}
        onClose={() => setResponseDialog({ open: false, announcementId: 0, title: '' })}
        announcementId={responseDialog.announcementId}
        announcementTitle={responseDialog.title}
      />

      <ResponsesDialog
        open={responsesDialog.open}
        onClose={() => setResponsesDialog({ open: false, announcementId: 0, title: '', isAuthor: false })}
        announcementId={responsesDialog.announcementId}
        announcementTitle={responsesDialog.title}
        isAuthor={responsesDialog.isAuthor}
      />
    </div>
  );
};

export default Index;