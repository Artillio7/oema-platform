#################################
# Create CA-signed certificate
#################################
echo "Step 2: Create the CA-signed certificate"

NAME=localhost # domain name
# Generate a private key
openssl genrsa -out $NAME.key 2048
# Create a certificate-signing request
openssl req -new -key $NAME.key -out $NAME.csr
# Create a config file for the extensions
>$NAME.ext cat <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names
[alt_names]
DNS.1 = $NAME
#DNS.2 = bar.$NAME # additional domains
IP.1 = 127.0.0.1 # Optionally, add an IP address
EOF
# Create the signed certificate
openssl x509 -req -in $NAME.csr -CA OEMA_CA.pem -CAkey OEMA_CA.key -CAcreateserial \
-out $NAME.crt -days 825 -sha256 -extfile $NAME.ext
