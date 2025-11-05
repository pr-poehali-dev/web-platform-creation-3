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

const API_URL = 'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf';

export default function Partners() {
  const [telegramId, setTelegramId] = useState<number>(123456789);
  const [partnersCount, setPartnersCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const botUsername = 'your_bot';
  const referralLink = `https://t.me/${botUsername}?start=${telegramId}`;

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const userId = tg.initDataUnsafe.user?.id;
      if (userId) {
        setTelegramId(userId);
      }
    }
    
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch(`${API_URL}?path=user&telegram_id=${telegramId}`);
      const data = await response.json();
      setPartnersCount(data.user.partners_count || 0);
      setReferralEarnings(0);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: '✅ Скопировано!',
      description: 'Реферальная ссылка скопирована'
    });
  };

  const shareReferralLink = () => {
    const text = `💰 Присоединяйся к MLWizard Investment!\n\n📈 Зарабатывай 1% в день от инвестиций\n💎 Пассивный доход без усилий\n\n👇 Регистрируйся по моей ссылке:`;
    
    if (window.Telegram?.WebApp) {
      const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } else {
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <Icon name="ArrowLeft" size={24} />
          </Button>
          <h1 className="text-2xl font-bold">Партнёрская программа</h1>
          <div className="w-10" />
        </div>

        <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border-purple-500/30 p-6">
          <div className="text-center space-y-2">
            <Icon name="Users" size={48} className="mx-auto text-purple-300 mb-2" />
            <div className="text-gray-300 text-sm">Приглашено друзей</div>
            <div className="text-4xl font-bold text-white">{partnersCount}</div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg border-green-500/30 p-4">
            <div className="text-green-300 text-xs mb-1">Заработано</div>
            <div className="text-xl font-bold">{referralEarnings.toFixed(2)} ₽</div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border-blue-500/30 p-4">
            <div className="text-blue-300 text-xs mb-1">За реферала</div>
            <div className="text-xl font-bold">10%</div>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <h2 className="font-bold text-lg mb-4">Ваша реферальная ссылка</h2>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-3 mb-4 break-all text-sm">
            {referralLink}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/10"
              onClick={copyReferralLink}
            >
              <Icon name="Copy" size={18} className="mr-2" />
              Копировать
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              onClick={shareReferralLink}
            >
              <Icon name="Share2" size={18} className="mr-2" />
              Поделиться
            </Button>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <h3 className="font-bold text-lg mb-4">Как это работает?</h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">1</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Поделись ссылкой</div>
                <div className="text-sm text-gray-300">Отправь реферальную ссылку друзьям</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">2</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Друг регистрируется</div>
                <div className="text-sm text-gray-300">Он переходит по ссылке и создаёт аккаунт</div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                <span className="font-bold">3</span>
              </div>
              <div>
                <div className="font-semibold mb-1">Получай бонусы</div>
                <div className="text-sm text-gray-300">10% от всех его инвестиций навсегда!</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border-yellow-500/30 p-6">
          <h3 className="font-bold text-lg mb-3">Уровни дохода</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon name="Star" size={20} className="text-yellow-400" />
                <span>1-10 рефералов</span>
              </div>
              <span className="font-bold text-yellow-400">10%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon name="Star" size={20} className="text-yellow-400" />
                <Icon name="Star" size={20} className="text-yellow-400" />
                <span>11-50 рефералов</span>
              </div>
              <span className="font-bold text-yellow-400">15%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon name="Star" size={20} className="text-yellow-400" />
                <Icon name="Star" size={20} className="text-yellow-400" />
                <Icon name="Star" size={20} className="text-yellow-400" />
                <span>51+ рефералов</span>
              </div>
              <span className="font-bold text-yellow-400">20%</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg border-green-500/30 p-4">
          <div className="flex items-start gap-3">
            <Icon name="TrendingUp" size={24} className="text-green-300 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Пример расчёта</div>
              <div className="text-xs text-gray-300">
                Ваш друг инвестирует 10,000₽. Вы получаете 1,000₽ единоразово + 10₽ каждый день от его прибыли!
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
