// ==========================================================
// VARIABILI GLOBALI E INIZIALIZZAZIONE
// ==========================================================
const BASE_URL = 'http://172.16.12.48:5000';
let currentRoomRates = {};
let userId = null; // Memorizza l'ID dell'utente loggato

// Funzione di utilità per il reindirizzamento
function redirectTo(path) {
    window.location.href = path;
}

// ==========================================================
// FUNZIONI DI UTILITY (Generali)
// ==========================================================

function showAlert(message, type = 'success') {
    // Usa l'ID specifico per l'area messaggi nella pagina di login/booking
    const messageArea = document.getElementById('bookingMessageArea') || document.getElementById('authMessageArea');
    
    if (messageArea) {
        messageArea.className = `alert alert-${type} mt-3`; 
        messageArea.textContent = message;
        
        setTimeout(() => {
            messageArea.textContent = '';
            messageArea.className = '';
        }, 5000);
    } else {
        // Fallback per pagine senza area messaggi specifica (es. admin)
        const container = document.querySelector('.container') || document.body;
        
        // Rimuove eventuali alert precedenti
        container.querySelectorAll('.temp-alert').forEach(alert => alert.remove());

        const alertBox = document.createElement('div');
        alertBox.className = `temp-alert alert alert-${type} mt-3`;
        alertBox.textContent = message;
        container.prepend(alertBox);
        
        setTimeout(() => {
            alertBox.remove();
        }, 5000);
    }
}


// ==========================================================
// CONTROLLO DI ACCESSO IMMEDIATO (Autenticazione)
// ==========================================================

function checkAccess() {
    const storedStatus = localStorage.getItem('userStatus');
    const storedId = localStorage.getItem('userId');
    const path = window.location.pathname;

    // Aggiorna la variabile globale userId se l'utente è loggato
    if (storedStatus && storedId) {
        userId = storedId;
    }
    
    // Lista delle pagine protette
    const protectedPaths = ['index.html', 'booking', 'admin'];
    const isProtectedPath = protectedPaths.some(p => path.includes(p));

    // 1. Reindirizza al login se non loggato e su pagina protetta
    if (isProtectedPath && !storedStatus) {
        if (typeof window !== 'undefined' && window.stop) window.stop(); 
        redirectTo('/'); 
        return false;
    }
    
    // 2. Prevenzione accesso admin su pagine non-admin e viceversa
    if (path.includes('admin') && storedStatus !== 'admin') {
        redirectTo('/index.html');
        return false;
    }
    if ((path.includes('index.html') || path.includes('booking')) && storedStatus === 'admin') {
         redirectTo('/admin');
         return false;
    }

    return true; // L'utente è autorizzato
}

checkAccess();


// ==========================================================
// API DI AUTENTICAZIONE (Login/Register)
// ==========================================================

