
/** @fileOverview Majestro PasswordManager's GUI implementation.
*
* @author DeepIntuition
*/

import CryptoTools from './crypto.js';
import AccountList from './accountlist.js'

const USER_DATA_FILENAME = 'userdata.txt';
const crypto = new CryptoTools();
const listCreator = new AccountList();

/**
* Defines view-specific eventlisteners.
* View flowchart:
* View1 -> View 2(abc) -> View3 -> View4
*/
document.addEventListener('DOMContentLoaded', function () {
  save_current_url();
  init_test_user(USER_DATA_FILENAME);

  // View 1: Smart number panel (id: smart_number_panel)
  define_view1_event_listeners();
  // View 2a: Select site (id: site_selector_panel)
  define_view2a_event_listeners();
  // View 2b: Add new accout (id: add_site_account_panel)
  define_view2b_event_listeners();
  // View 2c: Import accounts
  define_view2c_event_listeners();
  // View 3: Input master password (id: masterpw_panel)
  define_view3_event_listeners();
  // View 4: Show derived password (id: copy_panel)
  define_view4_event_listeners();
});

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
* Filter account-items based on Search bar input
*/
$('#site_datalist').keyup(async () => {
  let str = $('#site_datalist').val();
  let account_json = await load_from_local_storage('user_details');
  account_json.site_accounts = account_json.site_accounts.filter((e) => String(e).includes(str));
  await populate_site_list(account_json.site_accounts);
});

/**
* Defines event listeners for View1.
* In this view user can input his/her smart number, and
* a new user can open Github page by clicking new_user_button
*/
function define_view1_event_listeners() {
  // Smart number submit
  $('#smart_submit_button').click(async function() {
    const current_url = await load_from_local_storage('current_url');
    $('#add_site_account_input').val(current_url);
    console.debug('Loaded current url successfully: ', current_url);

    handle_smart_number(current_url);
  });

  // New user button
  $('#new_user_button').click(function () {
    window.open('https://github.com/DeepIntuition/Majestro');
  });
}

/**
* Defines event listeners for View2a.
* In this view user can either select the site/account and submit,
* or choose to modify accounts.
*/
function define_view2a_event_listeners() {
  // Handle delete account button
  $('#delete_account_button').click(function() {
    $('#site_select_error_message').hide();

    const account_val = $('#selected_account').val();

    if (account_val !== '') {
      $('#delete_account_button').fadeOut('400', function() {
        $('#confirm_delete_site_account_button').fadeIn('400');
      });
    } else {
      $('#site_select_error_message').text('• Select account first.');
      $('#site_select_error_message').show();
    }
  });

  $('#confirm_delete_site_account_button').click(function () {
    $('#confirm_delete_site_account_button').fadeOut('100', function() {
      const account_val = $('#selected_account').val();
      delete_account(account_val);
      $('#site_datalist').val('');
      $('#delete_account_button').fadeIn('400');
    })
  });

  // Submit selected site
  $('#id_submit_button').click(async function() {
    let account_json = await load_from_local_storage('user_details');
    const current_url = $('#selected_account').val()
    console.log('Selected account:', current_url);
    const exists = account_json.site_accounts.some(x => String(x) === String(current_url));
    console.log('Exists:', exists);
    if (exists) {
      $('#site_selector_panel').fadeOut('500', function () {
        $('#masterpw_panel').fadeIn('500');
        $('#site_select_error_message').hide();
      });
    } else {
      $('#site_select_error_message').text('• Account doesn\'t exist.');
      $('#site_select_error_message').show();
    }

  });



  $('#add_site_account_button').click(function () {
    $('#site_selector_panel').fadeOut('900', function () {
      $('#add_site_account_panel').fadeIn('900');
    });
  });
}

