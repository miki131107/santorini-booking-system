document.addEventListener('DOMContentLoaded', () => {

    // Riferimenti ai bottoni/campi
    const calculateEarningsButton = document.getElementById('calculateEarningsButton');
    const earningsMonthInput = document.getElementById('earningsMonth');
    const earningsYearInput = document.getElementById('earningsYear');
    const earningsResult = document.getElementById('earningsResult');
    const bookingsTableBody = document.getElementById('bookingsTable').querySelector('tbody');
    const bookingsMessage = document.getElementById('bookingsMessage');
    
    // Riferimenti per la gestione Tariffe
    const updateRatesForm = document.getElementById('updateRatesForm');
    const ratesInputsDiv = document.getElementById('ratesInputs');
    const ratesMessage = document.getElementById('ratesMessage');


    // --- FUNZIONI DI VISUALIZZAZIONE DATI ---
    
    // Funzione per recuperare e popolare tutte le prenotazioni
    async function fetchAllBookings() {
        bookingsMessage.textContent = 'Caricamento prenotazioni in corso...';
        bookingsMessage.style.color = 'blue';

        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/bookings');
            const result = await response.json();
            
            if (response.ok) {
                const bookings = result.bookings;
                bookingsTableBody.innerHTML = ''; 
                
                if (bookings.length === 0) {
                    bookingsMessage.textContent = 'Nessuna prenotazione trovata.';
                    bookingsMessage.style.color = 'orange';
                    return;
                }
                
                bookingsMessage.textContent = `${bookings.length} prenotazioni caricate con successo.`;
                bookingsMessage.style.color = 'green';

                bookings.forEach(booking => {
                    const row = bookingsTableBody.insertRow();
                    row.insertCell().textContent = booking.id || 'N/A';
                    row.insertCell().textContent = booking.room_type;
                    row.insertCell().textContent = `${booking.name} ${booking.surname}`;
                    row.insertCell().textContent = booking.phone || 'N/A';
                    row.insertCell().textContent = booking.start_date;
                    row.insertCell().textContent = booking.end_date;
                    row.insertCell().textContent = `${parseFloat(booking.total_cost).toFixed(2)}€`;
                    row.insertCell().textContent = booking.payment_method || 'N/A';
                });

            } else {
                bookingsMessage.textContent = `Errore nel caricamento: ${result.message}`;
                bookingsMessage.style.color = 'red';
            }

        } catch (error) {
            console.error('Errore di rete/API:', error);
            bookingsMessage.textContent = 'Errore di connessione al server per le prenotazioni.';
            bookingsMessage.style.color = 'red';
        }
    }

    // Funzione per calcolare i guadagni
    async function calculateEarnings() {
        const month = parseInt(earningsMonthInput.value);
        const year = parseInt(earningsYearInput.value);

        if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2023) {
            earningsResult.textContent = 'Per favore, inserisci un mese (1-12) e un anno validi.';
            earningsResult.style.color = 'red';
            return;
        }

        earningsResult.textContent = `Calcolo guadagni per il mese ${month}/${year}...`;
        earningsResult.style.color = 'blue';

        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/earnings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ month, year })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                earningsResult.textContent = `Guadagni totali per ${month}/${year}: ${result.total_earnings}€`;
                earningsResult.style.color = 'green';
            } else {
                earningsResult.textContent = `Errore nel calcolo: ${result.message}`;
                earningsResult.style.color = 'red';
            }

        } catch (error) {
            console.error('Errore di rete/API:', error);
            earningsResult.textContent = 'Errore di connessione al server per il calcolo guadagni.';
            earningsResult.style.color = 'red';
        }
    }


    // --- FUNZIONI DI GESTIONE TARIFFE ---
    
    // 1. Carica le tariffe attuali e crea i campi del form
    async function loadRatesForm() {
        ratesInputsDiv.innerHTML = '<p>Caricamento tariffe...</p>';
        try {
            const response = await fetch('http://127.0.0.1:5000/api/rates');
            const data = await response.json();
            
            if (response.ok && data.room_rates) {
                ratesInputsDiv.innerHTML = '';
                
                for (const [type, rate] of Object.entries(data.room_rates)) {
                    const div = document.createElement('div');
                    div.style.marginBottom = '10px';
                    div.innerHTML = `
                        <label for="${type}Rate" style="display: inline-block; width: 100px;">${type}:</label>
                        <input type="number" id="${type}Rate" value="${rate}" min="1" step="0.01" required 
                               style="width: 80px; padding: 5px;"> €
                    `;
                    ratesInputsDiv.appendChild(div);
                }
                ratesMessage.textContent = 'Modifica le tariffe e salva.'; // Messaggio di default dopo il caricamento
                ratesMessage.style.color = 'black';

            } else {
                 ratesInputsDiv.innerHTML = '<p style="color: orange;">Impossibile caricare le tariffe. Verifica il database.</p>';
                 ratesMessage.textContent = '';
            }
        } catch(e) {
            ratesInputsDiv.innerHTML = '<p style="color: red;">Errore di connessione al server per le tariffe.</p>';
            ratesMessage.textContent = '';
        }
    }
    
    // 2. Invia le tariffe aggiornate al server
    async function updateRates(event) {
        event.preventDefault(); 
        
        ratesMessage.textContent = 'Salvataggio in corso...';
        ratesMessage.style.color = 'blue';

        const newRates = {};
        const inputs = ratesInputsDiv.querySelectorAll('input[type="number"]');
        let isValid = true;

        inputs.forEach(input => {
            const roomType = input.id.replace('Rate', '');
            const price = parseFloat(input.value);
            
            if (isNaN(price) || price <= 0) {
                ratesMessage.textContent = `Errore: Il prezzo per ${roomType} non è valido.`;
                ratesMessage.style.color = 'red';
                isValid = false; 
            }
            newRates[roomType] = price;
        });
        
        if (!isValid) return;

        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/update_rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_rates: newRates })
            });

            const result = await response.json();

            if (response.ok) {
                ratesMessage.textContent = "✅ Tariffe aggiornate con successo!"; 
                ratesMessage.style.color = 'green';
                
                loadRatesForm(); 
                
                // Resetta il messaggio dopo 5 secondi
                setTimeout(() => {
                     ratesMessage.textContent = 'Modifica le tariffe e salva.';
                     ratesMessage.style.color = 'black';
                }, 5000); 

            } else {
                ratesMessage.textContent = `Errore di salvataggio: ${result.message}`;
                ratesMessage.style.color = 'red';
            }

        } catch (error) {
            ratesMessage.textContent = 'Errore di connessione al server durante l\'aggiornamento.';
            ratesMessage.style.color = 'red';
        }
    }


    // COLLEGA GLI EVENTI
    calculateEarningsButton.addEventListener('click', calculateEarnings);
    
    // Assicurati che il form esista prima di collegare l'evento
    if (updateRatesForm) {
        updateRatesForm.addEventListener('submit', updateRates);
    }


    // Carica i dati all'avvio della pagina
    fetchAllBookings();
    loadRatesForm(); // Carica il form delle tariffe
});