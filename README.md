# Majestro
__Majestro Password Manager__ is a light Chrome extension that lets you derive site-specific passwords using single __master__ password. 

![](Majestro_usage.gif)

Majestro's key derivation function is dependent on two *secrets*: 

1. ```smart number``` 
2. ```master password``` 

Majestro uses sha256 and PBKDF2 (Password-Based Key Derivation Function 2) for password derivation.
Dependencies: [Stanford Javascript Crypto Library](https://github.com/bitwiseshiftleft/sjcl)
[JQuery](https://jquery.com/download/), 
* download both ```sjcl.js``` and ```jquery-3.*.*.min.js``` (version >= 3.2.1 recommended) from their repositories and add to ```/script``` folder

#### Test user secrets:
__Smart number:__ ```123456```

__Master Password:__ ```this is the master password```  

For good security, smart number should be rather large, larger than 10e5 is recommended.
Same applies to the Master password, more than 16characters is recommended.

