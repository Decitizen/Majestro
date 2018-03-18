/** @fileOverview Majestro PasswordManager's GUI implementation.
*
* @author DeepIntuition
*/

/**
* Adds suitable eventlisteners and defines actions for GUI transitions.
*/
const USER_DATA_FILENAME = 'userdata.txt';

document.addEventListener('DOMContentLoaded', function () {

  // Buttons
  let smart_submit_button = document.getElementById('smart_submit_button');
  let add_account_button = document.getElementById('add_account_button');
  let id_submit_button = document.getElementById('id_submit_button');
  let copy_button = document.getElementById('copy_button');
  let cancel_add_account = document.getElementById('cancel_add_account_button');
  let submit_new_account_button = document.getElementById('submit_new_account_button');
  let import_accounts_button = document.getElementById('import_accounts_button');

  // Inputs
  let import_accounts_file_input = document.getElementById('import_accounts_file_input');
  let mpassword_input = document.getElementById('mpassword_input');
  let copy_input = document.getElementById('copy_input');
  save_current_url();

  smart_submit_button.addEventListener('click', function() {
    handle_smart_number();
  });

  id_submit_button.addEventListener('click', async function() {
    let account_json = await load_from_storage('user_details');
    let recognized = recognize_site($('#site_datalist').val(), account_json.site_accounts);

    if (recognized) {
      $('#site_selector_panel').fadeOut('500', function () {
        $('#masterpw_panel').fadeIn('500');
        $('#site_select_error_message').hide();
      });
    } else {
      document.getElementById('site_select_error_message').innerHTML = '• Account doesn\'t exist.';
      $('#site_select_error_message').show();
    }

  });

  copy_button.addEventListener('click', function () {
    let mpassword = document.getElementById('copy_input');
    copy_to_clipboard(mpassword.value);
  });

  add_account_button.addEventListener('click', function () {
    $('#site_selector_panel').fadeOut('900', function () {
      $('#add_account_panel').fadeIn('900');
    });

  });

  cancel_add_account.addEventListener('click', function () {
    $('#add_account_panel').fadeOut('900', function () {
      $('#site_selector_panel').fadeIn('900');
    });
  });

  submit_new_account_button.addEventListener('click', function () {
    $('#add_account_panel').fadeOut('900', function () {
      add_new_account();
      $('#site_selector_panel').fadeIn('900');
    });
  });

  import_accounts_button.addEventListener('click', function () {
    $('#import_export_panel').fadeOut('900', function () {
      $('#import_panel').fadeIn('900');
    });
  });

  copy_input.addEventListener('mouseover', function () {
    copy_input.type = 'text';
  });

  copy_input.addEventListener('mouseout', function () {
    copy_input.type = 'password';
  });

  import_accounts_file_input.addEventListener('onchange', function () {
    // TODO: implement import and export of accounts
  });

  mpassword_input.addEventListener('keyup', async function () {
    let input_number = document.getElementById('smart_number_input');
    let mpassword_check_sign = document.getElementById('mp_check_sign');
    const validate_promise = await validate_masterpw_hash(mpassword_input.value,
      input_number.value);

    const valid_masterpw = await validate_promise;

    if (valid_masterpw) {
      mpassword_check_sign.style.color = '#65aa05';
      mpassword_check_sign.innerHTML = '';
      $('#masterpw_input_error').fadeOut('fast');

      derive_password(mpassword_input.value, input_number.value);
    } else {
      mpassword_check_sign.style.color = '#ff9c2b';
      mpassword_check_sign.innerHTML = '';
    }
  });

  $('.site_item').hover(function () {
    $(this).toggleClass('site_item_hover');
  });

});

/**
* Check if match for current site is found in the list.
* @param {String} current - name of the current tab as a string
* @param {Array} site_array - site_array - sites as an array of strings
* @return {String} recognized - String if recognized, otherwise null
*/
function recognize_site(current, site_array) {
  const recognized = site_array.find(x => x.toLowerCase().includes(current));

  const message = recognized ? 'Site recognized.' : 'Couldn\'t recognize site.';
  console.log(message);
  console.log('recognized: ', recognized);

  return recognized;
}

