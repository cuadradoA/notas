class NotificationChannel {
  async send() {
    throw new Error("send() must be implemented");
  }
}

module.exports = NotificationChannel;
