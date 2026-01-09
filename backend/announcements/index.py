import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    """
    API для работы с объявлениями.
    GET - получить список объявлений
    POST - создать или обновить объявление
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
            filter_type = query_params.get('type')
            author = query_params.get('author')
            
            query = f"SELECT * FROM {schema}.announcements WHERE status = 'active'"
            params = []
            
            if filter_type:
                query += " AND type = %s"
                params.append(filter_type)
            
            if author:
                query += " AND author_name = %s"
                params.append(author)
            
            query += " ORDER BY CASE WHEN type = 'vip' THEN 1 WHEN type = 'boosted' THEN 2 ELSE 3 END, created_at DESC"
            
            cursor.execute(query, params)
            announcements = cursor.fetchall()
            
            result = []
            for ann in announcements:
                result.append({
                    'id': ann['id'],
                    'title': ann['title'],
                    'description': ann['description'],
                    'category': ann['category'],
                    'author': ann['author_name'],
                    'date': ann['created_at'].isoformat() if ann['created_at'] else None,
                    'type': ann['type'],
                    'status': ann['status']
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
            
            if action == 'close':
                announcement_id = body.get('id')
                cursor.execute(f"""
                    UPDATE {schema}.announcements 
                    SET status = 'closed' 
                    WHERE id = %s
                """, (announcement_id,))
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
