import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

interface TelegramWebApp {
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      username?: string;
    };
  };
  ready: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface UserData {
  user: {
    user_id: number;
    username: string;
    balance: number;
    withdraw_balance: number;
    partners_count: number;
  };
  total_invested: number;
  total_accumulated: number;
}

const API_URL = 'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf';

export default function Investment() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const telegramId = tg.initDataUnsafe.user?.id;
      if (telegramId) {
        fetchUserData(telegramId);
      }
    } else {
      fetchUserData(123456789);
    }
  }, []);

  const fetchUserData = async (telegramId: number) => {
    try {
      const response = await fetch(`${API_URL}?path=user&telegram_id=${telegramId}`);
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const dailyProfit = userData ? userData.total_invested * 0.01 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            MLWizard Investment
          </h1>
          <p className="text-gray-300 text-sm mt-2">Пассивный доход каждый день</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <div className="text-center space-y-2">
            <div className="text-gray-300 text-sm">Текущий баланс</div>
            <div className="text-4xl font-bold text-white">
              {userData?.user.balance.toFixed(2)} ₽
            </div>
            <div className="text-green-400 text-sm flex items-center justify-center gap-1">
              <Icon name="TrendingUp" size={16} />
              +{dailyProfit.toFixed(2)} ₽/день
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg border-green-500/30 p-4">
            <div className="text-green-300 text-xs mb-1">Инвестировано</div>
            <div className="text-xl font-bold">{userData?.total_invested.toFixed(2)} ₽</div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border-blue-500/30 p-4">
            <div className="text-blue-300 text-xs mb-1">Накоплено</div>
            <div className="text-xl font-bold">{userData?.total_accumulated.toFixed(2)} ₽</div>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Доступно для вывода</span>
              <span className="text-2xl font-bold text-yellow-400">
                {userData?.user.withdraw_balance.toFixed(2)} ₽
              </span>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              onClick={() => navigate('/wallet')}
            >
              <Icon name="Wallet" className="mr-2" size={20} />
              Вывести средства
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => navigate('/invest')}
          >
            <Icon name="TrendingUp" size={24} className="mb-1" />
            <span className="text-xs">Инвестиции</span>
          </Button>

          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => navigate('/partners')}
          >
            <Icon name="Users" size={24} className="mb-1" />
            <span className="text-xs">Партнёрам</span>
          </Button>

          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => navigate('/wallet')}
          >
            <Icon name="Wallet" size={24} className="mb-1" />
            <span className="text-xs">Кошелёк</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => navigate('/calculator')}
          >
            <Icon name="Calculator" size={24} className="mb-1" />
            <span className="text-xs">Калькулятор</span>
          </Button>

          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => navigate('/education')}
          >
            <Icon name="GraduationCap" size={24} className="mb-1" />
            <span className="text-xs">Обучение</span>
          </Button>

          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => navigate('/settings')}
          >
            <Icon name="Settings" size={24} className="mb-1" />
            <span className="text-xs">Настройки</span>
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-purple-500/30 p-4">
          <div className="flex items-center gap-3">
            <Icon name="Info" size={24} className="text-purple-300" />
            <div className="text-sm">
              <div className="font-semibold">1% в день</div>
              <div className="text-xs text-gray-300">Ежедневное начисление прибыли</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
