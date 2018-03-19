# Majestro
__Majestro Password Manager__ is a lightweight Chrome extension that lets you derive site-specific passwords using __master__ password. 

![](Majestro_usage.gif)

Majestro's __password derivation function__ is dependent on two *secrets*: 

1. ```smart number``` - smart number is used to open up the account encryption. 6 digits or more is recommended
2. ```master password``` - master password is used for site-specific password derivation. More than 16 characters is recommended.

Majestro uses __sha256__ and __PBKDF2__ (Password-Based Key Derivation Function 2) for password derivation.
## Dependencies: 
* [Stanford Javascript Crypto Library](https://github.com/bitwiseshiftleft/sjcl)
* [JQuery](https://jquery.com/download/) 

Download both ```sjcl.js``` and ```jquery-3.*.*.min.js``` (version >= 3.2.1 recommended) from their repositories and add to ```/script``` folder

#### Test user secrets:
__Smart number:__ ```123456```

__Master Password:__ ```this is the master password```  

## Loading to Chrome
Extension is not yet available in Chrome Store. 
Instead it needs to be loaded as `unpacked extension` using __Chrome's developer mode__:
![](majestro_load_chrome.gif)

## Development
Development is on-going, incoming features:
* Support for creating new accounts
* Support for exporting accounts 
* Support for adding new sites
* Encryption of own websites
* Support for cloud sync of accounts

## License
[MIT License](https://opensource.org/licenses/MIT)
