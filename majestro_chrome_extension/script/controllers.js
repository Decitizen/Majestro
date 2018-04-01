
/** @fileOverview Majestro PasswordManager's controllers/eventlisteners.
*
* @author DeepIntuition
*/

import * as Logic from './logic.js';
const USER_DATA_FILENAME = 'userdata.txt';
const TRANSITION_SPEED = 100;
/**
* Defines view-specific eventlisteners.
* View flowchart:
* View1 -> View 2(abc) -> View3 -> View4
*/
document.addEventListener('DOMContentLoaded', function () {
  Logic.save_current_url();
  Logic.init_test_user(USER_DATA_FILENAME);

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
  let copy_panel = document.getElementById('copy_panel');

  if (event.keyCode === ENTER_KEYCODE) {
    if (smart_number_panel.style.display != 'none') {

      // 1. Case, input smart number
      let smart_submit_button = document.getElementById('smart_submit_button');
      smart_submit_button.click();

    } else if (site_selector_panel.style.display != 'none') {

      // 2. Case, choose correct site from datalist
      let id_submit_button = document.getElementById('id_submit_button');
      id_submit_button.click();

    } else if (copy_panel.style.display != 'none') {
      let copy_button = document.getElementById('copy_button');
      copy_button.click();
    }
  }
});

/**
* Filter account-items based on Search bar input
*/
$('#site_datalist').keyup(async () => {
  let str = $('#site_datalist').val();
  let account_json = await Logic.load_from_local_storage('user_details');
  account_json.site_accounts = account_json.site_accounts.filter((e) => String(e).includes(str));
  await Logic.populate_site_list(account_json.site_accounts);
});

/**
* Defines event listeners for View1.
* In this view user can input his/her smart number, and
* a new user can open Github page by clicking new_user_button
*/
function define_view1_event_listeners() {
  // Smart number submit
  $('#smart_submit_button').click(async function() {
    const current_url = await Logic.load_from_local_storage('current_url');
    $('#add_site_account_input').val(current_url);
    console.debug('Loaded current url successfully: ', current_url);

    Logic.handle_smart_number(current_url);
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
      $('#delete_account_button').animate({width:'toggle'}, TRANSITION_SPEED);
      $('#delete_account_button').fadeOut('fast', function() {
        $('#confirm_delete_site_account_button').fadeIn('400');
      });
    } else {
      $('#site_select_error_message').text('• Select account first.');
      $('#site_select_error_message').show();
    }
  });

  $('#confirm_delete_site_account_button').click(function () {
    $('#confirm_delete_site_account_button').animate({width:'toggle'}, TRANSITION_SPEED);
    $('#confirm_delete_site_account_button').fadeOut('fast', function() {
      const account_val = $('#selected_account').val();
      Logic.delete_account(account_val);

      // Reset view
      $('#selected_account').val('');
      $('#site_datalist').val('');
      $('#delete_account_button').fadeIn('400');
    })
  });

  // Submit selected site
  $('#id_submit_button').click(async function() {
    let account_json = await Logic.load_from_local_storage('user_details');
    const current_url = $('#selected_account').val()
    console.log('Selected account:', current_url);

    const exists = account_json.site_accounts.some(x => String(x) === String(current_url));
    console.log('Exists:', exists);

    if (exists) {
      $('#site_selector_panel').animate({width:'toggle'}, TRANSITION_SPEED);
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
    $('#site_selector_panel').animate({width:'toggle'}, TRANSITION_SPEED);
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
    $('#submit_new_site_account_button').animate({width:'toggle'}, TRANSITION_SPEED);
    $('#submit_new_site_account_button').fadeOut('400', function() {
      $('#confirm_new_site_account_button').fadeIn('400');
    });
  });

  $('#confirm_new_site_account_button').click(async function () {
    if (!await Logic.add_new_account()) {
      $('#confirm_new_site_account_button').animate({width:'toggle'}, TRANSITION_SPEED);
      $('#confirm_new_site_account_button').fadeOut('TRANSITION_SPEED', function() {
        $('#exists_new_site_account_button').fadeIn('TRANSITION_SPEED', function() {
          $('#exists_new_site_account_button').animate({width:'toggle'}, TRANSITION_SPEED);
          $('#exists_new_site_account_button').fadeOut('TRANSITION_SPEED', function() {
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
    $('#add_site_account_panel').fadeOut('fast', function () {
      $('#site_selector_panel').fadeIn('10');
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
* Defines event listeners for View3.
* In this view user can enter the master password.
*/
function define_view3_event_listeners() {
  // Input master password: -> View4
  $('#mpassword_input').keyup(async function () {
    const mpassword_input = $('#mpassword_input').val();

    let input_number = document.getElementById('smart_number_input'),
    mpassword_check_sign = document.getElementById('mp_check_sign');

    const validate_promise = await Logic.validate_masterpw_hash(mpassword_input, input_number.value);
    const valid_masterpw = await validate_promise;

    if (valid_masterpw) {
      mpassword_check_sign.style.color = '#65aa05';
      mpassword_check_sign.innerHTML = '';

      $('#masterpw_input_error').fadeOut('fast');
      $('#smart_number_error').hide();

      await Logic.derive_password( mpassword_input, input_number.value );

      $('#mpassword_input').remove(); // Remove inputs from the DOM
      $('#smart_number_input').remove();

      $('#masterpw_panel').fadeOut('fast', () => $('#copy_panel').fadeIn('fast') );
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
    Logic.copy_to_clipboard(mpassword.value);
  });

  let copy_input = document.getElementById('copy_input');
  copy_input.addEventListener('mouseover', function () {
    copy_input.type = 'text';
  });

  copy_input.addEventListener('mouseout', function () {
    copy_input.type = 'password';
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