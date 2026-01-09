import json
import os
import psycopg2
import uuid
import base64
import requests
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """
    API для обработки платежей за объявления через ЮKassa.
    Создаёт платёж в ЮKassa и проверяет статус оплаты.
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
                return_url = body.get('return_url', 'https://помощь-рядом.рф')
                
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
                
                shop_id = os.environ.get('YOOKASSA_SHOP_ID')
                secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
                
                if not shop_id or not secret_key:
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
                            'payment_status': 'paid',
                            'test_mode': True,
                            'message': 'Тестовый режим: объявление создано без оплаты'
                        }),
                        'isBase64Encoded': False
                    }
                
                idempotence_key = str(uuid.uuid4())
                auth_string = f"{shop_id}:{secret_key}"
                auth_header = base64.b64encode(auth_string.encode()).decode()
                
                yookassa_data = {
                    'amount': {
                        'value': str(amount),
                        'currency': 'RUB'
                    },
                    'confirmation': {
                        'type': 'redirect',
                        'return_url': return_url
                    },
                    'capture': True,
                    'description': f'{title} ({announcement_type})',
                    'metadata': {
                        'announcement_id': announcement_id,
                        'type': announcement_type
                    }
                }
                
                yookassa_response = requests.post(
                    'https://api.yookassa.ru/v3/payments',
                    json=yookassa_data,
                    headers={
                        'Authorization': f'Basic {auth_header}',
                        'Idempotence-Key': idempotence_key,
                        'Content-Type': 'application/json'
                    }
                )
                
                if yookassa_response.status_code != 200:
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'error': 'Ошибка создания платежа',
                            'details': yookassa_response.text
                        }),
                        'isBase64Encoded': False
                    }
                
                payment_data = yookassa_response.json()
                payment_id = payment_data['id']
                confirmation_url = payment_data['confirmation']['confirmation_url']
                
                cursor.execute(f"""
                    UPDATE {schema}.announcements 
                    SET payment_id = %s
                    WHERE id = %s
                """, (payment_id, announcement_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'announcement_id': announcement_id,
                        'payment_id': payment_id,
                        'amount': amount,
                        'confirmation_url': confirmation_url,
                        'payment_status': 'pending'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'check_payment':
                announcement_id = body.get('announcement_id')
                schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
                
                cursor.execute(f"""
                    SELECT payment_status, payment_amount, payment_id FROM {schema}.announcements WHERE id = %s
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
                
                payment_status, amount, payment_id = result
                
                if payment_id and payment_status == 'pending':
                    shop_id = os.environ.get('YOOKASSA_SHOP_ID')
                    secret_key = os.environ.get('YOOKASSA_SECRET_KEY')
                    
                    if shop_id and secret_key:
                        auth_string = f"{shop_id}:{secret_key}"
                        auth_header = base64.b64encode(auth_string.encode()).decode()
                        
                        yookassa_response = requests.get(
                            f'https://api.yookassa.ru/v3/payments/{payment_id}',
                            headers={'Authorization': f'Basic {auth_header}'}
                        )
                        
                        if yookassa_response.status_code == 200:
                            payment_info = yookassa_response.json()
                            yookassa_status = payment_info.get('status')
                            
                            if yookassa_status == 'succeeded':
                                cursor.execute(f"""
                                    UPDATE {schema}.announcements 
                                    SET payment_status = 'paid'
                                    WHERE id = %s
                                """, (announcement_id,))
                                conn.commit()
                                payment_status = 'paid'
                            elif yookassa_status in ['canceled', 'cancelled']:
                                payment_status = 'cancelled'
                
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