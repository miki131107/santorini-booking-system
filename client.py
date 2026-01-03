import requests

# *** SOSTITUISCI CON L'INDIRIZZO IP DEL TUO PC HOST ***
SERVER_IP = "192.168.1.17" 
SERVER_PORT = 5000
API_URL = f"http://{SERVER_IP}:{SERVER_PORT}/api/rates"

print(f"Tentativo di connessione a: {API_URL}")

try:
    response = requests.get(API_URL)
    
    if response.status_code == 200:
        data = response.json()
        print("Connessione Riuscita! Tariffe ricevute:")
        print(data['room_rates'])
    else:
        print(f"Errore HTTP: {response.status_code}. Impossibile raggiungere l'API.")

except requests.exceptions.ConnectionError:
    print("Errore di connessione. Controlla l'IP, la porta e il Firewall.")

# Per testare l'accesso Admin (richiede un POST)
ADMIN_LOGIN_URL = f"http://{SERVER_IP}:{SERVER_PORT}/api/login"
