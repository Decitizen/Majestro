# Majestro
__Majestro Password Manager__ is a light Chrome extension that helps you to remember your passwords. 

Majestro's key derivation function is dependent on two secret keys: 

1. smart number 
2. master password 

Majestro uses sha256 and PBKDF2 (Password-Based Key Derivation Function 2) for password derivation, and uses [__Stanford Javascript Crypto Library__](https://github.com/bitwiseshiftleft/sjcl)

#### Test user:
__Smart number:__ 123456
__Master Password:__ this is the master password 
