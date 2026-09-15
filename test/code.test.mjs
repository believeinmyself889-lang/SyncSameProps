import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const WHITE = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
const BLACK = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];

function geometryNode(id, width = 100, height = 60) {
  let currentWidth = width;
  let currentHeight = height;
  return {
    id, name: id, type: 'RECTANGLE', fills: structuredClone(WHITE), strokes: [],
    strokeWeight: 1, strokeAlign: 'INSIDE', dashPattern: [], opacity: 1,
    effects: [], blendMode: 'PASS_THROUGH', cornerRadius: 0, rotation: 0,
    get width() { return currentWidth; },
    get height() { return currentHeight; },
    resizeWithoutConstraints(nextWidth, nextHeight) {
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    },
  };
}

function textNode(id, fontSize = 12, fills = BLACK) {
  const node = geometryNode(id, 120, 24);
  Object.assign(node, {
    type: 'TEXT', characters: 'Sample', fontName: { family: 'Inter', style: 'Regular' },
    fontSize, lineHeight: { unit: 'AUTO' }, letterSpacing: { unit: 'PIXELS', value: 0 },
    paragraphSpacing: 0, textAlignHorizontal: 'LEFT', textAlignVertical: 'TOP',
    textAutoResize: 'WIDTH_AND_HEIGHT', textCase: 'ORIGINAL', textDecoration: 'NONE',
    fills: structuredClone(fills),
    getRangeAllFontNames() { return [this.fontName]; },
  });
  return node;
}

function loadPlugin(master, candidates) {
  const handlers = {};
  const messages = [];
  const nodes = [master, ...candidates];
  const figma = {
    mixed: Symbol('mixed'),
    currentPage: {
      selection: [master],
      findAll: (predicate) => typeof predicate === 'function' ? nodes.filter(predicate) : nodes,
    },
    ui: { onmessage: null, postMessage: (message) => messages.push(message) },
    showUI() {}, notify() {}, loadFontAsync: async () => {},
    on: (name, handler) => { handlers[name] = handler; },
    getNodeById: (id) => nodes.find((node) => node.id === id) || null,
  };
  const source = fs.readFileSync(new URL('../code.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, { figma, __html__: '', console, setTimeout, clearTimeout }, { filename: 'code.js' });
  return { figma, handlers, messages };
}

function start(figma, properties) {
  figma.ui.onmessage({ type: 'set-properties', properties });
  figma.ui.onmessage({ type: 'set-tracking', value: true });
}

function emitChange(handlers, master, properties) {
  handlers.documentchange({ documentChanges: [{ type: 'PROPERTY_CHANGE', node: master, properties }] });
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 240));

test('tracks any selected combination and excludes objects that differ on one selected property', async () => {
  const master = textNode('master', 12, BLACK);
  const matching = textNode('matching', 12, BLACK);
  const differentFill = textNode('different-fill', 12, WHITE);
  const { figma, handlers } = loadPlugin(master, [matching, differentFill]);
  start(figma, ['fontSize', 'fills']);

  master.fontSize = 18;
  emitChange(handlers, master, ['fontSize']);
  await settle();

  assert.equal(matching.fontSize, 18);
  assert.equal(differentFill.fontSize, 12);
});

test('persists font size after Figma rolls back a hover preview', async () => {
  const master = textNode('master', 12);
  const target = textNode('target', 12);
  const { figma, handlers } = loadPlugin(master, [target]);
  start(figma, ['fontSize']);

  master.fontSize = 18;
  emitChange(handlers, master, ['fontSize']);
  await settle();
  assert.equal(target.fontSize, 18);

  master.fontSize = 12;
  target.fontSize = 12;
  master.fontSize = 18;
  emitChange(handlers, master, ['fontSize']);
  await settle();

  assert.equal(target.fontSize, 18);
});

test('writes selected width and height through the Figma resize API', async () => {
  const master = geometryNode('master');
  const target = geometryNode('target');
  const { figma, handlers } = loadPlugin(master, [target]);
  start(figma, ['width', 'height']);

  master.resizeWithoutConstraints(180, 96);
  emitChange(handlers, master, ['width', 'height']);
  await settle();

  assert.equal(target.width, 180);
  assert.equal(target.height, 96);
});

test('does not react when only an unselected property changes', async () => {
  const master = geometryNode('master');
  const target = geometryNode('target');
  const { figma, handlers, messages } = loadPlugin(master, [target]);
  start(figma, ['opacity']);
  const resultCount = messages.filter((message) => message.type === 'result').length;

  master.rotation = 30;
  emitChange(handlers, master, ['rotation']);
  await settle();

  assert.equal(target.rotation, 0);
  assert.equal(messages.filter((message) => message.type === 'result').length, resultCount);
});
