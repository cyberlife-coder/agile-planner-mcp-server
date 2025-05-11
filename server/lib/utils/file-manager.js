const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');

class FileManager {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async createEpicFile(epic) {
    if (!epic || !epic.id) {
      throw new Error('Epic invalide ou ID manquant');
    }
    const epicSlug = slugify(epic.id, { lower: true });
    const epicDir = path.join(this.basePath, 'epics', epicSlug);
    await fs.ensureDir(epicDir);
    return epicDir;
  }
}

module.exports = FileManager;

