from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import mysql.connector
from datetime import datetime, date 
import decimal

# --- 1. Configurazione Iniziale ---
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)
bcrypt = Bcrypt(app)

# ! CONFIGURAZIONE DATABASE XAMPP 
DB_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "", 
    "database": "bb_santorini"
}

# Dati Statici 
AVAILABLE_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


def get_db_connection():
    """Tenta di stabilire una connessione al database MySQL."""
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        print("CONNESSONE DB RIUSCITA!")
        return conn
    except mysql.connector.Error as err:
        print(f"ERRORE CRITICO DI CONNESSIONE A MYSQL: {err}")
        print(">>> ASSICURATI che XAMPP/MySQL sia avviato e la configurazione DB sia corretta.")
        # Se la connessione fallisce, ci assicuriamo che conn sia None
        return None
    
# --- 2. Rotte Frontend (Rendering Pagine) ---

@app.route('/')
def login_page(): 
    return render_template('login.html')

@app.route('/index.html') 
def index_page():
    return render_template('index.html')


@app.route('/booking')
def booking_page():
    return render_template('booking.html')

@app.route('/admin')
def admin_page():
    return render_template('admin.html') 

# --- 3. API di Autenticazione ---

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    status = 'user' 

    if not email or not password:
        return jsonify({"message": "Email e password sono obbligatori."}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500

    cursor = conn.cursor()
    try:
        # 1. Verifica esistenza
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"message": "Utente già registrato con questa email."}), 409

        # 2. Inserimento
        sql = "INSERT INTO users (email, password_hash, status) VALUES (%s, %s, %s)"
        cursor.execute(sql, (email, password_hash, status))
        conn.commit()
        
        return jsonify({"message": "Registrazione di successo! Puoi accedere ora."}), 201

    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Errore MySQL durante la registrazione: {err}")
        return jsonify({"message": "Errore interno del server durante la registrazione."}), 500
    
    finally:
        cursor.close()
        conn.close()


@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"message": "Email e password sono obbligatori."}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500

    cursor = conn.cursor(dictionary=True) 
    
    try:
        sql = "SELECT id, email, password_hash, status FROM users WHERE email = %s"
        cursor.execute(sql, (email,))
        user = cursor.fetchone()

        if user is None:
            return jsonify({"message": "Credenziali non valide."}), 401
        
        if bcrypt.check_password_hash(user['password_hash'], password):
            return jsonify({
                "message": "Login riuscito.",
                "status": user['status'],
                "user_id": user['id']
            }), 200
        else:
            return jsonify({"message": "Credenziali non valide."}), 401

    except mysql.connector.Error as err:
        print(f"Errore MySQL durante il login: {err}")
        return jsonify({"message": "Errore interno del server durante il login."}), 500
    
    finally:
        cursor.close()
        conn.close()

# --- 4. API di Prenotazione (Lettura/Disponibilità) ---

@app.route('/api/rates', methods=['GET'])
def get_rates():
    """Restituisce le tariffe delle camere dal database."""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500
    
    cursor = conn.cursor(dictionary=True)
    room_rates = {}

    try:
        sql = "SELECT room_type, price FROM rates"
        cursor.execute(sql)
        results = cursor.fetchall()
        
        for row in results:
            # Assicura che il prezzo sia un float per la serializzazione JSON
            if isinstance(row['price'], decimal.Decimal):
                room_rates[row['room_type']] = float(row['price'])
            else:
                 room_rates[row['room_type']] = row['price']
        
        return jsonify({
            "room_rates": room_rates,
            "available_months": AVAILABLE_MONTHS 
        }), 200

    except mysql.connector.Error as err:
        print(f"Errore MySQL durante il recupero tariffe: {err}")
        return jsonify({"message": "Errore interno del server (DB) durante il recupero tariffe."}, 500)
    
    finally:
        cursor.close()
        conn.close()


