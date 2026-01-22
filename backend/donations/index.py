import json
import os
import psycopg2
import requests
from psycopg2.extras import RealDictCursor

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
    API для работы с благотворительными пожертвованиями.
    Пользователи оставляют пожертвования, админ распределяет их.
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
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        if method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            admin_code = query_params.get('admin_code')
            
            if admin_code == 'HELP2025':
                cursor.execute(f"""
                    SELECT * FROM {schema}.donations 
                    ORDER BY created_at DESC
                """)
                donations = cursor.fetchall()
                
                result = []
                for d in donations:
                    result.append({
                        'id': d['id'],
                        'donor_name': d['donor_name'],
                        'donor_contact': d['donor_contact'],
                        'amount': d['amount'],
                        'message': d['message'],
                        'payment_status': d['payment_status'],
                        'assigned_to': d['assigned_to'],
                        'admin_notes': d['admin_notes'],
                        'created_at': d['created_at'].isoformat() if d['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result),
                    'isBase64Encoded': False
                }
            
            cursor.execute(f"""
                SELECT id, donor_name, amount, message, created_at 
                FROM {schema}.donations 
                WHERE payment_status = 'paid'
                ORDER BY created_at DESC
                LIMIT 20
            """)
            donations = cursor.fetchall()
            
            result = []
            for d in donations:
                result.append({
                    'id': d['id'],
                    'donor_name': d['donor_name'],
                    'amount': d['amount'],
                    'message': d['message'],
                    'created_at': d['created_at'].isoformat() if d['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_donation':
                donor_name = body.get('donor_name', 'Аноним')
                donor_contact = body.get('donor_contact', '')
                amount = body.get('amount', 0)
                message = body.get('message', '')
                
                cursor.execute(f"""
                    INSERT INTO {schema}.donations 
                    (donor_name, donor_contact, amount, message, payment_status)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (donor_name, donor_contact, amount, message, 'paid'))
                
                donation_id = cursor.fetchone()['id']
                conn.commit()
                
                send_telegram_notification(
                    f"💰 <b>Новое пожертвование!</b>\n\n"
                    f"👤 <b>От:</b> {donor_name}\n"
                    f"💵 <b>Сумма:</b> {amount}₽\n"
                    f"💬 <b>Сообщение:</b> {message}\n"
                    f"📞 <b>Контакт:</b> {donor_contact}\n\n"
                    f"ID пожертвования: {donation_id}"
                )
                
                ozon_card = '2204321081688079'
                payment_url = f'https://www.tinkoff.ru/rm/p2p/?card={ozon_card}&amount={amount}'
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'donation_id': donation_id,
                        'payment_url': payment_url,
                        'ozon_card': ozon_card,
                        'message': f'Спасибо за поддержку! Переведите {amount}₽ на карту Ozon {ozon_card}'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'assign_donation':
                admin_code = body.get('admin_code', '')
                donation_id = body.get('donation_id')
                assigned_to = body.get('assigned_to', '')
                admin_notes = body.get('admin_notes', '')
                
                if admin_code != 'HELP2025':
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Неверный код'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(f"""
                    UPDATE {schema}.donations 
                    SET assigned_to = %s, admin_notes = %s
                    WHERE id = %s
                """, (assigned_to, admin_notes, donation_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
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
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()