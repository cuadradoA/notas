class LegacyConsoleMailer {
  async deliver(message) {
    console.log(`[MockEmail] ${message}`);
  }
}

module.exports = LegacyConsoleMailer;
