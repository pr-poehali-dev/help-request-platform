import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """
    API для работы с откликами на объявления.
    GET - получить отклики по объявлению
    POST - создать отклик или отправить сообщение
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
            announcement_id = query_params.get('announcement_id')
            response_id = query_params.get('response_id')
            
            if response_id:
                cursor.execute(f"""
                    SELECT m.*, r.announcement_id, r.responder_name, r.message as initial_message
                    FROM {schema}.messages m
                    JOIN {schema}.responses r ON m.response_id = r.id
                    WHERE m.response_id = %s
                    ORDER BY m.created_at ASC
                """, (response_id,))
                messages = cursor.fetchall()
                
                result = []
                for msg in messages:
                    result.append({
                        'id': msg['id'],
                        'sender': msg['sender_name'],
                        'message': msg['message'],
                        'created_at': msg['created_at'].isoformat() if msg['created_at'] else None
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
            
            elif announcement_id:
                cursor.execute(f"""
                    SELECT r.*, 
                           (SELECT COUNT(*) FROM {schema}.messages WHERE response_id = r.id) as message_count
                    FROM {schema}.responses r
                    WHERE r.announcement_id = %s
                    ORDER BY r.created_at DESC
                """, (announcement_id,))
                responses = cursor.fetchall()
                
                result = []
                for resp in responses:
                    result.append({
                        'id': resp['id'],
                        'responder_name': resp['responder_name'],
                        'responder_contact': resp['responder_contact'],
                        'message': resp['message'],
                        'created_at': resp['created_at'].isoformat() if resp['created_at'] else None,
                        'status': resp['status'],
                        'message_count': resp['message_count']
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
            
            if action == 'create_response':
                announcement_id = body.get('announcement_id')
                responder_name = body.get('responder_name', 'Аноним')
                responder_contact = body.get('responder_contact', '')
                message = body.get('message', '')
                
                cursor.execute(f"""
                    INSERT INTO {schema}.responses 
                    (announcement_id, responder_name, responder_contact, message)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (announcement_id, responder_name, responder_contact, message))
                
                response_id = cursor.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'response_id': response_id
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_message':
                response_id = body.get('response_id')
                sender_name = body.get('sender_name', 'Аноним')
                message = body.get('message', '')
                
                cursor.execute(f"""
                    INSERT INTO {schema}.messages 
                    (response_id, sender_name, message)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (response_id, sender_name, message))
                
                message_id = cursor.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message_id': message_id
                    }),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неверный запрос'}),
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
