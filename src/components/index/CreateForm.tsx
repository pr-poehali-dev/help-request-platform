import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';

interface CreateFormProps {
  announcement: {
    title: string;
    description: string;
    category: string;
    author_contact: string;
    type: 'regular' | 'boosted' | 'vip';
  };
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  categories: Array<{ value: string; label: string; icon: string }>;
}

export const CreateForm = ({ announcement, onChange, onSubmit, categories }: CreateFormProps) => {
  return (
    <Card className="max-w-3xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="PenSquare" size={24} />
          Создать объявление
        </CardTitle>
        <CardDescription>
          Заполните форму для создания объявления о помощи
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Заголовок *</Label>
          <Input
            id="title"
            placeholder="Краткое описание проблемы"
            value={announcement.title}
            onChange={(e) => onChange('title', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Описание *</Label>
          <Textarea
            id="description"
            placeholder="Подробно опишите, какая помощь вам нужна"
            value={announcement.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <Label>Категория</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.filter(c => c.value !== 'all').map((cat) => (
              <Button
                key={cat.value}
                type="button"
                variant={announcement.category === cat.value ? 'default' : 'outline'}
                onClick={() => onChange('category', cat.value)}
                className="justify-start"
              >
                <Icon name={cat.icon as any} size={16} className="mr-2" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Контакт для связи *</Label>
          <Input
            id="contact"
            placeholder="Telegram, WhatsApp, телефон или email"
            value={announcement.author_contact}
            onChange={(e) => onChange('author_contact', e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Тип объявления</Label>
          <RadioGroup 
            value={announcement.type} 
            onValueChange={(value) => onChange('type', value)}
          >
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="regular" id="regular" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="regular" className="text-base font-semibold cursor-pointer">
                        Обычное
                      </Label>
                      <span className="text-2xl font-bold text-primary">10₽</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Стандартное размещение в общем списке
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-warning transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="boosted" id="boosted" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="boosted" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        <Icon name="TrendingUp" size={18} className="text-warning" />
                        Поднятое
                      </Label>
                      <span className="text-2xl font-bold text-warning">20₽</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Отображается выше обычных объявлений
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="vip" id="vip" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="vip" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                        <Icon name="Crown" size={18} className="text-primary" />
                        VIP
                      </Label>
                      <span className="text-2xl font-bold text-primary">100₽</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Максимальная видимость, цветное выделение, показывается в самом верху
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        <Button 
          onClick={onSubmit}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Icon name="Send" className="mr-2" size={20} />
          Создать и перейти к оплате
        </Button>
      </CardContent>
    </Card>
  );
};
