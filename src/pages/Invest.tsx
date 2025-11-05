import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  close: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface Investment {
  id: number;
  amount: number;
  accumulated: number;
  start_date: string;
  is_active: boolean;
}

const API_URL = 'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf';

export default function Invest() {
  const [telegramId, setTelegramId] = useState<number>(123456789);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
    loadInvestments();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch(`${API_URL}?path=user&telegram_id=${telegramId}`);
      const data = await response.json();
      setBalance(data.user.balance);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadInvestments = async () => {
    try {
      const response = await fetch(`${API_URL}?path=investments&telegram_id=${telegramId}`);
      const data = await response.json();
      setInvestments(data.investments);
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  };

  const handleInvest = async () => {
    const investAmount = parseFloat(amount);
    
    if (!investAmount || investAmount < 100) {
      toast({
        title: 'Ошибка',
        description: 'Минимальная сумма инвестиции - 100₽',
        variant: 'destructive'
      });
      return;
    }

    if (investAmount > balance) {
      toast({
        title: 'Недостаточно средств',
        description: 'Пополните баланс для инвестиции',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=invest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          amount: investAmount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '✅ Успешно!',
          description: `Инвестиция ${investAmount}₽ создана!`
        });
        setAmount('');
        loadUserData();
        loadInvestments();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать инвестицию',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при создании инвестиции',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId })
      });

      const data = await response.json();
      
      if (data.success && data.collected > 0) {
        toast({
          title: '💰 Собрано!',
          description: `Вы получили ${data.collected.toFixed(2)}₽`
        });
        loadUserData();
        loadInvestments();
      } else {
        toast({
          title: 'Нечего собирать',
          description: 'Накоплений пока нет'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось собрать накопления',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);
  const totalAccumulated = investments.reduce((sum, inv) => sum + parseFloat(inv.accumulated.toString()), 0);
  const dailyProfit = totalInvested * 0.01;

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
          <h1 className="text-2xl font-bold">Инвестиции</h1>
          <div className="w-10" />
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <div className="text-center space-y-2">
            <div className="text-gray-300 text-sm">Доступный баланс</div>
            <div className="text-3xl font-bold text-white">{balance.toFixed(2)} ₽</div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <h2 className="font-bold text-lg mb-4">Создать инвестицию</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Сумма инвестиции</label>
              <Input
                type="number"
                placeholder="Минимум 100₽"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Доходность:</span>
                <span className="font-bold">1% в день</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Прибыль в день:</span>
                <span className="font-bold text-green-400">
                  {amount ? (parseFloat(amount) * 0.01).toFixed(2) : '0.00'} ₽
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Прибыль в месяц:</span>
                <span className="font-bold text-green-400">
                  {amount ? (parseFloat(amount) * 0.3).toFixed(2) : '0.00'} ₽
                </span>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              onClick={handleInvest}
              disabled={loading}
            >
              {loading ? 'Создание...' : 'Инвестировать'}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg border-green-500/30 p-4">
            <div className="text-green-300 text-xs mb-1">Всего инвестировано</div>
            <div className="text-xl font-bold">{totalInvested.toFixed(2)} ₽</div>
            <div className="text-xs text-gray-300 mt-1">+{dailyProfit.toFixed(2)}₽/день</div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg border-yellow-500/30 p-4">
            <div className="text-yellow-300 text-xs mb-1">Накоплено</div>
            <div className="text-xl font-bold">{totalAccumulated.toFixed(2)} ₽</div>
            <Button
              size="sm"
              className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              onClick={handleCollect}
              disabled={loading || totalAccumulated === 0}
            >
              Собрать
            </Button>
          </Card>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <h2 className="font-bold text-lg mb-4">Активные инвестиции</h2>
          
          {investments.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Icon name="TrendingUp" size={48} className="mx-auto mb-2 opacity-50" />
              <p>У вас пока нет активных инвестиций</p>
            </div>
          ) : (
            <div className="space-y-3">
              {investments.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{parseFloat(inv.amount.toString()).toFixed(2)} ₽</div>
                      <div className="text-xs text-gray-400">
                        {new Date(inv.start_date).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        +{parseFloat(inv.accumulated.toString()).toFixed(2)} ₽
                      </div>
                      <div className="text-xs text-gray-400">накоплено</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Icon name="TrendingUp" size={14} />
                    <span>+{(parseFloat(inv.amount.toString()) * 0.01).toFixed(2)} ₽/день</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg border-blue-500/30 p-4">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={24} className="text-blue-300 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Как работает?</div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Создайте инвестицию от 100₽</li>
                <li>• Получайте 1% в день автоматически</li>
                <li>• Собирайте прибыль в любое время</li>
                <li>• Выводите на свой кошелёк</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