async function handleAuthentication(endpoint, data) {
    try {
        const response = await fetch(`${BASE_URL}/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message, 'success');
            
            if (endpoint === 'login') {
                localStorage.setItem('userStatus', result.status);
                localStorage.setItem('userId', result.user_id); 
                userId = result.user_id; 

                if (result.status === 'admin') {
                    redirectTo('/admin');
                } else {
                    redirectTo('/index.html');
                }
            } else if (endpoint === 'register') {
                // Dopo la registrazione, reindirizza alla pagina di login (la radice /)
                // Se la pagina di login ha l'ID 'login-form', possiamo mostrarla.
                const loginForm = document.getElementById('login-form');
                const registerForm = document.getElementById('register-form');
                if (loginForm && registerForm) {
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                } else {
                    redirectTo('/');
                }
            }
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error(`Errore durante ${endpoint}:`, error);
        showAlert(`Errore di connessione o interno del server durante ${endpoint}.`, 'danger');
    }
}

function setupAuthListeners() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterButton = document.getElementById('showRegister');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            handleAuthentication('login', { email, password });
        });
    }

    if (registerForm && showRegisterButton && loginForm) {
        showRegisterButton.addEventListener('click', function() {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            showRegisterButton.style.display = 'none';
        });

        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            handleAuthentication('register', { email, password });
        });
    }
}

// ==========================================================
// GESTIONE LOGOUT
// ==========================================================

function setupLogoutListener() {
    // Uso l'ID che appare nel tuo HTML: logoutButton
    const logoutButton = document.getElementById('logoutButton'); 
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('userStatus');
            localStorage.removeItem('userId');
            userId = null;
            redirectTo('/');
        });
    }
}


// ==========================================================
// API DI PRENOTAZIONE
// ==========================================================

async function getRoomRates() {
    try {
        const response = await fetch(`${BASE_URL}/api/rates`);
        if (!response.ok) {
            throw new Error('Errore nel recupero tariffe');
        }
        const data = await response.json();
        currentRoomRates = data.room_rates;
        
        if (document.getElementById('booking-form')) {
            updateRoomSelector(currentRoomRates);
            calculateCost();
        }
        if (document.getElementById('admin-dashboard')) {
            updateAdminRates(currentRoomRates);
        }

    } catch (error) {
        console.error("Errore recupero tariffe:", error);
        showAlert('Impossibile caricare le tariffe delle camere.', 'danger');
    }
}

function updateRoomSelector(rates) {
    const roomTypeSelect = document.getElementById('roomType');
    if (!roomTypeSelect) return;

    roomTypeSelect.innerHTML = '<option value="" disabled selected>Seleziona tipo camera</option>'; 

    for (const [type, price] of Object.entries(rates)) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = `${type} (€${price}/notte)`;
        roomTypeSelect.appendChild(option);
    }
}

function calculateCost() {
    const roomType = document.getElementById('roomType') ? document.getElementById('roomType').value : '';
    const startDate = document.getElementById('startDate') ? document.getElementById('startDate').value : '';
    const endDate = document.getElementById('endDate') ? document.getElementById('endDate').value : '';
    
    // IMPORTANTE: Questo campo deve esistere in booking.html come <input type="hidden" id="totalCost">
    const totalCostInput = document.getElementById('totalCost');
    const costDisplay = document.getElementById('costDisplay');
    
    if (!roomType || !startDate || !endDate || !currentRoomRates[roomType]) {
        if (totalCostInput) totalCostInput.value = '0.00';
        if (costDisplay) costDisplay.textContent = 'Costo Totale Stimato: €0.00';
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const pricePerNight = currentRoomRates[roomType];
    let totalCost = 0;

    if (diffDays > 0) {
        totalCost = diffDays * pricePerNight;
    }
    
    if (totalCostInput) totalCostInput.value = totalCost.toFixed(2);
    if (costDisplay) costDisplay.textContent = `Costo Totale Stimato (${diffDays} notti): €${totalCost.toFixed(2)}`;
}

async function checkAvailability(roomType, startDate, endDate) {
    // Validazione data già inclusa in calculateCost, ma ripetiamo per il messaggio di errore specifico
    if (new Date(startDate) >= new Date(endDate)) {
        showAlert('La data di check-out deve essere successiva al check-in.', 'danger');
        return false;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomType: roomType, startDate: startDate, endDate: endDate }),
        });

        const result = await response.json();
        
        if (response.ok && result.available) {
            showAlert(result.message, 'info');
            return true;
        } else {
            showAlert(result.message, 'danger');
            return false;
        }

    } catch (error) {
        console.error("Errore verifica disponibilità:", error);
        showAlert('Errore di connessione al server durante la verifica disponibilità.', 'danger');
        return false;
    }
}


async function handleBooking(event) {
    event.preventDefault();
    
    // Controlliamo subito l'ID utente
    if (!userId) {
        showAlert('Devi effettuare il login per prenotare.', 'danger');
        redirectTo('/');
        return;
    }
    
    // 1. Raccolta Dati (Manuale - Più Affidabile)
    const data = {
        user_id: userId,
        name: document.getElementById('name').value,
        surname: document.getElementById('surname').value,
        phone: document.getElementById('phone').value,
        roomType: document.getElementById('roomType').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        // *** CRUCIALE: Recupera il costo calcolato dal campo input ***
        totalCost: document.getElementById('totalCost').value, 
    };
    
    // 2. Validazione di base
    if (!data.name || !data.surname || !data.roomType || !data.startDate || !data.endDate || parseFloat(data.totalCost) <= 0) {
        showAlert('Compila tutti i campi obbligatori e verifica il costo stimato.', 'danger');
        return;
    }
    
    // Aggiungi dettagli carta se necessario
    if (data.paymentMethod === 'Carta di credito') {
        data.cardNumber = document.getElementById('cardNumber').value;
        data.expiryDate = document.getElementById('expiryDate').value;
        data.cvv = document.getElementById('cvv').value;
        
        if (!data.cardNumber || !data.expiryDate || !data.cvv) {
            showAlert('Inserisci tutti i dettagli della carta di credito.', 'danger');
            return;
        }
    }
    
    // 3. Controllo Disponibilità
    const isAvailable = await checkAvailability(data.roomType, data.startDate, data.endDate);
    if (!isAvailable) {
        return;
    }

    // 4. Invio API
    try {
        const response = await fetch(`${BASE_URL}/api/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message, 'success');
            document.getElementById('booking-form').reset(); 
            calculateCost(); 
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error("Errore durante la prenotazione:", error);
        showAlert('Errore di rete o server durante la prenotazione.', 'danger');
    }
}


// ==========================================================
// API DI AMMINISTRAZIONE
// ==========================================================

// --- Guadagni ---

async function handleCalculateEarnings(event) {
    event.preventDefault();
    const month = parseInt(document.getElementById('earnings-month').value);
    const year = parseInt(document.getElementById('earnings-year').value);
    const resultElement = document.getElementById('earnings-result');
    
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
        resultElement.textContent = 'Inserisci un mese e un anno validi.';
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/admin/earnings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, year }),
        });
        
        const result = await response.json();

        if (response.ok) {
            resultElement.textContent = `Guadagni per ${month}/${year}: €${result.total_earnings.toFixed(2)}`;
            showAlert(result.message, 'success');
        } else {
            resultElement.textContent = result.message;
            showAlert(result.message, 'danger');
        }

    } catch (error) {
        console.error("Errore calcolo guadagni:", error);
        resultElement.textContent = 'Errore di connessione al server per il calcolo guadagni.';
        showAlert('Errore di connessione al server per il calcolo guadagni.', 'danger');
    }
}

