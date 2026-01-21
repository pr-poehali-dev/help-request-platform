import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { donationsApi, type Donation } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const Charity = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    donor_name: '',
    donor_contact: '',
    amount: '',
    message: ''
  });

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const data = await donationsApi.getAll();
      setDonations(data);
    } catch (error) {
      console.error('Failed to load donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.donor_name || !formData.amount) {
      toast({
        title: 'Ошибка',
        description: 'Заполните имя и сумму',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseInt(formData.amount);
    if (amount < 1) {
      toast({
        title: 'Ошибка',
        description: 'Сумма должна быть больше 0',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await donationsApi.createDonation({
        donor_name: formData.donor_name,
        donor_contact: formData.donor_contact,
        amount,
        message: formData.message
      });

      toast({
        title: 'Спасибо за поддержку!',
        description: result.message || 'Ваше пожертвование принято'
      });

      if (result.payment_url) {
        window.open(result.payment_url, '_blank');
      }

      setFormData({ donor_name: '', donor_contact: '', amount: '', message: '' });
      setShowForm(false);
      await loadDonations();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать пожертвование',
        variant: 'destructive'
      });
    }
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
                <Icon name="Heart" size={48} className="text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Благотворительность</CardTitle>
            <CardDescription className="text-base mt-2">
              Поддержите развитие платформы "Помощь Рядом". Все средства направляются на помощь нуждающимся.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              size="lg" 
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <Icon name="Coins" size={20} />
              {showForm ? 'Скрыть форму' : 'Сделать пожертвование'}
            </Button>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="border-primary/30 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="DollarSign" size={24} />
                Форма пожертвования
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ваше имя *</label>
                <Input
                  placeholder="Как вас представить?"
                  value={formData.donor_name}
                  onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Контакт для связи</label>
                <Input
                  placeholder="Email или телефон (необязательно)"
                  value={formData.donor_contact}
                  onChange={(e) => setFormData({ ...formData, donor_contact: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Сумма пожертвования (₽) *</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                    >
                      {amount}₽
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Сообщение (необязательно)</label>
                <Textarea
                  placeholder="Ваши пожелания или комментарий..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  <Icon name="Send" size={18} className="mr-2" />
                  Отправить пожертвование
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
              <Icon name="Users" size={24} />
              Список благотворителей ({donations.length})
            </CardTitle>
            <CardDescription>
              Спасибо всем, кто поддерживает наш проект!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
            ) : donations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Heart" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Пока нет пожертвований. Будьте первым!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <Card key={donation.id} className="border-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon name="User" size={16} className="text-primary" />
                            <span className="font-semibold">{donation.donor_name}</span>
                            <span className="text-2xl font-bold text-primary">{donation.amount}₽</span>
                          </div>
                          {donation.message && (
                            <p className="text-sm text-muted-foreground italic">"{donation.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(donation.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <Icon name="Heart" size={24} className="text-primary" />
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

export default Charity;
