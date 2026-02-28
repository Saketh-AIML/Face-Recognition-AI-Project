from flask import Flask, request, jsonify
import sqlite3
import os
# Log file paths
LOG_FILE = 'server.log'
LOGIN_HISTORY_FILE = 'login_history.log'

# Set up logging to file
import logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

app = Flask(__name__)

def append_login_history(username, status):
    import datetime
    entry = {
        'username': username,
        'status': status,
        'timestamp': datetime.datetime.now().isoformat()
    }
    try:
        import json
        with open(LOGIN_HISTORY_FILE, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry) + '\n')
    except Exception as e:
        logging.error(f'Failed to write login history: {e}')

# Log endpoint must be after app is defined
@app.route('/api/login-logs', methods=['GET'])
def get_login_logs():
    import json
    if not os.path.exists(LOGIN_HISTORY_FILE):
        return jsonify({'logs': []})
    try:
        with open(LOGIN_HISTORY_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()[-100:]
        logs = [json.loads(line) for line in lines]
        return jsonify({'logs': logs})
    except Exception as e:
        return jsonify({'logs': [], 'error': str(e)})
@app.route('/api/logs', methods=['GET'])
def get_logs():
    if not os.path.exists(LOG_FILE):
        return jsonify({'logs': 'No logs found.'})
    try:
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()[-100:]  # Last 100 lines
        return jsonify({'logs': ''.join(lines)})
    except Exception as e:
        return jsonify({'logs': f'Error reading log file: {str(e)}'})

import numpy as np
import base64
from PIL import Image
import io
from flask_cors import CORS
import face_recognition


CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
DATABASE = 'database.db'

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        password TEXT,
        image TEXT
    )''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return 'Flask backend is running!'

# Registration endpoint
@app.route('/api/register', methods=['POST'])
def register():
    logging.info('Register endpoint called')
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    image_b64 = data.get('image')
    if not username or not password or not image_b64:
        return jsonify({'error': 'Username, password, and image required'}), 400
    # Just store the image as-is (base64 string)
    conn = get_db()
    cur = conn.cursor()
    cur.execute('INSERT INTO users (name, email, password, image) VALUES (?, ?, ?, ?)',
                (username, email, password, image_b64))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'}), 201


# Recognition endpoint (using face_recognition library)
@app.route('/api/recognize', methods=['POST'])
def recognize():
    logging.info('Recognize endpoint called')
    data = request.get_json()
    image_b64 = data.get('image')
    if not image_b64:
        return jsonify({'error': 'Image required'}), 400
    try:
        image_data = base64.b64decode(image_b64.split(',')[1] if ',' in image_b64 else image_b64)
        image = face_recognition.load_image_file(io.BytesIO(image_data))
        encodings = face_recognition.face_encodings(image)
        if not encodings:
            return jsonify({'status': 'fail', 'error': 'No face detected'}), 404
        input_encoding = encodings[0]
    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT name, image FROM users')
    users = cur.fetchall()
    conn.close()
    for user in users:
        try:
            db_image_data = base64.b64decode(user['image'].split(',')[1] if ',' in user['image'] else user['image'])
            db_image = face_recognition.load_image_file(io.BytesIO(db_image_data))
            db_encodings = face_recognition.face_encodings(db_image)
            if not db_encodings:
                continue
            match = face_recognition.compare_faces([db_encodings[0]], input_encoding, tolerance=0.5)[0]
            if match:
                append_login_history(user['name'], 'success')
                return jsonify({'status': 'success', 'userName': user['name']}), 200
        except Exception:
            continue
    append_login_history('unknown', 'fail')
    return jsonify({'status': 'fail', 'error': 'User not recognized'}), 404


# Endpoint to list all registered users (admin)
@app.route('/api/users', methods=['GET'])
def list_users():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT id, name, email, image FROM users')
        rows = cur.fetchall()
        conn.close()

        # try to read last login times from the login history file
        last_logins = {}
        try:
            import json
            if os.path.exists(LOGIN_HISTORY_FILE):
                with open(LOGIN_HISTORY_FILE, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line:
                            continue
                        try:
                            item = json.loads(line)
                            uname = item.get('username')
                            ts = item.get('timestamp')
                            if uname and ts:
                                # keep latest
                                if uname not in last_logins or ts > last_logins[uname]:
                                    last_logins[uname] = ts
                        except Exception:
                            continue
        except Exception:
            last_logins = {}

        users = []
        for r in rows:
            users.append({
                'id': r['id'],
                'name': r['name'],
                'email': r['email'],
                'image': r['image'],
                'lastLogin': last_logins.get(r['name'])
            })

        return jsonify({'users': users})
    except Exception as e:
        logging.error(f'Error listing users: {e}')
        return jsonify({'users': [], 'error': str(e)})


@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'deleted': user_id})
    except Exception as e:
        logging.error(f'Error deleting user {user_id}: {e}')
        return jsonify({'status': 'error', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
