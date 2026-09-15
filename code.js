/**
 * SyncSameProps — 自定义属性组合实时同步
 *
 * 1. 单选一个基准对象；2. 勾选任意属性并开始跟踪；
 * 3. 修改基准对象，改动前在所选属性上相同的对象自动跟随。
 *
 * 选定基准时固定本轮匹配组，确保 Figma 属性面板的悬停预览回滚后，
 * 正式提交仍会把最终值重新写入所有匹配对象。
 */

'use strict';

figma.showUI(__html__, { width: 380, height: 680, themeColors: true });

const PROPERTY_DEFS = [
  { key: 'fills', label: '填充', group: 'paint' },
  { key: 'strokes', label: '描边', group: 'paint' },
  { key: 'strokeWeight', label: '描边宽度', group: 'paint' },
  { key: 'strokeAlign', label: '描边对齐', group: 'paint' },
  { key: 'dashPattern', label: '虚线', group: 'paint' },
  { key: 'opacity', label: '不透明度', group: 'appearance' },
  { key: 'effects', label: '效果 / 阴影', group: 'appearance' },
  { key: 'blendMode', label: '混合模式', group: 'appearance' },
  { key: 'cornerRadius', label: '圆角', group: 'geometry' },
  { key: 'width', label: '宽度', group: 'geometry' },
  { key: 'height', label: '高度', group: 'geometry' },
  { key: 'rotation', label: '旋转', group: 'geometry' },
  { key: 'characters', label: '文本内容', group: 'text', textOnly: true },
  { key: 'fontName', label: '字体', group: 'text', textOnly: true },
  { key: 'fontSize', label: '字号', group: 'text', textOnly: true },
  { key: 'lineHeight', label: '行高', group: 'text', textOnly: true },
  { key: 'letterSpacing', label: '字距', group: 'text', textOnly: true },
  { key: 'paragraphSpacing', label: '段间距', group: 'text', textOnly: true },
  { key: 'textAlignHorizontal', label: '水平对齐', group: 'text', textOnly: true },
  { key: 'textAlignVertical', label: '垂直对齐', group: 'text', textOnly: true },
  { key: 'textAutoResize', label: '文本框尺寸', group: 'text', textOnly: true },
  { key: 'textCase', label: '大小写', group: 'text', textOnly: true },
  { key: 'textDecoration', label: '文本装饰', group: 'text', textOnly: true },
];

const PROPERTY_MAP = Object.fromEntries(PROPERTY_DEFS.map((def) => [def.key, def]));
const CORNER_KEYS = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'];
const TEXT_WRITE_PROPS = new Set(PROPERTY_DEFS.filter((def) => def.textOnly).map((def) => def.key));
const CLONE_PROPS = new Set(['fills', 'strokes', 'dashPattern', 'effects']);
const READ_ERROR = Symbol('read-error');

let selectedProps = [];
let tracking = false;
let masterId = null;
let masterFp = null;
let linkedTargetIds = [];
let debounceTimer = null;
let pendingTrackedChange = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function messageOf(error) {
  return error && error.message ? error.message : String(error);
}

function notify(text, isError = false) {
  figma.notify(text, { error: isError });
}

function postResult(text, tone = 'ok') {
  figma.ui.postMessage({ type: 'result', text, tone });
}

function safeRead(node, key) {
  try {
    return node[key];
  } catch (error) {
    return READ_ERROR;
  }
}

function supportsProperty(node, key) {
  const def = PROPERTY_MAP[key];
  if (!node || !def) return false;
  if (def.textOnly && node.type !== 'TEXT') return false;
  if (!(key in node)) return false;
  if ((key === 'width' || key === 'height') &&
      typeof node.resize !== 'function' && typeof node.resizeWithoutConstraints !== 'function') return false;
  const value = safeRead(node, key);
  if (value === READ_ERROR || value === undefined) return false;
  if (value === figma.mixed && key !== 'cornerRadius') return false;
  return true;
}

function valueForFingerprint(node, key) {
  const value = safeRead(node, key);
  if (key === 'cornerRadius' && value === figma.mixed) {
    return CORNER_KEYS.map((corner) => safeRead(node, corner));
  }
  if (value === figma.mixed) return '__mixed__';
  return value;
}

function fingerprint(node, props = selectedProps) {
  return props.map((key) => `${key}:${JSON.stringify(valueForFingerprint(node, key))}`).join('|');
}

function isValidForSelectedProps(node) {
  return selectedProps.length > 0 && selectedProps.every((key) => supportsProperty(node, key));
}

function clearMaster() {
  masterId = null;
  masterFp = null;
  linkedTargetIds = [];
}

function rebuildMaster() {
  clearMaster();
  const selection = figma.currentPage.selection;
  const master = selection.length === 1 ? selection[0] : null;
  if (tracking && master && isValidForSelectedProps(master)) {
    masterId = master.id;
    masterFp = fingerprint(master);
    linkedTargetIds = figma.currentPage.findAll((node) => (
      node.id !== master.id &&
      isValidForSelectedProps(node) &&
      fingerprint(node) === masterFp
    )).map((node) => node.id);
  }
  pushState();
}

function unavailableReason(master) {
  if (!tracking) return null;
  if (selectedProps.length === 0) return '请至少选择一个属性';
  if (!master) return null;
  const unavailable = selectedProps.filter((key) => !supportsProperty(master, key));
  if (!unavailable.length) return null;
  return `当前对象不支持：${unavailable.map((key) => PROPERTY_MAP[key].label).join('、')}`;
}

