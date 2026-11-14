// Runtime: Node.js >=20; dependencies: node built-ins only.
// Run: node --test tests/rules.test.mjs
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const root = new URL('../', import.meta.url);
const text = path => readFileSync(new URL(path, root), 'utf8');
const bytes = path => readFileSync(new URL(path, root));
const sha256 = data => createHash('sha256').update(data).digest('hex');
const sourceManifest = JSON.parse(text('manifest.json'));
const nativeManifest = JSON.parse(text('egern/manifest.json'));
const names = ['Ads', 'AI', 'Binance', 'Apple', 'Domestic', 'Proxy'];
const policies = ['REJECT', 'Intelligence', 'Binance', 'Apple', 'DIRECT', 'Proxy'];
const nativeTypes = {
  domain_set: 'DOMAIN', domain_suffix_set: 'DOMAIN-SUFFIX',
  ip_cidr_set: 'IP-CIDR', ip_cidr6_set: 'IP-CIDR6',
};
const body = path => text(path).split(/\r?\n/).map(line => line.trim())
  .filter(line => line && !line.startsWith('#'));

function surgeRules(name) {
  return body(`${name}.list`).map(line => {
    const [type, value, option, extra] = line.split(',');
    assert.ok(Object.values(nativeTypes).includes(type), `unsupported Surge type: ${line}`);
    assert.ok(value && !extra && (!option || option === 'no-resolve'), `invalid Surge rule: ${line}`);
    assert.ok(!option || type.startsWith('IP-CIDR'), `unexpected domain option: ${line}`);
    return [type, value, option === 'no-resolve'];
  });
}

// This parses the repository's native rule-set subset, not arbitrary YAML.
// Reject unknown syntax so a newly introduced YAML feature cannot be ignored.
function nativeRules(path) {
  const values = [];
  let section;
  let noResolve = false;
  for (const line of text(path).split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const flag = /^no_resolve: (true|false)$/.exec(line);
    const key = /^(domain_set|domain_suffix_set|ip_cidr_set|ip_cidr6_set):$/.exec(line);
    const item = /^  - (.+)$/.exec(line);
    if (flag) noResolve = flag[1] === 'true';
    else if (key) section = nativeTypes[key[1]];
    else if (item && section) {
      const raw = item[1];
      const value = raw.startsWith('"') ? JSON.parse(raw)
        : raw.startsWith("'") ? raw.slice(1, -1).replace(/''/g, "'") : raw;
      values.push([section, value]);
    } else assert.fail(`unsupported native syntax in ${path}: ${line}`);
  }
  return values.map(([type, value]) => [type, value, type.startsWith('IP-CIDR') && noResolve]);
}

const engines = {
  Surge: Object.fromEntries(names.map(name => [name, surgeRules(name)])),
  Egern: Object.fromEntries(names.map(name => [name, nativeRules(`egern/${name}.yaml`)])),
};
const matches = (rules, host) => rules.find(([type, value]) =>
  type === 'DOMAIN' ? host === value
    : type === 'DOMAIN-SUFFIX' && (host === value || host.endsWith(`.${value}`)));

function route(engine, host) {
  // The main configuration's existing Banking.list exception precedes these
  // six sets. It is a fixed fixture here; abchina.com is not in Domestic.list.
  if (host === 'abchina.com' || host.endsWith('.abchina.com')) return 'DIRECT';
  for (const [index, name] of names.entries()) {
    if (matches(engines[engine][name], host)) return policies[index];
  }
  return 'FINAL';
}

function expectRoute(host, policy) {
  for (const engine of Object.keys(engines)) assert.equal(route(engine, host), policy, `${engine}: ${host}`);
}
const countTypes = rules => {
  const counts = {};
  for (const [type] of rules) counts[type] = (counts[type] ?? 0) + 1;
  return counts;
};
const conditionHash = rules => sha256(JSON.stringify(rules));

// Each case checks both formats using first-match order from the published
// examples. No DNS, HTTP, client API, credentials or third-party code is used.
describe('ABC media classification', () => {
  for (const domain of ['abc.com', 'abcnews.com', 'abc-studios.com', 'edgedatg.com']) {
    for (const host of [domain, `www.${domain}`, `video.cdn.${domain}`]) {
      it(`${host} uses Proxy`, () => {
        expectRoute(host, 'Proxy');
        for (const sets of Object.values(engines)) {
          assert.equal(matches(sets.Domestic, host), undefined);
          assert.deepEqual(sets.Proxy.filter(([, value]) => value === domain), [['DOMAIN-SUFFIX', domain, false]]);
        }
      });
    }
  }
  for (const host of ['abchina.com', 'www.abchina.com', 'ebank.abchina.com']) {
    it(`${host} retains the prior Banking DIRECT exception`, () => {
      expectRoute(host, 'DIRECT');
      for (const sets of Object.values(engines)) {
        assert.equal(matches(sets.AI, host), undefined);
        assert.equal(matches(sets.Proxy, host), undefined);
      }
    });
  }
});

describe('SGTrae exact-host scope', () => {
  it('trae-api-sg.mchost.guru matches exact AI before Domestic', () => {
    expectRoute('trae-api-sg.mchost.guru', 'Intelligence');
    for (const sets of Object.values(engines)) {
      assert.deepEqual(matches(sets.AI, 'trae-api-sg.mchost.guru'), ['DOMAIN', 'trae-api-sg.mchost.guru', false]);
      assert.deepEqual(matches(sets.Domestic, 'trae-api-sg.mchost.guru'), ['DOMAIN-SUFFIX', 'mchost.guru', false]);
    }
  });
  for (const host of [
    'mchost.guru', 'api.mchost.guru', 'trae-api-cn.mchost.guru',
    'trae-api-sg2.mchost.guru', 'x.trae-api-sg.mchost.guru',
    'trae.cn', 'api.trae.cn', 'trae.com.cn', 'trae.guru',
  ]) {
    it(`${host} keeps its Domestic DIRECT route`, () => {
      expectRoute(host, 'DIRECT');
      for (const sets of Object.values(engines)) assert.equal(matches(sets.AI, host), undefined);
    });
  }
  for (const host of ['trae-api-sg.mchost.guru.example', 'trae-api-sg-mchost.guru', 'notmchost.guru']) {
    it(`${host} does not gain an AI or Domestic match`, () => {
      expectRoute(host, 'FINAL');
      for (const sets of Object.values(engines)) {
        assert.equal(matches(sets.AI, host), undefined);
        assert.equal(matches(sets.Domestic, host), undefined);
      }
    });
  }
});

describe('Existing AI and domestic routing', () => {
  for (const host of [
    'chatgpt.com', 'api.openai.com', 'cdn.oaistatic.com',
    'claude.ai', 'api.anthropic.com', 'gemini.google.com',
    'generativelanguage.googleapis.com', 'grok.com', 'api.x.ai',
  ]) it(`${host} retains Intelligence`, () => expectRoute(host, 'Intelligence'));
  for (const host of [
    'deepseek.com', 'chat.deepseek.com', 'api.deepseeksvc.com',
    'kimi.com', 'www.kimi.com', 'api.moonshot.cn',
  ]) it(`${host} retains DIRECT`, () => expectRoute(host, 'DIRECT'));
});

describe('Surge and Egern condition equivalence', () => {
  for (const name of names) {
    it(`${name} has identical ordered conditions, flags and source notices`, () => {
      const surge = engines.Surge[name];
      const native = engines.Egern[name];
      assert.deepEqual(native, surge);
      assert.equal(new Set(surge.map(rule => JSON.stringify(rule))).size, surge.length, 'duplicate conditions');
      assert.match(text(`${name}.list`), new RegExp(`^# 静态规则：${name}；有效规则：${surge.length}\\n`));
      const sourceHeader = text(`${name}.list`).split('\n\n', 1)[0];
      assert.ok(text(`egern/${name}.yaml`).startsWith(`${sourceHeader}\n`), 'source/license header changed');
    });
  }
  it('both reference examples retain AI before Domestic with existing policies', () => {
    const surge = [...text('README.md').matchAll(/RULE-SET,https:\/\/raw\.githubusercontent\.com\/atopsecret\/Rules\/main\/(\w+)\.list,([^,\n]+)/g)]
      .map(([, name, policy]) => [name, policy]);
    const native = [...text('egern/README.md').matchAll(/match: https:\/\/raw\.githubusercontent\.com\/atopsecret\/Rules\/main\/egern\/(\w+)\.yaml\n\s+policy: (\S+)/g)]
      .filter(([, name]) => names.includes(name)).map(([, name, policy]) => [name, policy]);
    const expected = names.map((name, index) => [name, policies[index]]);
    assert.deepEqual(surge, expected);
    assert.deepEqual(native, expected);
  });
});

