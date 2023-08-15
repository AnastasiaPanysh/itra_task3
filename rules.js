const crypto = require("crypto");
const readline = require("readline");
class Referee {
  constructor(numChoices) {
    this.numChoices = numChoices;
  }

  getResult(throw1, throw2) {
    if (throw1 === throw2) {
      return "Draw";
    } else if (
      (throw2 > throw1 && throw2 - throw1 <= this.numChoices / 2) ||
      (throw2 < throw1 && throw1 - throw2 > this.numChoices / 2)
    ) {
      return "Win";
    } else {
      return "Lose";
    }
  }
}
class TableRules {
  constructor(throws) {
    this.throws = throws;
  }

  onDisplay() {
    const headerRow = ["(throws)", ...this.throws];
    const referee = new Referee(this.throws.length);

    let table = this.formatRow(headerRow);

    for (let i = 0; i < this.throws.length; i++) {
      const row = [this.throws[i]];

      for (let j = 0; j < this.throws.length; j++) {
        row.push(referee.getResult(j, i));
      }

      table += this.formatRow(row);
    }
    console.log(table);
  }

  formatRow(row) {
    const cellWidth = 10;
    let formattedRow = "";

    for (const cell of row) {
      formattedRow += cell.toString().padEnd(cellWidth);
    }
    return formattedRow + "\n";
  }
}
class EncryptionKey {
  generateKey() {
    const bytes = crypto.randomBytes(16);
    return bytes.toString("hex");
  }

  generateHMAC(key, message) {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(message);
    return hmac.digest("hex");
  }
}
class Play {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.throwChoices = process.argv.slice(2);
    this.encryptionKey = new EncryptionKey();
    this.referee = new Referee(this.throwChoices.length);

    if (!this.validateThrowChoices(this.throwChoices)) {
      this.rl.close();
      return;
    }

    this.tableRules = new TableRules(this.throwChoices);
    this.playGame();
  }

  validateThrowChoices(throwChoices) {
    if (
      throwChoices.length < 3 ||
      throwChoices.length % 2 == 0 ||
      new Set(throwChoices).size !== throwChoices.length
    ) {
      console.log(
        "Incorrect result. You must provide 3 or more unique throw choices."
      );
      return false;
    }
    return true;
  }

  async playGame() {
    while (!this.endofthegame) {
      const key = this.encryptionKey.generateKey();
      const computerThrow = Math.floor(
        Math.random() * this.throwChoices.length
      );
      const hmac = this.encryptionKey.generateHMAC(
        key,
        this.throwChoices[computerThrow]
      );

      console.log("HMAC: " + hmac);

      console.log("Available throws:");
      for (let i = 0; i < this.throwChoices.length; i++) {
        console.log(i + 1 + " - " + this.throwChoices[i]);
      }
      console.log("0 - exit");
      console.log("? - help");

      const ans = await this.questionAsync("Choose a throw: ");
      await this.handleAnswer(ans, computerThrow, key);
    }
  }

  questionAsync(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async handleAnswer(ans, computerThrow, key) {
    if (ans === "?") {
      this.displayRules();
      await this.playGame();
    } else if (ans === "0") {
      this.endofthegame = true;
      this.rl.close();
    } else {
      const userThrow = parseInt(ans);
      if (
        isNaN(userThrow) ||
        userThrow <= 0 ||
        userThrow > this.throwChoices.length
      ) {
        console.log("\n\n\n");
        await this.playGame();
      } else {
        console.log("Your move: " + this.throwChoices[userThrow - 1]);
        console.log("Computer move: " + this.throwChoices[computerThrow]);

        const result = this.referee.getResult(computerThrow, userThrow - 1);
        switch (result) {
          case "Win":
            console.log("Won!");
            break;
          case "Lose":
            console.log("Lost!");
            break;
          default:
            console.log("Draw!");
            break;
        }

        console.log("HMAC key: " + key);
        await this.playGame();
      }
    }
  }

  displayRules() {
    this.tableRules.onDisplay();
  }
}

new Play();
