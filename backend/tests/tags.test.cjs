const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/tags.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const sandbox = { exports: {} }; vm.runInNewContext(compiled, sandbox);

test('Un redémarrage ne recrée pas les tags supprimés et ne remplace pas les modifications administrateur', async () => {
  let initialized = false;
  const records = new Map();
  const store = { get: async () => initialized, set: async ({ value }) => { initialized = value; } };
  const strapi = {
    store: () => store,
    db: {
      transaction: async callback => callback(),
      query: () => ({
        findOne: async ({ where }) => records.get(where.label),
        update: async () => { throw new Error('Aucun ancien tag dans cette fixture'); },
        updateMany: async ({ where, data }) => {
          const field = Object.keys(where)[0];
          for (const record of records.values()) {
            const matches = where[field]?.$null ? record[field] == null : record[field] === where[field];
            if (matches) Object.assign(record, data);
          }
        },
      }),
    },
    documents: () => ({ create: async ({ data }) => records.set(data.label, { ...data }) }),
  };
  await sandbox.exports.setupTags(strapi);
  assert.ok(records.has('Charge'));
  records.delete('Charge');
  records.get('Ambiance').enabled = false;
  records.get('Sens').label = 'Sens du travail';
  await sandbox.exports.setupTags(strapi);
  assert.equal(records.has('Charge'), false);
  assert.equal(records.get('Ambiance').enabled, false);
  records.get('Ambiance').icon = 'chat';
  records.get('Sens').icon = 'scales';
  await sandbox.exports.setupTags(strapi);
  assert.equal(records.get('Ambiance').icon, 'message-circle');
  assert.equal(records.get('Sens').icon, 'scale');
  records.get('Sens').icon = 'alarm-clock';
  await sandbox.exports.setupTags(strapi);
  assert.equal(records.get('Sens').icon, 'alarm-clock');
  assert.equal(records.get('Sens').label, 'Sens du travail');
  records.set('Ancien', { label: 'Ancien', enabled: null });
  await sandbox.exports.setupTags(strapi);
  assert.equal(records.get('Ancien').enabled, true);
  assert.equal(records.get('Ancien').audience, 'collaborateur');
  assert.equal(records.get('Ambiance').enabled, false);
});
