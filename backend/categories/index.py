"""
Бизнес: Получение списка категорий для платформы Рынок.
Args: event - dict с httpMethod
      context - объект с request_id, function_name
Returns: HTTP response dict со списком категорий
"""
import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT id, name, slug, icon, parent_id, sort_order "
            "FROM categories ORDER BY sort_order, name"
        )
        rows = cur.fetchall()
        categories = [
            {'id': r[0], 'name': r[1], 'slug': r[2], 'icon': r[3] or '',
             'parent_id': r[4], 'sort_order': r[5]}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': cors_headers,
                'body': json.dumps({'categories': categories})}
    finally:
        cur.close()
        conn.close()
