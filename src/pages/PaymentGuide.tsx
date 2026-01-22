import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const PaymentGuide = () => {
  const navigate = useNavigate();
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardNumber = '2204321081688079';

  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, cardNumber, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 via-background to-accent/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Icon name="HelpCircle" size={48} className="text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Как разместить объявление</CardTitle>
            <p className="text-muted-foreground mt-2">
              Простая инструкция по оплате и размещению
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                Создайте объявление
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Нажмите кнопку <strong>"Создать объявление"</strong> и заполните форму:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={20} className="text-primary mt-0.5" />
                  <span>Укажите заголовок и описание вашей проблемы</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={20} className="text-primary mt-0.5" />
                  <span>Выберите подходящую категорию</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Check" size={20} className="text-primary mt-0.5" />
                  <span>Оставьте контакт для связи (телефон, email или Telegram)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                Выберите тип объявления
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">Обычное</CardTitle>
                      <Icon name="FileText" className="text-muted-foreground" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-primary">10₽</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Стандартное размещение</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Видно всем пользователям</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-warning/50">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">Поднятое</CardTitle>
                      <Icon name="TrendingUp" className="text-warning" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-warning">20₽</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Выше обычных объявлений</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Больше откликов</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">VIP</CardTitle>
                      <Icon name="Crown" className="text-primary" size={24} />
                    </div>
                    <div className="text-3xl font-bold text-primary">100₽</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Самое верхнее место</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Выделение цветом</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-0.5" />
                        <span>Максимум внимания</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                Оплатите через Ozon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                После создания объявления откроется страница для оплаты:
              </p>
              
              <div className="bg-background rounded-lg p-4 border-2 border-primary/20">
                <div className="grid md:grid-cols-2 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <Icon name="CreditCard" size={32} className="text-primary" />
                    <div>
                      <div className="font-semibold">Номер карты Ozon:</div>
                      <div className="text-2xl font-mono text-primary">2204 3210 8168 8079</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-sm font-medium mb-2">Отсканируйте QR-код:</div>
                    <canvas ref={qrCanvasRef} className="border-2 border-primary/20 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-medium flex items-center gap-2">
                  <Icon name="Info" className="text-primary" size={20} />
                  Способы оплаты:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                    <Icon name="Smartphone" className="text-primary mt-1" size={20} />
                    <div>
                      <div className="font-medium">С телефона</div>
                      <div className="text-sm text-muted-foreground">
                        Переведите через приложение банка
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                    <Icon name="Monitor" className="text-primary mt-1" size={20} />
                    <div>
                      <div className="font-medium">С компьютера</div>
                      <div className="text-sm text-muted-foreground">
                        Переведите через интернет-банк на карту
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                Подтверждение оплаты
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                После перевода денег:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <Icon name="MessageCircle" size={20} className="text-primary mt-0.5" />
                  <span>Напишите администратору о том, что оплатили</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="Clock" size={20} className="text-primary mt-0.5" />
                  <span>Администратор проверит платёж и подтвердит его</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="CheckCircle" size={20} className="text-primary mt-0.5" />
                  <span>Ваше объявление автоматически опубликуется</span>
                </li>
              </ul>

              <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Icon name="Zap" className="text-primary mt-1" size={24} />
                  <div>
                    <div className="font-semibold text-primary mb-1">Быстрое подтверждение</div>
                    <p className="text-sm text-muted-foreground">
                      Обычно проверка занимает от 5 до 30 минут. Следите за статусом в разделе "Мои объявления"
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary p-4 rounded-full">
                  <Icon name="Heart" size={40} className="text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Готовы начать?</h3>
                <p className="text-muted-foreground mb-4">
                  Разместите объявление прямо сейчас и найдите помощь в вашем районе!
                </p>
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => navigate('/')}
                >
                  <Icon name="Plus" size={20} className="mr-2" />
                  Создать объявление
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentGuide;