require("dotenv").config();
const http = require("http");
const app = require("./app");
const { initSocket } = require("./infrastructure/realtime/socket");
const mongo = require("./infrastructure/database/mongo");
const registerEventHandlers = require("./application/events/register-event-handlers");
const { ensureDefaultAdmin } = require("./infrastructure/bootstrap/admin-bootstrap");

const server = http.createServer(app);
initSocket(server);
registerEventHandlers();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await mongo.connect();
    const admin = await ensureDefaultAdmin();
    console.log(`Default admin ready: ${admin.email}`);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
