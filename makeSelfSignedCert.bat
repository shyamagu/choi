cd key
openssl genrsa 2048 > private_key.pem
openssl req -new -key private_key.pem > server.csr
openssl x509 -days 3650 -req -signkey private_key.pem < server.csr > server.crt