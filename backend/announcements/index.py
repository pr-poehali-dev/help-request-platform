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
            announcement_id = query_params.get('id')
            track_view = query_params.get('track_view')
            
            # Учёт просмотра конкретного объявления
            if announcement_id and track_view == '1':
                cursor.execute(f"""
                    UPDATE {schema}.announcements 
                    SET views = COALESCE(views, 0) + 1
                    WHERE id = %s
                """, (announcement_id,))
                conn.commit()
            
            query = f"SELECT * FROM {schema}.announcements WHERE payment_status IN ('paid', 'pending')"
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
                status_map = {
                    'paid': 'Опубликовано',
                    'pending': 'Ожидает оплаты',
                    'active': 'Активно',
                    'closed': 'Закрыто'
                }
                result.append({
                    'id': ann['id'],
                    'title': ann['title'],
                    'description': ann['description'],
                    'category': ann['category'],
                    'author': ann['author_name'],
                    'date': ann['created_at'].isoformat() if ann['created_at'] else None,
                    'type': ann['type'],
                    'status': status_map.get(ann.get('payment_status', 'active'), ann.get('status', 'Активно')),
                    'views': ann.get('views', 0)
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
            
            if action == 'track_visit':
                # Учёт посещения сайта
                visitor_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
                user_agent = event.get('headers', {}).get('user-agent', '')
                
                cursor.execute(f"""
                    INSERT INTO {schema}.site_visits (visitor_ip, user_agent)
                    VALUES (%s, %s)
                """, (visitor_ip, user_agent))
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
            
            elif action == 'get_stats':
                # Статистика для админ-панели
                admin_code = body.get('admin_code', '')
                
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
                
                # Общее количество посещений
                cursor.execute(f"SELECT COUNT(*) as total FROM {schema}.site_visits")
                total_visits = cursor.fetchone()['total']
                
                # Уникальные посетители
                cursor.execute(f"SELECT COUNT(DISTINCT visitor_ip) as unique_visitors FROM {schema}.site_visits")
                unique_visitors = cursor.fetchone()['unique_visitors']
                
                # Посещения за сегодня
                cursor.execute(f"""
                    SELECT COUNT(*) as today_visits 
                    FROM {schema}.site_visits 
                    WHERE DATE(visited_at) = CURRENT_DATE
                """)
                today_visits = cursor.fetchone()['today_visits']
                
                # Просмотры объявлений
                cursor.execute(f"SELECT SUM(COALESCE(views, 0)) as total_views FROM {schema}.announcements")
                total_announcement_views = cursor.fetchone()['total_views'] or 0
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'total_visits': total_visits,
                        'unique_visitors': unique_visitors,
                        'today_visits': today_visits,
                        'total_announcement_views': total_announcement_views
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'close':
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
            
            elif action == 'delete_all':
                # Удаление всех объявлений (только для админа)
                admin_code = body.get('admin_code', '')
                
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
                
                cursor.execute(f"DELETE FROM {schema}.announcements")
                deleted_count = cursor.rowcount
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'deleted': deleted_count,
                        'message': f'Удалено {deleted_count} объявлений'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'delete':
                # Удаление конкретного объявления (только для админа)
                admin_code = body.get('admin_code', '')
                announcement_id = body.get('id')
                
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
                
                cursor.execute(f"DELETE FROM {schema}.announcements WHERE id = %s", (announcement_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message': 'Объявление удалено'
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