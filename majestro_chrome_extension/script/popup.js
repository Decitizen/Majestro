/** @fileOverview Majestro PasswordManager's GUI implementation.
 *
 * @author Ville Saarinen
 */

/**
 * Adds suitable eventlisteners and defines actions for GUI transitions.
 */
const USERS_SITES_FILENAME = 'list_of_crys.pswx';
const USER_ACCOUNTS_FILENAME = 'user_accounts.json';

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

  smart_submit_button.addEventListener('click', function () {
    load_from_storage('current_url', (current) => {
      console.log('Loaded current url successfully: ', current);

      let site_datalist = document.getElementById('site_datalist');
      let add_account_input = document.getElementById('add_account_input');

      if (validate_smart_number()) {
        console.log('Unlock with smart number performed successfully.');

        let site_array = read_user_accounts(USERS_SITES_FILENAME);
        let recognized = is_site_recognized(current, site_array);

        site_datalist.value = recognized;
        add_account_input.value = current;

        populate_site_list(site_array);
        transition_to_id_selection();
      }
    });
  });

  id_submit_button.addEventListener('click', function () {

    let site_array = read_user_accounts(USERS_SITES_FILENAME);
    let site_datalist = document.getElementById('site_datalist');

    if (is_site_recognized(site_datalist.value, site_array)) {
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

  mpassword_input.addEventListener('keyup', function () {
    let input_number = document.getElementById('smart_number_input');
    let mpassword_check_sign = document.getElementById('mp_check_sign');

    if (validate_masterpw_hash(mpassword_input.value,
      input_number.value,
      USER_ACCOUNTS_FILENAME)) {

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
function is_site_recognized(current, site_array) {
  let recognized = null;
  for (let site of site_array) {
    if (site.toLowerCase().includes(current)) {
      recognized = site;
    }
  }

  let message = recognized ? 'Site recognized.' : 'Couldn\'t recognize site.';
  console.log(message);

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
 * Handles loading of user's account details from json file.
 * @param {String} USER_ACCOUNTS_FILENAME
 * @return {Object} - includes content's of the json-file as key-value pairs
 */
function load_user_account(USER_ACCOUNTS_FILENAME) {
  let user_acc_url = chrome.runtime.getURL(USER_ACCOUNTS_FILENAME);
  let file_content = load_json(user_acc_url);

  return JSON.parse(file_content);
}

/**
 * Validates that hash of the master password is valid.
 * @param {String} mpassword - master password associated with account
 * @param {String} smart_number - smart number associated with account
 * @param {String} USER_ACCOUNTS_FILENAME
 */
function validate_masterpw_hash(mpassword, smart_number, USER_ACCOUNTS_FILENAME) {
  const CYCLES = 12000;
  const PW_BITS = 256;

  // Create a PBKDF2 hash using master password and smart number
  let mpassword_hash = sjcl.hash.sha256.hash(mpassword);
  mpassword_hash = sjcl.codec.hex.fromBits(mpassword_hash);

  let sm_number_hash = sjcl.hash.sha256.hash(smart_number);
  let derived_pbkdf2 = sjcl.misc.pbkdf2(mpassword_hash, sm_number_hash, CYCLES, PW_BITS);
  derived_pbkdf2 = sjcl.codec.hex.fromBits(derived_pbkdf2);

  // Verify with original hash
  let user_acc_details = load_user_account(USER_ACCOUNTS_FILENAME);
  if (user_acc_details.masterpw == derived_pbkdf2) {
    console.log('Masterpw validated.');

    return true;
  }
  console.log('Masterpw invalid.');
  return false;
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
 * Fetches the list of sites associated with user's account using XMLHttpRequest.
 * @param {String} filename
 * @return {Array} site_array - sites as an array of strings
 */
function read_user_accounts(filename) {
  let filePath = chrome.runtime.getURL(filename);

  let xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', filePath, false);
  xmlhttp.send();

  let fileContent = xmlhttp.responseText;
  let site_array = fileContent.split('\n');

  return site_array;
}

/**
 * Populates the datalist with sites given as a parameter.
 * @param {Array} site_array - sites as an array of strings
 */
function populate_site_list(site_array) {
  let options = '';
  for (let i = 0; i < site_array.length; i++) {
    options += '<option value="' + site_array[i] + '" />';
  }
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
 * Validates the form of smart number input.
 * @return {Boolean} - true signifies successful validation
 */
function validate_smart_number() {
  let smart_number = document.getElementById('smart_number_input');
  let error_message = document.getElementById('smart_number_error');

  if (isNaN(smart_number.value)) {
    if (error_message.style.display === 'none') {
      error_message.innerHTML = 'Not a number, try again.';
      error_message.style.display = '';
    }
    return false;

  } else if (!validate_smart_hash(smart_number.value, USER_ACCOUNTS_FILENAME)) {
    if (error_message.style.display === 'none') {
      error_message.style.display = '';
    }
    error_message.innerHTML = 'Invalid Smart number.';
    return false;

  } else {
    if (error_message.style.display !== 'none') {
      error_message.style.display = 'none';
    }

    return true;
  }
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
 * Load json from given url with XMLHttpRequest (synchronous call)
 * @param {String} json_url - filename
 * @return {response}
 */
function load_json(json_filename) {
  let xmlhttp = new XMLHttpRequest();

  xmlhttp.open('GET', json_filename, false);
  xmlhttp.send();

  return xmlhttp.responseText;
}

/**
 * Validate smart number input by comparing sha256 hash of input with the ones
 * fetched from the user_accounts.json
 * @param  {Number}  smart_input_value
 * @param  {String}  USER_ACCOUNTS_FILENAME - filename as a string
 * @return {Boolean}
 */
function validate_smart_hash(smart_input_value, USER_ACCOUNTS_FILENAME) {
  let user_acc_url = chrome.runtime.getURL(USER_ACCOUNTS_FILENAME);
  let file_content = load_json(user_acc_url);

  let accounts_json = JSON.parse(file_content);
  let orig_smart_hash = accounts_json.smartnum;
  let input_hash = sjcl.hash.sha256.hash(smart_input_value);
  input_hash = sjcl.codec.hex.fromBits(input_hash);

  if (orig_smart_hash == input_hash) {
    console.log('Smart number verified: ');
    console.log('User: ' + accounts_json.user);

    return true;
  }

  console.log('Smart number didn\'t match with a known user.');
  return false;
}

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
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
 * Save current URL to the storage API.
 */
function save_current_url() {
  get_current_url((url) => {
    console.log('Url fetched:', url);

    let strip_url = url.replace(/(^\w+:|^)\/\//, '');
    let url_array = strip_url.split('.');

    let index_value;
    for (let i = 0; i < url_array.length; i++) {
      if (url_array[i] != 'www') {
        index_value = i;
        break;
      }
    }

    let items = {};
    items['current_url'] = url_array[index_value];
    chrome.storage.sync.set(items);

    console.log('Url saved successfully.');
  });
}

/**
 * Load current URL by using the storage API.
 * @param {String} item - name of the item (key in the hashtable)
 * @param {function(string)} callback called when the actual URL of
 * the current tab is found from the storage API.
 */
function load_from_storage(item, callback) {
  chrome.storage.sync.get(item, (items) => {
    console.log('Loading item ', item, '...');
    callback(chrome.runtime.lastError ? null : items[item]);
  });
}
