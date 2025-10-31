import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const TelegramBot = () => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>('');
  const [userData, setUserData] = useState({
    balance: 0,
    withdrawBalance: 0,
    partners: 0,
    investments: [] as any[],
    activeInvestment: null as any,
  });
  const [showInvestment, setShowInvestment] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showPartners, setShowPartners] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id.toString());
        loadUserData(user.id.toString());
      }
    }
  }, []);

  const loadUserData = async (id: string) => {
    setUserData({
      balance: 1000.0,
      withdrawBalance: 250.0,
      partners: 3,
      investments: [],
      activeInvestment: {
        amount: 500.0,
        accumulated: 15.0,
      },
    });
  };

  const handleInvest = async () => {
    const amount = parseFloat(investmentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму',
        variant: 'destructive',
      });
      return;
    }

    if (amount > userData.balance) {
      toast({
        title: 'Недостаточно средств',
        description: 'Пополните баланс для инвестирования',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Успешно!',
      description: 'Инвестиция активирована',
    });
    setUserData(prev => ({
      ...prev,
      balance: prev.balance - amount,
      activeInvestment: {
        amount: amount,
        accumulated: 0,
      }
    }));
    setInvestmentAmount('');
    setShowInvestment(false);
  };

  const handleCollect = async () => {
    const profit = userData.activeInvestment?.amount * 0.01 || 0;
    toast({
      title: 'Собрано!',
      description: `Вы получили ${profit.toFixed(2)} ₽`,
    });
    setUserData(prev => ({
      ...prev,
      withdrawBalance: prev.withdrawBalance + profit,
      activeInvestment: {
        ...prev.activeInvestment,
        accumulated: 0,
      }
    }));
  };

  const MainScreen = () => (
    <div className="space-y-4 p-4">
      <div
        className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white"
        style={{
          backgroundImage: 'url(https://cdn.poehali.dev/files/a602d89d-bd95-4844-9784-24854e213b0b.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <p className="relative text-xl font-bold z-10">Эту картинку можно изменить</p>
      </div>

      <Card className="bg-gradient-to-br from-purple-900 to-purple-700 text-white border-0">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="IdCard" size={20} />
            <p className="text-sm">Ваш ID: {userId || '8497614241'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="DollarSign" size={20} />
            <p>Ваш баланс: <span className="font-bold">{userData.balance.toFixed(2)} ₽</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="CreditCard" size={20} />
            <p>Баланс для вывода: <span className="font-bold">{userData.withdrawBalance.toFixed(2)} ₽</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            <p>Партнеров: <span className="font-bold">{userData.partners} чел.</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => setShowWallet(true)}>
          <Icon name="Wallet" size={24} />
          <span>Пополнить</span>
        </Button>
        <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => setShowWallet(true)}>
          <Icon name="ArrowUpRight" size={24} />
          <span>Вывести</span>
        </Button>
      </div>

      <Button className="w-full h-16 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowInvestment(false)}>
        <Icon name="RefreshCw" size={20} className="mr-2" />
        Реинвестировать
      </Button>

      <Button className="w-full h-16 bg-yellow-600 hover:bg-yellow-700 text-white">
        <Icon name="FileText" size={20} className="mr-2" />
        История выводов
      </Button>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button className="h-24 flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowInvestment(true)}>
          <Icon name="TrendingUp" size={28} />
          <span className="text-sm">💻 Инвестиции</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setShowPartners(true)}>
          <Icon name="Users2" size={28} />
          <span className="text-sm">🏙️ Партнёрам</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-orange-600 hover:bg-orange-700 text-white">
          <Icon name="CreditCard" size={28} />
          <span className="text-sm">💳 Кошелёк</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-pink-600 hover:bg-pink-700 text-white">
          <Icon name="Calculator" size={28} />
          <span className="text-sm">🧮 Калькулятор</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Icon name="BookOpen" size={28} />
          <span className="text-sm">📚 Обучение</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-gray-700 hover:bg-gray-800 text-white">
          <Icon name="Settings" size={28} />
          <span className="text-sm">⚙️ Настройки</span>
        </Button>
      </div>
    </div>
  );

  const InvestmentScreen = () => (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => setShowInvestment(false)} className="mb-2">
        <Icon name="ArrowLeft" size={20} className="mr-2" />
        Назад
      </Button>

      <Card className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white border-0">
        <CardHeader>
          <CardTitle>💰 Инвестиции</CardTitle>
          <CardDescription className="text-gray-200">
            Открывай инвестиции и получай стабильную прибыль в данном разделе, после собирай доход:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="Percent" size={18} />
            <p>Процент прибыли: <span className="font-bold">1%</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Clock" size={18} />
            <p>Время доходности: <span className="font-bold">24 часа</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Calendar" size={18} />
            <p>Срок вклада: <span className="font-bold">Пожизненно</span></p>
          </div>
          <Separator className="my-3 bg-white/20" />
          <div className="flex items-center gap-2">
            <Icon name="Wallet" size={18} />
            <p>Ваш вклад: <span className="font-bold">{userData.activeInvestment?.amount || 0} ₽</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="DollarSign" size={18} />
            <p>Накопление: <span className="font-bold">{userData.activeInvestment?.accumulated || 0} ₽</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Timer" size={18} />
            <p>Время до сбора: <span className="font-bold">00:00:00</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Input
          type="number"
          placeholder="Введите сумму для инвестирования"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          className="h-12 text-lg"
        />
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-14 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInvest}>
            Инвестировать
          </Button>
          <Button className="h-14 bg-green-600 hover:bg-green-700 text-white" onClick={handleCollect}>
            Собрать
          </Button>
        </div>
      </div>
    </div>
  );

  const PartnersScreen = () => (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => setShowPartners(false)} className="mb-2">
        <Icon name="ArrowLeft" size={20} className="mr-2" />
        Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Users2" size={24} />
            Партнёрская программа
          </CardTitle>
          <CardDescription>
            Приглашайте друзей и получайте вознаграждение за каждого активного партнёра
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <p className="text-2xl font-bold text-center text-purple-800">
              {userData.partners} партнёров
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Ваша реферальная ссылка:</p>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={`https://t.me/YourBot?start=${userId}`}
                className="flex-1"
              />
              <Button size="icon" onClick={() => {
                navigator.clipboard.writeText(`https://t.me/YourBot?start=${userId}`);
                toast({ title: 'Скопировано!' });
              }}>
                <Icon name="Copy" size={18} />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Условия программы:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 5% с первого депозита партнёра</li>
              <li>• 2% с каждой инвестиции партнёра</li>
              <li>• Бонус за каждые 10 активных партнёров</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const WalletScreen = () => (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => setShowWallet(false)} className="mb-2">
        <Icon name="ArrowLeft" size={20} className="mr-2" />
        Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Wallet" size={24} />
            Кошелёк
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white text-center">
            <Icon name="Wallet" size={48} className="mx-auto mb-3" />
            <p className="text-3xl font-bold mb-1">{userData.withdrawBalance.toFixed(2)} ₽</p>
            <p className="text-sm opacity-90">Доступно для вывода</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button className="h-16" variant="outline">
              <Icon name="Download" size={20} className="mr-2" />
              Пополнить
            </Button>
            <Button className="h-16" variant="default">
              <Icon name="Upload" size={20} className="mr-2" />
              Вывести
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Способы пополнения:</h4>
            <div className="grid gap-2">
              <Button variant="outline" className="justify-start h-auto py-3">
                <Icon name="CreditCard" size={20} className="mr-3" />
                <div className="text-left">
                  <p className="font-medium">Банковская карта</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, МИР</p>
                </div>
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <Icon name="Smartphone" size={20} className="mr-3" />
                <div className="text-left">
                  <p className="font-medium">СБП</p>
                  <p className="text-xs text-muted-foreground">Система быстрых платежей</p>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (showInvestment) return <InvestmentScreen />;
  if (showWallet) return <WalletScreen />;
  if (showPartners) return <PartnersScreen />;

  return <MainScreen />;
};

export default TelegramBot;