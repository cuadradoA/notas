const InvitationEmailService = require("../../application/ports/InvitationEmailService");

class MockInvitationEmailService extends InvitationEmailService {
  async sendProjectInvitation({ to, projectName, invitedByEmail }) {
    console.log(
      `[MockEmail] Invitation sent to ${to} for project "${projectName}" by ${invitedByEmail}`
    );
  }
}

module.exports = new MockInvitationEmailService();
