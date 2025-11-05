'''
Business: API для инвестиционного бота с начислением 1% в день
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
from datetime import datetime, timedelta

def generate_referral_code(length: int = 10) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

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

def calculate_accruals(user_id: int, conn):
    cur = conn.cursor()
    
    cur.execute('''
        SELECT id, amount, last_collect, accumulated 
        FROM investments 
        WHERE user_id = %s AND is_active = true
    ''', (user_id,))
    
    investments = cur.fetchall()
    total_accrued = 0
    
    for inv in investments:
        time_diff = datetime.now() - inv['last_collect']
        days_passed = time_diff.total_seconds() / 86400
        
        daily_profit = float(inv['amount']) * 0.01
        accrued = daily_profit * days_passed
        new_accumulated = float(inv['accumulated']) + accrued
        
        cur.execute('''
            UPDATE investments 
            SET accumulated = %s, last_collect = CURRENT_TIMESTAMP 
            WHERE id = %s
        ''', (new_accumulated, inv['id']))
        
        total_accrued += accrued
    
    conn.commit()
    cur.close()
    return total_accrued

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
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '8016931243:AAE2ywL1OwgWg6Wmf1u24ltU1kOnwz14Jvw')
        
        if 'message' in body_data:
            message = body_data['message']
            chat_id = message['chat']['id']
            text = message.get('text', '')
            user_first_name = message['from'].get('first_name', 'друг')
            telegram_id = message['from']['id']
            
            conn = get_db_connection()
            cur = conn.cursor()
            
            cur.execute('SELECT * FROM telegram_users WHERE user_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user:
                referral_code = generate_referral_code()
                cur.execute('''
                    INSERT INTO telegram_users (user_id, username, balance, withdraw_balance) 
                    VALUES (%s, %s, 0, 0) RETURNING *
                ''', (telegram_id, message['from'].get('username', '')))
                user = cur.fetchone()
                conn.commit()
            
            if text == '/start':
                app_url = 'https://monetkalife.poehali.dev/'
                
                welcome_text = f'''👋 <b>Привет, {user_first_name}!</b>

💰 <b>MLWizard Investment</b> - Ваш путь к пассивному доходу!

📈 Получайте <b>1% в день</b> от суммы инвестиций
🔄 Ежедневное начисление прибыли
💎 Вывод средств в любое время
👥 Партнёрская программа

🎯 Нажми кнопку ниже, чтобы начать зарабатывать!'''
                
                keyboard = {
                    'inline_keyboard': [[
                        {'text': '💰 Открыть приложение', 'web_app': {'url': app_url}}
                    ], [
                        {'text': '📊 Как это работает?', 'callback_data': 'how_it_works'}
                    ]]
                }
                
                send_telegram_message(bot_token, chat_id, welcome_text, keyboard)
            
            cur.close()
            conn.close()
        
        elif 'callback_query' in body_data:
            callback = body_data['callback_query']
            chat_id = callback['message']['chat']['id']
            callback_data = callback['data']
            
            if callback_data == 'how_it_works':
                info_text = '''📖 <b>Как работает MLWizard Investment?</b>

💰 <b>Инвестиции:</b>
• Минимальная сумма - от 100₽
• Доходность - 1% в день
• Начисления каждые 24 часа

💎 <b>Вывод средств:</b>
• Без комиссий
• Моментальная обработка
• На любой кошелёк

👥 <b>Партнёрская программа:</b>
• 10% от инвестиций рефералов
• Бонусы за активных партнёров
• Многоуровневая система

📊 <b>Калькулятор доходности:</b>
Инвестиция 10,000₽ = 100₽/день = 3,000₽/месяц