def is_room_available(room_type, start_date_str, end_date_str):
    """Logica per il controllo di sovrapposizione delle prenotazioni nel DB."""
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return False, "Formato data non valido (atteso YYYY-MM-DD)."

    if start_date >= end_date:
        return False, "La data di fine deve essere successiva alla data di inizio."

    conn = get_db_connection()
    if conn is None:
        return False, "Errore di connessione al database per la verifica disponibilità."
        
    cursor = conn.cursor(dictionary=True)
    
    # Logica di sovrapposizione: A < D AND C < B
    # start_date_nuova < end_date_esistente AND end_date_nuova > start_date_esistente
    sql_check = """
    SELECT id FROM bookings
    WHERE room_type = %s
    AND status != 'Cancellata'
    AND (
        start_date < %s AND end_date > %s
    )
    """
    
    # Parametri: room_type, end_date_nuova, start_date_nuova
    cursor.execute(sql_check, (room_type, end_date_str, start_date_str))
    
    overlapping_bookings = cursor.fetchall()
    
    cursor.close()
    conn.close()

    if overlapping_bookings:
        return False, "Camera non disponibile per le date selezionate."
    else:
        return True, "Camera disponibile! Procedi con la prenotazione."


@app.route('/api/availability', methods=['POST'])
def check_availability_api():
    data = request.json
    room_type = data.get('roomType')
    start_date = data.get('startDate')
    end_date = data.get('endDate')

    if not all([room_type, start_date, end_date]):
        return jsonify({"message": "Dati mancanti.", "available": False}), 400

    available, message = is_room_available(room_type, start_date, end_date)
    
    if available:
        return jsonify({"message": message, "available": True}), 200
    else:
        return jsonify({"message": message, "available": False}), 409 # Conflict

# --- 5. API di Prenotazione (Creazione) ---

@app.route('/api/book', methods=['POST'])
def book_room():
    """Salva una nuova prenotazione nel database MySQL."""
    data = request.json
    
    user_id = data.get('user_id')
    name = data.get('name')
    surname = data.get('surname')
    room_type = data.get('roomType')
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    total_cost_str = data.get('totalCost') 
    
    # Recupera i campi opzionali
    phone = data.get('phone', '')
    payment_method = data.get('paymentMethod', '')
    card_number = data.get('cardNumber', '')
    expiry_date = data.get('expiryDate', '')
    cvv = data.get('cvv', '')
    
    if not all([user_id, name, surname, room_type, start_date, end_date, total_cost_str]):
        return jsonify({"message": "Dati di prenotazione essenziali mancanti. Verifica il login e tutti i campi."}), 400

    # Conversione Costo
    try:
        total_cost_float = float(total_cost_str)
    except ValueError:
        return jsonify({"message": "Costo totale non valido (non numerico). Ricalcola il costo."}), 400

    # 1. Verifica disponibilità finale
    available, message = is_room_available(room_type, start_date, end_date)
    if not available:
        return jsonify({"message": f"Prenotazione fallita. {message}"}), 409

    # 2. Connessione DB
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500

    cursor = conn.cursor()
    try:
        # Aggiunto 'booking_date'
        booking_date = datetime.now().date() 

        sql = """
        INSERT INTO bookings 
        (user_id, name, surname, phone, room_type, payment_method, card_number, expiry_date, cvv, start_date, end_date, total_cost, status, booking_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'Confermata', %s)
        """
        
        values = (
            user_id, 
            name, 
            surname, 
            phone, 
            room_type, 
            payment_method, 
            card_number, 
            expiry_date, 
            cvv, 
            start_date, 
            end_date, 
            total_cost_float, 
            booking_date # <<< Nuovo campo
        )
        
        cursor.execute(sql, values)
        conn.commit() 

        return jsonify({"message": "Prenotazione salvata con successo nel database! Controlla la tua email per i dettagli."}), 201

    except mysql.connector.Error as err:
        conn.rollback() 
        print(f"Errore MySQL durante la prenotazione: {err}")
        return jsonify({"message": f"Errore interno del database. Dettaglio: {err}"}), 500
    
    except Exception as e:
        print(f"Errore generico durante la prenotazione: {e}")
        return jsonify({"message": "Errore interno del server durante la prenotazione."}), 500
        
    finally:
        cursor.close()
        conn.close()

# ==========================================================
# 6. API di Amministrazione (Guadagni, Prenotazioni e Tariffe)
# ==========================================================