// --- Prenotazioni ---

async function fetchAllBookings() {
    try {
        const response = await fetch(`${BASE_URL}/api/admin/bookings`);
        const result = await response.json();

        if (response.ok) {
            renderBookingsTable(result.bookings);
            return result.bookings;
        } else {
            throw new Error(result.message || "Errore nel recupero delle prenotazioni.");
        }
    } catch (error) {
        console.error("Errore recupero prenotazioni:", error);
        document.getElementById('bookings-table-body').innerHTML = `<tr><td colspan="8" class="text-danger">Errore di connessione al server per le prenotazioni.</td></tr>`;
        return [];
    }
}

function renderBookingsTable(bookings) {
    const tableBody = document.getElementById('bookings-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = ''; 

    if (bookings.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">Nessuna prenotazione trovata.</td></tr>`;
        return;
    }

    bookings.forEach(booking => {
        const row = tableBody.insertRow();
        
        row.insertCell().textContent = booking.id;
        row.insertCell().textContent = booking.room_type;
        row.insertCell().textContent = `${booking.name} ${booking.surname} (${booking.user_email || 'Utente Eliminato'})`;
        row.insertCell().textContent = booking.phone || 'N/A';
        row.insertCell().textContent = booking.start_date;
        row.insertCell().textContent = booking.end_date;
        row.insertCell().textContent = `€${booking.total_cost.toFixed(2)}`;
        row.insertCell().textContent = booking.payment_method || booking.status;
    });
}

// --- Tariffe ---

function updateAdminRates(rates) {
    document.getElementById('rate-doppia').value = rates['Doppia'] || '';
    document.getElementById('rate-familiare').value = rates['Familiare'] || '';
    document.getElementById('rate-singola').value = rates['Singola'] || '';
    document.getElementById('rate-suite').value = rates['Suite'] || '';
}

async function handleUpdateRates(event) {
    event.preventDefault();
    
    const newRates = {
        'Doppia': parseFloat(document.getElementById('rate-doppia').value),
        'Familiare': parseFloat(document.getElementById('rate-familiare').value),
        'Singola': parseFloat(document.getElementById('rate-singola').value),
        'Suite': parseFloat(document.getElementById('rate-suite').value)
    };
    
    for (const key in newRates) {
        if (isNaN(newRates[key])) {
            showAlert(`Il prezzo per ${key} non è un numero valido.`, 'danger');
            return;
        }
    }

    try {
        const response = await fetch(`${BASE_URL}/api/admin/update_rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_rates: newRates }),
        });

        const result = await response.json();

        if (response.ok) {
            showAlert(result.message, 'success');
            currentRoomRates = newRates; 
        } else {
            showAlert(result.message, 'danger');
        }
    } catch (error) {
        console.error("Errore aggiornamento tariffe:", error);
        showAlert('Errore di connessione al server per l\'aggiornamento tariffe.', 'danger');
    }
}


function setupAdminListeners() {
    const earningsForm = document.getElementById('earnings-form');
    if (earningsForm) {
        earningsForm.addEventListener('submit', handleCalculateEarnings);
    }
    
    const ratesForm = document.getElementById('rates-form');
    if (ratesForm) {
        ratesForm.addEventListener('submit', handleUpdateRates);
    }
    
    if (document.getElementById('bookings-table-body')) {
        fetchAllBookings();
    }
}


// ==========================================================
// INIZIALIZZAZIONE GLOBALE
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Gestione Autenticazione (Login/Register)
    setupAuthListeners();
    setupLogoutListener();

    // Gestione Prenotazione (Booking)
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        getRoomRates();
        
        // Listener per i calcoli del costo e il tipo di camera
        document.getElementById('roomType').addEventListener('change', calculateCost);
        document.getElementById('startDate').addEventListener('change', calculateCost);
        document.getElementById('endDate').addEventListener('change', calculateCost);
        
        // Listener per l'invio del form (ORA RACCOGLIE DATI MANUALMENTE)
        bookingForm.addEventListener('submit', handleBooking);
        
        // Funzione per mostrare/nascondere i dettagli della carta (come nel tuo HTML)
        const paymentMethod = document.getElementById('paymentMethod');
        const cardDetails = document.getElementById('cardDetails');
        if (paymentMethod && cardDetails) {
            function toggleCardDetails() {
                cardDetails.style.display = (paymentMethod.value === 'Carta di credito') ? 'grid' : 'none';
            }
            toggleCardDetails();
            paymentMethod.addEventListener('change', toggleCardDetails);
        }
    }
    
    // Gestione Pagina Admin 
    if (document.getElementById('admin-dashboard')) {
        getRoomRates(); // Carica tariffe
        setupAdminListeners(); 
    }
});