/**
* Defines event listeners for View2b.
* In this view user can add new site/account, or import/export the accounts from/to a file.
*/
function define_view2b_event_listeners() {
  // Submit new site/account -> to View2a
  $('#submit_new_site_account_button').click(function () {
    $('#submit_new_site_account_button').fadeOut('400', function() {
      $('#confirm_new_site_account_button').fadeIn('400');
    });
  });

  $('#confirm_new_site_account_button').click(async function () {
    if (!await add_new_account()) {
      $('#confirm_new_site_account_button').fadeOut('100', function() {
        $('#exists_new_site_account_button').fadeIn('100', function() {
          $('#exists_new_site_account_button').fadeOut('100', function() {
            $('#submit_new_site_account_button').fadeIn('400');
          });
        });
      });
    } else {
      $('#add_site_account_panel').fadeOut('900', function () {
        $('#site_select_error_message').hide();
        $('#site_selector_panel').fadeIn('900', function () {
          $('#submit_new_site_account_button').show();
          $('#confirm_new_site_account_button').hide();
        });
      });
    }
  });

  // Click cancel-button: <- to View2a
  $('#cancel_add_site_account_button').click(function () {
    $('#add_site_account_panel').fadeOut('900', function () {
      $('#site_selector_panel').fadeIn('900');
    });
  });

  // Click Import accounts button: -> View2c, import view
  $('#import_accounts_button').click(function () {
    $('#import_export_panel').fadeOut('900', function () {
      $('#import_panel').fadeIn('900');
    });
  });
}

/**
* Defines event listeners for View2c.
* In this view user can select which file the import happens from.
*/
function define_view2c_event_listeners() {
  $('#import_accounts_file_input').change(function () {
    // TODO: implement import and export of accounts
  });
}

