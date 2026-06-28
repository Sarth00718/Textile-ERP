const repo = require('../repositories/factorySettings.repository');

async function getSettings() {
  let settings = await repo.get();
  if (!settings) {
    settings = await repo.createDefault();
  }
  return settings;
}

async function updateSettings(data) {
  const settings = await getSettings();
  return repo.update(settings.id, data);
}

module.exports = { getSettings, updateSettings };
