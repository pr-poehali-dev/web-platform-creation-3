import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf';

const Index = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('card');
  const [showMenu, setShowMenu] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showBoostDialog, setShowBoostDialog] = useState(false);

  const DEMO_TELEGRAM_ID = 'demo_user_' + Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch(`${API_URL}?path=user&telegram_id=${DEMO_TELEGRAM_ID}`);
      const userData = await response.json();
      setUser(userData);
      setBalance(parseFloat(userData.balance || 0));
      loadTransactions(userData.id);
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные пользователя',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (userId: number) => {
    try {
      const response = await fetch(`${API_URL}?path=transactions&user_id=${userId}`);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const addTransaction = async (type: string, amount: number, description: string) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}?path=transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          type,
          amount,
          description
        })
      });

      if (response.ok) {
        await loadUser();
        toast({
          title: 'Успешно!',
          description: 'Операция выполнена',
        });
        return true;
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить операцию',
        variant: 'destructive'
      });
    }
    return false;
  };

  const referralCode = user?.referral_code || 'LOADING...';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-200/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                <Icon name="Sparkles" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">BonusHub</h1>
                <p className="text-xs text-muted-foreground">Твой бонусный мир</p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="relative"
            >
              <Icon name={showMenu ? "X" : "Menu"} size={24} />
            </Button>
          </div>

          {showMenu && (
            <div className="mt-4 p-4 rounded-2xl gradient-card border border-purple-200 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="hover-lift"
                  onClick={() => setShowBoostDialog(true)}
                >
                  <Icon name="TrendingUp" size={18} className="mr-2" />
                  Накрутка
                </Button>
                <Button variant="outline" className="hover-lift">
                  <Icon name="MessageCircle" size={18} className="mr-2" />
                  Поддержка
                </Button>
                <Button variant="outline" className="hover-lift">
                  <Icon name="Handshake" size={18} className="mr-2" />
                  Партнёрство
                </Button>
                <Button variant="outline" className="hover-lift">
                  <Icon name="Shield" size={18} className="mr-2" />
                  Админка
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="mb-8 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full gradient-card border border-purple-300 mb-4">
            <Icon name="Wallet" size={24} className="text-primary" />
            <span className="text-3xl font-bold text-gradient">{loading ? '...' : balance.toFixed(2)} ₽</span>
          </div>
          <p className="text-muted-foreground">Твой баланс</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => addTransaction('card_bonus', 500, 'Демо-бонус за карту')}
            disabled={loading}
          >
            <Icon name="Gift" size={16} className="mr-2" />
            Получить демо-бонус 500₽
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Card className="p-6 hover-lift gradient-card border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Icon name="CreditCard" size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Альфа-Карта 🌟</h3>
                <p className="text-muted-foreground mb-4">
                  Получи <span className="font-bold text-primary">1000 ₽</span> (500₽ от нас + 500₽ от банка)
                </p>
                <Button 
                  className="gradient-primary text-white hover:opacity-90 transition-opacity"
                  onClick={() => setShowCardDialog(true)}
                >
                  Узнать подробности
                  <Icon name="ArrowRight" size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card 
              className="p-6 hover-lift cursor-pointer gradient-card border-2 border-purple-200"
              onClick={() => setShowReferralDialog(true)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-lg">Реферальная программа</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Приглашай друзей и получай <span className="font-bold text-primary">200 ₽</span> за каждого!
              </p>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Icon name="Gift" size={14} className="mr-1" />
                Активно
              </Badge>
            </Card>

            <Card 
              className="p-6 hover-lift cursor-pointer gradient-card border-2 border-purple-200"
              onClick={() => setShowBoostDialog(true)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Icon name="TrendingUp" size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-lg">Накрутка</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Telegram, TikTok подписчики, лайки и просмотры
              </p>
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <Icon name="Zap" size={14} className="mr-1" />
                Популярно
              </Badge>
            </Card>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-200 z-40">
        <div className="container mx-auto px-2">
          <div className="grid grid-cols-5 gap-1 py-2">
            <button
              onClick={() => setShowCardDialog(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Icon name="CreditCard" size={24} className="text-primary" />
              <span className="text-xs font-medium">Карта</span>
            </button>

            <button
              onClick={() => setShowBalanceDialog(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Icon name="Wallet" size={24} className="text-primary" />
              <span className="text-xs font-medium">Баланс</span>
            </button>

            <button
              onClick={() => setShowReferralDialog(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Icon name="Users" size={24} className="text-primary" />
              <span className="text-xs font-medium">Рефералы</span>
            </button>

            <button
              onClick={() => setShowWithdrawDialog(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Icon name="ArrowUpCircle" size={24} className="text-primary" />
              <span className="text-xs font-medium">Вывод</span>
            </button>

            <button
              onClick={() => setShowDepositDialog(true)}
              className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <Icon name="ArrowDownCircle" size={24} className="text-primary" />
              <span className="text-xs font-medium">Пополнение</span>
            </button>
          </div>
        </div>
      </nav>

      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Альфа-Карта 🌟</DialogTitle>
            <DialogDescription>Получи 1000 ₽ за оформление карты</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl gradient-card border border-purple-200">
              <p className="text-sm leading-relaxed mb-4">
                Привет, друзья! У нас отличная новость! 🌟 Вы можете получить <span className="font-bold text-primary">500 ₽</span> от нас и еще <span className="font-bold text-primary">500 ₽</span> от Альфа-Банка! В итоге ваша сумма составит <span className="font-bold text-xl text-gradient">1000 ₽</span>!
              </p>
              
              <Separator className="my-4" />
              
              <h4 className="font-bold mb-3">Что нужно сделать?</h4>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="font-bold text-primary">1.</span>
                  <span>Оформить Альфа-Карту по ссылке: <a href="https://alfa.me/ASQWHN" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">https://alfa.me/ASQWHN</a></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">2.</span>
                  <span>Активировать карту в приложении</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">3.</span>
                  <span>Сделать покупку от <span className="font-bold">200 ₽</span></span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">4.</span>
                  <span>Отправить чек на <a href="https://t.me/Alfa_Bank778" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">@Alfa_Bank778</a> для выплаты 500 ₽</span>
                </li>
              </ol>
              
              <Separator className="my-4" />
              
              <p className="text-sm text-muted-foreground">
                Альфа-Карта предлагает <span className="font-medium">бесплатное обслуживание</span>, <span className="font-medium">кэшбэк каждый месяц</span> и множество классных предложений от наших партнёров! ❤️ Не упустите шанс!
              </p>
            </div>
            
            <Button className="w-full gradient-primary text-white" asChild>
              <a href="https://alfa.me/ASQWHN" target="_blank" rel="noopener noreferrer">
                Оформить карту
                <Icon name="ExternalLink" size={18} className="ml-2" />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Твой баланс</DialogTitle>
            <DialogDescription>История операций и текущий баланс</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-6 rounded-xl gradient-card border border-purple-200">
              <Icon name="Wallet" size={48} className="mx-auto mb-3 text-primary" />
              <p className="text-4xl font-bold text-gradient mb-2">{balance.toFixed(2)} ₽</p>
              <p className="text-sm text-muted-foreground">Доступно для вывода</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Последние операции</h4>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="Receipt" size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Пока нет операций</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-3 rounded-lg bg-purple-50 flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <p className={`font-bold ${parseFloat(tx.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(tx.amount) > 0 ? '+' : ''}{parseFloat(tx.amount).toFixed(2)} ₽
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Реферальная программа</DialogTitle>
            <DialogDescription>Приглашай друзей и зарабатывай</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 rounded-xl gradient-card border border-purple-200 text-center">
              <Icon name="Gift" size={48} className="mx-auto mb-3 text-primary" />
              <p className="text-lg mb-2">Получай <span className="font-bold text-2xl text-gradient">200 ₽</span></p>
              <p className="text-sm text-muted-foreground">за каждого друга, который оформит карту</p>
            </div>
            
            <div className="space-y-2">
              <Label>Твоя реферальная ссылка</Label>
              <div className="flex gap-2">
                <Input value={`https://bonushub.ru/ref/${referralCode}`} readOnly />
                <Button variant="outline" size="icon">
                  <Icon name="Copy" size={18} />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Переходов</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-xs text-muted-foreground">Рефералов</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="text-2xl font-bold text-primary">0 ₽</p>
                <p className="text-xs text-muted-foreground">Заработано</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Вывод средств</DialogTitle>
            <DialogDescription>Выведи деньги через СБП</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="flex gap-3">
                <Icon name="AlertCircle" size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-900">
                  Минимальная сумма для вывода: <span className="font-bold">500 ₽</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Сумма вывода</Label>
              <Input type="number" placeholder="0" />
            </div>
            
            <div className="space-y-2">
              <Label>Номер телефона</Label>
              <Input type="tel" placeholder="+7 900 000 00 00" />
            </div>
            
            <div className="space-y-2">
              <Label>Банк (СБП)</Label>
              <Input placeholder="Например: Сбербанк" />
            </div>
            
            <Button className="w-full gradient-primary text-white" disabled={balance < 500}>
              Вывести средства
              <Icon name="Send" size={18} className="ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Пополнение баланса</DialogTitle>
            <DialogDescription>Пополни баланс через СБП</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 rounded-xl gradient-card border border-purple-200 text-center">
              <Icon name="Smartphone" size={48} className="mx-auto mb-3 text-primary" />
              <p className="text-sm text-muted-foreground mb-4">
                Переведи деньги на номер через СБП:
              </p>
              <p className="text-2xl font-bold text-gradient mb-2">+7 906 989 22 67</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Icon name="Copy" size={16} className="mr-2" />
                Скопировать номер
              </Button>
            </div>
            
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex gap-3">
                <Icon name="Clock" size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Средства зачисляются автоматически в течение 5 минут после перевода
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Сумма пополнения</Label>
              <Input type="number" placeholder="0" />
            </div>
            
            <Button className="w-full gradient-primary text-white">
              Я перевёл деньги
              <Icon name="Check" size={18} className="ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBoostDialog} onOpenChange={setShowBoostDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-gradient">Накрутка</DialogTitle>
            <DialogDescription>Продвижение в Telegram и TikTok</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="telegram" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="telegram">
                <Icon name="Send" size={18} className="mr-2" />
                Telegram
              </TabsTrigger>
              <TabsTrigger value="tiktok">
                <Icon name="Video" size={18} className="mr-2" />
                TikTok
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="telegram" className="space-y-4 mt-4">
              <Card className="p-4 hover-lift gradient-card border border-purple-200">
                <h4 className="font-bold mb-2">Подписчики на канал</h4>
                <p className="text-sm text-muted-foreground mb-3">От 0.5 ₽ за подписчика</p>
                <div className="flex gap-2">
                  <Input placeholder="Ссылка на канал" />
                  <Button variant="outline">Заказать</Button>
                </div>
              </Card>
              
              <Card className="p-4 hover-lift gradient-card border border-purple-200">
                <h4 className="font-bold mb-2">Участники в чат</h4>
                <p className="text-sm text-muted-foreground mb-3">От 0.7 ₽ за участника</p>
                <div className="flex gap-2">
                  <Input placeholder="Ссылка на чат" />
                  <Button variant="outline">Заказать</Button>
                </div>
              </Card>
              
              <Card className="p-4 hover-lift gradient-card border border-purple-200">
                <h4 className="font-bold mb-2">Просмотры постов</h4>
                <p className="text-sm text-muted-foreground mb-3">От 0.3 ₽ за 1000 просмотров</p>
                <div className="flex gap-2">
                  <Input placeholder="Ссылка на пост" />
                  <Button variant="outline">Заказать</Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="tiktok" className="space-y-4 mt-4">
              <Card className="p-4 hover-lift gradient-card border border-purple-200">
                <h4 className="font-bold mb-2">Подписчики</h4>
                <p className="text-sm text-muted-foreground mb-3">От 1 ₽ за подписчика</p>
                <div className="flex gap-2">
                  <Input placeholder="Ссылка на профиль" />
                  <Button variant="outline">Заказать</Button>
                </div>
              </Card>
              
              <Card className="p-4 hover-lift gradient-card border border-purple-200">
                <h4 className="font-bold mb-2">Лайки</h4>
                <p className="text-sm text-muted-foreground mb-3">От 0.5 ₽ за лайк</p>
                <div className="flex gap-2">
                  <Input placeholder="Ссылка на видео" />
                  <Button variant="outline">Заказать</Button>
                </div>
              </Card>
              
              <Card className="p-4 hover-lift gradient-card border border-purple-200">
                <h4 className="font-bold mb-2">Просмотры</h4>
                <p className="text-sm text-muted-foreground mb-3">От 0.2 ₽ за 1000 просмотров</p>
                <div className="flex gap-2">
                  <Input placeholder="Ссылка на видео" />
                  <Button variant="outline">Заказать</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
            <p className="text-sm text-purple-900">
              <Icon name="Info" size={16} className="inline mr-2" />
              Оплата списывается с твоего баланса. Заказы выполняются в течение 24 часов.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;