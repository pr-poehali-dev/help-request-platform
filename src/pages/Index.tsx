import { useState, useEffect, useCallback } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; amount: number; card: string; qrCode: string }>({
    open: false,
    amount: 0,
    card: '',
    qrCode: ''
  });

  useEffect(() => {
    loadAnnouncements();
    announcementsApi.trackVisit();
  }, [loadAnnouncements]);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.getAll();
      setAnnouncements(data);
    } catch {
      // Error loading announcements
    } finally {
      setLoading(false);
    }
  }, []);

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

      setPaymentDialog({
        open: true,
        amount: result.amount,
        card: result.ozon_card,
        qrCode: ''
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
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Загрузка объявлений...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <div className="text-center py-12">
                  <div className="bg-primary/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Icon name="Heart" size={48} className="text-primary" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Добро пожаловать!</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Здесь вы можете создать объявление о помощи или откликнуться на чужое. 
                    Вместе мы делаем мир добрее!
                  </p>
                  <Button onClick={() => setActiveTab('create')} size="lg" className="gap-2">
                    <Icon name="Plus" size={20} />
                    Создать объявление
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <FilterBar 
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categories={CATEGORIES}
                />
                
                {filteredAnnouncements.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="SearchX" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">В категории «{CATEGORIES.find(c => c.value === selectedCategory)?.label}» нет объявлений</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedCategory('all')}
                      className="mt-4"
                    >
                      <Icon name="Grid3x3" className="mr-2" size={16} />
                      Показать все категории
                    </Button>
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
                <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">У вас пока нет объявлений</p>
                <p className="text-muted-foreground mb-6">Создайте своё первое объявление</p>
                <Button onClick={() => setActiveTab('create')} size="lg" className="gap-2">
                  <Icon name="Plus" size={18} />
                  Создать объявление
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
        onOpenChange={(open) => setResponseDialog({ open, announcementId: 0, title: '' })}
        announcementId={responseDialog.announcementId}
        announcementTitle={responseDialog.title}
      />

      <ResponsesDialog
        open={responsesDialog.open}
        onOpenChange={(open) => setResponsesDialog({ open, announcementId: 0, title: '', isAuthor: false })}
        announcementId={responsesDialog.announcementId}
        announcementTitle={responsesDialog.title}
        isAuthor={responsesDialog.isAuthor}
        currentUserName={CURRENT_USER}
      />

      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ ...paymentDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="QrCode" size={24} />
              Оплата объявления
            </DialogTitle>
            <DialogDescription>
              Отсканируйте QR-код для оплаты {paymentDialog.amount}₽
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/50 p-4 rounded-lg text-center">
              <p className="text-sm font-medium mb-2">Номер карты Ozon:</p>
              <p className="text-xl font-bold tracking-wider mb-3">{paymentDialog.card}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(paymentDialog.card);
                  toast({ title: 'Скопировано!', description: 'Номер карты скопирован в буфер обмена' });
                }}
              >
                <Icon name="Copy" className="mr-2" size={14} />
                Скопировать номер
              </Button>
            </div>
            <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg">
              <p className="text-sm text-warning-foreground flex items-start gap-2">
                <Icon name="Info" size={16} className="mt-0.5 shrink-0" />
                <span>После проверки оплаты администратором объявление будет опубликовано</span>
              </p>
            </div>
            <Button 
              onClick={() => setPaymentDialog({ ...paymentDialog, open: false })} 
              className="w-full"
            >
              Понятно
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;