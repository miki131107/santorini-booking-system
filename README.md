# 🏝️ B&B Santorini - Booking & Management System

**B&B Santorini** è un'applicazione web **Full-Stack** progettata per automatizzare e centralizzare la gestione di una piccola struttura ricettiva. Il sistema offre una soluzione digitale completa che va dalla prenotazione online per i clienti alla gestione amministrativa per i proprietari.

---

## 📝 Descrizione del Progetto

Il progetto mira a sostituire i metodi di gestione manuale con una piattaforma robusta che garantisce efficienza e sicurezza. Si occupa di gestire l'intero ciclo di vita di un soggiorno: dalla registrazione dell'utente alla verifica matematica della disponibilità delle camere, fino al calcolo dei guadagni aziendali.

## 🚀 Funzionalità Principali

### 👤 Area Clienti (Prenotazione)

* **Autenticazione Sicura**: Gestione di login e registrazione utenti con password criptate tramite **Bcrypt**.
* **Verifica Disponibilità in Tempo Reale**: Una logica "anti-overbooking" controlla che le date scelte non si sovrappongano a prenotazioni esistenti nel database.
* **Calcolo Dinamico dei Costi**: JavaScript calcola istantaneamente il costo totale in base alla durata del soggiorno e alla tariffa della camera selezionata.

### 👑 Area Amministrativa (Gestione)

* **Dashboard Prenotazioni**: Visualizzazione completa di tutti i soggiorni con i relativi dati degli ospiti.
* **Analisi dei Guadagni**: Strumento per calcolare il fatturato totale filtrato per mese e anno.
* **Gestione Tariffe**: Pannello per aggiornare in tempo reale i prezzi delle camere.

---

## 🛠️ Stack Tecnologico

L'architettura segue il modello **Client-Server**:

* **Backend**: Python con framework **Flask**.
* **Database**: **MySQL** (gestito tramite XAMPP) per la persistenza dei dati.
* **Frontend**: HTML, CSS e **JavaScript (Vanilla)** per l'interattività e le chiamate API.

---

## 🗄️ Struttura del Database

Il database `bb_santorini` è organizzato in tre tabelle principali:

1. **`users`**: Memorizza credenziali, password hashate e livello di accesso (Admin/User).
2. **`rates`**: Contiene i prezzi giornalieri per ogni tipologia di camera.
3. **`bookings`**: Registra i dettagli di ogni soggiorno, inclusi i costi totali e le date di riferimento.

---

## 💻 Installazione e Avvio

1. **Configurazione Database**:
* Avvia **Apache** e **MySQL** da XAMPP.
* Importa il database `bb_santorini.sql` tramite phpMyAdmin.


2. **Configurazione Backend**:
* Crea un ambiente virtuale: `python -m venv venv`
* Installa le dipendenze: `pip install flask flask-mysql flask-bcrypt`


3. **Esecuzione**:
* Avvia il server: `python server.py`
* Accedi all'applicazione su: `http://127.0.0.1:5000`




Ti piacerebbe che ti aiutassi a generare un'immagine dello **schema del database** o un **diagramma di flusso** da inserire nel README per renderlo ancora più visivo?
