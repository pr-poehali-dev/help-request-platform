import json
import os
import psycopg2
import requests
from datetime import datetime, timedelta

def send_telegram_notification(message: str):
    """Отправить уведомление в Telegram"""
    try:
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
        
        if bot_token and chat_id:
            url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            requests.post(url, json={
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML'
            }, timeout=5)
    except Exception as e:
        print(f'Ошибка отправки в Telegram: {e}')

def handler(event: dict, context) -> dict:
    """
    API для приема платежей через ЮMoney.
    Создаёт объявление и показывает инструкцию для оплаты на карту ЮMoney.
    """
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cursor = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_payment':
                title = body.get('title', '')
                description = body.get('description', '')
                category = body.get('category', 'Разное')
                author_name = body.get('author_name', 'Аноним')
                author_contact = body.get('author_contact', '')
                announcement_type = body.get('type', 'regular')
                
                prices = {'regular': 10, 'boosted': 20, 'vip': 100}
                amount = prices.get(announcement_type, 10)
                
                expires_at = None
                if announcement_type == 'vip':
                    expires_at = datetime.now() + timedelta(days=7)
                
                schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
                cursor.execute(f"""
                    INSERT INTO {schema}.announcements 
                    (title, description, category, author_name, author_contact, type, payment_amount, payment_status, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (title, description, category, author_name, author_contact, announcement_type, amount, 'pending', expires_at))
                
                announcement_id = cursor.fetchone()[0]
                conn.commit()
                
                type_names = {'regular': 'Обычное', 'boosted': 'Поднятое', 'vip': 'VIP'}
                send_telegram_notification(
                    f"💰 <b>Новое объявление ожидает оплаты</b>\n\n"
                    f"📝 <b>Заголовок:</b> {title}\n"
                    f"📂 <b>Категория:</b> {category}\n"
                    f"🏷 <b>Тип:</b> {type_names.get(announcement_type, announcement_type)}\n"
                    f"💵 <b>Сумма:</b> {amount}₽\n"
                    f"👤 <b>Автор:</b> {author_name}\n"
                    f"📞 <b>Контакт:</b> {author_contact}\n\n"
                    f"ID объявления: {announcement_id}"
                )
                
                yoomoney_card = '4100119447434780'
                payment_url = f'https://yoomoney.ru/to/{yoomoney_card}/{amount}'
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'announcement_id': announcement_id,
                        'amount': amount,
                        'payment_url': payment_url,
                        'yoomoney_card': yoomoney_card,
                        'payment_status': 'pending',
                        'message': f'Переведите {amount}₽ на карту ЮMoney {yoomoney_card}'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'check_payment':
                announcement_id = body.get('announcement_id')
                schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
                
                cursor.execute(f"""
                    SELECT payment_status, payment_amount FROM {schema}.announcements WHERE id = %s
                """, (announcement_id,))
                
                result = cursor.fetchone()
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Объявление не найдено'}),
                        'isBase64Encoded': False
                    }
                
                payment_status, amount = result
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'payment_status': payment_status,
                        'amount': amount
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'confirm_payment':
                announcement_id = body.get('announcement_id')
                admin_code = body.get('admin_code', '')
                schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
                
                if admin_code == 'HELP2025':
                    cursor.execute(f"""
                        SELECT title, type, payment_amount FROM {schema}.announcements WHERE id = %s
                    """, (announcement_id,))
                    ann_data = cursor.fetchone()
                    
                    cursor.execute(f"""
                        UPDATE {schema}.announcements 
                        SET payment_status = 'paid'
                        WHERE id = %s
                    """, (announcement_id,))
                    conn.commit()
                    
                    if ann_data:
                        type_names = {'regular': 'Обычное', 'boosted': 'Поднятое', 'vip': 'VIP'}
                        send_telegram_notification(
                            f"✅ <b>Платёж подтверждён!</b>\n\n"
                            f"📝 <b>Объявление:</b> {ann_data[0]}\n"
                            f"🏷 <b>Тип:</b> {type_names.get(ann_data[1], ann_data[1])}\n"
                            f"💵 <b>Сумма:</b> {ann_data[2]}₽\n"
                            f"🆔 ID: {announcement_id}"
                        )
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': True,
                            'message': 'Платёж подтверждён'
                        }),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неверный код'}),
                    'isBase64Encoded': False
                }
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Ошибка сервера',
                'details': str(e)
            }),
            'isBase64Encoded': False
        }