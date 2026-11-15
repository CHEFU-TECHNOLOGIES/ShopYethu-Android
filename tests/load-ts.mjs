import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
export function loadTs(relative, dependencies = {}, globals = {}) {
  const filename = path.resolve(root, relative);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, Error, AbortController, URLSearchParams,
    setTimeout, clearTimeout, structuredClone, Date, console, ...globals,
    require: name => {
      if (name in dependencies) return dependencies[name];
      if (name.startsWith('.')) return loadTs(path.relative(root, path.resolve(path.dirname(filename), name + '.ts')), dependencies, globals);
      throw new Error(`Unexpected dependency ${name} in ${relative}`);
    },
  }, { filename });
  return module.exports;
}
