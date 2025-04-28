##################################
# Become a Certificate Authority
##################################

# Generate the private key
echo "Step 1: Create your own SSL Certificate Authority (CA)"
echo "=> Generate the private key to become a local CA"
openssl genrsa -des3 -out OEMA_CA.key 2048

# Generate the root certificate
echo
echo "=> Generate the root certificate whith the CA private key"
echo "NB: you need to enter the pass phrase you have just set!"
echo "Then answer to some questions to create the certificate."
openssl req -x509 -new -nodes -key OEMA_CA.key -sha256 -days 825 -out OEMA_CA.pem
