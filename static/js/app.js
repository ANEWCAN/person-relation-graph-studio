(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const COLORS = {
    male: '#3B82F6',
    female: '#EF476F',
    unknown: '#94A3B8',
    edge: '#64748B',
    text: '#EAF2FD',
    muted: '#91A4BB',
    accent: '#60A5FA',
  };

  const AVATAR_COUNT_PER_GENDER = 50;
  const AVATAR_ASSET_VERSION = '1.3.0';

  const SAMPLE_GRAPH = {
    nodes: [
      { id: 'p001', name: '林澈', gender: 'male', avatar: '/static/avatars/male_03.svg', note: '澄川科技联合创始人，负责产品与战略。', tags: ['核心人物', '产品'] },
      { id: 'p002', name: '苏晴', gender: 'female', avatar: '/static/avatars/female_06.svg', note: '用户研究负责人。', tags: ['同事', '研究'] },
      { id: 'p003', name: '周屿', gender: 'male', avatar: '/static/avatars/male_11.svg', note: '技术负责人。', tags: ['同事', '技术'] },
      { id: 'p004', name: '许知夏', gender: 'female', avatar: '/static/avatars/female_12.svg', note: '品牌与市场负责人。', tags: ['同事', '市场'] },
      { id: 'p005', name: '陈墨', gender: 'male', avatar: '/static/avatars/male_18.svg', note: '早期投资人。', tags: ['投资人'] },
      { id: 'p006', name: '程安', gender: 'female', avatar: '/static/avatars/female_19.svg', note: '高校研究者，长期合作顾问。', tags: ['顾问', '学术'] },
      { id: 'p007', name: '贺闻', gender: 'male', avatar: '/static/avatars/male_23.svg', note: '林澈大学同学。', tags: ['朋友'] },
      { id: 'p008', name: '孟乔', gender: 'female', avatar: '/static/avatars/female_25.svg', note: '苏晴的项目搭档。', tags: ['同事'] },
      { id: 'p009', name: '唐越', gender: 'male', avatar: '/static/avatars/male_29.svg', note: '产业合作方负责人。', tags: ['合作伙伴'] },
      { id: 'p010', name: '叶宁', gender: 'female', avatar: '/static/avatars/female_30.svg', note: '独立设计师。', tags: ['设计', '朋友'] },
      { id: 'p011', name: '顾言', gender: 'male', avatar: '/static/avatars/male_07.svg', note: '媒体记者。', tags: ['媒体'] },
      { id: 'p012', name: '沈星遥', gender: 'female', avatar: '/static/avatars/female_02.svg', note: '公司法务负责人。', tags: ['同事', '法务'] },
    ],
    edges: [
      { id: 'r001', source: 'p001', target: 'p002', relation: '管理', directed: true, weight: 4, color: '#4C8DF6', lineStyle: 'solid', note: '' },
      { id: 'r002', source: 'p001', target: 'p003', relation: '联合创始人', directed: false, weight: 6, color: '#7C8CFF', lineStyle: 'solid', note: '' },
      { id: 'r003', source: 'p001', target: 'p004', relation: '管理', directed: true, weight: 4, color: '#4C8DF6', lineStyle: 'solid', note: '' },
      { id: 'r004', source: 'p005', target: 'p001', relation: '投资', directed: true, weight: 5, color: '#F59E0B', lineStyle: 'solid', note: '种子轮投资' },
      { id: 'r005', source: 'p006', target: 'p002', relation: '研究合作', directed: false, weight: 3, color: '#22C7A9', lineStyle: 'dashed', note: '' },
      { id: 'r006', source: 'p007', target: 'p001', relation: '大学同学', directed: false, weight: 2.5, color: '#8B9AAF', lineStyle: 'solid', note: '' },
      { id: 'r007', source: 'p002', target: 'p008', relation: '项目搭档', directed: false, weight: 3.5, color: '#A56BF5', lineStyle: 'solid', note: '' },
      { id: 'r008', source: 'p004', target: 'p009', relation: '商务合作', directed: false, weight: 3, color: '#14B8A6', lineStyle: 'dashed', note: '' },
      { id: 'r009', source: 'p010', target: 'p004', relation: '设计合作', directed: true, weight: 2.5, color: '#EC4899', lineStyle: 'dotted', note: '' },
      { id: 'r010', source: 'p011', target: 'p001', relation: '采访', directed: true, weight: 2, color: '#64748B', lineStyle: 'dashed', note: '' },
      { id: 'r011', source: 'p012', target: 'p001', relation: '汇报给', directed: true, weight: 3, color: '#4C8DF6', lineStyle: 'solid', note: '' },
      { id: 'r012', source: 'p003', target: 'p012', relation: '跨部门协作', directed: false, weight: 2, color: '#64748B', lineStyle: 'dashed', note: '' },
      { id: 'r013', source: 'p003', target: 'p009', relation: '技术对接', directed: false, weight: 3, color: '#38BDF8', lineStyle: 'solid', note: '' },
      { id: 'r014', source: 'p006', target: 'p003', relation: '技术顾问', directed: true, weight: 2.5, color: '#22C7A9', lineStyle: 'dashed', note: '' },
      { id: 'r015', source: 'p010', target: 'p007', relation: '朋友', directed: false, weight: 2, color: '#EF7194', lineStyle: 'solid', note: '' },
    ],
  };

  const runtime = {
    graph: { nodes: [], edges: [] },
    selectedType: null,
    selectedId: null,
    focusedNodeId: null,
    focusDepth: 1,
    interactionMode: 'select',
    linkSourceId: null,
    history: [],
    future: [],
    avatars: [],
    avatarFilter: 'current',
    autosaveTimer: null,
    lastLayout: 'force',
    filters: {
      relation: 'all',
      genders: new Set(['male', 'female', 'unknown']),
    },
    settings: {
      showNodeLabels: true,
      showEdgeLabels: true,
      physicsEnabled: true,
      autoArrange: true,
    },
  };

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix = 'id') {
    if (window.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function initials(name) {
    const chars = Array.from(String(name || '人').trim());
    return chars.slice(0, 2).join('') || '人';
  }

  function genderLabel(gender) {
    return gender === 'male' ? '男' : gender === 'female' ? '女' : '其他 / 未知';
  }

  function lineStyleLabel(style) {
    return style === 'dashed' ? '虚线' : style === 'dotted' ? '点线' : '实线';
  }

  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || ''));
  }

  function builtInAvatarUrl(gender, seed) {
    if (!['male', 'female'].includes(gender)) return '';
    const index = stringSeed(seed || gender) % AVATAR_COUNT_PER_GENDER + 1;
    return `/static/avatars/${gender}_${String(index).padStart(2, '0')}.svg?v=${AVATAR_ASSET_VERSION}`;
  }

  function assignMissingAvatars(nodes) {
    const used = { male: new Set(), female: new Set() };
    for (const node of nodes) {
      const match = String(node.avatar || '').match(/\/(male|female)_(\d{2})\.svg(?:\?|$)/);
      if (match) used[match[1]].add(Number(match[2]));
    }
    for (const node of nodes) {
      if (String(node.avatar || '').trim()) continue;
      const seed = node.name || node.id || 'avatar';
      if (!['male', 'female'].includes(node.gender)) {
        node.avatar = generatedAvatarFallback('unknown', seed);
        continue;
      }
      let index = stringSeed(seed) % AVATAR_COUNT_PER_GENDER + 1;
      for (let tries = 0; tries < AVATAR_COUNT_PER_GENDER; tries += 1) {
        if (!used[node.gender].has(index)) break;
        index = index % AVATAR_COUNT_PER_GENDER + 1;
      }
      node.avatar = `/static/avatars/${node.gender}_${String(index).padStart(2, '0')}.svg?v=${AVATAR_ASSET_VERSION}`;
      used[node.gender].add(index);
    }
    return nodes;
  }

  function sanitizeNode(node) {
    const gender = ['male', 'female', 'unknown'].includes(node.gender) ? node.gender : 'unknown';
    return {
      id: String(node.id || uid('n')),
      name: String(node.name || '未命名人物').trim().slice(0, 60) || '未命名人物',
      gender,
      avatar: String(node.avatar || ''),
      note: String(node.note || '').slice(0, 500),
      tags: Array.isArray(node.tags) ? node.tags.map(String).filter(Boolean).slice(0, 20) : [],
      x: Number.isFinite(node.x) ? node.x : undefined,
      y: Number.isFinite(node.y) ? node.y : undefined,
      vx: Number.isFinite(node.vx) ? node.vx : 0,
      vy: Number.isFinite(node.vy) ? node.vy : 0,
      fixed: Boolean(node.fixed),
    };
  }

  function sanitizeEdge(edge, nodeIds) {
    if (!nodeIds.has(String(edge.source)) || !nodeIds.has(String(edge.target))) return null;
    return {
      id: String(edge.id || uid('e')),
      source: String(edge.source),
      target: String(edge.target),
      relation: String(edge.relation || '关系').trim().slice(0, 60) || '关系',
      directed: Boolean(edge.directed),
      weight: Math.max(0.5, Math.min(20, Number(edge.weight) || 2)),
      color: isHexColor(edge.color) ? String(edge.color).toUpperCase() : COLORS.edge,
      lineStyle: ['solid', 'dashed', 'dotted'].includes(edge.lineStyle) ? edge.lineStyle : 'solid',
      note: String(edge.note || '').slice(0, 300),
    };
  }

  function sanitizeGraph(graph) {
    const nodes = [];
    const usedIds = new Set();
    const usedNames = new Set();
    for (const raw of graph?.nodes || []) {
      const node = sanitizeNode(raw);
      if (usedIds.has(node.id)) node.id = uid('n');
      if (usedNames.has(node.name)) node.name = `${node.name} (${nodes.length + 1})`;
      usedIds.add(node.id);
      usedNames.add(node.name);
      nodes.push(node);
    }
    assignMissingAvatars(nodes);
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = [];
    const usedEdgeIds = new Set();
    for (const raw of graph?.edges || []) {
      const edge = sanitizeEdge(raw, nodeIds);
      if (!edge) continue;
      if (usedEdgeIds.has(edge.id)) edge.id = uid('e');
      usedEdgeIds.add(edge.id);
      edges.push(edge);
    }
    return { nodes, edges };
  }

  function graphForStorage() {
    return {
      nodes: runtime.graph.nodes.map(({ id, name, gender, avatar, note, tags, x, y, fixed }) => ({ id, name, gender, avatar, note, tags, x, y, fixed })),
      edges: runtime.graph.edges.map(({ id, source, target, relation, directed, weight, color, lineStyle, note }) => ({ id, source, target, relation, directed, weight, color, lineStyle, note })),
    };
  }

  function showToast(title, message = '', type = 'success') {
    const region = $('#toastRegion');
    const item = document.createElement('div');
    item.className = `toast ${type === 'error' ? 'error' : ''}`;
    item.innerHTML = `<i></i><div><strong>${escapeHtml(title)}</strong>${message ? `<p>${escapeHtml(message)}</p>` : ''}</div>`;
    region.appendChild(item);
    window.setTimeout(() => item.remove(), 3600);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function scheduleAutosave() {
    const status = $('#autosaveStatus');
    status.classList.add('saving');
    status.innerHTML = '<span></span>正在保存';
    window.clearTimeout(runtime.autosaveTimer);
    runtime.autosaveTimer = window.setTimeout(() => {
      try {
        localStorage.setItem('personRelationshipGraphStudio', JSON.stringify(graphForStorage()));
        status.classList.remove('saving');
        status.innerHTML = '<span></span>已自动保存';
      } catch (error) {
        status.classList.remove('saving');
        status.innerHTML = '<span></span>保存受限';
      }
    }, 360);
  }

  function snapshot() {
    return deepClone(graphForStorage());
  }

  function pushHistory() {
    runtime.history.push(snapshot());
    if (runtime.history.length > 60) runtime.history.shift();
    runtime.future = [];
    updateHistoryButtons();
  }

  function restoreGraph(graph, toastMessage = '') {
    runtime.graph = sanitizeGraph(graph);
    runtime.selectedType = null;
    runtime.selectedId = null;
    runtime.focusedNodeId = null;
    syncAll({ runLayout: false, fit: false });
    graphView.setGraph(runtime.graph);
    graphView.fit(0.88);
    if (toastMessage) showToast(toastMessage);
  }

  function undo() {
    if (!runtime.history.length) return;
    runtime.future.push(snapshot());
    const previous = runtime.history.pop();
    restoreGraph(previous, '已撤销上一步操作');
    updateHistoryButtons();
  }

  function redo() {
    if (!runtime.future.length) return;
    runtime.history.push(snapshot());
    const next = runtime.future.pop();
    restoreGraph(next, '已恢复操作');
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('#undoBtn').disabled = runtime.history.length === 0;
    $('#redoBtn').disabled = runtime.future.length === 0;
    $('#undoBtn').style.opacity = runtime.history.length ? '1' : '.45';
    $('#redoBtn').style.opacity = runtime.future.length ? '1' : '.45';
  }

  class GraphView {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.graph = runtime.graph;
      this.nodeMap = new Map();
      this.imageMap = new Map();
      this.curveMap = new Map();
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      this.width = 1;
      this.height = 1;
      this.dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      this.needsDraw = true;
      this.dragNode = null;
      this.dragNodeWasFixed = false;
      this.panning = false;
      this.pointerStart = null;
      this.lastPointer = null;
      this.moved = false;
      this.physicsRunning = false;
      this.physicsStep = 0;
      this.onNodeSelect = null;
      this.onEdgeSelect = null;
      this.onBackground = null;
      this.onNodePinChange = null;
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(canvas.parentElement);
      this.bindEvents();
      this.resize();
      requestAnimationFrame(() => this.frame());
    }

    bindEvents() {
      this.canvas.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
      window.addEventListener('pointermove', (event) => this.handlePointerMove(event));
      window.addEventListener('pointerup', (event) => this.handlePointerUp(event));
      this.canvas.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false });
      this.canvas.addEventListener('dblclick', (event) => this.handleDoubleClick(event));
      this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.requestDraw();
    }

    setGraph(graph) {
      this.graph = graph;
      this.nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
      const count = graph.nodes.length;
      graph.nodes.forEach((node, index) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
          const angle = (index / Math.max(1, count)) * Math.PI * 2;
          const radius = 130 + Math.sqrt(count) * 16;
          node.x = Math.cos(angle) * radius + (Math.random() - 0.5) * 30;
          node.y = Math.sin(angle) * radius + (Math.random() - 0.5) * 30;
          node.vx = 0;
          node.vy = 0;
        }
      });
      this.prepareCurves();
      this.preloadImages();
      if (runtime.settings.physicsEnabled && runtime.lastLayout === 'force') this.startPhysics(600);
      this.requestDraw();
    }

    prepareCurves() {
      const groups = new Map();
      for (const edge of this.graph.edges) {
        const key = [edge.source, edge.target].sort().join('|');
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(edge);
      }
      this.curveMap.clear();
      for (const edges of groups.values()) {
        edges.forEach((edge, index) => {
          const centered = index - (edges.length - 1) / 2;
          this.curveMap.set(edge.id, centered * 28);
        });
      }
    }

    preloadImages() {
      const activeUrls = new Set();
      for (const node of this.graph.nodes) {
        if (!node.avatar) node.avatar = builtInAvatarUrl(node.gender, node.name || node.id) || generatedAvatarFallback(node.gender, node.name || node.id);
        const avatarUrl = node.avatar;
        activeUrls.add(avatarUrl);
        const cached = this.imageMap.get(avatarUrl);
        if (cached && (!cached.complete || cached.naturalWidth > 0)) continue;
        if (cached) this.imageMap.delete(avatarUrl);
        const image = new Image();
        let fallbackApplied = false;
        image.decoding = 'async';
        image.onload = () => this.requestDraw();
        image.onerror = () => {
          if (!fallbackApplied) {
            fallbackApplied = true;
            image.src = generatedAvatarFallback(node.gender, node.name || node.id || avatarUrl);
            return;
          }
          this.requestDraw();
        };
        this.imageMap.set(avatarUrl, image);
        image.src = avatarUrl;
      }
      for (const key of this.imageMap.keys()) {
        if (!activeUrls.has(key) && this.imageMap.size > 180) this.imageMap.delete(key);
      }
    }

    updateCursor(event = null) {
      if (runtime.interactionMode === 'link') {
        if (!event) { this.canvas.style.cursor = 'crosshair'; return; }
        const point = this.eventPoint(event);
        const node = this.hitNode(this.screenToWorld(point.x, point.y));
        this.canvas.style.cursor = node ? 'crosshair' : 'not-allowed';
        return;
      }
      if (runtime.interactionMode === 'focus') {
        if (!event) { this.canvas.style.cursor = 'zoom-in'; return; }
        const point = this.eventPoint(event);
        const world = this.screenToWorld(point.x, point.y);
        this.canvas.style.cursor = this.hitNode(world) ? 'zoom-in' : this.hitEdge(world) ? 'pointer' : 'grab';
        return;
      }
      if (!event) { this.canvas.style.cursor = 'grab'; return; }
      const point = this.eventPoint(event);
      const world = this.screenToWorld(point.x, point.y);
      this.canvas.style.cursor = this.hitNode(world) || this.hitEdge(world) ? 'pointer' : 'grab';
    }

    requestDraw() {
      this.needsDraw = true;
    }

    frame() {
      if (this.physicsRunning && runtime.settings.physicsEnabled) {
        const iterations = this.graph.nodes.length < 80 ? 2 : 1;
        let energy = 0;
        for (let i = 0; i < iterations; i += 1) energy = this.physicsTick();
        this.physicsStep += iterations;
        if (this.physicsStep > 700 || (this.physicsStep > 90 && energy < 0.035)) this.physicsRunning = false;
        this.needsDraw = true;
      }
      if (this.needsDraw) {
        this.draw();
        this.needsDraw = false;
      }
      requestAnimationFrame(() => this.frame());
    }

    startPhysics(maxSteps = 500) {
      if (!runtime.settings.physicsEnabled || !this.graph.nodes.length) return;
      this.physicsRunning = true;
      this.physicsStep = Math.max(0, 700 - maxSteps);
    }

    stopPhysics() {
      this.physicsRunning = false;
    }

    physicsTick() {
      const nodes = this.layoutTargetNodes();
      const nodeIds = new Set(nodes.map((node) => node.id));
      const n = nodes.length;
      if (!n) return 0;
      const maxPairs = 24000;
      let pairs = 0;
      for (let i = 0; i < n; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < n; j += 1) {
          pairs += 1;
          if (pairs > maxPairs && Math.random() > maxPairs / pairs) continue;
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 20) {
            dx += Math.random() * 8 - 4;
            dy += Math.random() * 8 - 4;
            dist2 = dx * dx + dy * dy + 1;
          }
          const dist = Math.sqrt(dist2);
          const force = Math.min(5.5, 9200 / dist2);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!a.fixed) { a.vx += fx; a.vy += fy; }
          if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
        }
      }
      for (const edge of this.visibleEdges()) {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
        const source = this.nodeMap.get(edge.source);
        const target = this.nodeMap.get(edge.target);
        if (!source || !target) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const ideal = 150 - Math.min(42, edge.weight * 3);
        const force = (dist - ideal) * (0.0035 + edge.weight * 0.00035);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (!source.fixed) { source.vx += fx; source.vy += fy; }
        if (!target.fixed) { target.vx -= fx; target.vy -= fy; }
      }
      let energy = 0;
      for (const node of nodes) {
        if (node.fixed) { node.vx = 0; node.vy = 0; continue; }
        node.vx += -node.x * 0.0013;
        node.vy += -node.y * 0.0013;
        node.vx *= 0.84;
        node.vy *= 0.84;
        const speed = Math.hypot(node.vx, node.vy);
        if (speed > 8) { node.vx = node.vx / speed * 8; node.vy = node.vy / speed * 8; }
        node.x += node.vx;
        node.y += node.vy;
        energy += node.vx * node.vx + node.vy * node.vy;
      }
      return energy / Math.max(1, n);
    }

    visibleNodes() {
      return this.graph.nodes.filter((node) => runtime.filters.genders.has(node.gender));
    }

    layoutTargetNodes() {
      const visible = this.visibleNodes();
      if (!runtime.focusedNodeId) return visible;
      const focusSet = this.neighborhood(runtime.focusedNodeId, runtime.focusDepth);
      return visible.filter((node) => focusSet.has(node.id));
    }

    edgesForNodes(nodes) {
      const ids = new Set(nodes.map((node) => node.id));
      return this.visibleEdges().filter((edge) => ids.has(edge.source) && ids.has(edge.target));
    }

    visibleEdges() {
      const visibleIds = new Set(this.visibleNodes().map((node) => node.id));
      return this.graph.edges.filter((edge) =>
        visibleIds.has(edge.source) && visibleIds.has(edge.target) &&
        (runtime.filters.relation === 'all' || edge.relation === runtime.filters.relation));
    }

    neighborhood(nodeId, depth = 1) {
      const visibleIds = new Set(this.visibleNodes().map((node) => node.id));
      const result = new Set([nodeId]);
      let frontier = new Set([nodeId]);
      for (let level = 0; level < depth; level += 1) {
        const next = new Set();
        for (const edge of this.visibleEdges()) {
          if (frontier.has(edge.source) && visibleIds.has(edge.target)) next.add(edge.target);
          if (frontier.has(edge.target) && visibleIds.has(edge.source)) next.add(edge.source);
        }
        for (const id of next) result.add(id);
        frontier = next;
      }
      return result;
    }

    nodeRadius(node) {
      const degree = this.graph.edges.reduce((sum, edge) => sum + (edge.source === node.id || edge.target === node.id ? 1 : 0), 0);
      return 31 + Math.min(7, degree) * 0.8;
    }

    draw() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.width, this.height);
      this.drawBackground(ctx, this.width, this.height);
      ctx.save();
      ctx.translate(this.offsetX, this.offsetY);
      ctx.scale(this.scale, this.scale);
      this.drawScene(ctx, { exportMode: false, scale: this.scale });
      ctx.restore();
    }

    drawBackground(ctx, width, height, light = false) {
      ctx.save();
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.45, Math.max(width, height) * 0.75);
      if (light) {
        gradient.addColorStop(0, '#F8FBFF');
        gradient.addColorStop(1, '#EDF3FA');
      } else {
        gradient.addColorStop(0, '#132A45');
        gradient.addColorStop(0.55, '#0A192C');
        gradient.addColorStop(1, '#06101D');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = light ? 'rgba(88,112,140,.16)' : 'rgba(126,165,205,.10)';
      const spacing = 32;
      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    drawScene(ctx, options = {}) {
      const focusSet = runtime.focusedNodeId ? this.neighborhood(runtime.focusedNodeId, runtime.focusDepth) : null;
      const edges = this.visibleEdges();
      for (const edge of edges) this.drawEdge(ctx, edge, focusSet, options);
      const nodes = this.visibleNodes();
      for (const node of nodes) this.drawNode(ctx, node, focusSet, options);
    }

    edgeGeometry(edge) {
      const source = this.nodeMap.get(edge.source);
      const target = this.nodeMap.get(edge.target);
      if (!source || !target) return null;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const offset = this.curveMap.get(edge.id) || 0;
      const mx = (source.x + target.x) / 2;
      const my = (source.y + target.y) / 2;
      const cx = mx - (dy / dist) * offset;
      const cy = my + (dx / dist) * offset;
      return { source, target, cx, cy };
    }

    quadraticPoint(geometry, t) {
      const mt = 1 - t;
      return {
        x: mt * mt * geometry.source.x + 2 * mt * t * geometry.cx + t * t * geometry.target.x,
        y: mt * mt * geometry.source.y + 2 * mt * t * geometry.cy + t * t * geometry.target.y,
      };
    }

    quadraticTangent(geometry, t) {
      return {
        x: 2 * (1 - t) * (geometry.cx - geometry.source.x) + 2 * t * (geometry.target.x - geometry.cx),
        y: 2 * (1 - t) * (geometry.cy - geometry.source.y) + 2 * t * (geometry.target.y - geometry.cy),
      };
    }

    drawEdge(ctx, edge, focusSet, options) {
      const geometry = this.edgeGeometry(edge);
      if (!geometry) return;
      const isSelected = runtime.selectedType === 'edge' && runtime.selectedId === edge.id;
      const inFocus = !focusSet || (focusSet.has(edge.source) && focusSet.has(edge.target));
      let alpha = inFocus ? 0.84 : 0.07;
      if (runtime.focusedNodeId && (edge.source === runtime.focusedNodeId || edge.target === runtime.focusedNodeId)) alpha = 1;
      if (isSelected) alpha = 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = edge.color || COLORS.edge;
      ctx.lineWidth = (1.1 + edge.weight * 0.55) / Math.max(0.75, options.exportMode ? 1 : this.scale * 0.22 + 0.78);
      if (isSelected) {
        ctx.shadowColor = edge.color || COLORS.accent;
        ctx.shadowBlur = 16 / Math.max(0.6, this.scale);
        ctx.lineWidth += 1.6;
      }
      if (edge.lineStyle === 'dashed') ctx.setLineDash([12, 8]);
      if (edge.lineStyle === 'dotted') ctx.setLineDash([2.5, 7]);
      ctx.beginPath();
      ctx.moveTo(geometry.source.x, geometry.source.y);
      ctx.quadraticCurveTo(geometry.cx, geometry.cy, geometry.target.x, geometry.target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      if (edge.directed) {
        const p = this.quadraticPoint(geometry, 0.86);
        const tangent = this.quadraticTangent(geometry, 0.86);
        const angle = Math.atan2(tangent.y, tangent.x);
        const size = 9 + Math.min(6, edge.weight * 0.6);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.fillStyle = edge.color || COLORS.edge;
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.7, size * 0.62);
        ctx.lineTo(-size * 0.52, 0);
        ctx.lineTo(-size * 0.7, -size * 0.62);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (runtime.settings.showEdgeLabels && (inFocus || !focusSet)) {
        const p = this.quadraticPoint(geometry, 0.5);
        const fontSize = 10.5;
        ctx.font = `500 ${fontSize}px Inter, "PingFang SC", sans-serif`;
        const text = edge.relation;
        const width = ctx.measureText(text).width + 14;
        const height = 19;
        ctx.fillStyle = options.light ? 'rgba(255,255,255,.93)' : 'rgba(8,19,33,.88)';
        this.roundRect(ctx, p.x - width / 2, p.y - height / 2, width, height, 7);
        ctx.fill();
        ctx.strokeStyle = edge.color || COLORS.edge;
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = alpha * 0.9;
        ctx.stroke();
        ctx.fillStyle = options.light ? '#334155' : '#DDEBFA';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = alpha;
        ctx.fillText(text, p.x, p.y + 0.3);
      }
      ctx.restore();
    }

    drawNode(ctx, node, focusSet, options) {
      const radius = this.nodeRadius(node);
      const inFocus = !focusSet || focusSet.has(node.id);
      const isCenter = runtime.focusedNodeId === node.id;
      const isSelected = runtime.selectedType === 'node' && runtime.selectedId === node.id;
      const isLinkSource = runtime.interactionMode === 'link' && runtime.linkSourceId === node.id;
      const alpha = inFocus ? 1 : 0.11;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (isSelected || isCenter || isLinkSource) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + (isCenter ? 10 : isLinkSource ? 11 : 7), 0, Math.PI * 2);
        ctx.strokeStyle = isLinkSource ? '#34D399' : isCenter ? COLORS.accent : 'rgba(255,255,255,.75)';
        ctx.lineWidth = isLinkSource ? 3.5 : isCenter ? 3 : 2;
        if (isLinkSource) ctx.setLineDash([7, 5]);
        ctx.shadowColor = isLinkSource ? '#34D399' : isCenter ? COLORS.accent : 'rgba(255,255,255,.5)';
        ctx.shadowBlur = isCenter || isLinkSource ? 22 : 12;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = options.light ? '#E8EFF8' : '#182E49';
      ctx.fill();

      const image = node.avatar ? this.imageMap.get(node.avatar) : null;
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius - 4, 0, Math.PI * 2);
      ctx.clip();
      if (image?.complete && image.naturalWidth) {
        const size = Math.min(image.naturalWidth, image.naturalHeight);
        const sx = (image.naturalWidth - size) / 2;
        const sy = (image.naturalHeight - size) / 2;
        ctx.drawImage(image, sx, sy, size, size, node.x - radius + 4, node.y - radius + 4, (radius - 4) * 2, (radius - 4) * 2);
      } else {
        const gradient = ctx.createLinearGradient(node.x - radius, node.y - radius, node.x + radius, node.y + radius);
        gradient.addColorStop(0, node.gender === 'female' ? '#7C3358' : node.gender === 'male' ? '#234C8C' : '#445568');
        gradient.addColorStop(1, options.light ? '#CBD8E8' : '#15243A');
        ctx.fillStyle = gradient;
        ctx.fillRect(node.x - radius, node.y - radius, radius * 2, radius * 2);
        ctx.fillStyle = '#F2F7FF';
        ctx.font = `700 ${Math.max(15, radius * 0.62)}px Inter, "PingFang SC", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials(node.name), node.x, node.y + 1);
      }
      ctx.restore();

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS[node.gender] || COLORS.unknown;
      ctx.lineWidth = isCenter ? 5 : 4;
      ctx.stroke();

      if (node.fixed) {
        ctx.fillStyle = options.light ? '#334155' : '#081524';
        ctx.beginPath();
        ctx.arc(node.x + radius * 0.72, node.y - radius * 0.72, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(node.x + radius * 0.72 - 3.4, node.y - radius * 0.72 - 1.8, 6.8, 6);
        ctx.beginPath();
        ctx.arc(node.x + radius * 0.72, node.y - radius * 0.72 - 2.2, 3, Math.PI, 0);
        ctx.stroke();
      }

      if (runtime.settings.showNodeLabels) {
        ctx.font = `600 12px Inter, "PingFang SC", sans-serif`;
        const labelWidth = Math.min(118, ctx.measureText(node.name).width + 16);
        const y = node.y + radius + 17;
        ctx.fillStyle = options.light ? 'rgba(255,255,255,.93)' : 'rgba(7,17,30,.86)';
        this.roundRect(ctx, node.x - labelWidth / 2, y - 10, labelWidth, 20, 8);
        ctx.fill();
        ctx.fillStyle = options.light ? '#1E293B' : '#E8F2FD';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.ellipsis(ctx, node.name, labelWidth - 12), node.x, y + 0.5);
      }
      ctx.restore();
    }

    ellipsis(ctx, text, maxWidth) {
      if (ctx.measureText(text).width <= maxWidth) return text;
      let output = text;
      while (output.length > 1 && ctx.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
      return `${output}…`;
    }

    roundRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
    }

    screenToWorld(screenX, screenY) {
      return { x: (screenX - this.offsetX) / this.scale, y: (screenY - this.offsetY) / this.scale };
    }

    eventPoint(event) {
      const rect = this.canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    hitNode(worldPoint) {
      const nodes = this.visibleNodes();
      for (let i = nodes.length - 1; i >= 0; i -= 1) {
        const node = nodes[i];
        if (Math.hypot(worldPoint.x - node.x, worldPoint.y - node.y) <= this.nodeRadius(node) + 4 / this.scale) return node;
      }
      return null;
    }

    hitEdge(worldPoint) {
      let best = null;
      let bestDistance = 10 / this.scale;
      for (const edge of this.visibleEdges()) {
        const geometry = this.edgeGeometry(edge);
        if (!geometry) continue;
        for (let i = 0; i <= 24; i += 1) {
          const p = this.quadraticPoint(geometry, i / 24);
          const distance = Math.hypot(worldPoint.x - p.x, worldPoint.y - p.y);
          if (distance < bestDistance) { bestDistance = distance; best = edge; }
        }
      }
      return best;
    }

    handlePointerDown(event) {
      if (event.button !== 0) return;
      const point = this.eventPoint(event);
      const world = this.screenToWorld(point.x, point.y);
      const node = this.hitNode(world);

      if (node && runtime.interactionMode === 'link') {
        if (this.onNodeSelect) this.onNodeSelect(node.id);
        this.requestDraw();
        return;
      }
      if (node && runtime.interactionMode === 'focus') {
        if (this.onNodeSelect) this.onNodeSelect(node.id);
        this.requestDraw();
        return;
      }

      this.pointerStart = point;
      this.lastPointer = point;
      this.moved = false;
      if (node) {
        this.dragNode = node;
        this.dragNodeWasFixed = node.fixed;
        this.canvas.setPointerCapture?.(event.pointerId);
        if (this.onNodeSelect) this.onNodeSelect(node.id);
      } else {
        const edge = this.hitEdge(world);
        if (edge) {
          if (this.onEdgeSelect) this.onEdgeSelect(edge.id);
        } else {
          this.panning = true;
          if (this.onBackground) this.onBackground();
        }
      }
      this.canvas.parentElement.classList.add('dragging');
      this.requestDraw();
    }

    handlePointerMove(event) {
      if (!this.pointerStart) {
        this.updateCursor(event);
        return;
      }
      const point = this.eventPoint(event);
      const dx = point.x - this.lastPointer.x;
      const dy = point.y - this.lastPointer.y;
      if (Math.hypot(point.x - this.pointerStart.x, point.y - this.pointerStart.y) > 3) this.moved = true;
      if (this.dragNode) {
        const world = this.screenToWorld(point.x, point.y);
        this.dragNode.x = world.x;
        this.dragNode.y = world.y;
        this.dragNode.vx = 0;
        this.dragNode.vy = 0;
        this.dragNode.fixed = true;
      } else if (this.panning) {
        this.offsetX += dx;
        this.offsetY += dy;
      }
      this.lastPointer = point;
      this.requestDraw();
    }

    handlePointerUp(event) {
      if (!this.pointerStart) return;
      if (this.dragNode && this.moved) {
        this.dragNode.fixed = true;
        scheduleAutosave();
        if (this.onNodePinChange) this.onNodePinChange(this.dragNode.id, true);
      } else if (this.dragNode && !this.moved) {
        this.dragNode.fixed = this.dragNodeWasFixed;
      }
      this.dragNode = null;
      this.panning = false;
      this.pointerStart = null;
      this.lastPointer = null;
      this.canvas.parentElement.classList.remove('dragging');
      try { this.canvas.releasePointerCapture?.(event.pointerId); } catch (_) { /* no-op */ }
      this.updateCursor(event);
      this.requestDraw();
    }

    handleDoubleClick(event) {
      const point = this.eventPoint(event);
      const node = this.hitNode(this.screenToWorld(point.x, point.y));
      if (!node) return;
      node.fixed = !node.fixed;
      node.vx = 0;
      node.vy = 0;
      if (!node.fixed) this.startPhysics(300);
      scheduleAutosave();
      if (this.onNodePinChange) this.onNodePinChange(node.id, node.fixed);
      this.requestDraw();
    }

    handleWheel(event) {
      event.preventDefault();
      const point = this.eventPoint(event);
      const before = this.screenToWorld(point.x, point.y);
      const factor = Math.exp(-event.deltaY * 0.0012);
      this.scale = Math.max(0.18, Math.min(4.5, this.scale * factor));
      this.offsetX = point.x - before.x * this.scale;
      this.offsetY = point.y - before.y * this.scale;
      this.requestDraw();
    }

    zoom(factor, center = { x: this.width / 2, y: this.height / 2 }) {
      const before = this.screenToWorld(center.x, center.y);
      this.scale = Math.max(0.18, Math.min(4.5, this.scale * factor));
      this.offsetX = center.x - before.x * this.scale;
      this.offsetY = center.y - before.y * this.scale;
      this.requestDraw();
    }

    center() {
      this.offsetX = this.width / 2;
      this.offsetY = this.height / 2;
      this.requestDraw();
    }

    bounds(nodes = this.visibleNodes()) {
      if (!nodes.length) return { minX: -100, minY: -100, maxX: 100, maxY: 100, width: 200, height: 200 };
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const node of nodes) {
        const r = this.nodeRadius(node) + 32;
        minX = Math.min(minX, node.x - r);
        minY = Math.min(minY, node.y - r);
        maxX = Math.max(maxX, node.x + r);
        maxY = Math.max(maxY, node.y + r);
      }
      return { minX, minY, maxX, maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
    }

    fit(paddingRatio = 0.84, nodes = this.visibleNodes()) {
      if (!nodes.length) return;
      const b = this.bounds(nodes);
      const scale = Math.min((this.width * paddingRatio) / b.width, (this.height * paddingRatio) / b.height);
      this.scale = Math.max(0.18, Math.min(2.8, scale));
      this.offsetX = this.width / 2 - ((b.minX + b.maxX) / 2) * this.scale;
      this.offsetY = this.height / 2 - ((b.minY + b.maxY) / 2) * this.scale;
      this.requestDraw();
    }

    focusNode(nodeId, depth = 1) {
      const node = this.nodeMap.get(nodeId);
      if (!node) return;
      const neighborhood = Array.from(this.neighborhood(nodeId, depth)).map((id) => this.nodeMap.get(id)).filter(Boolean);
      this.fit(0.68, neighborhood);
      this.requestDraw();
    }

    autoArrange({ releaseFixed = true, fit = true } = {}) {
      const nodes = this.layoutTargetNodes();
      if (!nodes.length) return;
      if (releaseFixed) nodes.forEach((node) => { node.fixed = false; });
      this.applyLayout('force', { fit });
    }

    applyLayout(name, { fit = true } = {}) {
      const nodes = this.layoutTargetNodes();
      if (!nodes.length) return;
      runtime.lastLayout = name;
      this.stopPhysics();
      const width = Math.max(500, this.width / Math.max(0.55, this.scale));
      const height = Math.max(420, this.height / Math.max(0.55, this.scale));
      if (name === 'force') {
        nodes.forEach((node, index) => {
          if (!node.fixed) {
            const angle = index / nodes.length * Math.PI * 2;
            node.x = Math.cos(angle) * Math.min(width, height) * 0.23 + (Math.random() - 0.5) * 50;
            node.y = Math.sin(angle) * Math.min(width, height) * 0.23 + (Math.random() - 0.5) * 50;
            node.vx = 0; node.vy = 0;
          }
        });
        if (runtime.settings.physicsEnabled) this.startPhysics(700);
      } else if (name === 'circle') {
        const radius = Math.max(170, Math.min(width, height) * 0.34);
        nodes.forEach((node, index) => {
          const angle = index / nodes.length * Math.PI * 2 - Math.PI / 2;
          node.x = Math.cos(angle) * radius;
          node.y = Math.sin(angle) * radius;
          node.vx = node.vy = 0;
        });
      } else if (name === 'grid') {
        const cols = Math.ceil(Math.sqrt(nodes.length * (width / height)));
        const rows = Math.ceil(nodes.length / cols);
        const gapX = Math.min(180, width * 0.72 / Math.max(1, cols - 1));
        const gapY = Math.min(150, height * 0.72 / Math.max(1, rows - 1));
        nodes.forEach((node, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          node.x = (col - (cols - 1) / 2) * gapX;
          node.y = (row - (rows - 1) / 2) * gapY;
          node.vx = node.vy = 0;
        });
      } else if (name === 'radial') {
        this.radialLayout(nodes);
      } else if (name === 'hierarchy') {
        this.hierarchyLayout(nodes);
      } else if (name === 'random') {
        nodes.forEach((node) => {
          node.x = (Math.random() - 0.5) * width * 0.68;
          node.y = (Math.random() - 0.5) * height * 0.68;
          node.vx = node.vy = 0;
        });
      }
      scheduleAutosave();
      if (fit) this.fit(0.82, nodes);
      this.requestDraw();
    }

    radialLayout(nodes) {
      const degree = new Map(nodes.map((node) => [node.id, 0]));
      const layoutEdges = this.edgesForNodes(nodes);
      for (const edge of layoutEdges) {
        degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
        degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
      }
      const centerId = runtime.focusedNodeId && degree.has(runtime.focusedNodeId)
        ? runtime.focusedNodeId
        : [...degree.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const center = this.nodeMap.get(centerId);
      if (!center) return;
      center.x = 0; center.y = 0;
      const levels = [];
      const visited = new Set([center.id]);
      let frontier = [center.id];
      while (frontier.length) {
        const next = [];
        for (const id of frontier) {
          for (const edge of layoutEdges) {
            const other = edge.source === id ? edge.target : edge.target === id ? edge.source : null;
            if (other && !visited.has(other)) { visited.add(other); next.push(other); }
          }
        }
        if (next.length) levels.push(next);
        frontier = next;
      }
      const disconnected = nodes.filter((node) => !visited.has(node.id)).map((node) => node.id);
      if (disconnected.length) levels.push(disconnected);
      levels.forEach((ids, levelIndex) => {
        const radius = 150 + levelIndex * 145;
        ids.forEach((id, index) => {
          const node = this.nodeMap.get(id);
          const angle = index / ids.length * Math.PI * 2 - Math.PI / 2;
          node.x = Math.cos(angle) * radius;
          node.y = Math.sin(angle) * radius;
        });
      });
      nodes.forEach((node) => { node.vx = node.vy = 0; });
    }

    hierarchyLayout(nodes) {
      const visibleEdges = this.edgesForNodes(nodes);
      const indegree = new Map(nodes.map((node) => [node.id, 0]));
      for (const edge of visibleEdges) if (edge.directed) indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
      let roots = nodes.filter((node) => (indegree.get(node.id) || 0) === 0);
      if (!roots.length) {
        const degree = new Map(nodes.map((node) => [node.id, 0]));
        visibleEdges.forEach((edge) => { degree.set(edge.source, degree.get(edge.source) + 1); degree.set(edge.target, degree.get(edge.target) + 1); });
        roots = [[...degree.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]].map((id) => this.nodeMap.get(id)).filter(Boolean);
      }
      const levels = [];
      const visited = new Set();
      let frontier = roots.map((node) => node.id);
      while (frontier.length) {
        levels.push(frontier);
        frontier.forEach((id) => visited.add(id));
        const next = [];
        for (const id of frontier) {
          for (const edge of visibleEdges) {
            let other = null;
            if (edge.directed && edge.source === id) other = edge.target;
            else if (!edge.directed) other = edge.source === id ? edge.target : edge.target === id ? edge.source : null;
            if (other && !visited.has(other) && !next.includes(other)) next.push(other);
          }
        }
        frontier = next;
      }
      const remaining = nodes.filter((node) => !visited.has(node.id)).map((node) => node.id);
      if (remaining.length) levels.push(remaining);
      const gapY = 155;
      levels.forEach((ids, level) => {
        const gapX = Math.min(190, Math.max(95, 950 / Math.max(1, ids.length)));
        ids.forEach((id, index) => {
          const node = this.nodeMap.get(id);
          node.x = (index - (ids.length - 1) / 2) * gapX;
          node.y = (level - (levels.length - 1) / 2) * gapY;
          node.vx = node.vy = 0;
        });
      });
    }

    lockAll(locked) {
      for (const node of this.graph.nodes) {
        node.fixed = locked;
        node.vx = node.vy = 0;
      }
      if (!locked && runtime.settings.physicsEnabled && runtime.lastLayout === 'force') this.startPhysics(350);
      scheduleAutosave();
      this.requestDraw();
    }

    async ensureImages() {
      const pending = [];
      for (const image of this.imageMap.values()) {
        if (image.complete) continue;
        pending.push(new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 1800);
        }));
      }
      await Promise.all(pending);
    }

    async exportImage(format = 'png', scaleFactor = 2, transparent = false) {
      await this.ensureImages();
      const nodes = this.visibleNodes();
      if (!nodes.length) throw new Error('当前没有可导出的人物节点。');
      const b = this.bounds(nodes);
      const ratio = Math.max(0.55, Math.min(2.4, b.width / b.height));
      const baseWidth = 1500;
      const width = Math.min(7200, Math.round(baseWidth * scaleFactor));
      const height = Math.min(7200, Math.max(900 * scaleFactor, Math.round(width / ratio)));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const light = format === 'jpeg' || !transparent;
      if (!transparent || format === 'jpeg') this.drawBackground(ctx, width, height, true);
      const fitScale = Math.min(width * 0.84 / b.width, height * 0.84 / b.height);
      ctx.save();
      ctx.translate(width / 2 - ((b.minX + b.maxX) / 2) * fitScale, height / 2 - ((b.minY + b.maxY) / 2) * fitScale);
      ctx.scale(fitScale, fitScale);
      this.drawScene(ctx, { exportMode: true, light });
      ctx.restore();
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片生成失败。')), format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
      });
    }
  }

  const graphView = new GraphView($('#graphCanvas'));

  function nodeById(id) {
    return runtime.graph.nodes.find((node) => node.id === id) || null;
  }

  function edgeById(id) {
    return runtime.graph.edges.find((edge) => edge.id === id) || null;
  }

  function nodeName(id) {
    return nodeById(id)?.name || id;
  }

  function connectedEdges(nodeId) {
    return runtime.graph.edges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
  }

  function focusNetwork(id, { fit = true } = {}) {
    const node = nodeById(id);
    if (!node) return;
    runtime.focusedNodeId = id;
    updateFocusBanner();
    if (fit) graphView.focusNode(id, runtime.focusDepth);
    graphView.requestDraw();
  }

  function beginEditNode(id, { switchTab = true } = {}) {
    const node = nodeById(id);
    if (!node) return;
    fillPersonForm(node);
    if (switchTab) tabTo('people');
  }

  function beginEditEdge(id, { switchTab = true } = {}) {
    const edge = edgeById(id);
    if (!edge) return;
    fillRelationForm(edge);
    if (switchTab) tabTo('relations');
  }

  function selectNode(id, options = {}) {
    const node = nodeById(id);
    if (!node) return;
    runtime.selectedType = 'node';
    runtime.selectedId = id;
    if (options.edit === true) beginEditNode(id, { switchTab: options.switchTab !== false });
    if (options.focus === true) focusNetwork(id, { fit: options.fit !== false });
    renderInspector();
    graphView.requestDraw();
  }

  function selectEdge(id, options = {}) {
    const edge = edgeById(id);
    if (!edge) return;
    runtime.selectedType = 'edge';
    runtime.selectedId = id;
    if (options.edit === true) beginEditEdge(id, { switchTab: options.switchTab !== false });
    renderInspector();
    graphView.requestDraw();
  }

  function clearSelection({ clearFocus = false, clearForms = false } = {}) {
    runtime.selectedType = null;
    runtime.selectedId = null;
    if (clearFocus) runtime.focusedNodeId = null;
    if (clearForms) {
      resetPersonForm();
      resetRelationForm();
    }
    renderInspector();
    updateFocusBanner();
    graphView.requestDraw();
  }

  function resetFocus() {
    runtime.focusedNodeId = null;
    updateFocusBanner();
    renderInspector();
    graphView.fit(0.84);
    graphView.requestDraw();
  }

  function relationDraftPayload(source, target) {
    const colorText = $('#relationColorText').value.trim();
    return {
      source,
      target,
      relation: $('#relationName').value.trim() || '关系',
      directed: $('#relationDirected').checked,
      weight: Number($('#relationWeight').value) || 3,
      color: (isHexColor(colorText) ? colorText : $('#relationColor').value).toUpperCase(),
      lineStyle: $('#relationLineStyle').value,
      note: $('#relationNote').value.trim(),
    };
  }

  function updateInteractionUi() {
    const buttons = {
      select: $('#selectModeBtn'),
      focus: $('#focusModeBtn'),
      link: $('#linkModeBtn'),
    };
    Object.entries(buttons).forEach(([mode, button]) => {
      if (!button) return;
      const active = runtime.interactionMode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const banner = $('#linkModeBanner');
    if (banner) {
      if (runtime.interactionMode !== 'link') {
        banner.classList.add('hidden');
      } else {
        const source = nodeById(runtime.linkSourceId);
        $('#linkModeText').textContent = source ? `起点：${source.name} · 请选择终点人物` : '请选择第一个人物作为起点';
        banner.classList.remove('hidden');
      }
    }
    graphView.updateCursor();
    graphView.requestDraw();
  }

  function setInteractionMode(mode) {
    if (!['select', 'focus', 'link'].includes(mode)) return;
    runtime.interactionMode = mode;
    if (mode !== 'link') {
      runtime.linkSourceId = null;
    } else {
      $('#relationId').value = '';
      $('#saveRelationBtn').textContent = '添加关系';
      $('#deleteRelationBtn').classList.add('hidden');
    }
    updateInteractionUi();
  }

  function handleLinkNodeSelection(id) {
    const node = nodeById(id);
    if (!node) return;
    if (!runtime.linkSourceId) {
      runtime.linkSourceId = id;
      $('#relationSource').value = id;
      selectNode(id);
      updateInteractionUi();
      showToast('已选择连线起点', `${node.name}，请再选择一个人物作为终点。`);
      return;
    }
    if (runtime.linkSourceId === id) {
      showToast('请选择另一个人物', '连线的起点与终点不能相同。', 'error');
      return;
    }
    const source = runtime.linkSourceId;
    $('#relationTarget').value = id;
    const payload = relationDraftPayload(source, id);
    pushHistory();
    const edge = sanitizeEdge({ id: uid('e'), ...payload }, new Set(runtime.graph.nodes.map((item) => item.id)));
    runtime.graph.edges.push(edge);
    runtime.linkSourceId = null;
    runtime.selectedType = 'edge';
    runtime.selectedId = edge.id;
    syncAll({ runLayout: runtime.settings.autoArrange, fit: false });
    selectEdge(edge.id);
    updateInteractionUi();
    showToast('关系连线已添加', `${nodeName(source)} — ${edge.relation} — ${nodeName(id)}`);
  }

  function handleCanvasNodeSelection(id) {
    if (runtime.interactionMode === 'link') {
      handleLinkNodeSelection(id);
      return;
    }
    selectNode(id, { focus: runtime.interactionMode === 'focus' });
  }

  graphView.onNodeSelect = handleCanvasNodeSelection;
  graphView.onEdgeSelect = (id) => {
    if (runtime.interactionMode === 'link') return;
    selectEdge(id);
  };
  graphView.onBackground = () => {
    if (runtime.interactionMode === 'link' && runtime.linkSourceId) {
      runtime.linkSourceId = null;
      updateInteractionUi();
      showToast('已取消当前连线起点');
      return;
    }
    clearSelection({ clearFocus: false });
  };
  graphView.onNodePinChange = (_, fixed) => showToast(fixed ? '节点已固定' : '节点已解除固定', fixed ? '双击可再次解除。' : '力导向布局可继续调整位置。');

  function tabTo(name) {
    $$('.tab-btn').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
    $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  }

  function defaultAvatarForGender(gender, seed = Math.floor(Math.random() * 1e9)) {
    if (!['male', 'female'].includes(gender)) return generatedAvatarFallback('unknown', seed);
    const offset = typeof seed === 'number' ? seed : stringSeed(seed);
    const available = runtime.avatars.filter((avatar) => avatar.gender === gender);
    if (available.length) return available[Math.abs(offset) % available.length].url;
    return builtInAvatarUrl(gender, seed);
  }

  function setAvatarPreview(src, gender, name = '') {
    const preview = $('#avatarPreview');
    const image = $('#avatarPreviewImg');
    preview.classList.remove('male', 'female', 'unknown', 'has-image');
    preview.classList.add(gender || 'unknown');
    $('#avatarInitials').textContent = initials(name || '新');
    if (src) {
      let fallbackApplied = false;
      image.onload = () => preview.classList.add('has-image');
      image.onerror = () => {
        if (!fallbackApplied && ['male', 'female'].includes(gender)) {
          fallbackApplied = true;
          const fallback = generatedAvatarFallback(gender, name || src);
          image.src = fallback;
          $('#personAvatar').value = fallback;
          return;
        }
        preview.classList.remove('has-image');
      };
      image.src = src;
      if (image.complete && image.naturalWidth) preview.classList.add('has-image');
    } else {
      image.removeAttribute('src');
    }
  }

  function resetPersonForm() {
    $('#personId').value = '';
    $('#personName').value = '';
    $('#personGender').value = 'male';
    $('#personTags').value = '';
    $('#personNote').value = '';
    const avatar = defaultAvatarForGender('male');
    $('#personAvatar').value = avatar;
    setAvatarPreview(avatar, 'male', '新');
    $('#savePersonBtn').textContent = '添加人物';
    $('#deletePersonBtn').classList.add('hidden');
  }

  function fillPersonForm(node) {
    $('#personId').value = node.id;
    $('#personName').value = node.name;
    $('#personGender').value = node.gender;
    $('#personTags').value = node.tags.join(', ');
    $('#personNote').value = node.note || '';
    $('#personAvatar').value = node.avatar || '';
    setAvatarPreview(node.avatar, node.gender, node.name);
    $('#savePersonBtn').textContent = '保存人物修改';
    $('#deletePersonBtn').classList.remove('hidden');
  }

  function resetRelationForm() {
    $('#relationId').value = '';
    $('#relationName').value = '';
    $('#relationColor').value = '#64748b';
    $('#relationColorText').value = '#64748B';
    $('#relationWeight').value = '3';
    $('#weightValue').textContent = '3';
    $('#relationDirected').checked = false;
    $('#relationLineStyle').value = 'solid';
    $('#relationNote').value = '';
    $('#saveRelationBtn').textContent = '添加关系';
    $('#deleteRelationBtn').classList.add('hidden');
    refreshPersonSelectors();
  }

  function fillRelationForm(edge) {
    refreshPersonSelectors();
    $('#relationId').value = edge.id;
    $('#relationSource').value = edge.source;
    $('#relationTarget').value = edge.target;
    $('#relationName').value = edge.relation;
    $('#relationColor').value = edge.color;
    $('#relationColorText').value = edge.color;
    $('#relationWeight').value = String(edge.weight);
    $('#weightValue').textContent = String(edge.weight);
    $('#relationDirected').checked = edge.directed;
    $('#relationLineStyle').value = edge.lineStyle;
    $('#relationNote').value = edge.note || '';
    $('#saveRelationBtn').textContent = '保存关系修改';
    $('#deleteRelationBtn').classList.remove('hidden');
  }

  function savePerson() {
    const id = $('#personId').value;
    const name = $('#personName').value.trim();
    if (!name) { showToast('人物名称不能为空', '请填写人物名称后再保存。', 'error'); $('#personName').focus(); return; }
    const duplicate = runtime.graph.nodes.find((node) => node.name === name && node.id !== id);
    if (duplicate) { showToast('人物名称已存在', '同一图谱中建议使用唯一名称。', 'error'); return; }
    const gender = $('#personGender').value;
    const tags = $('#personTags').value.split(/[,，;；|]/).map((value) => value.trim()).filter(Boolean);
    const avatar = $('#personAvatar').value || defaultAvatarForGender(gender, name);
    pushHistory();
    let savedId = id;
    if (id) {
      const node = nodeById(id);
      Object.assign(node, { name, gender, tags, avatar, note: $('#personNote').value.trim() });
      showToast('人物信息已更新', name);
    } else {
      const node = sanitizeNode({ id: uid('n'), name, gender, tags, avatar, note: $('#personNote').value.trim() });
      runtime.graph.nodes.push(node);
      savedId = node.id;
      showToast('人物已添加', name);
    }
    syncAll({ runLayout: runtime.settings.autoArrange, fit: false });
    selectNode(savedId);
    beginEditNode(savedId, { switchTab: false });
  }

  function deletePerson(id = $('#personId').value) {
    const node = nodeById(id);
    if (!node) return;
    const relationCount = connectedEdges(id).length;
    const confirmed = window.confirm(`确定删除“${node.name}”吗？\n同时会删除与其关联的 ${relationCount} 条关系。`);
    if (!confirmed) return;
    pushHistory();
    runtime.graph.nodes = runtime.graph.nodes.filter((item) => item.id !== id);
    runtime.graph.edges = runtime.graph.edges.filter((edge) => edge.source !== id && edge.target !== id);
    clearSelection({ clearFocus: true, clearForms: true });
    syncAll({ runLayout: runtime.settings.autoArrange, fit: false });
    showToast('人物已删除', `${node.name} 及其 ${relationCount} 条关系已移除。`);
  }

  function saveRelation() {
    if (runtime.graph.nodes.length < 2) { showToast('至少需要两个人物', '请先添加人物，再创建关系。', 'error'); return; }
    const id = $('#relationId').value;
    const source = $('#relationSource').value;
    const target = $('#relationTarget').value;
    const relation = $('#relationName').value.trim();
    if (!source || !target) { showToast('请选择起点和终点人物', '', 'error'); return; }
    if (source === target) { showToast('起点与终点不能相同', '如需表示人物自身属性，请使用标签或备注。', 'error'); return; }
    if (!relation) { showToast('关系名称不能为空', '', 'error'); $('#relationName').focus(); return; }
    const payload = relationDraftPayload(source, target);
    payload.relation = relation;
    pushHistory();
    let savedId = id;
    if (id) {
      Object.assign(edgeById(id), payload);
      showToast('关系已更新', `${nodeName(source)} — ${relation} — ${nodeName(target)}`);
    } else {
      const edge = { id: uid('e'), ...payload };
      runtime.graph.edges.push(edge);
      savedId = edge.id;
      showToast('关系已添加', `${nodeName(source)} — ${relation} — ${nodeName(target)}`);
    }
    syncAll({ runLayout: runtime.settings.autoArrange, fit: false });
    selectEdge(savedId);
    beginEditEdge(savedId, { switchTab: false });
  }

  function deleteRelation(id = $('#relationId').value) {
    const edge = edgeById(id);
    if (!edge) return;
    if (!window.confirm(`确定删除“${nodeName(edge.source)} — ${edge.relation} — ${nodeName(edge.target)}”吗？`)) return;
    pushHistory();
    runtime.graph.edges = runtime.graph.edges.filter((item) => item.id !== id);
    clearSelection({ clearFocus: false });
    resetRelationForm();
    syncAll({ runLayout: runtime.settings.autoArrange, fit: false });
    showToast('关系已删除');
  }

  function refreshPersonSelectors() {
    const source = $('#relationSource');
    const target = $('#relationTarget');
    const currentSource = source.value;
    const currentTarget = target.value;
    const options = runtime.graph.nodes.map((node) => `<option value="${escapeHtml(node.id)}">${escapeHtml(node.name)} · ${genderLabel(node.gender)}</option>`).join('');
    source.innerHTML = `<option value="">请选择人物</option>${options}`;
    target.innerHTML = `<option value="">请选择人物</option>${options}`;
    if (runtime.graph.nodes.some((node) => node.id === currentSource)) source.value = currentSource;
    if (runtime.graph.nodes.some((node) => node.id === currentTarget)) target.value = currentTarget;
    if (!source.value && runtime.graph.nodes[0]) source.value = runtime.graph.nodes[0].id;
    if (!target.value && runtime.graph.nodes[1]) target.value = runtime.graph.nodes[1].id;
  }

  function refreshSearch() {
    $('#personSearchList').innerHTML = runtime.graph.nodes.map((node) => `<option value="${escapeHtml(node.name)}"></option>`).join('');
  }

  function refreshRelationFilter() {
    const select = $('#relationFilter');
    const current = runtime.filters.relation;
    const types = [...new Set(runtime.graph.edges.map((edge) => edge.relation))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    select.innerHTML = `<option value="all">全部关系</option>${types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}`;
    if (current === 'all' || types.includes(current)) select.value = current;
    else { select.value = 'all'; runtime.filters.relation = 'all'; }
  }

  function updateStats() {
    const n = runtime.graph.nodes.length;
    const m = runtime.graph.edges.length;
    const types = new Set(runtime.graph.edges.map((edge) => edge.relation)).size;
    const density = n > 1 ? Math.min(1, (2 * m) / (n * (n - 1))) : 0;
    $('#statNodes').textContent = n;
    $('#statEdges').textContent = m;
    $('#statTypes').textContent = types;
    $('#statDensity').textContent = `${(density * 100).toFixed(density < 0.1 ? 1 : 0)}%`;
    $('#emptyState').classList.toggle('hidden', n > 0);
    $('#canvasHint').classList.toggle('hidden', n === 0);
  }

  function updateFocusBanner() {
    const banner = $('#focusBanner');
    const node = nodeById(runtime.focusedNodeId);
    if (!node) { banner.classList.add('hidden'); return; }
    const neighborhood = graphView.neighborhood(node.id, runtime.focusDepth);
    $('#focusName').textContent = node.name;
    $('#focusSummary').textContent = `${runtime.focusDepth} 度网络 · ${Math.max(0, neighborhood.size - 1)} 位关联人物`;
    banner.classList.remove('hidden');
  }

  function renderInspector() {
    const placeholder = $('#inspectorPlaceholder');
    const content = $('#inspectorContent');
    const body = $('#inspectorBody');
    if (!runtime.selectedType || !runtime.selectedId) {
      placeholder.classList.remove('hidden');
      content.classList.add('hidden');
      body.innerHTML = '';
      return;
    }
    placeholder.classList.add('hidden');
    content.classList.remove('hidden');
    if (runtime.selectedType === 'node') renderNodeInspector(body);
    else renderEdgeInspector(body);
  }

  function renderNodeInspector(body) {
    const node = nodeById(runtime.selectedId);
    if (!node) return;
    $('#inspectorType').textContent = 'PERSON / 人物';
    const edges = connectedEdges(node.id);
    const neighbors = new Set(edges.map((edge) => edge.source === node.id ? edge.target : edge.source));
    const outgoing = edges.filter((edge) => edge.directed && edge.source === node.id).length;
    const incoming = edges.filter((edge) => edge.directed && edge.target === node.id).length;
    body.innerHTML = `
      <div class="inspector-profile">
        <div class="inspector-avatar ${escapeHtml(node.gender)}">${node.avatar ? `<img src="${escapeHtml(node.avatar)}" alt="${escapeHtml(node.name)}的头像">` : `<span>${escapeHtml(initials(node.name))}</span>`}</div>
        <h2>${escapeHtml(node.name)}</h2>
        <p>${escapeHtml(node.note || '暂无人物备注')}</p>
        <div class="tag-row">${node.tags.length ? node.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('') : '<span class="tag">暂无标签</span>'}</div>
      </div>
      <div class="inspector-metrics">
        <div class="mini-metric"><strong>${neighbors.size}</strong><span>关联人物</span></div>
        <div class="mini-metric"><strong>${outgoing}</strong><span>发出关系</span></div>
        <div class="mini-metric"><strong>${incoming}</strong><span>接收关系</span></div>
      </div>
      <div class="inspector-section">
        <h3>直接关系 · ${edges.length}</h3>
        <div class="relation-list">
          ${edges.length ? edges.map((edge) => {
            const otherId = edge.source === node.id ? edge.target : edge.source;
            const direction = !edge.directed ? '双向 / 无向' : edge.source === node.id ? '发出' : '接收';
            return `<button type="button" class="relation-item" data-inspector-edge="${escapeHtml(edge.id)}" style="--edge-color:${escapeHtml(edge.color)}"><i></i><span><strong>${escapeHtml(nodeName(otherId))}</strong><span>${escapeHtml(edge.relation)}</span></span><em>${direction}</em></button>`;
          }).join('') : '<div class="empty-small">该人物暂无关系</div>'}
        </div>
      </div>
      <div class="inspector-section">
        <h3>人物属性</h3>
        <div class="property-list">
          <div class="property-row"><span>性别</span><strong>${genderLabel(node.gender)}</strong></div>
          <div class="property-row"><span>人物 ID</span><strong>${escapeHtml(node.id)}</strong></div>
          <div class="property-row"><span>节点状态</span><strong>${node.fixed ? '已固定' : '自由布局'}</strong></div>
        </div>
      </div>
      <div class="inspector-actions">
        <button type="button" data-inspector-action="edit-node">编辑人物</button>
        <button type="button" data-inspector-action="focus-node">聚焦网络</button>
      </div>`;
    $$('[data-inspector-edge]', body).forEach((button) => button.addEventListener('click', () => selectEdge(button.dataset.inspectorEdge)));
    const inspectorImage = $('.inspector-avatar img', body);
    if (inspectorImage) inspectorImage.addEventListener('error', () => { inspectorImage.src = generatedAvatarFallback(node.gender, node.name || node.id); }, { once: true });
    $('[data-inspector-action="edit-node"]', body).addEventListener('click', () => beginEditNode(node.id));
    $('[data-inspector-action="focus-node"]', body).addEventListener('click', () => focusNetwork(node.id));
  }

  function renderEdgeInspector(body) {
    const edge = edgeById(runtime.selectedId);
    if (!edge) return;
    $('#inspectorType').textContent = 'RELATION / 关系';
    body.innerHTML = `
      <div class="edge-inspector" style="--edge-color:${escapeHtml(edge.color)}">
        <div class="edge-visual">
          <button type="button" class="edge-person" data-inspector-node="${escapeHtml(edge.source)}"><strong>${escapeHtml(nodeName(edge.source))}</strong></button>
          <div class="edge-arrow ${edge.directed ? 'directed' : ''}"><em>${escapeHtml(edge.relation)}</em><span></span></div>
          <button type="button" class="edge-person" data-inspector-node="${escapeHtml(edge.target)}"><strong>${escapeHtml(nodeName(edge.target))}</strong></button>
        </div>
        <div class="property-list">
          <div class="property-row"><span>关系名称</span><strong>${escapeHtml(edge.relation)}</strong></div>
          <div class="property-row"><span>方向</span><strong>${edge.directed ? '有向（带箭头）' : '无向（不带箭头）'}</strong></div>
          <div class="property-row"><span>权重 / 粗细</span><strong>${edge.weight}</strong></div>
          <div class="property-row"><span>颜色</span><strong><i class="color-swatch" style="background:${escapeHtml(edge.color)}"></i>${escapeHtml(edge.color)}</strong></div>
          <div class="property-row"><span>线型</span><strong>${lineStyleLabel(edge.lineStyle)}</strong></div>
          <div class="property-row"><span>备注</span><strong>${escapeHtml(edge.note || '暂无')}</strong></div>
          <div class="property-row"><span>关系 ID</span><strong>${escapeHtml(edge.id)}</strong></div>
        </div>
        <div class="inspector-actions">
          <button type="button" data-inspector-action="edit-edge">编辑关系</button>
          <button type="button" data-inspector-action="delete-edge">删除关系</button>
        </div>
      </div>`;
    $$('[data-inspector-node]', body).forEach((button) => button.addEventListener('click', () => selectNode(button.dataset.inspectorNode)));
    $('[data-inspector-action="edit-edge"]', body).addEventListener('click', () => beginEditEdge(edge.id));
    $('[data-inspector-action="delete-edge"]', body).addEventListener('click', () => deleteRelation(edge.id));
  }

  function syncAll({ runLayout = false, fit = false } = {}) {
    runtime.graph = sanitizeGraph(runtime.graph);
    graphView.setGraph(runtime.graph);
    refreshPersonSelectors();
    refreshSearch();
    refreshRelationFilter();
    updateStats();
    updateFocusBanner();
    renderInspector();
    updateHistoryButtons();
    scheduleAutosave();
    if (runLayout && runtime.settings.autoArrange) {
      window.setTimeout(() => graphView.autoArrange({ releaseFixed: false, fit }), 20);
    } else if (runLayout && runtime.settings.physicsEnabled && runtime.lastLayout === 'force') {
      graphView.startPhysics(380);
      if (fit) window.setTimeout(() => graphView.fit(0.84), 30);
    } else if (fit) {
      window.setTimeout(() => graphView.fit(0.84), 30);
    }
  }

  function mergeGraphs(current, incoming) {
    const result = deepClone(current);
    const byName = new Map(result.nodes.map((node) => [node.name, node.id]));
    const idMap = new Map();
    for (const rawNode of incoming.nodes) {
      const existingId = byName.get(rawNode.name);
      if (existingId) {
        idMap.set(rawNode.id, existingId);
        const existing = result.nodes.find((node) => node.id === existingId);
        if (!existing.avatar && rawNode.avatar) existing.avatar = rawNode.avatar;
        if (!existing.note && rawNode.note) existing.note = rawNode.note;
        if (existing.gender === 'unknown' && rawNode.gender !== 'unknown') {
          existing.gender = rawNode.gender;
          if (!rawNode.avatar || String(existing.avatar || '').startsWith('data:image/svg+xml')) existing.avatar = rawNode.avatar || '';
        }
        existing.tags = [...new Set([...(existing.tags || []), ...(rawNode.tags || [])])];
      } else {
        const node = sanitizeNode(rawNode);
        if (result.nodes.some((item) => item.id === node.id)) node.id = uid('n');
        result.nodes.push(node);
        byName.set(node.name, node.id);
        idMap.set(rawNode.id, node.id);
      }
    }
    for (const rawEdge of incoming.edges) {
      const edge = { ...rawEdge, source: idMap.get(rawEdge.source) || rawEdge.source, target: idMap.get(rawEdge.target) || rawEdge.target };
      if (result.edges.some((item) => item.id === edge.id)) edge.id = uid('e');
      const duplicate = result.edges.some((item) => item.source === edge.source && item.target === edge.target && item.relation === edge.relation && item.directed === edge.directed);
      if (!duplicate) result.edges.push(edge);
    }
    return sanitizeGraph(result);
  }

  function applyImportedGraph(incoming, label = '数据') {
    const mode = $('input[name="importMode"]:checked')?.value || 'replace';
    pushHistory();
    runtime.graph = mode === 'merge' ? mergeGraphs(runtime.graph, sanitizeGraph(incoming)) : sanitizeGraph(incoming);
    runtime.selectedType = null;
    runtime.selectedId = null;
    runtime.focusedNodeId = null;
    runtime.linkSourceId = null;
    setInteractionMode('select');
    syncAll({ runLayout: runtime.settings.autoArrange, fit: true });
    showToast(`${label}导入成功`, `共 ${runtime.graph.nodes.length} 个人物、${runtime.graph.edges.length} 条关系。`);
  }

  async function importFile(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '导入失败');
      applyImportedGraph(data.graph, '文件');
    } catch (error) {
      showToast('文件导入失败', error.message, 'error');
    } finally {
      $('#graphFileInput').value = '';
    }
  }

  async function importText() {
    const text = $('#textImportInput').value.trim();
    if (!text) { showToast('请输入 JSON 或 CSV 数据', '', 'error'); return; }
    try {
      const response = await fetch('/api/import-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: $('#textImportFormat').value, text }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || '解析失败');
      applyImportedGraph(data.graph, '在线数据');
    } catch (error) {
      showToast('在线数据解析失败', error.message, 'error');
    }
  }

  async function exportData() {
    const format = $('#dataExportFormat').value;
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: graphForStorage() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '导出失败');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/i);
      downloadBlob(blob, match?.[1] || `relationship_graph.${format}`);
      showToast('图数据已导出', format.toUpperCase());
    } catch (error) {
      showToast('数据导出失败', error.message, 'error');
    }
  }

  async function exportImage() {
    try {
      const format = $('#imageFormat').value;
      const scale = Number($('#imageScale').value);
      const transparent = $('#transparentImage').checked;
      const blob = await graphView.exportImage(format, scale, transparent);
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      downloadBlob(blob, `person_relationship_graph_${timestamp}.${format === 'jpeg' ? 'jpg' : 'png'}`);
      showToast('关系图图片已保存', `${format.toUpperCase()} · ${scale}× 清晰度`);
    } catch (error) {
      showToast('图片保存失败', error.message, 'error');
    }
  }

  function generateAvatarSvg(gender, seed = Math.floor(Math.random() * 1e9)) {
    const rng = mulberry32(seed);
    const skin = ['#F7D7C4', '#F2C6A0', '#E7B98A', '#D99A6C', '#C9825D', '#9F6548'][Math.floor(rng() * 6)];
    const hair = ['#171717', '#2B211C', '#493126', '#704B36', '#B47A4D'][Math.floor(rng() * 5)];
    const bg = ['#EAF4FF', '#F5F0FF', '#EDF8F4', '#FFF2F6', '#EEF2F7'][Math.floor(rng() * 5)];
    const shirt = ['#2563EB', '#7C3AED', '#0F766E', '#DB2777', '#475569'][Math.floor(rng() * 5)];
    const border = gender === 'female' ? COLORS.female : gender === 'male' ? COLORS.male : COLORS.unknown;
    const hairPath = gender === 'female'
      ? 'M58 102C58 45 84 24 128 24s70 25 70 83l-10 78h-31l-5-65H104l-5 65H68z'
      : 'M70 87c7-42 31-63 62-63 34 0 56 22 61 61-31-15-72-15-123 2z';
    const fringe = gender === 'female' ? '<path d="M77 78c19-34 49-45 78-28 11 6 20 15 27 27-34-12-65-6-86 14z" fill="HAIR"/>' : '<path d="M75 77c18-31 45-41 72-31 18 6 31 18 40 35-38-13-76-9-112-4z" fill="HAIR"/>';
    const eyeGap = 27 + Math.floor(rng() * 6);
    const smile = 7 + Math.floor(rng() * 5);
    const glasses = rng() > 0.72 ? `<circle cx="${128-eyeGap}" cy="111" r="15" fill="none" stroke="#334155" stroke-width="3"/><circle cx="${128+eyeGap}" cy="111" r="15" fill="none" stroke="#334155" stroke-width="3"/><path d="M${143-eyeGap} 111h${eyeGap*2-30}" stroke="#334155" stroke-width="3"/>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><circle cx="128" cy="128" r="123" fill="${bg}"/><path d="M39 254c8-51 38-78 89-78s81 27 89 78" fill="${shirt}"/><rect x="111" y="157" width="34" height="34" rx="14" fill="${skin}"/><path d="${hairPath}" fill="${hair}"/><ellipse cx="82" cy="127" rx="10" ry="16" fill="${skin}"/><ellipse cx="174" cy="127" rx="10" ry="16" fill="${skin}"/><rect x="82" y="63" width="92" height="109" rx="46" fill="${skin}"/>${fringe.replaceAll('HAIR', hair)}<path d="M${118-eyeGap} 94q10-7 20 0M${118+eyeGap} 94q10-7 20 0" fill="none" stroke="${hair}" stroke-width="5" stroke-linecap="round"/><circle cx="${128-eyeGap}" cy="111" r="4.5" fill="#253142"/><circle cx="${128+eyeGap}" cy="111" r="4.5" fill="#253142"/>${glasses}<path d="M128 119q-2 14 3 17" fill="none" stroke="#A66D58" stroke-width="3" stroke-linecap="round"/><path d="M110 148q18 ${smile} 36 0" fill="none" stroke="#A64B55" stroke-width="4" stroke-linecap="round"/><ellipse cx="97" cy="134" rx="10" ry="5" fill="#F08A8A" opacity=".18"/><ellipse cx="159" cy="134" rx="10" ry="5" fill="#F08A8A" opacity=".18"/><circle cx="128" cy="128" r="122" fill="none" stroke="${border}" stroke-width="8"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function mulberry32(seed) {
    return function random() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function stringSeed(value) {
    let hash = 2166136261;
    for (const char of String(value || 'avatar')) {
      hash ^= char.codePointAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function generatedAvatarFallback(gender, hint) {
    const genderSalt = gender === 'female' ? 0x6f2a91d3 : 0x13c4b72f;
    return generateAvatarSvg(gender, (stringSeed(hint) ^ genderSalt) >>> 0);
  }

  function normalizeAvatarCatalog(payload) {
    const source = Array.isArray(payload) ? payload : Array.isArray(payload?.avatars) ? payload.avatars : [];
    const catalog = new Map();
    for (const raw of source) {
      const gender = raw?.gender;
      const index = Number(raw?.index || String(raw?.id || '').match(/(\d+)$/)?.[1]);
      if (!['male', 'female'].includes(gender) || !Number.isInteger(index) || index < 1 || index > AVATAR_COUNT_PER_GENDER || !raw?.url) continue;
      catalog.set(`${gender}_${index}`, {
        id: `${gender}_${String(index).padStart(2, '0')}`,
        gender,
        index,
        url: String(raw.url),
        generated: false,
      });
    }
    const complete = [];
    for (const gender of ['male', 'female']) {
      for (let index = 1; index <= AVATAR_COUNT_PER_GENDER; index += 1) {
        const key = `${gender}_${index}`;
        complete.push(catalog.get(key) || {
          id: `${gender}_${String(index).padStart(2, '0')}`,
          gender,
          index,
          url: generatedAvatarFallback(gender, key),
          generated: true,
        });
      }
    }
    return complete;
  }

  function updateAvatarLibraryCounts() {
    const maleCount = runtime.avatars.filter((avatar) => avatar.gender === 'male').length;
    const femaleCount = runtime.avatars.filter((avatar) => avatar.gender === 'female').length;
    const currentGender = $('#personGender').value;
    const currentCount = runtime.avatars.filter((avatar) => avatar.gender === currentGender).length;
    $('#currentAvatarCount').textContent = ` (${currentCount})`;
    $('#maleAvatarCount').textContent = ` (${maleCount})`;
    $('#femaleAvatarCount').textContent = ` (${femaleCount})`;
    $('#allAvatarCount').textContent = ` (${runtime.avatars.length})`;
    $('#avatarLibraryStatus').textContent = `头像库已就绪：男性 ${maleCount} 张，女性 ${femaleCount} 张。列表较长时可向下滚动。`;
  }

  async function loadAvatars() {
    let payload = null;
    try {
      const response = await fetch(`/api/avatars?v=${AVATAR_ASSET_VERSION}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      payload = await response.json();
    } catch (_) {
      payload = null;
    }
    runtime.avatars = normalizeAvatarCatalog(payload);
    updateAvatarLibraryCounts();
    renderAvatarGallery();
  }

  function renderAvatarGallery() {
    const gender = $('#personGender').value;
    const filter = runtime.avatarFilter === 'current' ? gender : runtime.avatarFilter;
    const avatars = filter === 'all' || filter === 'unknown' ? runtime.avatars : runtime.avatars.filter((avatar) => avatar.gender === filter);
    const gallery = $('#avatarGallery');
    gallery.innerHTML = avatars.map((avatar) => `<button type="button" class="avatar-option${avatar.generated ? ' is-fallback' : ''}" data-avatar-id="${escapeHtml(avatar.id)}" data-avatar-url="${escapeHtml(avatar.url)}" title="${avatar.gender === 'male' ? '男性' : '女性'}头像 ${avatar.index}"><img src="${escapeHtml(avatar.url)}" alt="${avatar.gender === 'male' ? '男性' : '女性'}头像 ${avatar.index}"><span>${String(avatar.index).padStart(2, '0')}</span></button>`).join('');
    $$('.avatar-option', gallery).forEach((button) => {
      const avatar = runtime.avatars.find((item) => item.id === button.dataset.avatarId);
      const image = $('img', button);
      image.addEventListener('error', () => {
        if (!avatar || avatar.generated) return;
        const fallback = generatedAvatarFallback(avatar.gender, avatar.id);
        avatar.url = fallback;
        avatar.generated = true;
        button.dataset.avatarUrl = fallback;
        button.classList.add('is-fallback');
        image.src = fallback;
      }, { once: true });
      button.addEventListener('click', () => {
        const url = button.dataset.avatarUrl;
        $('#personAvatar').value = url;
        setAvatarPreview(url, $('#personGender').value, $('#personName').value);
        $('#avatarDialog').close();
      });
    });
  }

  function focusSearch() {
    const query = $('#personSearch').value.trim().toLowerCase();
    if (!query) return;
    const exact = runtime.graph.nodes.find((node) => node.name.toLowerCase() === query);
    const partial = runtime.graph.nodes.find((node) => node.name.toLowerCase().includes(query));
    const node = exact || partial;
    if (!node) { showToast('未找到人物', `没有匹配“${$('#personSearch').value.trim()}”的人物。`, 'error'); return; }
    selectNode(node.id, { focus: true });
  }

  function clearGraph() {
    if (!runtime.graph.nodes.length) return;
    if (!window.confirm('确定清空当前全部人物与关系吗？该操作可以撤销。')) return;
    pushHistory();
    runtime.graph = { nodes: [], edges: [] };
    clearSelection({ clearFocus: true, clearForms: true });
    runtime.linkSourceId = null;
    setInteractionMode('select');
    syncAll({ fit: false });
    showToast('图谱已清空');
  }

  function loadSample() {
    if (runtime.graph.nodes.length && !window.confirm('载入示例将替换当前图谱，是否继续？')) return;
    pushHistory();
    runtime.graph = sanitizeGraph(deepClone(SAMPLE_GRAPH));
    runtime.selectedType = null;
    runtime.selectedId = null;
    runtime.focusedNodeId = null;
    runtime.linkSourceId = null;
    runtime.lastLayout = 'force';
    setInteractionMode('select');
    syncAll({ runLayout: runtime.settings.autoArrange, fit: true });
    showToast('示例图谱已载入', '默认点击只选择人物，切换到聚焦模式可查看局部网络。');
  }

  function bindUi() {
    $$('.tab-btn').forEach((button) => button.addEventListener('click', () => tabTo(button.dataset.tab)));
    $('#savePersonBtn').addEventListener('click', savePerson);
    $('#deletePersonBtn').addEventListener('click', () => deletePerson());
    $('#resetPersonFormBtn').addEventListener('click', resetPersonForm);
    $('#saveRelationBtn').addEventListener('click', saveRelation);
    $('#deleteRelationBtn').addEventListener('click', () => deleteRelation());
    $('#resetRelationFormBtn').addEventListener('click', resetRelationForm);
    $('#undoBtn').addEventListener('click', undo);
    $('#redoBtn').addEventListener('click', redo);
    $('#sampleBtn').addEventListener('click', loadSample);
    $('#clearBtn').addEventListener('click', clearGraph);
    $('#emptyAddBtn').addEventListener('click', () => { tabTo('people'); $('#personName').focus(); });
    $('#closeInspectorBtn').addEventListener('click', () => clearSelection({ clearFocus: false }));
    $('#selectModeBtn').addEventListener('click', () => setInteractionMode('select'));
    $('#focusModeBtn').addEventListener('click', () => setInteractionMode('focus'));
    $('#linkModeBtn').addEventListener('click', () => setInteractionMode('link'));
    $('#cancelLinkModeBtn').addEventListener('click', () => setInteractionMode('select'));
    $('#autoArrangeBtn').addEventListener('click', () => {
      graphView.autoArrange({ releaseFixed: true, fit: true });
      showToast(runtime.focusedNodeId ? '当前子网络已自动整理' : '全图已自动整理');
    });

    $('#personName').addEventListener('input', () => setAvatarPreview($('#personAvatar').value, $('#personGender').value, $('#personName').value));
    $('#personGender').addEventListener('change', () => {
      const gender = $('#personGender').value;
      const current = $('#personAvatar').value;
      if (!current || current.includes('/static/avatars/')) $('#personAvatar').value = defaultAvatarForGender(gender, $('#personName').value || gender);
      setAvatarPreview($('#personAvatar').value, gender, $('#personName').value);
      updateAvatarLibraryCounts();
      renderAvatarGallery();
    });
    $('#openAvatarGalleryBtn').addEventListener('click', () => {
      runtime.avatarFilter = 'current';
      $$('.avatar-filter button').forEach((item) => item.classList.toggle('active', item.dataset.avatarFilter === 'current'));
      updateAvatarLibraryCounts();
      renderAvatarGallery();
      $('#avatarDialog').showModal();
    });
    $('#closeAvatarDialogBtn').addEventListener('click', () => $('#avatarDialog').close());
    $('#avatarDialog').addEventListener('click', (event) => { if (event.target === $('#avatarDialog')) $('#avatarDialog').close(); });
    $$('.avatar-filter button').forEach((button) => button.addEventListener('click', () => {
      runtime.avatarFilter = button.dataset.avatarFilter;
      $$('.avatar-filter button').forEach((item) => item.classList.toggle('active', item === button));
      renderAvatarGallery();
    }));
    $('#generateAvatarBtn').addEventListener('click', () => {
      const gender = $('#personGender').value;
      const avatar = generateAvatarSvg(gender);
      $('#personAvatar').value = avatar;
      setAvatarPreview(avatar, gender, $('#personName').value);
      showToast('已生成新头像', '头像在浏览器中即时生成，可随图数据一起导出。');
    });
    $('#avatarFileInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) { showToast('头像文件过大', '建议使用 4 MB 以内的图片。', 'error'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        $('#personAvatar').value = String(reader.result || '');
        setAvatarPreview(String(reader.result || ''), $('#personGender').value, $('#personName').value);
      };
      reader.readAsDataURL(file);
    });

    $('#relationWeight').addEventListener('input', () => { $('#weightValue').textContent = $('#relationWeight').value; });
    $('#relationColor').addEventListener('input', () => { $('#relationColorText').value = $('#relationColor').value.toUpperCase(); });
    $('#relationColorText').addEventListener('input', () => { if (isHexColor($('#relationColorText').value)) $('#relationColor').value = $('#relationColorText').value; });

    const dropZone = $('#dropZone');
    $('#graphFileInput').addEventListener('change', (event) => importFile(event.target.files?.[0]));
    ['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); }));
    ['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); }));
    dropZone.addEventListener('drop', (event) => importFile(event.dataTransfer.files?.[0]));
    $('#parseTextBtn').addEventListener('click', importText);
    $('#textImportFormat').addEventListener('change', () => {
      $('#textImportInput').placeholder = $('#textImportFormat').value === 'json'
        ? '{"nodes":[{"id":"p1","name":"林澈","gender":"male"}],"edges":[]}'
        : 'source,target,relation,source_gender,target_gender,directed,weight,color\n林澈,苏晴,同事,male,female,false,3,#64748B';
    });
    $('#exportDataBtn').addEventListener('click', exportData);
    $('#exportImageBtn').addEventListener('click', exportImage);

    $('#focusSearchBtn').addEventListener('click', focusSearch);
    $('#personSearch').addEventListener('keydown', (event) => { if (event.key === 'Enter') focusSearch(); });
    $('#focusDepth').addEventListener('input', () => {
      runtime.focusDepth = Number($('#focusDepth').value);
      $('#focusDepthValue').textContent = `${runtime.focusDepth} 度`;
      updateFocusBanner();
      if (runtime.focusedNodeId) graphView.focusNode(runtime.focusedNodeId, runtime.focusDepth);
      graphView.requestDraw();
    });
    $('#resetFocusBtn').addEventListener('click', resetFocus);
    $('#closeFocusBtn').addEventListener('click', resetFocus);
    $('#relationFilter').addEventListener('change', () => { runtime.filters.relation = $('#relationFilter').value; graphView.requestDraw(); });
    [['filterMale','male'],['filterFemale','female'],['filterUnknown','unknown']].forEach(([id, gender]) => {
      $(`#${id}`).addEventListener('change', () => {
        if ($(`#${id}`).checked) runtime.filters.genders.add(gender); else runtime.filters.genders.delete(gender);
        graphView.requestDraw();
      });
    });
    $('#resetFiltersBtn').addEventListener('click', () => {
      runtime.filters.relation = 'all';
      runtime.filters.genders = new Set(['male','female','unknown']);
      $('#relationFilter').value = 'all';
      $('#filterMale').checked = $('#filterFemale').checked = $('#filterUnknown').checked = true;
      graphView.requestDraw();
    });
    $$('.layout-btn').forEach((button) => button.addEventListener('click', () => {
      $$('.layout-btn').forEach((item) => item.classList.toggle('active', item === button));
      graphView.applyLayout(button.dataset.layout);
    }));
    $('#showNodeLabels').addEventListener('change', () => { runtime.settings.showNodeLabels = $('#showNodeLabels').checked; graphView.requestDraw(); });
    $('#showEdgeLabels').addEventListener('change', () => { runtime.settings.showEdgeLabels = $('#showEdgeLabels').checked; graphView.requestDraw(); });
    $('#physicsEnabled').addEventListener('change', () => {
      runtime.settings.physicsEnabled = $('#physicsEnabled').checked;
      if (runtime.settings.physicsEnabled && runtime.lastLayout === 'force') graphView.startPhysics(500); else graphView.stopPhysics();
    });
    $('#autoArrangeEnabled').addEventListener('change', () => {
      runtime.settings.autoArrange = $('#autoArrangeEnabled').checked;
      showToast(runtime.settings.autoArrange ? '自动整理已开启' : '自动整理已关闭');
    });

    $('#zoomInBtn').addEventListener('click', () => graphView.zoom(1.2));
    $('#zoomOutBtn').addEventListener('click', () => graphView.zoom(1 / 1.2));
    $('#fitBtn').addEventListener('click', () => graphView.fit(0.84));
    $('#centerBtn').addEventListener('click', () => graphView.center());
    $('#lockAllBtn').addEventListener('click', () => { graphView.lockAll(true); showToast('全部节点已固定'); });
    $('#unlockAllBtn').addEventListener('click', () => { graphView.lockAll(false); showToast('全部节点已解除固定'); });

    window.addEventListener('keydown', (event) => {
      const typing = ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); return; }
      if (typing) return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (runtime.selectedType === 'node') deletePerson(runtime.selectedId);
        if (runtime.selectedType === 'edge') deleteRelation(runtime.selectedId);
      }
      if (event.key === 'Escape') {
        if (runtime.interactionMode === 'link') setInteractionMode('select');
        else if (runtime.focusedNodeId) resetFocus();
        else clearSelection({ clearFocus: false });
      }
      if (event.key.toLowerCase() === 'f') graphView.fit(0.84);
    });
  }

  async function initialize() {
    bindUi();
    resetPersonForm();
    resetRelationForm();
    await loadAvatars();
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem('personRelationshipGraphStudio') || 'null'); } catch (_) { stored = null; }
    runtime.graph = sanitizeGraph(stored?.nodes?.length ? stored : deepClone(SAMPLE_GRAPH));
    setInteractionMode('select');
    syncAll({ runLayout: runtime.settings.autoArrange, fit: true });
    updateHistoryButtons();
    window.setTimeout(() => graphView.fit(0.84), 120);
  }

  initialize();
})();
