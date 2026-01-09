import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """
    API для обработки платежей за объявления.
    Поддерживает создание платежа и проверку статуса.
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
                """, (title, description, category, author_name, author_contact, announcement_type, amount, 'paid', expires_at))
                
                announcement_id = cursor.fetchone()[0]
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
                        'amount': amount,
                        'payment_status': 'paid',
                        'message': 'Объявление создано и оплачено'
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
                if result:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'payment_status': result[0],
                            'amount': result[1]
                        }),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Объявление не найдено'}),
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