/**
* Handles keyevents of key:ENTER, offered as an alternative way to confirm input.
*/
document.addEventListener('keyup', function (event) {
  const ENTER_KEYCODE = 13;

  event.preventDefault();
  let smart_number_panel = document.getElementById('smart_number_panel');
  let site_selector_panel = document.getElementById('site_selector_panel');

  if (event.keyCode === ENTER_KEYCODE) {
    if (smart_number_panel.style.display != 'none') {

      // 1. Case, input smart number
      let smart_submit_button = document.getElementById('smart_submit_button');
      smart_submit_button.click();

    } else if (site_selector_panel.style.display != 'none') {

      // 2. Case, choose correct site from datalist
      let id_submit_button = document.getElementById('id_submit_button');
      id_submit_button.click();

    }
  }
});

/**
* Validates that hash of the master password is valid.
* @param {String} mpassword - master password associated with account
* @param {String} smart_number - smart number associated with account
*/
async function validate_masterpw_hash(mpassword, smart_number) {
  const CYCLES = 12000;
  const PW_BITS = 256;

  // Create a PBKDF2 hash using master password and smart number
  let mpassword_hash = sjcl.hash.sha256.hash(mpassword);
  mpassword_hash = sjcl.codec.hex.fromBits(mpassword_hash);

  let sm_number_hash = sjcl.hash.sha256.hash(smart_number);
  let derived_pbkdf2 = sjcl.misc.pbkdf2(mpassword_hash, sm_number_hash, CYCLES, PW_BITS);
  derived_pbkdf2 = sjcl.codec.hex.fromBits(derived_pbkdf2);

  // Verify against original hash
  let account_json = await load_from_storage('user_details');
  if (account_json.masterpw == derived_pbkdf2) {
    console.log('Masterpw validated.');

    return true;
  }
  console.log('Masterpw invalid.');
  return false;
}

/**
* Handles validation of smart number, decrypts + populates account-names
* and triggers transition effect to select account-view
*/
async function handle_smart_number() {
  const smart_input_number = $('#smart_number_input').val();
  const current = await load_from_storage('current_url');
  console.log('Loaded current url successfully: ', current);

  // Derive secret key based on smart number
  const sk = secret_key_derivation(smart_input_number);
  const user_account_promise = await load_user_details(USER_DATA_FILENAME, sk);
  const account_json = await user_account_promise;
  save_user_details(account_json);

  const orig_smart_hash = account_json.smartnum;
  if (validate_smart_number(orig_smart_hash, smart_input_number, account_json.masterpw)) {
    console.log('Unlock with smart number performed successfully.');
    const recognized = recognize_site(current, account_json.site_accounts);

    if (recognized) {
      $('#site_datalist').val(recognized);
      $('#add_account_input').val(current);
    }

    populate_site_list(account_json.site_accounts);
    transition_to_id_selection();
  }
}

function secret_key_derivation(smart_number) {
  const CYCLES = 20000;
  const PW_BITS = 256;
  const MOD_VALUE = 15401;

  const smart_number_salt = String(smart_number) + String(smart_number % MOD_VALUE);

  let sk;
  try {
    let sm_number_hash = sjcl.hash.sha256.hash(smart_number);
    sk = sjcl.misc.pbkdf2(sm_number_hash, smart_number_salt, CYCLES, PW_BITS);
  } catch (error) {
    console.log('Exception occurred during the Secret Key derivation:', error.message);
  }

  return sk;
}

