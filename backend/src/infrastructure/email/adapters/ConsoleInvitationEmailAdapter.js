const InvitationEmailService = require("../../../application/ports/InvitationEmailService");

class ConsoleInvitationEmailAdapter extends InvitationEmailService {
  constructor(legacyMailer) {
    super();
    this.legacyMailer = legacyMailer;
  }

  async sendProjectInvitation({ to, projectName, invitedByEmail }) {
    return this.legacyMailer.deliver(
      `Invitation sent to ${to} for project "${projectName}" by ${invitedByEmail}`
    );
  }
}

module.exports = ConsoleInvitationEmailAdapter;
