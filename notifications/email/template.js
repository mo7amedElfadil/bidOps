"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailTemplate = renderEmailTemplate;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const templateCache = new Map();
const templatesDir = node_path_1.default.join(__dirname, 'templates');
async function loadTemplate(name) {
    if (templateCache.has(name))
        return templateCache.get(name);
    const filename = name.endsWith('.html') ? name : `${name}.html`;
    const fullPath = node_path_1.default.join(templatesDir, filename);
    const contents = await (0, promises_1.readFile)(fullPath, 'utf-8');
    templateCache.set(name, contents);
    return contents;
}
async function renderEmailTemplate(name, data) {
    const template = await loadTemplate(name);
    return template.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => data[key] ?? '');
}
