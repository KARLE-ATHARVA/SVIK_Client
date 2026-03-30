const fs = require('fs');
const path = require('path');

const entry = path.resolve(__dirname, '..', 'node_modules', 'qrcode', 'lib', 'browser.js');
const outFile = path.resolve(__dirname, '..', 'public', 'app', 'visualizer', 'js', 'qrcode-bundle.js');

const moduleId = new Map();
const modules = [];

function resolveModule(fromFile, reqPath) {
  if (!reqPath.startsWith('.')) return null;
  let full = path.resolve(path.dirname(fromFile), reqPath);
  if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  if (fs.existsSync(full + '.js')) return full + '.js';
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
    const idx = path.join(full, 'index.js');
    if (fs.existsSync(idx)) return idx;
  }
  if (fs.existsSync(full + '.json')) return full + '.json';
  return null;
}

function getId(file) {
  if (moduleId.has(file)) return moduleId.get(file);
  const id = modules.length;
  moduleId.set(file, id);
  modules.push({ file, code: '' });
  return id;
}

function readModule(file) {
  const id = getId(file);
  const code = fs.readFileSync(file, 'utf8');
  modules[id].code = code;

  const requires = [];
  const reqRegex = /require\(['"](.+?)['"]\)/g;
  let m;
  while ((m = reqRegex.exec(code))) {
    requires.push(m[1]);
  }

  for (const req of requires) {
    const resolved = resolveModule(file, req);
    if (!resolved) continue;
    if (!moduleId.has(resolved)) {
      readModule(resolved);
    }
  }
}

readModule(entry);

function escapeBackticks(str) {
  return str.replace(/`/g, '\\`');
}

let output = '(function(){\n';
output += 'var modules = {};\n';
output += 'var cache = {};\n';
output += 'function require(id){\n';
output += '  if(cache[id]) return cache[id].exports;\n';
output += '  var module = { exports: {} };\n';
output += '  cache[id] = module;\n';
output += '  modules[id](require, module, module.exports);\n';
output += '  return module.exports;\n';
output += '}\n';

modules.forEach((mod, idx) => {
  output += 'modules[' + idx + '] = function(require, module, exports){\n';
  output += escapeBackticks(mod.code) + '\n';
  output += '};\n';
});

const entryId = moduleId.get(entry);
output += 'window.QRCode = require(' + entryId + ');\n';
output += '})();\n';

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, output, 'utf8');
console.log('Wrote bundle to', outFile);