function pushState() {
  const selection = figma.currentPage.selection;
  const master = selection.length === 1 ? selection[0] : null;
  figma.ui.postMessage({
    type: 'state',
    tracking,
    selectedProps,
    selectionCount: selection.length,
    masterType: master ? master.type : null,
    masterName: master ? master.name : null,
    masterOk: masterId != null,
    linkedCount: linkedTargetIds.length,
    reason: unavailableReason(master),
    properties: PROPERTY_DEFS.map((def) => ({
      key: def.key,
      label: def.label,
      group: def.group,
      available: master ? supportsProperty(master, def.key) : true,
    })),
  });
}

async function loadFontsForNode(node) {
  if (!node || node.type !== 'TEXT') return;
  let fonts = [];
  try {
    if (node.characters.length > 0 && typeof node.getRangeAllFontNames === 'function') {
      fonts = node.getRangeAllFontNames(0, node.characters.length);
    } else if (node.fontName !== figma.mixed) {
      fonts = [node.fontName];
    }
  } catch (error) {
    throw new Error(`无法读取文本 ${node.id} 的字体`);
  }
  const seen = new Set();
  for (const font of fonts) {
    if (!font || !font.family || !font.style) continue;
    const key = `${font.family}\u0000${font.style}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await figma.loadFontAsync(font);
  }
}

async function applySelectedProperties(target, master) {
  if (selectedProps.some((key) => TEXT_WRITE_PROPS.has(key))) {
    await loadFontsForNode(target);
    if (selectedProps.includes('fontName')) await loadFontsForNode(master);
  }

  for (const key of selectedProps) {
    if (key === 'width' || key === 'height') continue;
    if (key === 'cornerRadius' && master.cornerRadius === figma.mixed) {
      for (const corner of CORNER_KEYS) target[corner] = master[corner];
      continue;
    }
    const value = master[key];
    target[key] = CLONE_PROPS.has(key) ? clone(value) : value;
  }

  if (selectedProps.includes('width') || selectedProps.includes('height')) {
    const resize = typeof target.resizeWithoutConstraints === 'function'
      ? target.resizeWithoutConstraints.bind(target)
      : (typeof target.resize === 'function' ? target.resize.bind(target) : null);
    if (!resize) throw new Error(`节点 ${target.id} 不支持尺寸修改`);
    resize(
      selectedProps.includes('width') ? master.width : target.width,
      selectedProps.includes('height') ? master.height : target.height,
    );
  }
}

async function syncTargets(master, baselineFp) {
  const linked = new Set(linkedTargetIds);
  let synced = 0;
  let skipped = 0;
  for (const node of figma.currentPage.findAll()) {
    if (node.id === master.id || !isValidForSelectedProps(node)) continue;
    if (!linked.has(node.id) && fingerprint(node) !== baselineFp) continue;
    try {
      await applySelectedProperties(node, master);
      synced += 1;
    } catch (error) {
      skipped += 1;
      console.warn(`[SyncSameProps] 跳过节点 ${node.id}:`, error);
    }
  }

  let text = synced > 0 ? `${synced} 个匹配对象已同步` : '没有找到匹配对象';
  if (skipped > 0) text += ` · ${skipped} 个对象无法写入`;
  notify(text, synced === 0 && skipped > 0);
  postResult(text, synced > 0 ? 'ok' : (skipped > 0 ? 'error' : 'neutral'));
  pushState();
}

function changedSelectedProperty(change) {
  const changed = Array.isArray(change.properties) ? change.properties : [];
  if (changed.length === 0) return true;
  if (selectedProps.includes('cornerRadius') && changed.some((key) => CORNER_KEYS.includes(key))) return true;
  return selectedProps.some((key) => changed.includes(key));
}

figma.on('documentchange', (event) => {
  if (!tracking || !masterId) return;
  for (const change of event.documentChanges) {
    if (change.type === 'REMOVE' && change.node.id === masterId) {
      clearMaster();
      pushState();
      continue;
    }
    if (change.type !== 'PROPERTY_CHANGE' || change.node.id !== masterId) continue;
    if (!changedSelectedProperty(change)) continue;
    pendingTrackedChange = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processPendingChange, 180);
  }
});

async function processPendingChange() {
  debounceTimer = null;
  if (!tracking || !masterId || !pendingTrackedChange) return;
  pendingTrackedChange = false;
  const master = figma.getNodeById(masterId);
  if (!master) {
    clearMaster();
    pushState();
    return;
  }
  const baselineFp = masterFp;
  masterFp = fingerprint(master);
  await syncTargets(master, baselineFp).catch((error) => {
    console.error('[SyncSameProps] 同步失败:', error);
    notify(`同步失败：${messageOf(error)}`, true);
    postResult(`同步失败：${messageOf(error)}`, 'error');
  });
}

figma.on('selectionchange', rebuildMaster);

figma.ui.onmessage = (message) => {
  if (!message) return;
  if (message.type === 'set-properties') {
    const next = Array.isArray(message.properties) ? message.properties : [];
    selectedProps = PROPERTY_DEFS.map((def) => def.key).filter((key) => next.includes(key));
    rebuildMaster();
    return;
  }
  if (message.type === 'set-tracking') {
    tracking = Boolean(message.value);
    rebuildMaster();
    if (tracking && masterId) {
      postResult(`已开始跟踪 ${selectedProps.length} 个属性 · ${linkedTargetIds.length} 个匹配对象`, 'neutral');
    }
    return;
  }
  if (message.type === 'refresh') rebuildMaster();
};

pushState();
