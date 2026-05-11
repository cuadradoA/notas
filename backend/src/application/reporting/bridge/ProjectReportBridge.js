class ProjectReportBridge {
  constructor(renderer) {
    this.renderer = renderer;
  }

  async export(snapshot) {
    return this.renderer.render(this.buildViewModel(snapshot));
  }

  buildViewModel() {
    throw new Error("buildViewModel() must be implemented");
  }
}

module.exports = ProjectReportBridge;
