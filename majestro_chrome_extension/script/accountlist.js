

export default class AccountList {

  constructor() {
  }

  createAccountCard(text, account_class) {
    let divElement = document.createElement("div");
    let b = document.createElement('button');
    const t = document.createTextNode(text);
    let icon = document.createElement("span");

    icon.classList.add('fa');
    icon.classList.add('fa-lock')

    divElement.classList.add(account_class);
    b.classList.add('account_button');
    b.appendChild(t);
    divElement.appendChild(icon)
    divElement.appendChild(b);
    document.getElementById("account-list").appendChild(divElement);
  }

  async populateAccountCards(accounts, recognized) {
    if (recognized) {

      // Add Magnet icon to indicate recognized site
      let magnet_sign = document.createElement("div");
      magnet_sign.classList.add('fa');
      magnet_sign.classList.add('recognized_sign')
      magnet_sign.classList.add('fa-magnet');
      document.getElementById("account-list").appendChild(magnet_sign);
      this.createAccountCard(recognized, 'account_recognized_item');

      // Add message to indicate recognized site
      let recognized_message = document.createElement("p");
      const t = document.createTextNode('Website recognized!');
      recognized_message.classList.add('recognized_message');
      recognized_message.appendChild(t);
      document.getElementById("account-list").appendChild(recognized_message);
    } else {
      $("#account-list").empty();
    }

    accounts = accounts.sort();
    await accounts.forEach(
      ( account ) => this.createAccountCard(account, 'account_item')
    );

    $('.account_button').click(function() {
      $('#selected_account').val($(this).text());
      $('#site_select_error_message').hide();
    });
  }
}