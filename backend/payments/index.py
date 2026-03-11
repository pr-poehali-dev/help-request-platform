import json
import os
import psycopg2
import requests
import hashlib
from datetime import datetime, timedelta

def calculate_token(params: dict, password: str) -> str:
    """Вычислить токен для подписи запроса к Тинькофф API"""
    values = {k: str(v) for k, v in params.items() if k != 'Token'}
    values['Password'] = password
    sorted_values = sorted(values.items())
    concatenated = ''.join([str(v) for k, v in sorted_values])
    return hashlib.sha256(concatenated.encode()).hexdigest()

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
    API для приема платежей через Тинькофф СБП.
    Создаёт платёж, генерирует QR-код и проверяет статус оплаты.
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
                amount_kopecks = amount * 100
                
                expires_at = None
                if announcement_type == 'vip':
                    expires_at = datetime.now() + timedelta(days=7)
                
                # Создаём объявление в БД
                schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
                cursor.execute(f"""
                    INSERT INTO {schema}.announcements 
                    (title, description, category, author_name, author_contact, type, payment_amount, payment_status, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (title, description, category, author_name, author_contact, announcement_type, amount, 'pending', expires_at))
                
                announcement_id = cursor.fetchone()[0]
                conn.commit()
                
                # Создаём платёж в Тинькофф
                terminal_key = os.environ.get('TINKOFF_TERMINAL_KEY', '')
                password = os.environ.get('TINKOFF_PASSWORD', '')
                
                order_id = f'ann_{announcement_id}_{int(datetime.now().timestamp())}'
                
                init_params = {
                    'TerminalKey': terminal_key,
                    'Amount': amount_kopecks,
                    'OrderId': order_id,
                    'Description': f'Объявление: {title[:50]}'
                }
                
                init_params['Token'] = calculate_token(init_params, password)
                
                # Запрос в Тинькофф API
                tinkoff_response = requests.post(
                    'https://securepay.tinkoff.ru/v2/Init',
                    json=init_params,
                    timeout=10
                )
                
                tinkoff_data = tinkoff_response.json()
                
                if not tinkoff_data.get('Success'):
                    raise Exception(f"Ошибка Tinkoff API: {tinkoff_data.get('Message', 'Unknown error')}")
                
                payment_id = tinkoff_data.get('PaymentId')
                
                # Генерируем QR-код для СБП (DYNAMIC = настоящий СБП QR)
                qr_params = {
                    'TerminalKey': terminal_key,
                    'PaymentId': str(payment_id),
                    'DataType': 'DYNAMIC'
                }
                qr_params['Token'] = calculate_token(qr_params, password)
                
                qr_response = requests.post(
                    'https://securepay.tinkoff.ru/v2/GetQr',
                    json=qr_params,
                    timeout=10
                )
                
                qr_data = qr_response.json()
                print(f"GetQr response: {qr_data}")
                qr_code_data = qr_data.get('Data', '')
                
                # Если СБП QR не получен — используем PaymentURL
                if not qr_code_data:
                    print(f"GetQr failed, fallback to PaymentURL. Error: {qr_data.get('Message', '')}")
                    qr_code_data = tinkoff_data.get('PaymentURL', '')
                
                # Сохраняем payment_id в БД
                cursor.execute(f"""
                    UPDATE {schema}.announcements 
                    SET payment_id = %s
                    WHERE id = %s
                """, (payment_id, announcement_id))
                conn.commit()
                
                type_names = {'regular': 'Обычное', 'boosted': 'Поднятое', 'vip': 'VIP'}
                send_telegram_notification(
                    f"🔔 <b>Новое объявление ожидает оплаты</b>\n\n"
                    f"📝 <b>Заголовок:</b> {title}\n"
                    f"📂 <b>Категория:</b> {category}\n"
                    f"🏷 <b>Тип:</b> {type_names.get(announcement_type, announcement_type)}\n"
                    f"💵 <b>Сумма:</b> {amount}₽\n"
                    f"👤 <b>Автор:</b> {author_name}\n"
                    f"📞 <b>Контакт:</b> {author_contact}\n\n"
                    f"💳 Оплата через Тинькофф СБП\n"
                    f"🆔 ID объявления: {announcement_id}\n"
                    f"🆔 Payment ID: {payment_id}"
                )
                
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
                        'qr_code': qr_code_data,
                        'payment_url': tinkoff_data.get('PaymentURL', ''),
                        'payment_status': 'pending',
                        'message': f'Объявление создано! Отсканируйте QR-код для оплаты {amount}₽ через СБП.'
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
                
                # Проверяем статус в Тинькофф
                if payment_id and payment_status == 'pending':
                    terminal_key = os.environ.get('TINKOFF_TERMINAL_KEY', '')
                    password = os.environ.get('TINKOFF_PASSWORD', '')
                    
                    state_params = {
                        'TerminalKey': terminal_key,
                        'PaymentId': payment_id
                    }
                    state_params['Token'] = calculate_token(state_params, password)
                    
                    state_response = requests.post(
                        'https://securepay.tinkoff.ru/v2/GetState',
                        json=state_params,
                        timeout=10
                    )
                    
                    state_data = state_response.json()
                    tinkoff_status = state_data.get('Status', '')
                    
                    if tinkoff_status == 'CONFIRMED':
                        cursor.execute(f"""
                            UPDATE {schema}.announcements 
                            SET payment_status = 'paid'
                            WHERE id = %s
                        """, (announcement_id,))
                        conn.commit()
                        payment_status = 'paid'
                        
                        send_telegram_notification(
                            f"✅ <b>Платёж подтверждён автоматически!</b>\n\n"
                            f"🆔 ID объявления: {announcement_id}\n"
                            f"💵 Сумма: {amount}₽\n"
                            f"💳 Payment ID: {payment_id}"
                        )
                
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
            
            elif action == 'generate_sbp_qr':
                # Генерация СБП QR для пожертвований и обращений к знаменитостям
                amount = body.get('amount', 100)
                description = body.get('description', 'Оплата')
                amount_kopecks = int(amount) * 100
                
                terminal_key = os.environ.get('TINKOFF_TERMINAL_KEY', '')
                password = os.environ.get('TINKOFF_PASSWORD', '')
                
                import time
                order_id = f'sbp_{int(time.time())}'
                
                init_params = {
                    'TerminalKey': terminal_key,
                    'Amount': amount_kopecks,
                    'OrderId': order_id,
                    'Description': description[:140]
                }
                init_params['Token'] = calculate_token(init_params, password)
                
                init_response = requests.post(
                    'https://securepay.tinkoff.ru/v2/Init',
                    json=init_params,
                    timeout=10
                )
                init_data = init_response.json()
                print(f"Init response: {init_data}")
                
                if not init_data.get('Success'):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': init_data.get('Message', 'Ошибка создания платежа')}),
                        'isBase64Encoded': False
                    }
                
                payment_id = init_data.get('PaymentId')
                
                qr_params = {
                    'TerminalKey': terminal_key,
                    'PaymentId': str(payment_id),
                    'DataType': 'DYNAMIC'
                }
                qr_params['Token'] = calculate_token(qr_params, password)
                
                qr_response = requests.post(
                    'https://securepay.tinkoff.ru/v2/GetQr',
                    json=qr_params,
                    timeout=10
                )
                qr_data = qr_response.json()
                print(f"GetQr response: {qr_data}")
                
                qr_code_data = qr_data.get('Data', '') or init_data.get('PaymentURL', '')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'qr_code': qr_code_data,
                        'payment_id': payment_id,
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
                            f"✅ <b>Платёж подтверждён вручную!</b>\n\n"
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
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }