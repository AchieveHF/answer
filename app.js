const bank = window.QUESTION_BANK || { questions: [] };
const questions = bank.questions || [];
const questionById = new Map(questions.map((q) => [q.id, q]));

const typeLabels = {
  choice: "单选",
  multiple_choice: "多选",
  true_false: "判断",
  fill: "填空",
  short_answer: "简答",
  calculation: "计算题",
  programming: "编程/综合",
  design: "设计题",
  sql_application: "SQL应用",
};

const typeOrder = [
  "choice",
  "multiple_choice",
  "true_false",
  "fill",
  "short_answer",
  "calculation",
  "programming",
  "design",
  "sql_application",
];

const promptKeywordTerms = [
  "操作系统",
  "内核代码",
  "内核态",
  "用户态",
  "自由态",
  "就绪态",
  "进程",
  "线程",
  "处理器",
  "临界资源",
  "临界区",
  "信号量",
  "死锁",
  "银行家算法",
  "页面置换",
  "虚拟存储",
  "页表",
  "缺页",
  "文件控制块",
  "中断",
  "JSP",
  "Servlet",
  "JavaBean",
  "request",
  "response",
  "session",
  "application",
  "Filter",
  "JDBC",
  "MVC",
  "Struts2",
  "数据库",
  "主键",
  "外键",
  "视图",
  "索引",
  "触发器",
  "事务",
  "范式",
  "E-R",
  "SQL",
  "黑盒测试",
  "白盒测试",
  "等价类",
  "边界值",
  "判定表",
  "路径覆盖",
  "语句覆盖",
  "条件覆盖",
  "回归测试",
  "单元测试",
  "集成测试",
  "系统测试",
  "验收测试",
  "瀑布模型",
  "原型模型",
  "螺旋模型",
  "需求分析",
  "数据流图",
  "内聚",
  "耦合",
  "UML",
  "五种视图",
  "用例视图",
  "逻辑视图",
  "进程视图",
  "实现视图",
  "部署视图",
  "类图",
  "对象图",
  "顺序图",
  "活动图",
  "状态图",
  "组件图",
  "系统分析",
  "设计人员",
  "软件结构",
  "问题域",
  "Activity",
  "Intent",
  "Service",
  "BroadcastReceiver",
  "ContentProvider",
  "SharedPreferences",
  "SQLite",
  "Handler",
  "AndroidManifest",
];

const els = {
  homeView: document.querySelector("#homeView"),
  subjectView: document.querySelector("#subjectView"),
  wrongBookView: document.querySelector("#wrongBookView"),
  subjectList: document.querySelector("#subjectList"),
  subjectTemplate: document.querySelector("#subjectTemplate"),
  questionTemplate: document.querySelector("#questionTemplate"),
  openWrongBookBtn: document.querySelector("#openWrongBookBtn"),
  homeWrongSummary: document.querySelector("#homeWrongSummary"),
  backBtn: document.querySelector("#backBtn"),
  toggleAnswersBtn: document.querySelector("#toggleAnswersBtn"),
  clearSubjectBtn: document.querySelector("#clearSubjectBtn"),
  openSubjectWrongBookBtn: document.querySelector("#openSubjectWrongBookBtn"),
  continueStudyBtn: document.querySelector("#continueStudyBtn"),
  studySubject: document.querySelector("#studySubject"),
  studyCount: document.querySelector("#studyCount"),
  practiceStats: document.querySelector("#practiceStats"),
  practiceProgress: document.querySelector("#practiceProgress"),
  typeNav: document.querySelector("#typeNav"),
  questionList: document.querySelector("#questionList"),
  wrongBookBackBtn: document.querySelector("#wrongBookBackBtn"),
  wrongBookAllBtn: document.querySelector("#wrongBookAllBtn"),
  clearWrongBookBtn: document.querySelector("#clearWrongBookBtn"),
  wrongBookTitle: document.querySelector("#wrongBookTitle"),
  wrongBookCount: document.querySelector("#wrongBookCount"),
  wrongBookStats: document.querySelector("#wrongBookStats"),
  wrongBookList: document.querySelector("#wrongBookList"),
};