/**
* Handles derivation of site-specific passwords using master password,
* smart number and account name.
* @param {String} mpassword - master password associated with account
* @param {String} smart_number - smart number associated with account
* @param {String} USER_ACCOUNTS_FILENAME
*/
function derive_password(mpassword, smart_number) {
  const CYCLES = 10000;
  const PW_BITS = 256;
  const MOD_VALUE = 17;
  const PW_CHAR_LENGTH = 24;

  let site_name = document.getElementById('site_datalist');
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

/**
* Handle functionality for adding new account.
*/
function add_new_account() {
  // TODO: complete functionality for saving new accounts
  //
  // let add_account_panel = document.getElementById('add_account_panel');
  // save_account('');
  // $('#add_account_panel').fadeIn('500');
}

/**
* Enables copying of given string to clipboard
* @param {String} text_to_copy
*/
function copy_to_clipboard(text_to_copy) {

  const input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.opacity = 0;
  input.value = text_to_copy;

  document.body.appendChild(input);
  input.select();
  document.execCommand('Copy');
  document.body.removeChild(input);
}

/**
* Fetches user details from the local file
* @param {String} filename
* @param {String} sk - secret key
* @return {Object} encrypted data
*/
async function load_user_details(filename, sk) {
  const data_object_promise = await $.get(chrome.runtime.getURL(filename));
  const encr_file_string = await data_object_promise;

  let user_details;
  try {
    const decr_file_string = decrypt_user_details(encr_file_string, sk);
    user_details = JSON.parse(decr_file_string);

  } catch (error) {
    console.error('File decryption was not successful:', error);
  }
  console.log('user_details:', user_details);

  return user_details;
}

function decrypt_user_details(encrypted_data, sk) {
  return sjcl.decrypt(sk, encrypted_data);
}

/**
* Validates the form of smart number input.
* @param  {String}  smart_hash   - smart number hash
* @param  {String}  masterpw_hash   - master password hash
* @param  {Number}  smart_input_number - input number as a string
* @return {Boolean} - true signifies successful validation
*/
function validate_smart_number(smart_hash, smart_input_number, masterpw_hash) {
  let error_message = document.getElementById('smart_number_error');
  let validate_flag = false;
  let message = '';

  if (isNaN(smart_input_number)) {
    message = 'Not a number, try again.';
  } else if (!validate_smart_hash(smart_hash, smart_input_number, masterpw_hash)) {
    message = 'Invalid Smart number.';
  } else {
    validate_flag = true;
  }

  error_message.innerHTML = message;
  error_message.style.display = validate_flag ? 'none' : 'block';
  return validate_flag;
}

/**
* Populates the datalist with sites given as a parameter.
* @param {Array} site_array - sites as an array of strings
*/
function populate_site_list(site_array) {
  let options = '';
  site_array.forEach(x => options += '<option value="' + String(x) + '" />');
  document.getElementById('select_site').innerHTML = options;
}

/**
* Helper routine for transforming the logo/icon from the landing view to
* the next.
*/
function transform_icon() {
  let icon_container = document.getElementById('icon_container');
  let icon_container_small = document.getElementById('icon_container_small');

  icon_container.style.display = 'none';
  icon_container_small.style.display = '';
}

/**
* Validate smart number input by comparing sha256 hash of input with the ones
* fetched from the user_accounts.json
* @param  {String}  orig_smart_hash - original smart hash
* @param  {Number}  smart_input_value
* @param  {String}  masterpw_hash
* @return {Boolean}
*/
function validate_smart_hash(orig_smart_hash, smart_input_value, masterpw_hash) {
  let input_hash = sjcl.hash.sha256.hash(smart_input_value);
  input_hash = sjcl.hash.sha256.hash(input_hash + masterpw_hash);
  input_hash = sjcl.codec.hex.fromBits(input_hash);

  if (orig_smart_hash == input_hash) {
    console.log('Smart number verified: ');
    return true;
  }
  console.log('Smart number didn\'t match with a known user.');
  return false;
}

/**
* Handle JQuery transitions from landing page (smart number input) to the
* actual app.
*/
function transition_to_id_selection() {
  $('body').fadeOut('fast', function () {
    // Smooth transition
    transform_icon();
    $('#smart_number_panel').hide();
    $('#site_selector_panel').show();
    $('body').fadeIn('500');
  });
}

/**
* Get the current URL.
* @param {function(string)} callback called when the URL of the current tab
* is found.
*/
function get_current_url(callback) {
  const CURRENT_URL_INDEX = 0;

  let queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    let tab = tabs[CURRENT_URL_INDEX];
    let url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
}

/**
* Strip url to {website_name.com}-form and save current URL using the storage API.
*/
function save_current_url() {
  get_current_url((url) => {
    const match_index = 0;
    const prefix_regex = /(^\w+:|^)\/\//;
    const suffix_regex = /[^/]*/;
    console.log('Url fetched:', url);

    let strip_url = url.replace(prefix_regex, '');
    strip_url = strip_url.match(suffix_regex)[match_index];

    let items = {};
    items['current_url'] = strip_url;
    chrome.storage.sync.set(items);

    console.log('Url', strip_url, 'saved successfully.');
  });
}

/**
* Save user details using storage API
* @param {Object} user_details - details of user's accounts
*/
function save_user_details(user_details) {
  let items = {};
  items['user_details'] = user_details;
  chrome.storage.sync.set(items);
}

/**
* Load current URL by using the storage API.
* @param {String} item - name of the item (key in the hashtable)
* @param {function(string)} callback called when the actual URL of
* the current tab is found from the storage API.
*/
function load_from_storage(item) {
  return new Promise(resolve => {
    chrome.storage.sync.get(item, (items) => {
      console.log('Loading item ', item, '...');
      resolve(chrome.runtime.lastError ? null : items[item]);
    });
  });
}
