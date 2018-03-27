

export default class AccountList {

  constructor() {
  }

  createAccountCard(text) {
    let divElement = document.createElement("div");
    let b = document.createElement('button');
    const t = document.createTextNode(text);
    let icon = document.createElement("span");
    icon.classList.add('fa');
    icon.classList.add('fa-lock')

    divElement.classList.add('account_item');
    b.classList.add('account_button');
    b.appendChild(t);
    divElement.appendChild(icon)
    divElement.appendChild(b);
    document.getElementById("account-list").appendChild(divElement);
  }

  async populateAccountCards(accounts) {
    $("#account-list").empty();
    accounts = accounts.sort();
    await accounts.forEach( (account) => this.createAccountCard(account) );

    $('.account_button').click(function() {
      $('#selected_account').val($(this).text());
      $('#site_select_error_message').hide();
    });
  }
}