🎯 Начни зарабатывать прямо сейчас!'''
                
                send_telegram_message(bot_token, chat_id, info_text)
        
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
            
            calculate_accruals(int(telegram_id), conn)
            
            cur.execute('SELECT * FROM telegram_users WHERE user_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user:
                referral_code = generate_referral_code()
                cur.execute('''
                    INSERT INTO telegram_users (user_id, balance, withdraw_balance) 
                    VALUES (%s, 0, 0) RETURNING *
                ''', (telegram_id,))
                user = cur.fetchone()
                conn.commit()
            
            cur.execute('''
                SELECT SUM(amount) as total_invested, SUM(accumulated) as total_accumulated 
                FROM investments 
                WHERE user_id = %s AND is_active = true
            ''', (telegram_id,))
            investment_stats = cur.fetchone()
            
            cur.close()
            conn.close()
            
            user_data = {
                'user_id': int(user['user_id']),
                'username': user.get('username', ''),
                'balance': float(user['balance']),
                'withdraw_balance': float(user['withdraw_balance']),
                'partners_count': int(user['partners_count'])
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': user_data,
                    'total_invested': float(investment_stats['total_invested'] or 0),
                    'total_accumulated': float(investment_stats['total_accumulated'] or 0)
                }),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and path == 'invest':
            body_data = json.loads(event.get('body', '{}'))
            telegram_id = body_data.get('telegram_id')
            amount = float(body_data.get('amount', 0))
            
            if amount < 100:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Минимальная сумма инвестиции - 100₽'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('SELECT balance FROM telegram_users WHERE user_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user or float(user['balance']) < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE telegram_users 
                SET balance = balance - %s 
                WHERE user_id = %s
            ''', (amount, telegram_id))
            
            cur.execute('''
                INSERT INTO investments (user_id, amount, accumulated, is_active) 
                VALUES (%s, %s, 0, true) RETURNING *
            ''', (telegram_id, amount))
            
            investment = cur.fetchone()
            
            cur.execute('''
                INSERT INTO transactions (user_id, type, amount, status) 
                VALUES (%s, 'investment', %s, 'completed')
            ''', (telegram_id, amount))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'investment': dict(investment)}),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and path == 'collect':
            body_data = json.loads(event.get('body', '{}'))
            telegram_id = body_data.get('telegram_id')
            
            calculate_accruals(telegram_id, conn)
            
            cur.execute('''
                SELECT SUM(accumulated) as total_accumulated 
                FROM investments 
                WHERE user_id = %s AND is_active = true
            ''', (telegram_id,))
            result = cur.fetchone()
            total_accumulated = float(result['total_accumulated'] or 0)
            
            if total_accumulated > 0:
                cur.execute('''
                    UPDATE telegram_users 
                    SET withdraw_balance = withdraw_balance + %s 
                    WHERE user_id = %s
                ''', (total_accumulated, telegram_id))
                
                cur.execute('''
                    UPDATE investments 
                    SET accumulated = 0 
                    WHERE user_id = %s AND is_active = true
                ''', (telegram_id,))
                
                cur.execute('''
                    INSERT INTO transactions (user_id, type, amount, status) 
                    VALUES (%s, 'collect', %s, 'completed')
                ''', (telegram_id, total_accumulated))
                
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'collected': total_accumulated}),
                'isBase64Encoded': False
            }
        
        if method == 'GET' and path == 'investments':
            telegram_id = event.get('queryStringParameters', {}).get('telegram_id')
            
            calculate_accruals(int(telegram_id), conn)
            
            cur.execute('''
                SELECT * FROM investments 
                WHERE user_id = %s AND is_active = true 
                ORDER BY start_date DESC
            ''', (telegram_id,))
            investments = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'investments': [dict(inv) for inv in investments]}, default=str),
                'isBase64Encoded': False
            }
        
        if method == 'POST' and path == 'withdraw':
            body_data = json.loads(event.get('body', '{}'))
            telegram_id = body_data.get('telegram_id')
            amount = float(body_data.get('amount', 0))
            
            cur.execute('SELECT withdraw_balance FROM telegram_users WHERE user_id = %s', (telegram_id,))
            user = cur.fetchone()
            
            if not user or float(user['withdraw_balance']) < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств для вывода'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE telegram_users 
                SET withdraw_balance = withdraw_balance - %s 
                WHERE user_id = %s
            ''', (amount, telegram_id))
            
            cur.execute('''
                INSERT INTO transactions (user_id, type, amount, status) 
                VALUES (%s, 'withdrawal', %s, 'pending')
            ''', (telegram_id, amount))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }