const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Crea un'applicazione Express
const app = express();

// Percorso del file JSON e dello script shell
const jsonFilePath = path.join(__dirname, 'clienti_connessi.json');
const scriptPath = path.join(__dirname, 'estrai_clienti_vpn.sh');

// Password fissa per l'autenticazione
const PASSWORD = "Gds237882011!!!"; // Sostituisci con la tua password
const port = 80;

// Funzione per eseguire lo script bash e aggiornare il file JSON
function aggiornaJSON(callback) {
    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Errore durante l'esecuzione dello script: ${error.message}`);
            return callback(error);
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        console.log(`Script eseguito con successo: ${stdout}`);
        callback(null); // Nessun errore
    });
}

// Middleware per richiedere la password
app.use((req, res, next) => {
    const auth = { login: 'admin', password: PASSWORD }; // Password fissa

    // Legge le credenziali inviate dall'header Authorization
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // Verifica credenziali
    if (login && password && login === auth.login && password === auth.password) {
        return next(); // Accesso autorizzato, prosegui
    }

    // Richiede l'autenticazione se non valida
    res.set('WWW-Authenticate', 'Basic realm="401"'); // Prompt di autenticazione
    res.status(401).send('Autenticazione richiesta.'); // Accesso negato
});

// Funzione per mostrare la pagina di caricamento
app.get('/', (req, res) => {
    // Esegui lo script bash in background e aggiorna il JSON
    aggiornaJSON((err) => {
        if (err) {
            return res.status(500).send('Errore durante l\'aggiornamento del file JSON.');
        }

        // Dopo che lo script è stato eseguito, ridirigi alla pagina dei risultati
        setTimeout(() => {
            res.redirect('/results');
        }, 1000); // Ritardo per dare tempo allo script di terminare
    });
});

// Endpoint per mostrare la pagina con la tabella
app.get('/results', (req, res) => {
    // Verifica che il file JSON esista
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Errore nella lettura del file JSON.');
        }

        // Parsea i dati JSON
        const clients = JSON.parse(data);

        // Genera la tabella HTML con Bootstrap e dark mode
        let html = `
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Client VPN Connessi</title>
                <!-- Link Bootstrap CSS -->
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
                <!-- Dark mode CSS -->
                <style>
                    body {
                        background-color: #121212;
                        color: #e0e0e0;
                    }
                    .table {
                        background-color: #1e1e1e;
                    }
                    .table th, .table td {
                        color: #e0e0e0;
                    }
                    .table thead th {
                        background-color: #333;
                    }
                    .table-striped tbody tr:nth-of-type(odd) {
                        background-color: #2b2b2b;
                    }
                    .table-striped tbody tr:nth-of-type(even) {
                        background-color: #1e1e1e;
                    }
                    h1 {
                        margin-top: 20px;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Client VPN Connessi</h1>
                    <table class="table table-dark table-striped mt-4">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>IP Reale</th>
                                <th>IP Virtuale</th>
                                <th>MB Ricevuti</th>
                                <th>MB Inviati</th>
                                <th>Connesso dal</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        // Aggiungi ogni client come una riga nella tabella
        clients.forEach(client => {
            const bytesRicevutiMB = (client.Bytes_Ricevuti / 1048576).toFixed(2);
            const bytesInviatiMB = (client.Bytes_Inviati / 1048576).toFixed(2);
            html += `
                <tr>
                    <td>${client.Client}</td>
                    <td>${client.IP_Reale}</td>
                    <td>${client.IP_Virtuale}</td>
                    <td>${bytesRicevutiMB} MB</td>
                    <td>${bytesInviatiMB} MB</td>
                    <td>${client.Connesso_dal}</td>
                </tr>
            `;
        });

        // Chiudi la tabella e l'HTML
        html += `
                        </tbody>
                    </table>
                </div>
                <!-- Link Bootstrap JS e Popper.js -->
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
            </body>
            </html>
        `;

        // Invia la pagina HTML come risposta
        res.send(html);
    });
});
app.listen(port, '0.0.0.0', () => {
    console.log(`Server in esecuzione su http://0.0.0.0:${port}`);
});