/**
* Defines event listeners for View3.
* In this view user can enter the master password.
*/
function define_view3_event_listeners() {
  // Input master password: -> View4
  $('#mpassword_input').keyup(async function () {
    const mpassword_input = $('#mpassword_input').val();
    let input_number = document.getElementById('smart_number_input');
    let mpassword_check_sign = document.getElementById('mp_check_sign');
    const validate_promise = await validate_masterpw_hash(mpassword_input,
      input_number.value);
      const valid_masterpw = await validate_promise;

      if (valid_masterpw) {
        mpassword_check_sign.style.color = '#65aa05';
        mpassword_check_sign.innerHTML = '';
        $('#masterpw_input_error').fadeOut('fast');

        crypto.derive_password(mpassword_input, input_number.value);
      } else {
        if (mpassword_check_sign.offsetParent === null) {
          $('#mp_check_sign').fadeIn('900');
        }
        mpassword_check_sign.style.color = '#ff9c2b';
        mpassword_check_sign.innerHTML = '';

      }
    });
  }

  /**
  * Defines event listeners for View4: final view.
  * In this view user can view the derived site-specific password
  * and copy it to clipboard.
  */
  function define_view4_event_listeners() {
    // Click copy-button: copy derived password to clipboard
    $('#copy_button').click(function () {
      let mpassword = document.getElementById('copy_input');
      copy_to_clipboard(mpassword.value);
    });

    let copy_input = document.getElementById('copy_input');
    copy_input.addEventListener('mouseover', function () {
      copy_input.type = 'text';
    });

    copy_input.addEventListener('mouseout', function () {
      copy_input.type = 'password';
    });
  }


  // Models / Logic

  /**
  * Check if match for current site is found in the list.
  * @param {String} current - name of the current tab as a string
  * @param {Array} site_array - site_array - sites as an array of strings
  * @return {String} recognized - String if recognized, otherwise null
  */
  function recognize_site(current, site_array) {
    const recognized = site_array.find(x => x.toLowerCase().includes(current));

    const message = recognized ? 'Site recognized.' : 'Couldn\'t recognize site.';
    console.debug(message);
    console.debug('recognized: ', recognized);

    return recognized;
  }

  /**
  * Handles validation of smart number, decrypts + populates account-names
  * and triggers transition effect to select account-view
  * @param {String} current_url
  */
  async function handle_smart_number(current_url) {
    const smart_input_number = $('#smart_number_input').val();

    // Derive secret key based on smart number
    const sk = crypto.secret_key_derivation(smart_input_number);
    let account_json = null;

    if (isNaN(smart_input_number)) {
      $('#smart_number_error').text('Not a number, try again.');
      $('#smart_number_error').show();
    } else {
      const user_account_promise = await load_encr_user_details(sk);
      account_json = await user_account_promise;

      if (!account_json) {
        $('#smart_number_error').text('Invalid Smart number.');
        $('#smart_number_error').show();
      }
    }

    if (crypto.validate_smart_hash(account_json.smartnum, smart_input_number, account_json.masterpw)) {
      console.debug('Unlock with smart number performed successfully.');
      save_data('user_details', account_json, false);
      const recognized = recognize_site(current_url, account_json.site_accounts);

      if (recognized) {
        $('#site_select_error_message').show();
        $('.recognized_sign').show();

        // Filter out non-recognized, sort and set recognized as first
        let is_current = (x => x !== recognized);
        account_json.site_accounts = account_json.site_accounts.filter(is_current);
        $('#selected_account').val(recognized);
        $('#recognized_account').val(recognized);
        $('#recognized_account').show();
      }

      await populate_site_list(account_json.site_accounts, recognized);
      transition_to_id_selection();
      $('.recognized_message').delay(2000).fadeOut("slow");
    }
  }

  /**
  * Handle functionality for adding new account.
  * @return {Boolean} false if account name already existed, true if the address was new
  */
  async function add_new_account() {
    let account_json = await load_from_local_storage('user_details');
    const current_url = $('#add_site_account_input').val();
    const exists = account_json.site_accounts.some(x => x == current_url);

    if (!exists) {
      account_json.site_accounts.push(current_url);
      populate_site_list(account_json.site_accounts);
      save_data('user_details', account_json, false);
      save_user_details_encr(account_json);

      return true;
    }
    return false;
  }

  /**
  * Handle deletion of account.
  * @param {String} account_val - value of the string from the html object
  */
  async function delete_account(account_val) {
    let account_json = await load_from_local_storage('user_details');
    account_json.site_accounts = account_json.site_accounts.filter(e => String(e) !== account_val);

    try {
      save_data('user_details', account_json, false);
      save_user_details_encr(account_json);
      await populate_site_list(account_json.site_accounts);

    } catch (error) {
      console.log('Exception happened during saving of data:', error.message);
    }
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
  * Fetches (and decrypts) user details from the global storage
  * @param {String} sk - secret key
  * @return {Object} decrypted data
  */
  async function load_encr_user_details(sk) {
    const encr_file_string = await load_from_global_storage('encrypted_user_details');

    let user_details;
    try {
      const decr_file_string = crypto.decrypt_user_details(encr_file_string, sk);
      user_details = JSON.parse(decr_file_string);

    } catch (error) {
      console.error('File decryption was not successful:', error);
    }
    return user_details;
  }

  /**
  * Populates the datalist with sites given as a parameter.
  * @param {Array} site_array - sites as an array of strings
  */
  async function populate_site_list(site_array, recognized) {
    recognized ? await listCreator.populateAccountCards(site_array, recognized)
    : await listCreator.populateAccountCards(site_array, null);
  }

  /**
  * Helper routine for transforming the logo/icon from the landing view to
  * the next.
  */
  function transform_icon() {
    let icon_container = document.getElementById('icon_container');
    let icon_container_small = document.getElementById('icon_container_small');

    icon_container.style.display = 'none';
    $('#icon_container_small').css('position','fixed');
    icon_container_small.style.display = 'block';
  }

  /**
  * Handle JQuery transitions from landing page (smart number input) to the
  * actual app.
  */
  function transition_to_id_selection() {
    // Smooth transition
    $("#smart_number_panel").animate({width:'toggle'}, 100);
    $('#smart_number_panel').fadeOut('900', () => {
      transform_icon();
      $('#site_selector_panel').fadeIn();
    });
  }

  /**
  * Validates that hash of the master password is valid.
  * @param {String} mpassword - master password associated with account
  * @param {String} smart_number - smart number associated with account
  */
  async function validate_masterpw_hash(mpassword, smart_number) {

    // Create a PBKDF2 hash using master password and smart number
    const derived_pbkdf2 = crypto.pbkdf2_hash_masterpw(mpassword,smart_number);

    // Verify against original hash
    let account_json = await load_from_local_storage('user_details');
    if (account_json.masterpw == derived_pbkdf2) {
      console.debug('Masterpw validated.');

      return true;
    }
    console.debug('Masterpw invalid.');
    return false;
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
      console.debug('Url fetched:', url);

      let strip_url = url.replace(prefix_regex, '');
      strip_url = strip_url.match(suffix_regex)[match_index];

      let items = {};
      items['current_url'] = strip_url;
      chrome.storage.local.set(items);

      console.debug('Url', strip_url, 'saved successfully.');
    });
  }

  /**
  * Save given data using storage API
  * @param {String} data_key, data_key - key for the data as a string
  * @param {Object} data - data that is to be stored
  * @param {Boolean} global - true if global sync, false if local
  */
  function save_data(data_key, data, global = true) {
    let items = {};
    items[data_key] = data;
    if (global) {
      chrome.storage.sync.set(items);
    } else {
      chrome.storage.local.set(items);
    }
  }

  /**
  * Load current URL by using the storage sync (global) API.
  * @param {String} item - name of the item (key in the hashtable)
  * @param {function(string)} callback called when the actual URL of
  * the current tab is found from the storage API.
  */
  function load_from_global_storage(item) {
    return new Promise(resolve => {
      chrome.storage.sync.get(item, (items) => {
        console.debug('Loading item ', item, '...');
        resolve(chrome.runtime.lastError ? null : items[item]);
      });
    });
  }

  /**
  * Load current URL by using the storage local API.
  * @param {String} item - name of the item (key in the hashtable)
  * @param {function(string)} callback called when the actual URL of
  * the current tab is found from the storage API.
  */
  function load_from_local_storage(item) {
    return new Promise(resolve => {
      chrome.storage.local.get(item, (items) => {
        console.debug('Loading item ', item, '...');
        resolve(chrome.runtime.lastError ? null : items[item]);
      });
    });
  }

  /**
  * Save encrypted user details to the global storage
  * @param {Object} user_details - user's information
  * @return {Object} encrypted data
  */
  function save_user_details_encr(user_details) {
    const sk = crypto.secret_key_derivation($('#smart_number_input').val());
    const encrypted_user_details = encrypt_user_details(user_details, sk);
    save_data('encrypted_user_details', encrypted_user_details, true);

    return user_details;
  }

  /**
  * Encrypts user details
  * @param {String} plaintext_data
  * @param {String} sk - secret key
  * @return {Object} parsed json object including user data: user, smartnum, masterpw, site_accounts
  */
  function encrypt_user_details(plaintext_data, sk) {

    let encr_user_details;
    try {
      const ptext_data_string = JSON.stringify(plaintext_data);
      encr_user_details = sjcl.encrypt(sk, ptext_data_string);
    } catch (error) {
      console.debug('File encryption was not successful:', error.message);
    }

    return encr_user_details;
  }
  /**
  * In the first startup, if there is no account in chrome storage API, saves encrypted
  * test user details into chrome storage API.
  * @param {String} filename
  */
  async function init_test_user(filename) {
    const encrypted_user_details = await $.get(chrome.runtime.getURL(filename));
    const is_data = await load_from_global_storage('encrypted_user_details');
    if (!is_data) {
      save_data('encrypted_user_details', encrypted_user_details, true);

      console.debug('Storage API populated with test user data.');
    } else {
      console.debug('Storage API already populated with data:', is_data);
    }
  }