function readCache(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

const state = {
  subject: "",
  wrongBookSubject: "",
  wrongBookReturn: "home",
  showAllAnswers: false,
  revealed: new Set(),
  continueDismissedTargetId: "",
  attempts: readCache("questionBankAttempts", {}),
  wrongIds: new Set(readCache("questionBankWrongIds", [])),
  wrongBook: readCache("questionBankWrongBook", {}),
  bookmarks: new Set(JSON.parse(localStorage.getItem("questionBankBookmarks") || "[]")),
};

migrateWrongBook();

function saveBookmarks() {
  localStorage.setItem("questionBankBookmarks", JSON.stringify([...state.bookmarks]));
}

function savePracticeState() {
  localStorage.setItem("questionBankAttempts", JSON.stringify(state.attempts));
  localStorage.setItem("questionBankWrongIds", JSON.stringify([...state.wrongIds]));
  localStorage.setItem("questionBankWrongBook", JSON.stringify(state.wrongBook));
}

function migrateWrongBook() {
  let changed = false;
  for (const id of state.wrongIds) {
    if (state.wrongBook[id]) continue;
    const q = questionById.get(id);
    if (!q) continue;
    state.wrongBook[id] = {
      count: 1,
      subject: q.subject,
      type: q.type,
      firstAt: Date.now(),
      lastAt: Date.now(),
    };
    changed = true;
  }
  if (changed) savePracticeState();
}

function wrongBookCount(q) {
  return Number(state.wrongBook[q.id]?.count || 0);
}

function recordWrong(q) {
  const now = Date.now();
  const item = state.wrongBook[q.id] || {
    count: 0,
    subject: q.subject,
    type: q.type,
    firstAt: now,
  };
  item.count += 1;
  item.subject = q.subject;
  item.type = q.type;
  item.lastAt = now;
  state.wrongBook[q.id] = item;
}

function subjectStats(items) {
  const answered = items.filter((q) => state.attempts[q.id]?.checked).length;
  const correct = items.filter((q) => state.attempts[q.id]?.checked && state.attempts[q.id].correct).length;
  const wrong = answered - correct;
  const rate = answered ? Math.round((correct / answered) * 1000) / 10 : null;
  const wrongBook = items.filter((q) => wrongBookCount(q) > 0).length;
  return { answered, correct, wrong, rate, wrongBook };
}

function statsText(items) {
  const stats = subjectStats(items);
  return [
    `${stats.answered}/${items.length}`,
    `对 ${stats.correct}`,
    `错 ${stats.wrong}`,
    stats.rate === null ? "--" : `${stats.rate}%`,
    stats.wrongBook ? `错题本 ${stats.wrongBook}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function wrongBookItems(subject = "") {
  return Object.entries(state.wrongBook)
    .map(([id, info]) => ({ q: questionById.get(id), info }))
    .filter((item) => item.q && (!subject || item.q.subject === subject))
    .sort((a, b) => (Number(b.info.lastAt || 0) - Number(a.info.lastAt || 0)) || a.q.subject.localeCompare(b.q.subject, "zh-CN"))
    .map((item) => item.q);
}

function bySubject() {
  const grouped = new Map();
  for (const q of questions) {
    if (!grouped.has(q.subject)) grouped.set(q.subject, []);
    grouped.get(q.subject).push(q);
  }
  return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh-CN"));
}

function countTypes(items) {
  return items.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});
}

function readableAnswer(q) {
  if (!q.answer) return "资料中未识别到答案";
  if (q.answer === "T") return "T  正确";
  if (q.answer === "F") return "F  错误";
  if (q.answerText) return `${q.answer}  ${q.answerText}`;
  return q.answer;
}

function cleanText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, "$1$2")
    .replace(/[。；;，,、\s]*[A-E]$/g, "")
    .trim();
}

function highlightTermsForQuestion(q) {
  const prompt = cleanText(q.prompt);
  const terms = [];
  for (const term of promptKeywordTerms) {
    if (prompt.includes(term)) terms.push(term);
  }

  const domainTerms = prompt.match(/[A-Za-z][A-Za-z0-9+#.-]{1,}|PCB|CPU|UML|SQL|HTTP|JSP|MVC|DBMS|JDBC|XML|JSON/g) || [];
  terms.push(...domainTerms.filter((term) => term.length >= 2));

  return [...new Set(terms)]
    .sort((a, b) => b.length - a.length)
    .slice(0, 6);
}

function renderPrompt(target, text, terms, q, revealAnswer = false) {
  target.textContent = "";
  const cleanTerms = terms.filter(Boolean);
  const blankToken = "__FILL_BLANK__";
  let displayText = String(text || "");
  if (q?.type === "fill") {
    displayText = displayText.replace(/_{1,}|＿+|（\s*\d*\s*）|\(\s*\d*\s*\)/g, blankToken);
    if (!displayText.includes(blankToken)) {
      displayText = displayText.replace(/(的)\s+(?=(表示|是|为|用于|称为))/g, `$1${blankToken}`);
    }
  }
  const hasBlank = q?.type === "fill" && displayText.includes(blankToken);
  const answerForBlank = revealAnswer ? cleanText(q?.answer || q?.answerText || "") : "";

  const termPattern = cleanTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pieces = [q?.type === "fill" ? blankToken : "", termPattern].filter(Boolean);
  if (!pieces.length) {
    target.textContent = displayText;
    if (q?.type === "fill") target.append(createBlankNode(answerForBlank));
    return;
  }

  const matcher = new RegExp(`(${pieces.join("|")})`, "g");
  const fragments = displayText.split(matcher);
  const termSet = new Set(cleanTerms);

  for (const fragment of fragments) {
    if (!fragment) continue;
    if (q?.type === "fill" && fragment === blankToken) {
      target.append(createBlankNode(answerForBlank));
      continue;
    }
    const span = document.createElement("span");
    span.textContent = fragment;
    if (termSet.has(fragment)) span.className = "keyword-highlight";
    target.append(span);
  }

  if (q?.type === "fill" && !hasBlank) target.append(createBlankNode(answerForBlank));
}

function createBlankNode(answer = "") {
  const blank = document.createElement("span");
  blank.className = "fill-blank";
  blank.textContent = answer || "";
  return blank;
}

function renderQuestionMedia(q) {
  const images = Array.isArray(q.images) ? q.images : [];
  if (!images.length) return null;

  const media = document.createElement("div");
  media.className = "question-media";
  for (const image of images) {
    const src = typeof image === "string" ? image : image.src;
    if (!src) continue;
    const link = document.createElement("a");
    link.className = "question-media-link";
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener";

    const img = document.createElement("img");
    img.src = src;
    img.alt = (typeof image === "object" && image.alt) || `${q.subject || ""}${q.number ? `第${q.number}题` : ""}配图`;
    img.loading = "lazy";
    link.append(img);
    media.append(link);
  }
  return media.children.length ? media : null;
}

function correctLetters(q) {
  const answer = String(q.answer || "").toUpperCase();
  if (answer === "T" || answer === "F") return new Set([answer]);
  return new Set(answer.match(/[A-E]/g) || []);
}

function answerOptions(q) {
  if (q.type === "true_false") {
    return [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ];
  }
  return q.options || [];
}

function isObjective(q) {
  return correctLetters(q).size > 0 && answerOptions(q).length > 0;
}

function isChecked(q) {
  return Boolean(state.attempts[q.id]?.checked);
}

function hasAttemptProgress(q) {
  const attempt = state.attempts[q.id];
  return Boolean(attempt?.checked || attempt?.selected?.length);
}

function sameChoice(a, b) {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((key, index) => key === right[index]);
}

function saveAttempt(q, selected, checked) {
  const previous = state.attempts[q.id];
  const selectedList = [...selected].sort();
  const correct = checked && sameChoice(selected, correctLetters(q));
  const previousSelected = (previous?.selected || []).join(",");
  const nextSelected = selectedList.join(",");
  const shouldCountWrong =
    checked &&
    !correct &&
    (!previous?.checked || previous.correct || previousSelected !== nextSelected || !state.wrongBook[q.id]);

  state.attempts[q.id] = {
    selected: selectedList,
    checked,
    correct,
    updatedAt: Date.now(),
  };
  if (checked && !correct) {
    state.wrongIds.add(q.id);
    if (shouldCountWrong) recordWrong(q);
  }
  if (checked && correct) state.wrongIds.delete(q.id);
  savePracticeState();
  return state.attempts[q.id];
}

function clearAttempt(q) {
  delete state.attempts[q.id];
  state.wrongIds.delete(q.id);
  savePracticeState();
}

function createBadge(text, className) {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function renderHome() {
  els.subjectList.textContent = "";
  const fragment = document.createDocumentFragment();
  const totalWrong = wrongBookItems().length;

  els.homeWrongSummary.textContent = totalWrong ? `${totalWrong} 道错题` : "暂无错题";

  for (const [subject, items] of bySubject()) {
    const card = els.subjectTemplate.content.firstElementChild.cloneNode(true);
    const typeCounts = countTypes(items);
    const typeSummary = typeOrder
      .filter((type) => typeCounts[type])
      .map((type) => `${typeLabels[type]} ${typeCounts[type]}`)
      .join(" · ");

    card.querySelector(".subject-name").textContent = subject;
    card.querySelector(".subject-meta").textContent = subjectSummary(items);
    card.querySelector(".subject-types").textContent = typeSummary;
    card.addEventListener("click", () => openSubject(subject));
    fragment.append(card);
  }

  els.subjectList.append(fragment);
}

function openSubject(subject) {
  state.subject = subject;
  state.showAllAnswers = false;
  state.revealed.clear();
  state.continueDismissedTargetId = "";
  els.homeView.hidden = true;
  els.subjectView.hidden = false;
  els.wrongBookView.hidden = true;
  renderSubject();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function closeSubject() {
  state.subject = "";
  state.showAllAnswers = false;
  state.revealed.clear();
  renderHome();
  els.subjectView.hidden = true;
  els.homeView.hidden = false;
  els.wrongBookView.hidden = true;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function openWrongBook(subject = "", returnTo = "home") {
  state.wrongBookSubject = subject;
  state.wrongBookReturn = returnTo;
  state.revealed.clear();
  state.continueDismissedTargetId = "";
  els.homeView.hidden = true;
  els.subjectView.hidden = true;
  els.wrongBookView.hidden = false;
  els.continueStudyBtn.hidden = true;
  renderWrongBook();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function closeWrongBook() {
  state.revealed.clear();
  els.wrongBookView.hidden = true;
  if (state.wrongBookReturn === "subject" && state.subject) {
    els.homeView.hidden = true;
    els.subjectView.hidden = false;
    renderSubject();
  } else {
    state.wrongBookReturn = "home";
    els.subjectView.hidden = true;
    els.homeView.hidden = false;
    renderHome();
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

function orderedSubjectItems(items) {
  return [...groupedByType(items).values()].flat();
}

function continueStudyInfo(items = subjectItems()) {
  const ordered = orderedSubjectItems(items);
  const objectiveItems = ordered.filter(isObjective);
  const answered = objectiveItems.filter(isChecked).length;
  const hasProgress = objectiveItems.some(hasAttemptProgress);

  if (!hasProgress || !objectiveItems.length || answered >= objectiveItems.length) return null;

  const partial = objectiveItems.find((q) => {
    const attempt = state.attempts[q.id];
    return attempt?.selected?.length && !attempt.checked;
  });
  if (partial) return { target: partial, answered, total: objectiveItems.length };

  let lastProgressIndex = -1;
  ordered.forEach((q, index) => {
    if (isObjective(q) && hasAttemptProgress(q)) lastProgressIndex = index;
  });

  const target =
    ordered.slice(lastProgressIndex + 1).find((q) => isObjective(q) && !isChecked(q)) ||
    objectiveItems.find((q) => !isChecked(q));

  return target ? { target, answered, total: objectiveItems.length } : null;
}

function updateContinueStudyButton(items = subjectItems()) {
  const info = continueStudyInfo(items);
  if (!info) {
    els.continueStudyBtn.hidden = true;
    state.continueDismissedTargetId = "";
    return;
  }
  if (state.continueDismissedTargetId && state.continueDismissedTargetId !== info.target.id) {
    state.continueDismissedTargetId = "";
  }
  if (state.continueDismissedTargetId === info.target.id || continueTargetReached(info.target)) {
    dismissContinueStudy(info.target.id);
    return;
  }
  els.continueStudyBtn.hidden = false;
  els.continueStudyBtn.setAttribute("aria-label", `继续看题，已答 ${info.answered} / ${info.total}`);
}

function continueTargetReached(q) {
  const target = document.getElementById(q.id);
  if (!target) return false;
  const threshold = Math.min(460, Math.max(220, window.innerHeight * 0.5));
  return target.getBoundingClientRect().top <= threshold;
}

function dismissContinueStudy(targetId = "") {
  state.continueDismissedTargetId = targetId;
  els.continueStudyBtn.hidden = true;
}

function continueStudy() {
  const info = continueStudyInfo();
  if (!info) {
    updateContinueStudyButton();
    return;
  }
  const target = document.getElementById(info.target.id);
  if (!target) return;
  dismissContinueStudy(info.target.id);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("continue-focus");
  window.setTimeout(() => target.classList.remove("continue-focus"), 1100);
}

let continueScrollFrame = 0;
function handleContinueStudyScroll() {
  if (continueScrollFrame || els.subjectView.hidden || els.continueStudyBtn.hidden) return;
  continueScrollFrame = window.requestAnimationFrame(() => {
    continueScrollFrame = 0;
    const info = continueStudyInfo();
    if (info && continueTargetReached(info.target)) dismissContinueStudy(info.target.id);
  });
}

function clearSubjectRecords() {
  const items = subjectItems();
  if (!items.length) return;
  const confirmed = window.confirm(`清空《${state.subject}》答题记录？错题本保留。`);
  if (!confirmed) return;

  for (const q of items) {
    delete state.attempts[q.id];
    state.wrongIds.delete(q.id);
  }
  state.revealed.clear();
  state.showAllAnswers = false;
  state.continueDismissedTargetId = "";
  savePracticeState();
  renderSubject();
}

function clearWrongBookRecords() {
  const subject = state.wrongBookSubject;
  const items = wrongBookItems(subject);
  if (!items.length) return;
  const name = subject ? `《${subject}》` : "全部";
  const confirmed = window.confirm(`清空${name}错题本？答题记录保留。`);
  if (!confirmed) return;

  for (const q of items) {
    delete state.wrongBook[q.id];
    state.wrongIds.delete(q.id);
  }
  savePracticeState();
  renderWrongBook();
}

function subjectItems() {
  return questions.filter((q) => q.subject === state.subject);
}

function subjectSummary(items) {
  const stats = subjectStats(items);
  return [
    `${items.length} 题`,
    stats.answered ? `已答 ${stats.answered}` : "",
    stats.rate !== null ? `正确率 ${stats.rate}%` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function updateStudyHeader() {
  if (!state.subject) return;
  const items = subjectItems();
  const stats = subjectStats(items);
  els.studyCount.textContent = subjectSummary(items);
  els.practiceStats.textContent = statsText(items);
  els.openSubjectWrongBookBtn.textContent = `错题本 ${stats.wrongBook}`;
  els.practiceProgress.style.width = `${items.length ? (stats.answered / items.length) * 100 : 0}%`;
  updateContinueStudyButton(items);
}

function groupedByType(items) {
  const groups = new Map();
  for (const type of typeOrder) {
    const rows = items.filter((q) => q.type === type);
    if (rows.length) groups.set(type, rows);
  }
  return groups;
}

function renderTypeNav(groups) {
  els.typeNav.textContent = "";
  const fragment = document.createDocumentFragment();
  for (const [type, items] of groups) {
    const link = document.createElement("a");
    link.href = `#type-${type}`;
    link.className = "type-chip";
    link.textContent = `${typeLabels[type] || type} ${items.length}`;
    fragment.append(link);
  }
  els.typeNav.append(fragment);
}

function renderSubject() {
  const items = subjectItems();
  const groups = groupedByType(items);

  els.studySubject.textContent = state.subject;
  updateStudyHeader();
  els.toggleAnswersBtn.classList.toggle("active", state.showAllAnswers);
  els.toggleAnswersBtn.setAttribute("aria-checked", String(state.showAllAnswers));
  els.toggleAnswersBtn.setAttribute("aria-label", state.showAllAnswers ? "隐藏全部答案" : "显示全部答案");
  renderTypeNav(groups);

  els.questionList.textContent = "";
  const fragment = document.createDocumentFragment();
  for (const [type, rows] of groups) {
    const section = document.createElement("section");
    section.className = "type-section";
    section.id = `type-${type}`;

    const heading = document.createElement("div");
    heading.className = "type-heading";
    heading.innerHTML = `<h2>${typeLabels[type] || type}</h2><span>${rows.length} 题</span>`;
    section.append(heading);

    rows.forEach((q, index) => {
      section.append(renderQuestion(q, index + 1));
    });

    fragment.append(section);
  }
  els.questionList.append(fragment);
}

function renderWrongBook() {
  const subject = state.wrongBookSubject;
  const items = wrongBookItems(subject);
  const totalWrongCount = items.reduce((sum, q) => sum + wrongBookCount(q), 0);

  els.wrongBookTitle.textContent = subject ? `${subject}错题本` : "错题本";
  els.wrongBookCount.textContent = `${items.length} 题`;
  els.wrongBookStats.textContent = items.length
    ? `${items.length} 道错题 · 答错 ${totalWrongCount} 次`
    : "暂无错题";
  els.clearWrongBookBtn.disabled = !items.length;
  els.wrongBookAllBtn.hidden = !subject;
  els.wrongBookList.textContent = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "暂无错题";
    els.wrongBookList.append(empty);
    return;
  }

  const grouped = new Map();
  for (const q of items) {
    const key = subject ? (typeLabels[q.type] || q.type) : q.subject;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(q);
  }

  const fragment = document.createDocumentFragment();
  for (const [label, rows] of grouped) {
    const section = document.createElement("section");
    section.className = "type-section";

    const heading = document.createElement("div");
    heading.className = "type-heading";
    heading.innerHTML = `<h2>${label}</h2><span>${rows.length} 题</span>`;
    section.append(heading);

    rows.forEach((q, index) => {
      section.append(renderQuestion(q, index + 1, { showWrongCount: true }));
    });

    fragment.append(section);
  }
  els.wrongBookList.append(fragment);
}