@app.route('/api/admin/earnings', methods=['POST'])
def calculate_monthly_earnings_api():
    data = request.json
    month_num = data.get('month')
    year = data.get('year')

    try:
        if not (isinstance(month_num, int) and 1 <= month_num <= 12 and isinstance(year, int) and year > 1900):
             return jsonify({"message": "Mese o Anno non validi."}), 400
             
    except Exception:
        return jsonify({"message": "Mese o Anno non validi (Formato errato)."}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500
    
    cursor = conn.cursor()
    total_earnings = 0
    
    try:
        # LOGICA MIGLIORATA: Considera le prenotazioni la cui data di INIZIO cade nel mese/anno specificato.
        sql = """
        SELECT total_cost FROM bookings
        WHERE status != 'Cancellata'
        AND YEAR(start_date) = %s AND MONTH(start_date) = %s
        """
        cursor.execute(sql, (year, month_num))
        bookings = cursor.fetchall()

        for booking in bookings:
            try:
                cost = booking[0]
                # Conversione sicura da Decimal o altri tipi a float
                total_earnings += float(cost)
            except (TypeError, ValueError):
                print(f"Warning: Total cost not numeric for booking: {booking}")
                
        return jsonify({
            "message": f"Guadagni totali per {month_num}/{year}: {total_earnings:.2f}€",
            "total_earnings": round(total_earnings, 2)
        }), 200

    except mysql.connector.Error as err:
        print(f"Errore MySQL durante il calcolo guadagni: {err}")
        return jsonify({"message": "Errore interno del server (DB)."}, 500)
    
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/bookings', methods=['GET'])
def get_all_bookings():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500

    cursor = conn.cursor(dictionary=True)
    
    try:
        # Uso di LEFT JOIN per includere le prenotazioni anche se l'utente è stato cancellato.
        sql = """
        SELECT 
            b.id, b.name, b.surname, b.phone, b.room_type, b.start_date, b.end_date, b.total_cost, b.payment_method, b.status, 
            u.email AS user_email 
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.start_date DESC
        """
        cursor.execute(sql)
        bookings = cursor.fetchall()
        
        # Conversione dei tipi di dato per la serializzazione JSON
        for booking in bookings:
            # Conversione data in stringa YYYY-MM-DD
            if isinstance(booking.get('start_date'), date): 
                booking['start_date'] = booking['start_date'].strftime('%Y-%m-%d')
            if isinstance(booking.get('end_date'), date):
                booking['end_date'] = booking['end_date'].strftime('%Y-%m-%d')
            # Converte gli oggetti Decimal in float
            if 'total_cost' in booking and isinstance(booking['total_cost'], decimal.Decimal):
                 booking['total_cost'] = float(booking['total_cost'])
            
        return jsonify({"bookings": bookings}), 200

    except mysql.connector.Error as err:
        print(f"Errore MySQL durante il recupero prenotazioni: {err}")
        return jsonify({"message": f"Errore interno del server (DB): {err}"}, 500)
    
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/update_rates', methods=['POST'])
def update_rates():
    data = request.json
    
    new_rates = data.get('room_rates')
    if not isinstance(new_rates, dict) or not new_rates:
        return jsonify({"message": "Dati tariffe non validi."}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Errore di connessione al database."}), 500

    cursor = conn.cursor()
    try:
        for room_type, price in new_rates.items():
            sql = "UPDATE rates SET price = %s WHERE room_type = %s"
            try:
                # Conversione sicura prima dell'esecuzione
                price_float = float(price)
            except ValueError:
                 return jsonify({"message": f"Prezzo non valido per il tipo di camera: {room_type}"}), 400
                 
            cursor.execute(sql, (price_float, room_type))

        conn.commit()
        return jsonify({"message": "Tariffe aggiornate con successo nel database."}), 200

    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Errore MySQL durante l'aggiornamento tariffe: {err}")
        return jsonify({"message": f"Errore DB durante l'aggiornamento: {err}"}), 500
    
    finally:
        cursor.close()
        conn.close()

# --- Avvio del Server ---
if __name__ == '__main__':
    # *** CRITICO PER LA LAN: Cambiato da 'localhost' a '0.0.0.0' ***
    app.run(debug=True, port=5000, host='0.0.0.0')