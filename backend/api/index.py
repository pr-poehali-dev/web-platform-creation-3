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
    
    if path == 'telegram_webhook':
        body_data = json.loads(event.get('body', '{}'))
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '8296427829:AAFS25SM96ZtRS2Z36XS1-jeY2uTDo0fj5M')
        
        if 'message' in body_data:
            message = body_data['message']
            chat_id = message['chat']['id']
            text = message.get('text', '')
            user_first_name = message['from'].get('first_name', 'друг')
            
            if text == '/start':
                web_app_url = 'https://monetkalife.poehali.dev/bot'
                
                welcome_text = f'''👋 <b>Привет, {user_first_name}!</b>

💰 Добро пожаловать в инвестиционного бота!

📊 Здесь вы можете:
• Инвестировать с доходностью 3% в день
• Выводить средства в любой момент
• Приглашать партнёров и получать бонусы

🚀 Нажми кнопку ниже, чтобы начать!'''
                
                keyboard = {
                    'inline_keyboard': [[
                        {'text': '🚀 Открыть приложение', 'web_app': {'url': web_app_url}}
                    ], [
                        {'text': '💬 Поддержка', 'url': 'https://t.me/admin'}
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
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True}),
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
                    'INSERT INTO users (telegram_id, referral_code) VALUES (%s, %s) RETURNING *',
                    (telegram_id, referral_code)
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