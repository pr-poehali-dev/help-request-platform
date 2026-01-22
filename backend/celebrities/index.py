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
    API для обращений к знаменитостям.
    Люди оставляют просьбы о помощи, направленные известным личностям.
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
                    SELECT * FROM {schema}.celebrity_requests 
                    ORDER BY created_at DESC
                """)
            else:
                cursor.execute(f"""
                    SELECT id, requester_name, celebrity_name, request_text, status, created_at 
                    FROM {schema}.celebrity_requests 
                    WHERE status != 'rejected'
                    ORDER BY created_at DESC
                    LIMIT 50
                """)
            
            requests_list = cursor.fetchall()
            
            result = []
            for r in requests_list:
                result.append({
                    'id': r['id'],
                    'requester_name': r['requester_name'],
                    'requester_contact': r.get('requester_contact', ''),
                    'celebrity_name': r['celebrity_name'],
                    'request_text': r['request_text'],
                    'status': r['status'],
                    'admin_notes': r.get('admin_notes', ''),
                    'created_at': r['created_at'].isoformat() if r['created_at'] else None
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
            
            if action == 'create_request':
                requester_name = body.get('requester_name', '')
                requester_contact = body.get('requester_contact', '')
                celebrity_name = body.get('celebrity_name', '')
                request_text = body.get('request_text', '')
                
                if not requester_name or not celebrity_name or not request_text:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(f"""
                    INSERT INTO {schema}.celebrity_requests 
                    (requester_name, requester_contact, celebrity_name, request_text)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (requester_name, requester_contact, celebrity_name, request_text))
                
                request_id = cursor.fetchone()['id']
                conn.commit()
                
                amount = 60
                ozon_card = '2204321081688079'
                
                send_telegram_notification(
                    f"⭐ <b>Новое обращение к знаменитости!</b>\n\n"
                    f"👤 <b>От:</b> {requester_name}\n"
                    f"🎭 <b>К кому:</b> {celebrity_name}\n"
                    f"📝 <b>Текст:</b> {request_text[:200]}...\n"
                    f"📞 <b>Контакт:</b> {requester_contact}\n"
                    f"💵 <b>Сумма:</b> {amount}₽\n\n"
                    f"ID обращения: {request_id}"
                )
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'request_id': request_id,
                        'amount': amount,
                        'ozon_card': ozon_card,
                        'message': f'Обращение создано! Переведите {amount}₽ на карту Ozon {ozon_card} или отсканируйте QR-код в форме'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_status':
                admin_code = body.get('admin_code', '')
                request_id = body.get('request_id')
                status = body.get('status', 'pending')
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
                    UPDATE {schema}.celebrity_requests 
                    SET status = %s, admin_notes = %s
                    WHERE id = %s
                """, (status, admin_notes, request_id))
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