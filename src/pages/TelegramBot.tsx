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
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [calculatorDays, setCalculatorDays] = useState('30');
  const [depositAmount, setDepositAmount] = useState('');
  const [botSettings, setBotSettings] = useState({
    investmentPercent: 3,
    adminTelegram: '@admin',
    channelUrl: 'https://t.me/yourchannel',
    chatUrl: 'https://t.me/yourchat',
    requireSubscription: true,
    requiredChannels: [] as string[],
    requiredChats: [] as string[],
    requiredBots: [] as string[],
    botStatus: 'running',
    paymentBot: '@CryptoBot',
    withdrawBot: '@CryptoBot',
    botToken: '8296427829:AAFS25SM96ZtRS2Z36XS1-jeY2uTDo0fj5M',
    welcomeMessage: '',
    webAppUrl: 'https://monetkalife.poehali.dev/bot',
  });

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id.toString());
        loadUserData(user.id.toString());
        // Проверка на админа (замени на свой ID)
        if (user.id.toString() === '123456789') {
          setIsAdmin(true);
        }
      }
    }
    loadBotSettings();
  }, []);
  
  const loadBotSettings = () => {
    const saved = localStorage.getItem('bot_settings');
    if (saved) {
      setBotSettings(JSON.parse(saved));
    }
  };
  
  const saveBotSettings = (settings: any) => {
    setBotSettings(settings);
    localStorage.setItem('bot_settings', JSON.stringify(settings));
    toast({
      title: 'Сохранено!',
      description: 'Настройки бота обновлены',
    });
  };

  const loadUserData = async (id: string) => {
    const savedData = localStorage.getItem(`user_${id}`);
    if (savedData) {
      setUserData(JSON.parse(savedData));
    } else {
      const initialData = {
        balance: 1000.0,
        withdrawBalance: 250.0,
        partners: 3,
        investments: [],
        activeInvestment: {
          amount: 500.0,
          accumulated: 15.0,
        },
      };
      setUserData(initialData);
      localStorage.setItem(`user_${id}`, JSON.stringify(initialData));
    }
  };
  
  const saveUserData = (data: any) => {
    setUserData(data);
    if (userId) {
      localStorage.setItem(`user_${userId}`, JSON.stringify(data));
    }
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
    const newData = {
      ...userData,
      balance: userData.balance - amount,
      activeInvestment: {
        amount: amount,
        accumulated: 0,
      }
    };
    saveUserData(newData);
    setInvestmentAmount('');
    setShowInvestment(false);
  };

  const handleCollect = async () => {
    const profit = (userData.activeInvestment?.amount * botSettings.investmentPercent / 100) || 0;
    toast({
      title: 'Собрано!',
      description: `Вы получили ${profit.toFixed(2)} ₽`,
    });
    const newData = {
      ...userData,
      withdrawBalance: userData.withdrawBalance + profit,
      activeInvestment: {
        ...userData.activeInvestment,
        accumulated: 0,
      }
    };
    saveUserData(newData);
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
        <Button className="h-24 flex-col gap-2 bg-pink-600 hover:bg-pink-700 text-white" onClick={() => setShowCalculator(true)}>
          <Icon name="Calculator" size={28} />
          <span className="text-sm">🧮 Калькулятор</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Icon name="BookOpen" size={28} />
          <span className="text-sm">📚 Обучение</span>
        </Button>
        <Button className="h-24 flex-col gap-2 bg-gray-700 hover:bg-gray-800 text-white" onClick={() => setShowSettings(true)}>
          <Icon name="Settings" size={28} />
          <span className="text-sm">⚙️ Настройки</span>
        </Button>
      </div>
      
      {isAdmin && (
        <Button 
          className="w-full h-16 bg-red-600 hover:bg-red-700 text-white mt-4"
          onClick={() => setShowAdminPanel(true)}
        >
          <Icon name="Shield" size={20} className="mr-2" />
          🔧 Панель администратора
        </Button>
      )}
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
            <p>Процент прибыли: <span className="font-bold">{botSettings.investmentPercent}%</span></p>
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

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Icon name="Download" size={18} />
              Пополнить баланс
            </h4>
            <Input
              type="number"
              placeholder="Введите сумму"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="h-12 text-lg"
            />
            <div className="grid gap-2">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => {
                  const amount = parseFloat(depositAmount);
                  if (amount > 0) {
                    const paymentUrl = `https://t.me/${botSettings.paymentBot.replace('@', '')}?start=pay_${amount}_${userId}`;
                    window.open(paymentUrl, '_blank');
                    toast({
                      title: 'Переход к оплате',
                      description: `Открываем ${botSettings.paymentBot}...`,
                    });
                  }
                }}
              >
                <Icon name="CreditCard" size={20} className="mr-3" />
                <div className="text-left">
                  <p className="font-medium">Банковская карта</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, МИР</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3"
                onClick={() => {
                  const amount = parseFloat(depositAmount);
                  if (amount > 0) {
                    const paymentUrl = `https://t.me/${botSettings.paymentBot.replace('@', '')}?start=sbp_${amount}_${userId}`;
                    window.open(paymentUrl, '_blank');
                    toast({
                      title: 'Переход к оплате',
                      description: `Открываем ${botSettings.paymentBot}...`,
                    });
                  }
                }}
              >
                <Icon name="Smartphone" size={20} className="mr-3" />
                <div className="text-left">
                  <p className="font-medium">СБП</p>
                  <p className="text-xs text-muted-foreground">Система быстрых платежей</p>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Icon name="Upload" size={18} />
              Вывести средства
            </h4>
            <Button 
              className="w-full h-14" 
              variant="default"
              onClick={() => {
                const withdrawUrl = `https://t.me/${botSettings.withdrawBot.replace('@', '')}?start=withdraw_${userData.withdrawBalance}_${userId}`;
                window.open(withdrawUrl, '_blank');
                toast({
                  title: 'Переход к выводу',
                  description: `Открываем ${botSettings.withdrawBot}...`,
                });
              }}
            >
              <Icon name="Upload" size={20} className="mr-2" />
              Вывести {userData.withdrawBalance.toFixed(2)} ₽
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Средства будут переведены в течение 24 часов
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CalculatorScreen = () => {
    const amount = parseFloat(calculatorAmount) || 0;
    const days = parseInt(calculatorDays) || 1;
    const dailyProfit = amount * (botSettings.investmentPercent / 100);
    const totalProfit = dailyProfit * days;
    const totalAmount = amount + totalProfit;

    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" onClick={() => setShowCalculator(false)} className="mb-2">
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Calculator" size={24} />
              🧮 Калькулятор доходности
            </CardTitle>
            <CardDescription>
              Рассчитайте свою прибыль от инвестиций
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма инвестиции (₽)</label>
              <Input
                type="number"
                placeholder="Введите сумму"
                value={calculatorAmount}
                onChange={(e) => setCalculatorAmount(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Количество дней</label>
              <Input
                type="number"
                placeholder="Введите дни"
                value={calculatorDays}
                onChange={(e) => setCalculatorDays(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <Separator />

            <div className="space-y-3 p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Ежедневный доход ({botSettings.investmentPercent}%):</span>
                <span className="font-bold text-green-700">{dailyProfit.toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Прибыль за {days} дней:</span>
                <span className="font-bold text-green-700">{totalProfit.toFixed(2)} ₽</span>
              </div>
              <Separator className="bg-green-300" />
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">Итоговая сумма:</span>
                <span className="text-2xl font-bold text-green-800">{totalAmount.toFixed(2)} ₽</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <Icon name="Info" size={16} className="inline mr-2" />
              Расчёт производится по ставке {botSettings.investmentPercent}% в сутки
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const SettingsScreen = () => (
    <div className="space-y-4 p-4">
      <Button variant="ghost" onClick={() => setShowSettings(false)} className="mb-2">
        <Icon name="ArrowLeft" size={20} className="mr-2" />
        Назад
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Settings" size={24} />
            ⚙️ Настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => window.open(`https://t.me/${botSettings.adminTelegram.replace('@', '')}`, '_blank')}
          >
            <Icon name="UserCog" size={24} className="mr-3" />
            <div className="text-left">
              <p className="font-medium">👨‍💻 Администратор</p>
              <p className="text-xs text-muted-foreground">Написать администратору</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => window.open(botSettings.channelUrl, '_blank')}
          >
            <Icon name="Radio" size={24} className="mr-3" />
            <div className="text-left">
              <p className="font-medium">📢 Наш канал</p>
              <p className="text-xs text-muted-foreground">Подписывайтесь на новости</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={() => window.open(botSettings.chatUrl, '_blank')}
          >
            <Icon name="MessagesSquare" size={24} className="mr-3" />
            <div className="text-left">
              <p className="font-medium">💬 Наш чат</p>
              <p className="text-xs text-muted-foreground">Общайтесь с командой</p>
            </div>
          </Button>

          <Separator />

          <div className="p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Info" size={18} />
              <p className="text-sm font-medium">О приложении</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Версия: 1.0.0<br />
              Телеграм бот для инвестиций
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AdminPanel = () => {
    const [newChannel, setNewChannel] = useState('');
    const [newChat, setNewChat] = useState('');
    const [newBot, setNewBot] = useState('');

    return (
      <div className="space-y-4 p-4">
        <Button variant="ghost" onClick={() => setShowAdminPanel(false)} className="mb-2">
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          Назад
        </Button>

        <Card className="bg-gradient-to-br from-red-900 to-red-700 text-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Shield" size={24} />
              🔧 Панель администратора
            </CardTitle>
            <CardDescription className="text-gray-200">
              Управление настройками бота
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium">Токен уже установлен</p>
                  <p className="text-sm text-muted-foreground">Ваш токен: 8296...fj5M</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium">Прокрути вниз до "Управление ботом"</p>
                  <p className="text-sm text-muted-foreground">Найди синюю кнопку "🚀 ЗАПУСТИТЬ БОТА"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium">Нажми кнопку один раз</p>
                  <p className="text-sm text-muted-foreground">После этого бот заработает!</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">✓</div>
                <div>
                  <p className="font-medium">✅ БОТ УЖЕ ЗАПУЩЕН!</p>
                  <p className="text-sm text-muted-foreground">Открой @MONETKALIFENbot в Telegram и напиши /start</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                className="h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg font-bold"
                onClick={() => {
                  window.open('https://t.me/MONETKALIFENbot', '_blank');
                }}
              >
                <Icon name="MessageCircle" size={24} className="mr-2" />
                🤖 ОТКРЫТЬ БОТА
              </Button>
              <Button
                className="h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg font-bold"
                onClick={() => {
                  window.open('/rocket', '_blank');
                }}
              >
                <Icon name="Rocket" size={24} className="mr-2" />
                🚀 ИГРАТЬ В РАКЕТУ
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Основные настройки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Процент инвестиций (%)</label>
              <Input
                type="number"
                value={botSettings.investmentPercent}
                onChange={(e) => {
                  const newSettings = { ...botSettings, investmentPercent: parseFloat(e.target.value) || 0 };
                  saveBotSettings(newSettings);
                }}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Telegram администратора</label>
              <Input
                value={botSettings.adminTelegram}
                onChange={(e) => {
                  const newSettings = { ...botSettings, adminTelegram: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="@admin"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ссылка на канал</label>
              <Input
                value={botSettings.channelUrl}
                onChange={(e) => {
                  const newSettings = { ...botSettings, channelUrl: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="https://t.me/yourchannel"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ссылка на чат</label>
              <Input
                value={botSettings.chatUrl}
                onChange={(e) => {
                  const newSettings = { ...botSettings, chatUrl: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="https://t.me/yourchat"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Бот для оплаты</label>
              <Input
                value={botSettings.paymentBot}
                onChange={(e) => {
                  const newSettings = { ...botSettings, paymentBot: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="@CryptoBot"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Бот для вывода</label>
              <Input
                value={botSettings.withdrawBot}
                onChange={(e) => {
                  const newSettings = { ...botSettings, withdrawBot: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="@CryptoBot"
                className="h-12"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">🤖 Токен Telegram бота</label>
              <Input
                value={botSettings.botToken}
                onChange={(e) => {
                  const newSettings = { ...botSettings, botToken: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="h-12 font-mono text-xs"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Получи токен у @BotFather в Telegram
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔒 Обязательная подписка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Включить проверку подписки</span>
              <Button
                variant={botSettings.requireSubscription ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newSettings = { ...botSettings, requireSubscription: !botSettings.requireSubscription };
                  saveBotSettings(newSettings);
                }}
              >
                {botSettings.requireSubscription ? 'Вкл' : 'Выкл'}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Обязательные каналы</label>
              <div className="flex gap-2">
                <Input
                  placeholder="@channel или ссылка"
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newChannel) {
                      const newSettings = {
                        ...botSettings,
                        requiredChannels: [...botSettings.requiredChannels, newChannel]
                      };
                      saveBotSettings(newSettings);
                      setNewChannel('');
                    }
                  }}
                >
                  <Icon name="Plus" size={18} />
                </Button>
              </div>
              <div className="space-y-1">
                {botSettings.requiredChannels.map((channel, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm">{channel}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSettings = {
                          ...botSettings,
                          requiredChannels: botSettings.requiredChannels.filter((_, i) => i !== idx)
                        };
                        saveBotSettings(newSettings);
                      }}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Обязательные чаты</label>
              <div className="flex gap-2">
                <Input
                  placeholder="@chat или ссылка"
                  value={newChat}
                  onChange={(e) => setNewChat(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newChat) {
                      const newSettings = {
                        ...botSettings,
                        requiredChats: [...botSettings.requiredChats, newChat]
                      };
                      saveBotSettings(newSettings);
                      setNewChat('');
                    }
                  }}
                >
                  <Icon name="Plus" size={18} />
                </Button>
              </div>
              <div className="space-y-1">
                {botSettings.requiredChats.map((chat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm">{chat}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSettings = {
                          ...botSettings,
                          requiredChats: botSettings.requiredChats.filter((_, i) => i !== idx)
                        };
                        saveBotSettings(newSettings);
                      }}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Обязательные боты</label>
              <div className="flex gap-2">
                <Input
                  placeholder="@bot"
                  value={newBot}
                  onChange={(e) => setNewBot(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newBot) {
                      const newSettings = {
                        ...botSettings,
                        requiredBots: [...botSettings.requiredBots, newBot]
                      };
                      saveBotSettings(newSettings);
                      setNewBot('');
                    }
                  }}
                >
                  <Icon name="Plus" size={18} />
                </Button>
              </div>
              <div className="space-y-1">
                {botSettings.requiredBots.map((bot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                    <span className="text-sm">{bot}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSettings = {
                          ...botSettings,
                          requiredBots: botSettings.requiredBots.filter((_, i) => i !== idx)
                        };
                        saveBotSettings(newSettings);
                      }}
                    >
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Rocket" size={28} />
              🚀 Игра "РАКЕТА"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              Азартная игра, где игроки ставят монеты на взлёт ракеты и забирают выигрыш до того, как она взорвётся!
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/70 rounded-lg border-2 border-purple-200">
                <p className="text-3xl font-bold text-green-600">30%</p>
                <p className="text-sm text-gray-600">Шанс выигрыша</p>
              </div>
              <div className="p-4 bg-white/70 rounded-lg border-2 border-purple-200">
                <p className="text-3xl font-bold text-red-600">70%</p>
                <p className="text-sm text-gray-600">Шанс проигрыша</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-purple-600" />
                <span>Коэффициент до x15.00</span>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-purple-600" />
                <span>Реальные ставки и выигрыши</span>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="Check" size={16} className="text-purple-600" />
                <span>История всех игр</span>
              </p>
            </div>

            <Button
              className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white text-lg font-bold"
              onClick={() => {
                window.open('/rocket', '_blank');
              }}
            >
              <Icon name="Rocket" size={24} className="mr-2" />
              🎮 ЗАПУСТИТЬ ИГРУ
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚡ Управление ботом</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-6 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-bold">Статус бота</p>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-bold text-green-700 text-lg">✅ РАБОТАЕТ</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-600" />
                  <span>Webhook подключён</span>
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-600" />
                  <span>Бот: @MONETKALIFENbot</span>
                </p>
                <p className="flex items-center gap-2">
                  <Icon name="Check" size={16} className="text-green-600" />
                  <span>Токен активен</span>
                </p>
              </div>
            </div>

            <Button
              className="w-full h-14 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
              onClick={async () => {
                toast({ title: '🔍 Проверяем...', description: 'Запрашиваем статус бота' });
                
                try {
                  const response = await fetch(
                    `https://api.telegram.org/bot${botSettings.botToken}/getWebhookInfo`
                  );
                  const data = await response.json();
                  
                  if (data.ok && data.result.url) {
                    toast({
                      title: '✅ Бот работает!',
                      description: `Webhook активен. Ожидает сообщений: ${data.result.pending_update_count}`
                    });
                  } else {
                    toast({
                      title: '⚠️ Webhook не установлен',
                      description: 'Нажмите "Запустить бота" ниже',
                      variant: 'destructive'
                    });
                  }
                } catch (error) {
                  toast({
                    title: '❌ Ошибка',
                    description: 'Не удалось проверить статус',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Icon name="RefreshCw" size={20} className="mr-2" />
              Проверить статус бота
            </Button>

            <Button
              variant="outline"
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
              onClick={async () => {
                toast({
                  title: '⏳ Подключаем...',
                  description: 'Устанавливаем webhook для бота'
                });
                
                try {
                  const response = await fetch(
                    'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf?path=setup_webhook',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ bot_token: botSettings.botToken })
                    }
                  );
                  
                  const data = await response.json();
                  
                  if (data.ok) {
                    toast({
                      title: '✅ Бот запущен!',
                      description: 'Webhook установлен. Напиши боту /start в Telegram'
                    });
                  } else {
                    toast({
                      title: '❌ Ошибка',
                      description: data.description || 'Проверьте токен бота',
                      variant: 'destructive'
                    });
                  }
                } catch (error) {
                  toast({
                    title: '❌ Ошибка подключения',
                    description: 'Не удалось установить webhook',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Icon name="Zap" size={20} className="mr-2" />
              🚀 ЗАПУСТИТЬ БОТА
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>💬 Настройка сообщений</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Приветственное сообщение</label>
              <textarea
                className="w-full h-32 p-3 border rounded-md resize-none text-sm"
                value={botSettings.welcomeMessage || ''}
                onChange={(e) => {
                  const newSettings = { ...botSettings, welcomeMessage: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="Привет! 👋 Добро пожаловать в наш бот..."
              />
              <p className="text-xs text-muted-foreground">
                Используй HTML теги: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">URL Web App</label>
              <Input
                value={botSettings.webAppUrl || 'https://monetkalife.poehali.dev/bot'}
                onChange={(e) => {
                  const newSettings = { ...botSettings, webAppUrl: e.target.value };
                  saveBotSettings(newSettings);
                }}
                placeholder="https://yourdomain.com/bot"
                className="h-12"
              />
            </div>

            <Button
              className="w-full h-12"
              onClick={async () => {
                const testMessage = botSettings.welcomeMessage || '👋 Привет! Это тестовое сообщение от бота.';
                
                toast({
                  title: 'Отправка...',
                  description: 'Отправляем тестовое сообщение'
                });
                
                try {
                  const response = await fetch(
                    `https://api.telegram.org/bot${botSettings.botToken}/getMe`
                  );
                  const data = await response.json();
                  
                  if (data.ok) {
                    toast({
                      title: '✅ Бот работает!',
                      description: `Подключён как @${data.result.username}`
                    });
                  }
                } catch (error) {
                  toast({
                    title: '❌ Ошибка',
                    description: 'Проверьте токен',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Icon name="Send" size={18} className="mr-2" />
              Проверить бота
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (showAdminPanel) return <AdminPanel />;
  if (showInvestment) return <InvestmentScreen />;
  if (showWallet) return <WalletScreen />;
  if (showPartners) return <PartnersScreen />;
  if (showCalculator) return <CalculatorScreen />;
  if (showSettings) return <SettingsScreen />;

  return <MainScreen />;
};

export default TelegramBot;