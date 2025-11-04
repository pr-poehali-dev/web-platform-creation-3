'''
Business: API для работы с пользователями, балансом и транзакциями BonusHub
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict
'''

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import random
import string

def generate_referral_code(length: int = 10) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def generate_crash_point() -> float:
    rand = random.random() * 100
    
    if rand < 70:
        return round(1.00 + random.random() * 0.50, 2)
    elif rand < 90:
        return round(1.50 + random.random() * 1.00, 2)
    elif rand < 97:
        return round(2.50 + random.random() * 2.50, 2)
    else:
        return round(5.00 + random.random() * 10.00, 2)

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def send_telegram_message(bot_token: str, chat_id: int, text: str, reply_markup=None):
    import urllib.request
    import urllib.parse
    
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    path = event.get('queryStringParameters', {}).get('path', '')
    
    if path == 'telegram_webhook' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '8296427829:AAFS25SM96ZtRS2Z36XS1-jeY2uTDo0fj5M')
        
        if 'message' in body_data:
            message = body_data['message']
            chat_id = message['chat']['id']
            text = message.get('text', '')
            user_first_name = message['from'].get('first_name', 'друг')
            
            if text == '/start':
                rocket_game_url = 'https://monetkalife.poehali.dev/rocket'
                
                welcome_text = f'''👋 <b>Привет, {user_first_name}!</b>

🚀 Добро пожаловать в игру РАКЕТА!

💰 Здесь вы можете:
• Делать ставки на взлёт ракеты
• Забирать выигрыш в любой момент
• Рисковать и выигрывать до x15.00!

📊 Шансы: 30% выигрыш, 70% проигрыш

🎮 Нажми кнопку ниже, чтобы начать играть!'''
                
                keyboard = {
                    'inline_keyboard': [[
                        {'text': '🚀 Играть в РАКЕТУ', 'web_app': {'url': rocket_game_url}}
                    ], [
                        {'text': '📊 Правила игры', 'callback_data': 'rules'}
                    ]]
                }
                
                send_telegram_message(bot_token, chat_id, welcome_text, keyboard)
            
            elif text == '/help':
                help_text = '''📚 <b>Помощь по боту</b>

/start - Главное меню
/help - Эта справка
/app - Открыть приложение

💡 Нажмите "Открыть приложение" для доступа ко всем функциям!'''
                
                send_telegram_message(bot_token, chat_id, help_text)
            
            else:
                reply_text = '👋 Используй /start для открытия приложения!'
                send_telegram_message(bot_token, chat_id, reply_text)
        
        elif 'callback_query' in body_data:
            callback = body_data['callback_query']
            chat_id = callback['message']['chat']['id']
            callback_data = callback['data']
            
            if callback_data == 'rules':
                rules_text = '''📖 <b>Правила игры "РАКЕТА"</b>

🚀 <b>Как играть:</b>
1. Сделайте ставку (от 1 монеты)
2. Нажмите "Запуск" - ракета взлетает!
3. Коэффициент растёт: 1.00x → 1.50x → 2.00x → ...
4. Нажмите "Забрать" до взрыва ракеты!

💰 <b>Выигрыш:</b>
Ваша ставка × коэффициент = выигрыш

💥 <b>Проигрыш:</b>
Если ракета взорвётся - ставка сгорает

📊 <b>Шансы:</b>
• 70% - ракета взрывается до 1.50x
• 20% - ракета достигает 1.50x-2.50x
• 7% - ракета достигает 2.50x-5.00x
• 3% - ракета достигает 5.00x-15.00x

🎯 <b>Стратегия:</b>
Забирайте на малых коэффициентах (1.20x-1.50x) для частых выигрышей!'''
                
                send_telegram_message(bot_token, chat_id, rules_text)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'ok': True}),
            'isBase64Encoded': False
        }
    
    if path == 'setup_webhook' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        bot_token = body_data.get('bot_token', os.environ.get('TELEGRAM_BOT_TOKEN', ''))
        webhook_url = 'https://functions.poehali.dev/a71f7786-5cde-465c-8f34-348cbe04c7bf?path=telegram_webhook'
        
        import urllib.request
        import urllib.parse
        
        url = f'https://api.telegram.org/bot{bot_token}/setWebhook'
        data = json.dumps({'url': webhook_url}).encode('utf-8')
        
        req = urllib.request.Request(
            url,
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'ok': False, 'error': str(e)}),
                'isBase64Encoded': False
            }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET' and path == 'user':
            telegram_id = event.get('queryStringParameters', {}).get('telegram_id')
            
            if not telegram_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'telegram_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT * FROM users WHERE telegram_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user:
                referral_code = generate_referral_code()
                cur.execute(
                    'INSERT INTO users (telegram_id, referral_code, balance) VALUES (%s, %s, %s) RETURNING *',
                    (telegram_id, referral_code, 1000.00)
                )
                user = cur.fetchone()
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(user), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'transactions':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id is required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                'SELECT * FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 50',
                (user_id,)
            )
            transactions = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(t) for t in transactions], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'transaction':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            trans_type = body_data.get('type')
            amount = body_data.get('amount')
            description = body_data.get('description', '')
            
            if not all([user_id, trans_type, amount]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id, type and amount are required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                'INSERT INTO transactions (user_id, type, amount, description, status) VALUES (%s, %s, %s, %s, %s) RETURNING *',
                (user_id, trans_type, amount, description, 'completed')
            )
            transaction = cur.fetchone()
            
            if trans_type in ['card_bonus', 'referral_bonus', 'deposit']:
                cur.execute(
                    'UPDATE users SET balance = balance + %s, total_earned = total_earned + %s WHERE id = %s',
                    (amount, amount, user_id)
                )
            elif trans_type in ['withdrawal', 'boost_payment']:
                cur.execute(
                    'UPDATE users SET balance = balance - %s WHERE id = %s',
                    (amount, user_id)
                )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(transaction), default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'rocket_start':
            body_data = json.loads(event.get('body', '{}'))
            telegram_id = body_data.get('telegram_id')
            bet_amount = float(body_data.get('bet_amount', 0))
            
            if not telegram_id or bet_amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid parameters'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT id, balance FROM users WHERE telegram_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            if float(user['balance']) < bet_amount:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'}),
                    'isBase64Encoded': False
                }
            
            crash_point = generate_crash_point()
            
            cur.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (bet_amount, user['id']))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'crash_point': crash_point, 'user_id': user['id']}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'rocket_cashout':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            bet_amount = float(body_data.get('bet_amount', 0))
            multiplier = float(body_data.get('multiplier', 0))
            crash_point = float(body_data.get('crash_point', 0))
            
            if not user_id or bet_amount <= 0 or multiplier <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid parameters'}),
                    'isBase64Encoded': False
                }
            
            profit = round(bet_amount * multiplier, 2)
            net_profit = round(profit - bet_amount, 2)
            
            cur.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (profit, user_id))
            
            cur.execute(
                '''INSERT INTO rocket_games (user_id, bet_amount, multiplier, crash_point, profit, won)
                   VALUES (%s, %s, %s, %s, %s, %s)''',
                (user_id, bet_amount, multiplier, crash_point, net_profit, True)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'profit': profit, 'net_profit': net_profit}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'rocket_lost':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            bet_amount = float(body_data.get('bet_amount', 0))
            crash_point = float(body_data.get('crash_point', 0))
            
            if not user_id or bet_amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid parameters'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''INSERT INTO rocket_games (user_id, bet_amount, multiplier, crash_point, profit, won)
                   VALUES (%s, %s, %s, %s, %s, %s)''',
                (user_id, bet_amount, crash_point, crash_point, -bet_amount, False)
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'rocket_history':
            telegram_id = event.get('queryStringParameters', {}).get('telegram_id')
            
            if not telegram_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'telegram_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT id FROM users WHERE telegram_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''SELECT * FROM rocket_games WHERE user_id = %s 
                   ORDER BY created_at DESC LIMIT 20''',
                (user['id'],)
            )
            games = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(g) for g in games], default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == 'rocket_balance':
            telegram_id = event.get('queryStringParameters', {}).get('telegram_id')
            
            if not telegram_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'telegram_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT balance FROM users WHERE telegram_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user:
                referral_code = generate_referral_code()
                cur.execute(
                    'INSERT INTO users (telegram_id, referral_code, balance) VALUES (%s, %s, %s) RETURNING balance',
                    (telegram_id, referral_code, 1000.00)
                )
                user = cur.fetchone()
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'balance': float(user['balance'])}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == 'boost':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            service_type = body_data.get('service_type')
            platform = body_data.get('platform')
            target_url = body_data.get('target_url')
            quantity = body_data.get('quantity')
            price = body_data.get('price')
            
            if not all([user_id, service_type, platform, target_url, quantity, price]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'All fields are required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT balance FROM users WHERE id = %s', (user_id,))
            user = cur.fetchone()
            
            if not user or float(user['balance']) < float(price):
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Insufficient balance'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                'INSERT INTO boost_orders (user_id, service_type, platform, target_url, quantity, price) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *',
                (user_id, service_type, platform, target_url, quantity, price)
            )
            order = cur.fetchone()
            
            cur.execute(
                'UPDATE users SET balance = balance - %s WHERE id = %s',
                (price, user_id)
            )
            
            cur.execute(
                'INSERT INTO transactions (user_id, type, amount, description) VALUES (%s, %s, %s, %s)',
                (user_id, 'boost_payment', price, f'Заказ накрутки: {service_type} на {platform}')
            )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(dict(order), default=str),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Endpoint not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }