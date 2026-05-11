class CachedProjectInsightsProxy {
  constructor(gateway) {
    this.gateway = gateway;
    this.boardsCache = new Map();
    this.tasksCache = new Map();
  }

  async getBoards(projectId) {
    const cacheKey = projectId.toString();

    if (!this.boardsCache.has(cacheKey)) {
      this.boardsCache.set(cacheKey, this.gateway.getBoards(projectId));
    }

    return this.boardsCache.get(cacheKey);
  }

  async getTasks(projectId) {
    const cacheKey = projectId.toString();

    if (!this.tasksCache.has(cacheKey)) {
      const boards = await this.getBoards(projectId);
      this.tasksCache.set(cacheKey, this.gateway.getTasks(projectId, boards));
    }

    return this.tasksCache.get(cacheKey);
  }
}

module.exports = CachedProjectInsightsProxy;
