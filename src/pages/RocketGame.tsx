import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface GameHistory {
  multiplier: number;
  profit: number;
  timestamp: Date;
}

const RocketGame = () => {
  const { toast } = useToast();
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashPoint, setCrashPoint] = useState(0);
  const [cashedOut, setCashedOut] = useState(false);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateCrashPoint = () => {
    const rand = Math.random() * 100;
    
    if (rand < 70) {
      return 1.00 + Math.random() * 0.50;
    } else if (rand < 90) {
      return 1.50 + Math.random() * 1.00;
    } else if (rand < 97) {
      return 2.50 + Math.random() * 2.50;
    } else {
      return 5.00 + Math.random() * 10.00;
    }
  };

  const startGame = () => {
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

    setBalance(prev => prev - betAmount);
    setIsPlaying(true);
    setCashedOut(false);
    setMultiplier(1.00);
    
    const crash = generateCrashPoint();
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
  };

  const cashOut = () => {
    if (!isPlaying || cashedOut) return;

    setCashedOut(true);
    const profit = Math.floor(betAmount * multiplier);
    setBalance(prev => prev + profit);

    setHistory(prev => [{
      multiplier,
      profit: profit - betAmount,
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);

    toast({
      title: '💰 Выигрыш!',
      description: `Вы забрали ${profit} монет (x${multiplier})`,
    });

    endGame(true, multiplier);
  };

  const endGame = (won: boolean, finalMultiplier: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!won && !cashedOut) {
      setHistory(prev => [{
        multiplier: finalMultiplier,
        profit: -betAmount,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="bg-black/40 backdrop-blur border-purple-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                🚀 Ракета
              </CardTitle>
              <div className="text-right">
                <p className="text-sm text-gray-400">Ваш баланс</p>
                <p className="text-2xl font-bold text-yellow-400">{balance} 💰</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 bg-gradient-to-t from-blue-950 to-purple-950 rounded-lg overflow-hidden border-2 border-purple-500/50">
              <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="border border-purple-500/20" />
                ))}
              </div>

              {!isPlaying && !cashedOut && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="text-6xl animate-bounce">🚀</div>
                    <p className="text-white text-xl font-bold">Готовы к запуску?</p>
                    <p className="text-gray-400">Сделайте ставку и нажмите "Запуск"</p>
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
                    <div className={`text-8xl font-black ${getMultiplierColor()} drop-shadow-2xl transition-colors`}>
                      {multiplier.toFixed(2)}x
                    </div>
                  </div>

                  {cashedOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center space-y-2">
                        <div className="text-6xl">💰</div>
                        <p className="text-white text-3xl font-bold">Забрано!</p>
                        <p className="text-green-400 text-2xl">+{Math.floor(betAmount * multiplier)} монет</p>
                      </div>
                    </div>
                  )}

                  {!isPlaying && !cashedOut && crashPoint > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-900/70">
                      <div className="text-center space-y-2">
                        <div className="text-6xl">💥</div>
                        <p className="text-white text-3xl font-bold">Взрыв!</p>
                        <p className="text-red-400 text-2xl">x{crashPoint.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="absolute bottom-4 left-4 text-white/60 text-sm space-y-1">
                <p>📊 Шанс выигрыша: 30%</p>
                <p>💥 Шанс проигрыша: 70%</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Сумма ставки</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      disabled={isPlaying}
                      className="bg-black/40 text-white border-purple-500/50"
                      min={1}
                      max={balance}
                    />
                    <Button
                      onClick={() => setBetAmount(Math.min(betAmount * 2, balance))}
                      disabled={isPlaying}
                      variant="outline"
                      className="border-purple-500/50 text-white"
                    >
                      x2
                    </Button>
                    <Button
                      onClick={() => setBetAmount(Math.floor(betAmount / 2))}
                      disabled={isPlaying}
                      variant="outline"
                      className="border-purple-500/50 text-white"
                    >
                      ÷2
                    </Button>
                  </div>
                </div>

                {!isPlaying ? (
                  <Button
                    onClick={startGame}
                    className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xl font-bold"
                  >
                    <Icon name="Rocket" size={24} className="mr-2" />
                    🚀 Запуск ({betAmount} монет)
                  </Button>
                ) : (
                  <Button
                    onClick={cashOut}
                    disabled={cashedOut}
                    className="w-full h-16 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white text-xl font-bold animate-pulse"
                  >
                    <Icon name="DollarSign" size={24} className="mr-2" />
                    💰 Забрать {Math.floor(betAmount * multiplier)} монет
                  </Button>
                )}
              </div>

              <Card className="bg-black/40 border-purple-500/50">
                <CardHeader>
                  <CardTitle className="text-white text-lg">📊 История игр</CardTitle>
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">История пуста</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {history.map((game, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded ${
                            game.profit > 0 ? 'bg-green-900/30' : 'bg-red-900/30'
                          }`}
                        >
                          <span className="text-white font-mono">
                            x{game.multiplier.toFixed(2)}
                          </span>
                          <span className={`font-bold ${game.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {game.profit > 0 ? '+' : ''}{game.profit} 💰
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

        <Card className="bg-black/40 backdrop-blur border-purple-500/50">
          <CardHeader>
            <CardTitle className="text-white">📖 Правила игры</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>🚀 <strong>Ракета взлетает</strong> с коэффициентом 1.00x и растёт</p>
            <p>💰 <strong>Забери выигрыш</strong> до того, как ракета улетит!</p>
            <p>💥 <strong>Не успел?</strong> Ставка сгорает</p>
            <p>📊 <strong>Шансы:</strong> 30% выигрыш, 70% проигрыш</p>
            <p>🎯 <strong>Максимум:</strong> Коэффициент может достигать x15.00!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RocketGame;
