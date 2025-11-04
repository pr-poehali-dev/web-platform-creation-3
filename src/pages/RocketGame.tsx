import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface GameHistory {
  multiplier: number;
  profit: number;
  won: boolean;
  created_at: string;
}

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

const API_URL = 'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf';

const RocketGame = () => {
  const { toast } = useToast();
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [telegramId, setTelegramId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      
      const user = tg.initDataUnsafe.user;
      if (user) {
        setTelegramId(String(user.id));
        loadBalance(String(user.id));
        loadHistory(String(user.id));
      } else {
        setTelegramId('123456789');
        loadBalance('123456789');
        loadHistory('123456789');
      }
    } else {
      setTelegramId('123456789');
      loadBalance('123456789');
      loadHistory('123456789');
    }
  }, []);

  const loadBalance = async (tgId: string) => {
    try {
      const response = await fetch(`${API_URL}?path=rocket_balance&telegram_id=${tgId}`);
      const data = await response.json();
      
      if (data.balance !== undefined) {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (tgId: string) => {
    try {
      const response = await fetch(`${API_URL}?path=rocket_history&telegram_id=${tgId}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const startGame = async () => {
    if (betAmount > balance) {
      toast({
        title: '❌ Недостаточно средств',
        description: 'Пополните баланс или уменьшите ставку',
        variant: 'destructive'
      });
      return;
    }

    if (betAmount < 1) {
      toast({
        title: '❌ Минимальная ставка',
        description: 'Минимальная ставка: 1 монета',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}?path=rocket_start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          bet_amount: betAmount
        })
      });

      const data = await response.json();

      if (data.error) {
        toast({
          title: '❌ Ошибка',
          description: data.error,
          variant: 'destructive'
        });
        return;
      }

      setBalance(prev => prev - betAmount);
      setUserId(data.user_id);
      setIsPlaying(true);
      setCashedOut(false);
      setMultiplier(1.00);
      
      const crash = data.crash_point;
      setCrashPoint(crash);

      let current = 1.00;
      const speed = Math.random() * 50 + 50;

      intervalRef.current = setInterval(() => {
        current += 0.01;
        setMultiplier(Number(current.toFixed(2)));

        if (current >= crash) {
          endGame(false, crash);
        }
      }, speed);
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось начать игру',
        variant: 'destructive'
      });
    }
  };

  const cashOut = async () => {
    if (!isPlaying || cashedOut) return;

    setCashedOut(true);
    const profit = Math.floor(betAmount * multiplier);

    try {
      const response = await fetch(`${API_URL}?path=rocket_cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          bet_amount: betAmount,
          multiplier: multiplier,
          crash_point: crashPoint
        })
      });

      const data = await response.json();

      if (data.success) {
        setBalance(prev => prev + profit);
        loadHistory(telegramId);

        toast({
          title: '💰 Выигрыш!',
          description: `Вы забрали ${profit} монет (x${multiplier})`,
        });
      }
    } catch (error) {
      console.error('Error cashing out:', error);
    }

    endGame(true, multiplier);
  };

  const endGame = async (won: boolean, finalMultiplier: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!won && !cashedOut) {
      try {
        await fetch(`${API_URL}?path=rocket_lost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            bet_amount: betAmount,
            crash_point: finalMultiplier
          })
        });

        loadHistory(telegramId);
      } catch (error) {
        console.error('Error saving loss:', error);
      }

      toast({
        title: '💥 Ракета улетела!',
        description: `Взрыв на x${finalMultiplier.toFixed(2)}`,
        variant: 'destructive'
      });
    }

    setTimeout(() => {
      setIsPlaying(false);
      setMultiplier(1.00);
      setCrashPoint(0);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getRocketPosition = () => {
    const progress = Math.min((multiplier - 1.00) / 3.00, 1);
    return {
      bottom: `${10 + progress * 70}%`,
      left: `${10 + progress * 70}%`,
      transform: `rotate(${progress * 45}deg) scale(${1 + progress * 0.5})`,
      opacity: cashedOut ? 0.3 : 1
    };
  };

  const getMultiplierColor = () => {
    if (multiplier < 1.5) return 'text-blue-500';
    if (multiplier < 2.0) return 'text-green-500';
    if (multiplier < 3.0) return 'text-yellow-500';
    if (multiplier < 5.0) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🚀</div>
          <p className="text-white text-xl">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>
      <div className="max-w-6xl mx-auto space-y-4 relative z-10">
        <Card className="bg-black/60 backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl">
          <CardHeader className="border-b border-purple-500/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-3xl font-black flex items-center gap-3">
                <span className="text-5xl animate-pulse">🚀</span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">РАКЕТА</span>
              </CardTitle>
              <div className="text-right">
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border-2 border-yellow-500/50 mb-2">
                  <p className="text-xs text-gray-300 uppercase tracking-wider">Баланс</p>
                  <p className="text-3xl font-black text-yellow-400 drop-shadow-lg">{balance.toFixed(0)} 💰</p>
                </div>
                {balance < 10 && (
                  <Button
                    onClick={() => {
                      toast({
                        title: '💳 Пополнение баланса',
                        description: 'Свяжитесь с администратором для пополнения'
                      });
                    }}
                    className="w-full h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                  >
                    💳 Пополнить
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative h-96 bg-gradient-to-t from-slate-950 via-purple-950 to-blue-950 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-2xl">
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="border border-purple-500/30" />
                ))}
              </div>

              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

              {!isPlaying && !cashedOut && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="text-8xl animate-bounce drop-shadow-2xl">🚀</div>
                    <div className="space-y-2">
                      <p className="text-white text-3xl font-black drop-shadow-lg">Готовы к запуску?</p>
                      <p className="text-purple-300 text-lg">Сделайте ставку и нажмите "Запуск"</p>
                    </div>
                  </div>
                </div>
              )}

              {isPlaying && (
                <>
                  <div 
                    className="absolute text-6xl transition-all duration-100 ease-linear"
                    style={getRocketPosition()}
                  >
                    🚀
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className={`text-9xl font-black ${getMultiplierColor()} drop-shadow-[0_0_50px_rgba(168,85,247,0.8)] transition-all duration-100 animate-pulse`}>
                        {multiplier.toFixed(2)}x
                      </div>
                      <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl rounded-full" />
                    </div>
                  </div>

                  {cashedOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/90 to-emerald-900/90 backdrop-blur-sm">
                      <div className="text-center space-y-4 animate-in zoom-in duration-500">
                        <div className="text-8xl animate-bounce">💰</div>
                        <p className="text-white text-5xl font-black drop-shadow-lg">ЗАБРАНО!</p>
                        <p className="text-green-300 text-3xl font-bold">+{Math.floor(betAmount * multiplier)} монет</p>
                      </div>
                    </div>
                  )}

                  {!isPlaying && !cashedOut && crashPoint > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-sm">
                      <div className="text-center space-y-4 animate-in zoom-in duration-500">
                        <div className="text-8xl animate-pulse">💥</div>
                        <p className="text-white text-5xl font-black drop-shadow-lg">ВЗРЫВ!</p>
                        <p className="text-red-300 text-3xl font-bold">x{crashPoint.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur p-3 rounded-lg border border-purple-500/30">
                <div className="text-white/80 text-xs space-y-1 font-medium">
                  <p>📊 Выигрыш: 30%</p>
                  <p>💥 Проигрыш: 70%</p>
                </div>
              </div>

              {isPlaying && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur p-3 rounded-lg border border-purple-500/30">
                  <div className="text-white text-xs space-y-1 font-medium">
                    <p className="font-bold text-yellow-400">💰 Ваша ставка: {betAmount}</p>
                    <p className="font-bold text-green-400">🎯 Выигрыш: {Math.floor(betAmount * multiplier)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block font-bold uppercase tracking-wider">Сумма ставки</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      disabled={isPlaying}
                      className="bg-black/60 text-white border-2 border-purple-500/50 text-xl font-bold h-14 focus:border-purple-400"
                      min={1}
                      max={balance}
                    />
                    <Button
                      onClick={() => setBetAmount(Math.min(betAmount * 2, balance))}
                      disabled={isPlaying}
                      variant="outline"
                      className="border-2 border-purple-500/50 text-white hover:bg-purple-500/20 h-14 px-6 font-bold"
                    >
                      x2
                    </Button>
                    <Button
                      onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                      disabled={isPlaying}
                      variant="outline"
                      className="border-2 border-purple-500/50 text-white hover:bg-purple-500/20 h-14 px-6 font-bold"
                    >
                      ÷2
                    </Button>
                  </div>
                </div>

                {!isPlaying ? (
                  <Button
                    onClick={startGame}
                    className="w-full h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-2xl font-black shadow-lg hover:shadow-green-500/50 transition-all"
                  >
                    <Icon name="Rocket" size={28} className="mr-3" />
                    🚀 ЗАПУСК ({betAmount} монет)
                  </Button>
                ) : (
                  <Button
                    onClick={cashOut}
                    disabled={cashedOut}
                    className="w-full h-20 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white text-2xl font-black animate-pulse shadow-lg hover:shadow-yellow-500/50 transition-all"
                  >
                    <Icon name="DollarSign" size={28} className="mr-3" />
                    💰 ЗАБРАТЬ {Math.floor(betAmount * multiplier)} монет
                  </Button>
                )}
              </div>

              <Card className="bg-black/60 border-2 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white text-xl font-bold">📊 История игр</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-400 text-center py-4">Загрузка...</p>
                  ) : history.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">История пуста</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {history.map((game, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded ${
                            game.won ? 'bg-green-900/30' : 'bg-red-900/30'
                          }`}
                        >
                          <span className="text-white font-mono">
                            x{Number(game.multiplier).toFixed(2)}
                          </span>
                          <span className={`font-bold ${game.won ? 'text-green-400' : 'text-red-400'}`}>
                            {game.won ? '+' : ''}{Number(game.profit).toFixed(0)} 💰
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl border-2 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-2xl font-bold">📖 Правила игры</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-200 space-y-3 text-base">
            <p className="flex items-start gap-3"><span className="text-2xl">🚀</span><span><strong className="text-purple-300">Ракета взлетает</strong> с коэффициентом 1.00x и растёт каждую секунду</span></p>
            <p className="flex items-start gap-3"><span className="text-2xl">💰</span><span><strong className="text-yellow-300">Забери выигрыш</strong> до того, как ракета улетит! Чем дольше ждёшь - тем больше выигрыш</span></p>
            <p className="flex items-start gap-3"><span className="text-2xl">💥</span><span><strong className="text-red-300">Не успел?</strong> Ставка сгорает полностью</span></p>
            <p className="flex items-start gap-3"><span className="text-2xl">📊</span><span><strong className="text-blue-300">Шансы:</strong> 30% выигрыш, 70% проигрыш (честная игра!)</span></p>
            <p className="flex items-start gap-3"><span className="text-2xl">🎯</span><span><strong className="text-green-300">Максимум:</strong> Коэффициент может достигать x15.00!</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RocketGame;