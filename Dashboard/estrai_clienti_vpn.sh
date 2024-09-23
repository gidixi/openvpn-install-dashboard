#!/bin/bash

# Percorso del file di log di OpenVPN
log_file="/var/log/openvpn-status.log"

# Verifica se il file esiste
if [[ ! -f "$log_file" ]]; then
    echo "Il file di log $log_file non esiste."
    exit 1
fi

# Percorso del file JSON di output
json_output="clienti_connessi.json"

rm -f "$json_output"

# Inizia il file JSON
echo "[" > "$json_output"

# Estrai le informazioni dei client connessi e generare il JSON
client_count=0
grep '^CLIENT_LIST' "$log_file" | while IFS=',' read -r _ client_name real_address virtual_address _ bytes_received bytes_sent connected_since _; do
    # Aggiungi una virgola tra gli oggetti JSON, tranne per il primo client
    if [[ $client_count -ne 0 ]]; then
        echo "," >> "$json_output"
    fi
    client_count=$((client_count+1))

    # Genera l'oggetto JSON per ogni client
    echo "  {" >> "$json_output"
    echo "    \"Client\": \"$client_name\"," >> "$json_output"
    echo "    \"IP_Reale\": \"$real_address\"," >> "$json_output"
    echo "    \"IP_Virtuale\": \"$virtual_address\"," >> "$json_output"
    echo "    \"Bytes_Ricevuti\": \"$bytes_received\"," >> "$json_output"
    echo "    \"Bytes_Inviati\": \"$bytes_sent\"," >> "$json_output"
    echo "    \"Connesso_dal\": \"$connected_since\"" >> "$json_output"
    echo "  }" >> "$json_output"

    # Mostra i dettagli a schermo
    echo "Client: $client_name"
    echo "IP Reale: $real_address"
    echo "IP Virtuale: $virtual_address"
    echo "Bytes Ricevuti: $bytes_received"
    echo "Bytes Inviati: $bytes_sent"
    echo "Connesso dal: $connected_since"
    echo "-----------------------------------"
done

# Chiudi il file JSON
echo "]" >> "$json_output"

# Mostra un messaggio di conferma
echo "Dati salvati in $json_output"
