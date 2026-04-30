"""
Бизнес: Регистрация, вход и проверка сессий пользователей платформы Рынок.
Args: event - dict с httpMethod, body, headers, queryStringParameters
      context - объект с request_id, function_name
Returns: HTTP response dict с user данными и токеном сессии
"""
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2


def hash_password(password: str) -> str:
    salt = "market_salt_2026"
    return hashlib.sha256((password + salt).encode()).hexdigest()


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        params = event.get('queryStringParameters') or {}
        action = params.get('action', '')
        
        if method == 'POST':
            raw_body = event.get('body') or '{}'
            try:
                body = json.loads(raw_body) if raw_body else {}
            except (json.JSONDecodeError, ValueError):
                body = {}
            
            if action == 'register':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                name = body.get('name', '').strip()
                phone = body.get('phone', '').strip()
                city = body.get('city', '').strip()
                
                if not email or not password or not name:
                    return {'statusCode': 400, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Email, пароль и имя обязательны'})}
                
                if len(password) < 6:
                    return {'statusCode': 400, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Пароль минимум 6 символов'})}
                
                cur.execute(f"SELECT id FROM users WHERE email = '{email.replace(chr(39), chr(39)+chr(39))}'")
                if cur.fetchone():
                    return {'statusCode': 400, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Email уже зарегистрирован'})}
                
                pwd_hash = hash_password(password)
                email_safe = email.replace("'", "''")
                name_safe = name.replace("'", "''")
                phone_safe = phone.replace("'", "''")
                city_safe = city.replace("'", "''")
                
                cur.execute(
                    f"INSERT INTO users (email, password_hash, name, phone, city) "
                    f"VALUES ('{email_safe}', '{pwd_hash}', '{name_safe}', '{phone_safe}', '{city_safe}') "
                    f"RETURNING id, email, name, phone, city, avatar_url"
                )
                user = cur.fetchone()
                user_id = user[0]
                
                token = secrets.token_urlsafe(32)
                expires = datetime.now() + timedelta(days=30)
                cur.execute(
                    f"INSERT INTO sessions (user_id, token, expires_at) "
                    f"VALUES ({user_id}, '{token}', '{expires.isoformat()}')"
                )
                conn.commit()
                
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({
                    'token': token,
                    'user': {'id': user[0], 'email': user[1], 'name': user[2],
                             'phone': user[3] or '', 'city': user[4] or '', 'avatar_url': user[5] or ''}
                })}
            
            if action == 'login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                
                if not email or not password:
                    return {'statusCode': 400, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Email и пароль обязательны'})}
                
                pwd_hash = hash_password(password)
                email_safe = email.replace("'", "''")
                
                cur.execute(
                    f"SELECT id, email, name, phone, city, avatar_url FROM users "
                    f"WHERE email = '{email_safe}' AND password_hash = '{pwd_hash}' AND is_active = TRUE"
                )
                user = cur.fetchone()
                
                if not user:
                    return {'statusCode': 401, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Неверный email или пароль'})}
                
                token = secrets.token_urlsafe(32)
                expires = datetime.now() + timedelta(days=30)
                cur.execute(
                    f"INSERT INTO sessions (user_id, token, expires_at) "
                    f"VALUES ({user[0]}, '{token}', '{expires.isoformat()}')"
                )
                conn.commit()
                
                return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({
                    'token': token,
                    'user': {'id': user[0], 'email': user[1], 'name': user[2],
                             'phone': user[3] or '', 'city': user[4] or '', 'avatar_url': user[5] or ''}
                })}
        
        if method == 'GET' and action == 'me':
            headers = event.get('headers', {})
            token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
            
            if not token:
                return {'statusCode': 401, 'headers': cors_headers,
                        'body': json.dumps({'error': 'Не авторизован'})}
            
            token_safe = token.replace("'", "''")
            cur.execute(
                f"SELECT u.id, u.email, u.name, u.phone, u.city, u.avatar_url "
                f"FROM sessions s JOIN users u ON s.user_id = u.id "
                f"WHERE s.token = '{token_safe}' AND s.expires_at > CURRENT_TIMESTAMP"
            )
            user = cur.fetchone()
            
            if not user:
                return {'statusCode': 401, 'headers': cors_headers,
                        'body': json.dumps({'error': 'Сессия истекла'})}
            
            return {'statusCode': 200, 'headers': cors_headers, 'body': json.dumps({
                'user': {'id': user[0], 'email': user[1], 'name': user[2],
                         'phone': user[3] or '', 'city': user[4] or '', 'avatar_url': user[5] or ''}
            })}
        
        return {'statusCode': 400, 'headers': cors_headers,
                'body': json.dumps({'error': 'Неизвестное действие'})}
    finally:
        cur.close()
        conn.close()