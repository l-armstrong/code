const EthCrypto = require('eth-crypto');
const Client = require('./client.js');

// Our naive implementation of a centralized payment processor
class Paypal extends Client {
  constructor() {
    super();
    // the state of the network (accounts and balances)
    this.state = {
      [this.wallet.address]: {
        balance: 1000000,
      },
    };
    // the history of transactions
    this.txHistory = [];
  }

  // Checks that the sender of a transaction is the same as the signer
  checkTxSignature(tx) {
    // get the signature from the transaction
    const sig = this.verify(tx.sig, this.toHash(tx.contents), tx.contents.from);
    // if the signature is invalid print an error to the console and return false
    if (!sig) {
      console.log('Invalid Signature');
      return false;
      // return true if the transaction is valid
    }
    return true;
  }

  // Checks if the user's address is already in the state, and if not, adds the user's address to the state
  checkUserAddress(tx) {
    // check if the sender is in the state
    if(!(tx.contents.to in this.state)) {
      this.state[tx.contents.to] = {
        balance: 0,
      };
    }
    // check if the receiver is in the state
    if(!(tx.contents.from in this.state)) {
      this.state[tx.contents.from] = {
        balance: 0,
      };
    }
    // once the checks on both accounts pass (they're both in the state), return true
    return true;
  }

  // Checks the transaction type and ensures that the transaction is valid based on that type
  checkTxType(tx) {
    // if the transaction type is 'mint'
    if(tx.contents.type == 'mint') {
      if(tx.contents.from != this.wallet.address) {
        console.log('Non-Paypal Clients can\'t mint!');
        return false;
      }
      return true;
    }
    if(tx.contents.type == 'check') {
      const user = tx.contents.from;
      console.log(`Your balance is ${this.state[user].balance}`)
      return false;
    }
    if(tx.contents.type == 'send') {
      if(tx.contents.amount < 0 || 
        this.state[tx.contents.from].balance < tx.contents.amount) {
          console.log('Invalid Transaction');
          return false;
        }
      return true;
    }
  }

  // Checks if a transaction is valid, adds it to the transaction history, and updates the state of accounts and balances
  checkTx(tx) {
    // check that the transaction signature is valid
    if(this.checkTxSignature(tx)) {
      if(this.checkUserAddress(tx)) {
        if(this.checkTxType(tx)) {
          return true;
        }
      }
    }
    return false;
  }

  // Updates account balances according to a transaction and adds the transaction to the history
  applyTx(tx) {
    // decrease the balance of the transaction sender/signer
    // TODO
    this.state[tx.contents.from].balance -= tx.contents.amount;
    // increase the balance of the transaction receiver
    this.state[tx.contents.to].balance += tx.contents.amount;
    // add the transaction to the transaction history
    this.txHistory.push(tx);
    return true;
    // return true once the transaction is processed
    // TODO
  }

  // Process a transaction
  processTx(tx) {
    // check the transaction is valid
    if(this.checkTx(tx)) {
      this.applyTx(tx)
    }
  }
}

module.exports = Paypal;
