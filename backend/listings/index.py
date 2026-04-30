"""
Бизнес: CRUD объявлений на платформе Рынок - создание, поиск, просмотр, редактирование.
Args: event - dict с httpMethod, body, headers, queryStringParameters
      context - объект с request_id, function_name
Returns: HTTP response dict с объявлениями
"""
import json
import os
import psycopg2


def get_user_by_token(cur, token: str):
    if not token:
        return None
    token_safe = token.replace("'", "''")
    cur.execute(
        f"SELECT u.id, u.name FROM sessions s JOIN users u ON s.user_id = u.id "
        f"WHERE s.token = '{token_safe}' AND s.expires_at > CURRENT_TIMESTAMP"
    )
    return cur.fetchone()


def safe(s: str) -> str:
    return str(s).replace("'", "''")


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token', '')
        
        if method == 'GET':
            listing_id = params.get('id')
            
            if listing_id:
                lid = int(listing_id)
                cur.execute(
                    f"UPDATE listings SET views_count = views_count + 1 WHERE id = {lid}"
                )
                conn.commit()
                cur.execute(
                    f"SELECT l.id, l.title, l.description, l.price, l.currency, l.city, "
                    f"l.images, l.status, l.views_count, l.created_at, "
                    f"l.category_id, c.name, c.slug, "
                    f"u.id, u.name, u.phone, u.avatar_url "
                    f"FROM listings l "
                    f"LEFT JOIN categories c ON l.category_id = c.id "
                    f"LEFT JOIN users u ON l.user_id = u.id "
                    f"WHERE l.id = {lid}"
                )
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Не найдено'})}
                
                listing = {
                    'id': row[0], 'title': row[1], 'description': row[2],
                    'price': float(row[3]) if row[3] is not None else None,
                    'currency': row[4] or 'RUB', 'city': row[5] or '',
                    'images': row[6] or [], 'status': row[7],
                    'views_count': row[8], 'created_at': row[9].isoformat() if row[9] else None,
                    'category': {'id': row[10], 'name': row[11], 'slug': row[12]} if row[10] else None,
                    'seller': {'id': row[13], 'name': row[14], 'phone': row[15] or '', 'avatar_url': row[16] or ''}
                }
                return {'statusCode': 200, 'headers': cors_headers,
                        'body': json.dumps({'listing': listing})}
            
            # Список с фильтрами
            where = ["l.status = 'active'"]
            
            search = params.get('search', '').strip()
            if search:
                s = safe(search)
                where.append(f"(LOWER(l.title) LIKE LOWER('%{s}%') OR LOWER(l.description) LIKE LOWER('%{s}%'))")
            
            cat_slug = params.get('category', '').strip()
            if cat_slug:
                where.append(f"c.slug = '{safe(cat_slug)}'")
            
            city = params.get('city', '').strip()
            if city:
                where.append(f"LOWER(l.city) LIKE LOWER('%{safe(city)}%')")
            
            min_price = params.get('min_price')
            if min_price:
                try:
                    where.append(f"l.price >= {float(min_price)}")
                except ValueError:
                    pass
            
            max_price = params.get('max_price')
            if max_price:
                try:
                    where.append(f"l.price <= {float(max_price)}")
                except ValueError:
                    pass
            
            user_filter = params.get('user_id')
            if user_filter:
                try:
                    where.append(f"l.user_id = {int(user_filter)}")
                except ValueError:
                    pass
            
            my_only = params.get('my') == '1'
            if my_only:
                me = get_user_by_token(cur, token)
                if not me:
                    return {'statusCode': 401, 'headers': cors_headers,
                            'body': json.dumps({'error': 'Не авторизован'})}
                where = [f"l.user_id = {me[0]}"]
            
            where_sql = ' AND '.join(where) if where else 'TRUE'
            
            sort = params.get('sort', 'new')
            order_sql = 'l.created_at DESC'
            if sort == 'price_asc':
                order_sql = 'l.price ASC NULLS LAST'
            elif sort == 'price_desc':
                order_sql = 'l.price DESC NULLS LAST'
            
            limit = min(int(params.get('limit', 30)), 100)
            offset = int(params.get('offset', 0))
            
            cur.execute(
                f"SELECT l.id, l.title, l.price, l.currency, l.city, l.images, "
                f"l.created_at, l.views_count, c.name, c.slug, l.user_id "
                f"FROM listings l LEFT JOIN categories c ON l.category_id = c.id "
                f"WHERE {where_sql} ORDER BY {order_sql} LIMIT {limit} OFFSET {offset}"
            )
            rows = cur.fetchall()
            listings = [{
                'id': r[0], 'title': r[1],
                'price': float(r[2]) if r[2] is not None else None,
                'currency': r[3] or 'RUB', 'city': r[4] or '',
                'images': r[5] or [],
                'created_at': r[6].isoformat() if r[6] else None,
                'views_count': r[7],
                'category_name': r[8] or '', 'category_slug': r[9] or '',
                'user_id': r[10]
            } for r in rows]
            
            return {'statusCode': 200, 'headers': cors_headers,
                    'body': json.dumps({'listings': listings})}
        
        if method == 'POST':
            user = get_user_by_token(cur, token)
            if not user:
                return {'statusCode': 401, 'headers': cors_headers,
                        'body': json.dumps({'error': 'Войдите в аккаунт'})}
            
            body = json.loads(event.get('body', '{}'))
            title = body.get('title', '').strip()
            description = body.get('description', '').strip()
            price = body.get('price')
            city = body.get('city', '').strip()
            category_id = body.get('category_id')
            images = body.get('images', [])
            
            if not title or not description or not category_id:
                return {'statusCode': 400, 'headers': cors_headers,
                        'body': json.dumps({'error': 'Заполните все обязательные поля'})}
            
            try:
                price_val = float(price) if price not in (None, '') else 'NULL'
            except (ValueError, TypeError):
                price_val = 'NULL'
            
            images_arr = "ARRAY[]::TEXT[]"
            if images and isinstance(images, list):
                items = ",".join([f"'{safe(x)}'" for x in images if x])
                if items:
                    images_arr = f"ARRAY[{items}]::TEXT[]"
            
            price_sql = price_val if price_val == 'NULL' else str(price_val)
            
            cur.execute(
                f"INSERT INTO listings (user_id, category_id, title, description, price, city, images) "
                f"VALUES ({user[0]}, {int(category_id)}, '{safe(title)}', '{safe(description)}', "
                f"{price_sql}, '{safe(city)}', {images_arr}) RETURNING id"
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            
            return {'statusCode': 200, 'headers': cors_headers,
                    'body': json.dumps({'id': new_id, 'success': True})}
        
        if method == 'DELETE':
            user = get_user_by_token(cur, token)
            if not user:
                return {'statusCode': 401, 'headers': cors_headers,
                        'body': json.dumps({'error': 'Войдите в аккаунт'})}
            
            lid = params.get('id')
            if not lid:
                return {'statusCode': 400, 'headers': cors_headers,
                        'body': json.dumps({'error': 'id required'})}
            
            cur.execute(
                f"UPDATE listings SET status = 'deleted' WHERE id = {int(lid)} AND user_id = {user[0]}"
            )
            conn.commit()
            return {'statusCode': 200, 'headers': cors_headers,
                    'body': json.dumps({'success': True})}
        
        return {'statusCode': 400, 'headers': cors_headers,
                'body': json.dumps({'error': 'Bad request'})}
    finally:
        cur.close()
        conn.close()
