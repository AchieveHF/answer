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

function renderPrompt(target, text, terms) {
  target.textContent = "";
  const cleanTerms = terms.filter(Boolean);
  if (!cleanTerms.length) {
    target.textContent = text;
    return;
  }

  const pattern = cleanTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const matcher = new RegExp(`(${pattern})`, "g");
  const fragments = String(text || "").split(matcher);
  const termSet = new Set(cleanTerms);

  for (const fragment of fragments) {
    if (!fragment) continue;
    const span = document.createElement("span");
    span.textContent = fragment;
    if (termSet.has(fragment)) span.className = "memory-highlight";
    target.append(span);
  }
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
  els.homeView.hidden = true;
  els.subjectView.hidden = true;
  els.wrongBookView.hidden = false;
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
    stats.wrongBook ? `错题本 ${stats.wrongBook}` : "",
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
  els.practiceProgress.style.width = `${items.length ? (stats.answered / items.length) * 100 : 0}%`;
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
      section.append(renderQuestion(q, index + 1, { showWrongCount: true, showKnowledgeBeforeAnswer: true }));
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
  renderPrompt(prompt, q.prompt, highlightTermsForQuestion(q));

  const answerPanel = node.querySelector(".answer-panel");
  const answerButton = node.querySelector(".answer-toggle");
  const answerMain = node.querySelector(".answer-main");
  const answerExtra = node.querySelector(".answer-extra");

  answerMain.textContent = `答案：${readableAnswer(q)}`;
  answerExtra.textContent = [q.explanation && `解析：${q.explanation}`]
    .filter(Boolean)
    .join("\n");

  function setVisible(visible) {
    answerPanel.hidden = !visible;
    node.classList.toggle("answer-visible", visible);
    answerButton.textContent = visible ? "收起答案" : "查看答案";
    if (visible) {
      state.revealed.add(q.id);
    } else {
      state.revealed.delete(q.id);
    }
  }

  const options = node.querySelector(".options");
  const correct = correctLetters(q);
  const choices = answerOptions(q);
  const objective = isObjective(q);
  let selected = new Set(state.attempts[q.id]?.selected || []);

  const result = document.createElement("div");
  result.className = "quiz-result";
  result.hidden = true;

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
  node.insertBefore(result, answerButton);

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
      result.hidden = false;
      result.className = `quiz-result ${attempt.correct ? "correct" : "wrong"}`;
      result.textContent = attempt.correct ? "答对了 ✓" : "答错了 ×，绿色项为正确答案";
      setVisible(true);
    } else {
      result.hidden = true;
      result.textContent = "";
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
      } else {
        saveAttempt(q, selected, true);
        updateStudyHeader();
      }
      refreshPracticeUi();
    });
  }

  setVisible(Boolean(state.attempts[q.id]?.checked) || state.showAllAnswers || state.revealed.has(q.id));
  refreshPracticeUi();
  answerButton.addEventListener("click", () => setVisible(answerPanel.hidden));

  return node;
}

els.backBtn.addEventListener("click", closeSubject);
els.openWrongBookBtn.addEventListener("click", () => openWrongBook("", "home"));
els.openSubjectWrongBookBtn.addEventListener("click", () => openWrongBook(state.subject, "subject"));
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
