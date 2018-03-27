
export default class CryptoTools {
  constructor() {
    this.settings = {
      v:1,
      iter:10000,
      ks:128,
      ts:64,
      mode:'ccm',
      adata:'',
      cipher:'aes'
    };
  }

  /**
  * Validate smart number input by comparing sha256 hash of input with the ones
  * fetched from the user_accounts.json
  * @param  {String}  orig_smart_hash - original smart hash
  * @param  {Number}  smart_input_value
  * @param  {String}  masterpw_hash
  * @return {Boolean}
  */
  validate_smart_hash(orig_smart_hash, smart_input_value, masterpw_hash) {
    let input_hash = sjcl.hash.sha256.hash(smart_input_value);
    input_hash = sjcl.hash.sha256.hash(input_hash + masterpw_hash);
    input_hash = sjcl.codec.hex.fromBits(input_hash);

    if (orig_smart_hash == input_hash) {
      console.debug('Smart number verified: ');
      return true;
    }
    console.debug('Smart number didn\'t match with selected user.');
    return false;
  }

   /**
  * Handles appropriate hash sequence for master password
  * @param {String} mpassword - master password associated with account
  * @param {String} smart_number - smart number associated with account
  */
  pbkdf2_hash_masterpw(mpassword, smart_number) {
    const CYCLES = 12000;
    const PW_BITS = 256;

    let mpassword_hash = sjcl.hash.sha256.hash(mpassword);
    mpassword_hash = sjcl.codec.hex.fromBits(mpassword_hash);

    let sm_number_hash = sjcl.hash.sha256.hash(smart_number);
    let derived_pbkdf2 = sjcl.misc.pbkdf2(mpassword_hash, sm_number_hash, CYCLES, PW_BITS);

    return sjcl.codec.hex.fromBits(derived_pbkdf2);
  }

  /**
  * Decrypts user details from the local file
  * @param {String} sk - secret key
  * @return {Object} encrypted data
  */
  decrypt_user_details(encrypted_data, sk) {
    return sjcl.decrypt(sk, encrypted_data);
  }

  /**
  * Handles the derivation of secret key (sk), uses smart number
  * @param  {String} smart_number
  * @return {String} secret key
  */
  secret_key_derivation(smart_number) {
    const CYCLES = 20000;
    const PW_BITS = 256;
    const MOD_VALUE = 15401;

    const smart_number_salt = String(smart_number) + String(smart_number % MOD_VALUE);

    let sk;
    try {
      let sm_number_hash = sjcl.hash.sha256.hash(smart_number);
      sk = sjcl.misc.pbkdf2(sm_number_hash, smart_number_salt, CYCLES, PW_BITS);
    } catch (error) {
      console.debug('Exception occurred during the Secret Key derivation:', error.message);
    }

    return sk;
  }

  /**
  * Handles derivation of site-specific passwords using master password,
  * smart number and account name.
  * @param {String} mpassword - master password associated with account
  * @param {String} smart_number - smart number associated with account
  */
  derive_password(mpassword, smart_number) {
    const CYCLES = 10000;
    const PW_BITS = 256;
    const MOD_VALUE = 17;
    const PW_CHAR_LENGTH = 24;

    let site_name = selected_account;
    $('#smart_number_error').hide();
    $('#masterpw_panel').fadeOut('slow', function () {
      // Site-specific password is derived in 4 phases

      // 1) Concatenate smart number + master password + account name,
      //    and hash resulting string by sha256
      let pw_hash = sjcl.hash.sha256.hash(smart_number + mpassword + site_name.value);

      // 2) Concatenate smart number with account name,
      //    and hash resulting string by sha256
      let smart_hash = sjcl.hash.sha256.hash(smart_number + site_name.value);
      smart_hash = sjcl.codec.hex.fromBits(smart_hash);

      // 3) Using first hash as a password and second as a salt, derive the final hash
      //    using PBKDF2 with more approriate parameters, format into base64
      let derived_pw = sjcl.misc.pbkdf2(pw_hash, smart_hash, CYCLES, PW_BITS);
      let password = sjcl.codec.base64.fromBits(derived_pw);

      // 4) Select a 24 letter substring of the string.
      //    Find the first placement based on smart number
      //    modded with constant mod value
      let begin_pw_placement = smart_number % MOD_VALUE;

      password = password.substring(begin_pw_placement, begin_pw_placement + PW_CHAR_LENGTH);
      let copy_input = document.getElementById('copy_input');
      copy_input.value = password;

      $('#copy_panel').fadeIn('slow');
    });
  }
}