function renderQuestion(q, indexInType, renderOptions = {}) {
  const node = els.questionTemplate.content.firstElementChild.cloneNode(true);
  node.id = q.id;

  const meta = node.querySelector(".meta-line");
  meta.append(createBadge(`#${q.number || indexInType}`, "number"));
  if (renderOptions.showWrongCount && wrongBookCount(q)) {
    const wrongBadge = createBadge(`错 ${wrongBookCount(q)} 次`, "wrong-count");
    wrongBadge.dataset.wrongCountFor = q.id;
    meta.append(wrongBadge);
  }

  const mark = node.querySelector(".mark-btn");
  mark.classList.toggle("active", state.bookmarks.has(q.id));
  mark.textContent = state.bookmarks.has(q.id) ? "★" : "☆";
  mark.addEventListener("click", () => {
    if (state.bookmarks.has(q.id)) state.bookmarks.delete(q.id);
    else state.bookmarks.add(q.id);
    saveBookmarks();
    mark.classList.toggle("active", state.bookmarks.has(q.id));
    mark.textContent = state.bookmarks.has(q.id) ? "★" : "☆";
  });

  const prompt = node.querySelector(".prompt");
  const promptTerms = highlightTermsForQuestion(q);
  const options = node.querySelector(".options");
  const questionMedia = renderQuestionMedia(q);
  if (questionMedia) node.insertBefore(questionMedia, options);

  const answerPanel = node.querySelector(".answer-panel");
  const answerButton = node.querySelector(".answer-toggle");
  const answerMain = node.querySelector(".answer-main");
  const answerExtra = node.querySelector(".answer-extra");

  const objective = isObjective(q);
  const answerMainText = objective ? "" : `答案：${readableAnswer(q)}`;
  const answerExtraText = q.explanation ? `解析：${q.explanation}` : "";
  answerMain.textContent = answerMainText;
  answerMain.hidden = !answerMainText;
  answerExtra.textContent = answerExtraText;
  answerExtra.hidden = !answerExtraText;

  let answerVisible = false;
  function setVisible(visible) {
    answerVisible = visible;
    answerPanel.hidden = !visible || (!answerMainText && !answerExtraText);
    node.classList.toggle("answer-visible", visible);
    answerButton.textContent = visible ? "收起答案" : "查看答案";
    renderPrompt(prompt, q.prompt, promptTerms, q, visible);
    if (visible) {
      state.revealed.add(q.id);
    } else {
      state.revealed.delete(q.id);
    }
  }

  const correct = correctLetters(q);
  const choices = answerOptions(q);
  let selected = new Set(state.attempts[q.id]?.selected || []);

  const actionRow = document.createElement("div");
  actionRow.className = "quiz-actions";

  let submitButton = null;
  if (objective && q.type === "multiple_choice") {
    submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "quiz-submit";
    actionRow.append(submitButton);
  }

  if (actionRow.children.length) node.insertBefore(actionRow, answerButton);

  function currentAttempt() {
    return state.attempts[q.id] || { selected: [...selected], checked: false, correct: false };
  }

  function refreshPracticeUi() {
    const attempt = currentAttempt();
    const checked = Boolean(attempt.checked);
    selected = new Set(attempt.selected || []);
    node.classList.toggle("answered", checked);
    node.classList.toggle("answered-correct", checked && attempt.correct);
    node.classList.toggle("answered-wrong", checked && !attempt.correct);

    node.querySelectorAll(".option").forEach((item) => {
      const key = item.dataset.key;
      const isSelected = selected.has(key);
      const isCorrect = correct.has(key);
      const icon = item.querySelector(".option-result");

      item.classList.toggle("selected", isSelected);
      item.classList.toggle("correct", isCorrect);
      item.classList.toggle("selected-correct", checked && isSelected && isCorrect);
      item.classList.toggle("selected-wrong", checked && isSelected && !isCorrect);
      item.classList.toggle("missed-correct", checked && !isSelected && isCorrect);
      if (item.hasAttribute("role")) item.setAttribute("aria-checked", String(isSelected));
      icon.textContent = checked && isSelected && !isCorrect ? "×" : checked && isCorrect ? "✓" : "";
    });

    if (checked) {
      setVisible(true);
    }

    if (submitButton) {
      submitButton.disabled = !checked && selected.size === 0;
      submitButton.textContent = checked ? "重新选择" : "提交选择";
    }

    const wrongBadge = node.querySelector(`[data-wrong-count-for="${q.id}"]`);
    if (wrongBadge) wrongBadge.textContent = `错 ${wrongBookCount(q)} 次`;
  }

  if (choices.length) {
    for (const opt of choices) {
      const item = document.createElement("li");
      item.className = "option";
      item.dataset.key = opt.key;
      if (objective) {
        item.tabIndex = 0;
        item.setAttribute("role", q.type === "multiple_choice" ? "checkbox" : "radio");
      }

      const key = document.createElement("span");
      key.className = "option-key";
      key.textContent = opt.key;

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = opt.text;

      const icon = document.createElement("span");
      icon.className = "option-result";

      item.append(key, text, icon);
      if (objective) {
        item.addEventListener("click", () => {
          const attempt = currentAttempt();
          if (q.type === "multiple_choice") {
            if (attempt.checked) return;
            if (selected.has(opt.key)) selected.delete(opt.key);
            else selected.add(opt.key);
            saveAttempt(q, selected, false);
            updateContinueStudyButton();
          } else {
            selected = new Set([opt.key]);
            saveAttempt(q, selected, true);
            updateStudyHeader();
          }
          refreshPracticeUi();
        });
        item.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            item.click();
          }
        });
      }
      options.append(item);
    }
  } else {
    options.remove();
  }

  if (submitButton) {
    submitButton.addEventListener("click", () => {
      const attempt = currentAttempt();
      if (attempt.checked) {
        clearAttempt(q);
        selected = new Set();
        setVisible(false);
        updateStudyHeader();
      } else {
        saveAttempt(q, selected, true);
        updateStudyHeader();
      }
      refreshPracticeUi();
    });
  }

  setVisible(Boolean(state.attempts[q.id]?.checked) || state.showAllAnswers || state.revealed.has(q.id));
  refreshPracticeUi();
  answerButton.addEventListener("click", () => setVisible(!answerVisible));

  return node;
}

els.backBtn.addEventListener("click", closeSubject);
els.openWrongBookBtn.addEventListener("click", () => openWrongBook("", "home"));
els.openSubjectWrongBookBtn.addEventListener("click", () => openWrongBook(state.subject, "subject"));
els.continueStudyBtn.addEventListener("click", continueStudy);
window.addEventListener("scroll", handleContinueStudyScroll, { passive: true });
els.clearSubjectBtn.addEventListener("click", clearSubjectRecords);
els.wrongBookBackBtn.addEventListener("click", closeWrongBook);
els.wrongBookAllBtn.addEventListener("click", () => openWrongBook("", state.wrongBookReturn));
els.clearWrongBookBtn.addEventListener("click", clearWrongBookRecords);
els.toggleAnswersBtn.addEventListener("click", () => {
  state.showAllAnswers = !state.showAllAnswers;
  state.revealed.clear();
  renderSubject();
});

renderHome();