describe('Manifest and checksum integrity', () => {
  for (const name of names) {
    it(`${name} source counts, bytes, full hash and body hash agree`, () => {
      const entry = sourceManifest.files.find(item => item.file === `${name}.list`);
      const data = bytes(entry.file);
      assert.equal(entry.rule_count, engines.Surge[name].length);
      assert.equal(entry.bytes, data.length);
      assert.equal(entry.sha256, sha256(data));
      assert.equal(entry.verified_rule_body_sha256, sha256(`${body(entry.file).join('\n')}\n`));
    });
    it(`${name} native metadata agrees with source and parsed conditions`, () => {
      const entry = nativeManifest.files[name];
      const source = sourceManifest.files.find(item => item.file === `${name}.list`);
      const data = bytes(`egern/${entry.file}`);
      assert.equal(entry.rules, engines.Egern[name].length);
      assert.deepEqual(entry.type_counts, countTypes(engines.Egern[name]));
      assert.equal(entry.no_resolve, engines.Surge[name].some(rule => rule[2]));
      assert.equal(entry.condition_sha256, conditionHash(engines.Surge[name]));
      assert.equal(entry.condition_sha256, conditionHash(engines.Egern[name]));
      assert.equal(entry.source, `../${source.file}`);
      assert.equal(entry.source_sha256, source.sha256);
      assert.equal(entry.bytes, data.length);
      assert.equal(entry.sha256, sha256(data));
    });
  }
  for (const group of ['optional_files', 'support_files']) {
    for (const [name, entry] of Object.entries(nativeManifest[group])) {
      it(`${name} auxiliary native count, bytes and hash remain valid`, () => {
        const rules = nativeRules(`egern/${entry.file}`);
        const data = bytes(`egern/${entry.file}`);
        assert.equal(entry.rules, rules.length);
        assert.equal(entry.bytes, data.length);
        assert.equal(entry.sha256, sha256(data));
        if (entry.type_counts) assert.deepEqual(entry.type_counts, Object.fromEntries(
          Object.entries(countTypes(rules)).map(([type, count]) => [Object.keys(nativeTypes).find(key => nativeTypes[key] === type), count]),
        ));
      });
    }
  }
  it('core manifest totals and documented totals agree', () => {
    const total = sourceManifest.files.reduce((sum, entry) => sum + entry.rule_count, 0);
    assert.equal(sourceManifest.total_rules, total);
    assert.equal(nativeManifest.total_rules, total);
    assert.equal(Object.values(nativeManifest.files).reduce((sum, entry) => sum + entry.rules, 0), total);
    for (const path of ['README.md', 'egern/README.md']) assert.ok(text(path).includes(total.toLocaleString('en-US')), path);
  });
  for (const directory of ['', 'egern/']) {
    it(`${directory || 'root/'}SHA256SUMS exactly covers published rule files`, () => {
      const expected = directory ? [
        ...Object.values(nativeManifest.files), ...Object.values(nativeManifest.support_files),
        ...Object.values(nativeManifest.optional_files),
      ] : sourceManifest.files;
      const lines = body(`${directory}SHA256SUMS`);
      const actual = lines.map(line => {
        const match = /^([a-f0-9]{64})  (\S+)$/.exec(line);
        assert.ok(match, `invalid checksum: ${line}`);
        const [, hash, file] = match;
        assert.equal(sha256(bytes(`${directory}${file}`)), hash, file);
        return file;
      });
      assert.deepEqual([...actual].sort(), expected.map(entry => entry.file).sort());
    });
  }
  it('source licenses, provenance and publication settings are preserved', () => {
    assert.deepEqual(sourceManifest.files.map(entry => [entry.file, entry.license, entry.source_ids]), [
      ['Ads.list', 'GPL-3.0-only', ['awavenue', 'easylistchina']],
      ['AI.list', 'GPL-2.0-only', ['blackmatrix7', 'v2fly']],
      ['Binance.list', 'GPL-2.0-only', ['blackmatrix7', 'v2fly']],
      ['Apple.list', 'MIT', ['v2fly']], ['Domestic.list', 'MIT', ['v2fly']],
      ['Proxy.list', 'MIT for V2Fly portions; official public Telegram CIDRs', ['v2fly', 'telegram']],
    ]);
    assert.equal(sourceManifest.publication_mode, 'static-manual');
    assert.equal(sourceManifest.automatic_search, false);
    assert.equal(sourceManifest.scheduled_updates, false);
    assert.equal(nativeManifest.network_requests, 0);
    assert.equal(nativeManifest.optional_files.TikTok.license, 'MIT');
    assert.equal(nativeManifest.optional_files.TikTok.policy, 'TikTok');
  });
  it('the current TikTok overseas authentication/device dependencies remain present', () => {
    const rules = nativeRules('egern/TikTok.yaml');
    for (const host of ['byteoversea.com', 'byteoversea.net', 'ibytedtos.com', 'ibyteimg.com', 'isnssdk.com', 'sgsnssdk.com']) {
      assert.deepEqual(matches(rules, host), ['DOMAIN-SUFFIX', host, false]);
    }
    for (const host of ['bytedance.com', 'snssdk.com', 'pstatp.com']) assert.equal(matches(rules, host), undefined);
  });
});
