const ConsoleInvitationEmailAdapter = require("./adapters/ConsoleInvitationEmailAdapter");
const LegacyConsoleMailer = require("./legacy/LegacyConsoleMailer");

module.exports = new ConsoleInvitationEmailAdapter(new LegacyConsoleMailer());
