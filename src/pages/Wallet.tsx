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

export default function Wallet() {
  const [telegramId, setTelegramId] = useState<number>(123456789);
  const [withdrawBalance, setWithdrawBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
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
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch(`${API_URL}?path=user&telegram_id=${telegramId}`);
      const data = await response.json();
      setWithdrawBalance(data.user.withdraw_balance);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount < 100) {
      toast({
        title: 'Ошибка',
        description: 'Минимальная сумма вывода - 100₽',
        variant: 'destructive'
      });
      return;
    }

    if (withdrawAmount > withdrawBalance) {
      toast({
        title: 'Недостаточно средств',
        description: 'Сумма превышает доступный баланс',
        variant: 'destructive'
      });
      return;
    }

    if (!walletAddress) {
      toast({
        title: 'Укажите адрес',
        description: 'Введите номер карты или кошелька',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          amount: withdrawAmount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '✅ Заявка создана!',
          description: `Вывод ${withdrawAmount}₽ в обработке`
        });
        setAmount('');
        setWalletAddress('');
        loadUserData();
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать заявку',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при создании заявки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">Кошелёк</h1>
          <div className="w-10" />
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <div className="text-center space-y-2">
            <div className="text-gray-300 text-sm">Доступно для вывода</div>
            <div className="text-4xl font-bold text-yellow-400">
              {withdrawBalance.toFixed(2)} ₽
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <h2 className="font-bold text-lg mb-4">Вывод средств</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Сумма вывода</label>
              <Input
                type="number"
                placeholder="Минимум 100₽"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Номер карты / кошелька</label>
              <Input
                type="text"
                placeholder="4111 1111 1111 1111"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Icon name="Info" size={16} className="text-blue-300 mt-0.5" />
                <div className="text-gray-300">
                  <div className="font-semibold mb-1">Информация о выводе:</div>
                  <ul className="text-xs space-y-1">
                    <li>• Минимальная сумма - 100₽</li>
                    <li>• Комиссия - 0%</li>
                    <li>• Обработка 1-24 часа</li>
                    <li>• Поддержка карт РФ</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Вывести средства'}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => setAmount('500')}
          >
            <div className="text-lg font-bold">500 ₽</div>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => setAmount('1000')}
          >
            <div className="text-lg font-bold">1000 ₽</div>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-20 bg-white/5 border-white/20 hover:bg-white/10"
            onClick={() => setAmount(withdrawBalance.toString())}
          >
            <div className="text-lg font-bold">Всё</div>
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg border-green-500/30 p-4">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={24} className="text-green-300" />
            <div className="text-sm">
              <div className="font-semibold">Безопасность</div>
              <div className="text-xs text-gray-300">Все данные защищены шифрованием</div>
            </div>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-6">
          <h3 className="font-bold mb-3">Способы вывода</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Icon name="CreditCard" size={20} className="text-blue-400" />
              <span className="text-sm">Банковская карта</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Icon name="Smartphone" size={20} className="text-green-400" />
              <span className="text-sm">Электронные кошельки</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Icon name="Wallet" size={20} className="text-purple-400" />
              <span className="text-sm">Криптовалюта</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
