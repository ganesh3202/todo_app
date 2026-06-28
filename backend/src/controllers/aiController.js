const { Op }  = require('sequelize');
const { Task, Project } = require('../models');

// ── Helpers ─────────────────────────────────────────────────────────────

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function parseDueDate(text) {
  const lower = text.toLowerCase();
  const now = new Date();

  if (/\btoday\b/.test(lower)) return now;

  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  if (/\bnext week\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }

  const inDaysMatch = lower.match(/in (\d+)\s*days?/);
  if (inDaysMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inDaysMatch[1], 10));
    return d;
  }

  for (let i = 0; i < DAY_NAMES.length; i++) {
    if (lower.includes(DAY_NAMES[i])) {
      const d = new Date(now);
      const currentDay = d.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
      return d;
    }
  }

  return null;
}

function parsePriority(text) {
  const lower = text.toLowerCase();
  if (lower.includes('urgent')) return 'urgent';
  if (lower.includes('high priority') || lower.includes('high-priority')) return 'high';
  if (lower.includes('low priority') || lower.includes('low-priority')) return 'low';
  return 'medium';
}

function extractTaskTitle(rawQuery) {
  let text = rawQuery;

  text = text.replace(/^(create|add|new)\s+(a\s+)?task\s*(to|:)?\s*/i, '');
  text = text.replace(/^remind me to\s*/i, '');

  text = text.replace(/\bin\s+\d+\s*days?\b/gi, '');
  text = text.replace(/\b(today|tomorrow|next week)\b/gi, '');
  text = text.replace(/\b(on|by)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '');
  text = text.replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '');
  text = text.replace(/\b(high|low|medium)\s*(-|\s)?priority\b/gi, '');
  text = text.replace(/\burgent\b/gi, '');

  return text.replace(/^[:\-]\s*/, '').replace(/\s{2,}/g, ' ').trim();
}

function findBestTaskMatch(tasks, name) {
  const lowerName = name.toLowerCase().trim();
  if (!lowerName) return null;

  let match = tasks.find(t => t.title.toLowerCase() === lowerName);
  if (match) return match;

  match = tasks.find(t =>
    t.title.toLowerCase().includes(lowerName) || lowerName.includes(t.title.toLowerCase())
  );
  if (match) return match;

  const nameWords = lowerName.split(/\s+/);
  let bestScore = 0, best = null;
  for (const t of tasks) {
    const titleWords = t.title.toLowerCase().split(/\s+/);
    const score = nameWords.filter(w => titleWords.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return best;
}

// ── Main handler ────────────────────────────────────────────────────────

// POST /api/ai/query
exports.aiQuery = async (req, res) => {
  try {
    const { query }  = req.body;
    const userId     = req.user.id;
    const rawQuery   = query || '';
    const lowerQuery = rawQuery.toLowerCase();
    const now        = new Date();

    let response = '';
    let data      = null;

    const isCreateIntent =
      /^(create|add|new)\s+(a\s+)?task\b/i.test(rawQuery) ||
      /^remind me to\b/i.test(rawQuery);

    const completeMatch =
      rawQuery.match(/^mark\s+(.+?)\s+as\s+(?:done|complete|completed)$/i) ||
      rawQuery.match(/^mark\s+(.+?)\s+(?:done|complete|completed)$/i) ||
      rawQuery.match(/^complete\s+(?:task\s+)?(.+)$/i) ||
      rawQuery.match(/^finish\s+(?:task\s+)?(.+)$/i) ||
      rawQuery.match(/^(?:i\s+)?(?:finished|completed)\s+(.+)$/i);

    // ── 1. CREATE TASK ────────────────────────────────────────────────
    if (isCreateIntent) {
      const title = extractTaskTitle(rawQuery);

      if (!title) {
        response = "I couldn't figure out the task title. Try something like \"create a task to call the client tomorrow\".";
      } else {
        const dueDate  = parseDueDate(rawQuery);
        const priority = parsePriority(rawQuery);

        const newTask = await Task.create({
          title, status: 'todo', priority, dueDate, createdById: userId,
        });

        data     = [newTask];
        response = `✅ Created task: **${title}**\nPriority: ${priority}${dueDate ? `\nDue: ${dueDate.toLocaleDateString()}` : ''}`;
      }
    }

    // ── 2. MARK TASK COMPLETE ────────────────────────────────────────
    else if (completeMatch) {
      const taskName = completeMatch[1];
      const openTasks = await Task.findAll({
        where: { createdById: userId, status: { [Op.ne]: 'completed' } },
        attributes: ['id', 'title', 'status', 'priority', 'dueDate'],
      });

      const found = findBestTaskMatch(openTasks, taskName);

      if (found) {
        found.status = 'completed';
        await found.save();
        data     = [found];
        response = `🎉 Marked **${found.title}** as completed!`;
      } else {
        response = `I couldn't find a task matching "${taskName}". Check the title and try again?`;
      }
    }

    // ── 3. READ-ONLY QUERIES ──────────────────────────────────────────
    else {
      const [tasks, projects] = await Promise.all([
        Task.findAll({
          where: { createdById: userId },
          attributes: ['id', 'title', 'status', 'priority', 'dueDate', 'tags'],
          include: [{ association: 'project', attributes: ['name'] }]
        }),
        Project.findAll({
          where: { ownerId: userId },
          attributes: ['id', 'name', 'status', 'deadline', 'progress']
        })
      ]);

      if (lowerQuery.includes('this week')) {
        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const thisWeek = tasks.filter(t =>
          t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= weekFromNow && t.status !== 'completed'
        );
        data     = thisWeek;
        response = thisWeek.length > 0
          ? `📅 **${thisWeek.length}** task(s) due this week:\n${thisWeek.map(t => `• ${t.title} [${t.priority}]`).join('\n')}`
          : "Nothing due this week — you're all caught up!";
      }

      else if (lowerQuery.includes('this month')) {
        const monthFromNow = new Date(now);
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);
        const thisMonth = tasks.filter(t =>
          t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= monthFromNow && t.status !== 'completed'
        );
        data     = thisMonth;
        response = thisMonth.length > 0
          ? `🗓️ **${thisMonth.length}** task(s) due this month:\n${thisMonth.map(t => `• ${t.title} [${t.priority}]`).join('\n')}`
          : "Nothing due this month so far!";
      }

      else if (lowerQuery.includes('today')) {
        const todayTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate).toDateString() === now.toDateString() && t.status !== 'completed';
        });
        data     = todayTasks;
        response = todayTasks.length > 0
          ? `You have **${todayTasks.length}** task(s) due today:\n${todayTasks.map(t => `• ${t.title} [${t.priority}]`).join('\n')}`
          : "🎉 No tasks due today — you're clear!";
      }

      else if (lowerQuery.includes('overdue') || lowerQuery.includes('late') || lowerQuery.includes('missed')) {
        const overdue = tasks.filter(t =>
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed'
        );
        data     = overdue;
        response = overdue.length > 0
          ? `⚠️ You have **${overdue.length}** overdue task(s):\n${overdue.map(t => `• ${t.title}`).join('\n')}`
          : "✅ No overdue tasks! Great job staying on top of things.";
      }

      else if (lowerQuery.includes('high priority') || lowerQuery.includes('urgent') || lowerQuery.includes('important')) {
        const highPri = tasks.filter(t =>
          (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed'
        );
        data     = highPri;
        response = highPri.length > 0
          ? `🔴 **${highPri.length}** high-priority task(s):\n${highPri.map(t => `• ${t.title} [${t.priority}]`).join('\n')}`
          : "👍 No urgent tasks pending right now!";
      }

      else if (lowerQuery.includes('tag')) {
        const tagMatch = lowerQuery.match(/tag(?:ged)?\s*[:\s]\s*["']?([a-z0-9_\-]+)["']?/i)
          || lowerQuery.match(/with\s+tag\s+["']?([a-z0-9_\-]+)["']?/i);
        const tagName  = tagMatch ? tagMatch[1] : null;

        if (tagName) {
          const tagged = tasks.filter(t =>
            Array.isArray(t.tags) && t.tags.some(tag => tag.toLowerCase() === tagName.toLowerCase())
          );
          data     = tagged;
          response = tagged.length > 0
            ? `🏷️ **${tagged.length}** task(s) tagged "${tagName}":\n${tagged.map(t => `• ${t.title}`).join('\n')}`
            : `No tasks found with the tag "${tagName}".`;
        } else {
          response = "Tell me which tag to search for, like \"tasks tagged design\".";
        }
      }

      else if (lowerQuery.includes('project')) {
        const projMatch = lowerQuery.match(/project\s+["']?([a-z0-9 _\-]+?)["']?(?:\s+tasks)?$/i)
          || lowerQuery.match(/tasks?\s+(?:in|for|under)\s+["']?([a-z0-9 _\-]+)["']?/i);
        const projName  = projMatch ? projMatch[1].trim() : null;
        const matchedProject = projName
          ? projects.find(p => p.name.toLowerCase().includes(projName.toLowerCase()))
          : null;

        if (matchedProject) {
          const projTasks = tasks.filter(t => t.project?.name === matchedProject.name && t.status !== 'completed');
          data     = projTasks;
          response = projTasks.length > 0
            ? `📁 **${projTasks.length}** task(s) in "${matchedProject.name}":\n${projTasks.map(t => `• ${t.title}`).join('\n')}`
            : `No open tasks in "${matchedProject.name}".`;
        } else {
          const active = projects.filter(p => p.status === 'active');
          data     = active;
          response = active.length > 0
            ? `📁 **${active.length}** active project(s):\n${active.map(p => `• ${p.name} (${p.progress}% done)`).join('\n')}`
            : "No active projects at the moment.";
        }
      }

      else if (lowerQuery.includes('pending') || lowerQuery.includes('incomplete') || lowerQuery.includes('not done')) {
        const pending = tasks.filter(t => t.status !== 'completed');
        data     = pending;
        response = `You have **${pending.length}** pending task(s).`;
      }

      else if (lowerQuery.includes('next') || lowerQuery.includes('suggest') || lowerQuery.includes('what should')) {
        const order  = { urgent: 0, high: 1, medium: 2, low: 3 };
        const sorted = tasks
          .filter(t => t.status !== 'completed')
          .sort((a, b) => {
            const diff = (order[a.priority] || 2) - (order[b.priority] || 2);
            if (diff !== 0) return diff;
            if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
            return a.dueDate ? -1 : 1;
          });

        if (sorted.length > 0) {
          const next = sorted[0];
          data     = [next];
          response = `🎯 I suggest working on:\n**${next.title}**\nPriority: ${next.priority}${next.dueDate ? `\nDue: ${new Date(next.dueDate).toLocaleDateString()}` : ''}`;
        } else {
          response = "🎉 All tasks completed! Amazing work!";
        }
      }

      else if (lowerQuery.includes('summary') || lowerQuery.includes('overview') || lowerQuery.includes('status')) {
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending    = tasks.filter(t => t.status !== 'completed').length;
        const overdue    = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed').length;
        response = `📊 **Your Summary**\n• Total Tasks: ${tasks.length}\n• Completed: ${completed}\n• Pending: ${pending}\n• Overdue: ${overdue}\n• Active Projects: ${projects.filter(p => p.status === 'active').length}`;
      }

      else {
        response = `I can help you with:\n• "What tasks are due today?"\n• "What's due this week?"\n• "Show overdue tasks"\n• "High priority tasks"\n• "Tasks tagged design"\n• "Tasks in project Website Redesign"\n• "Suggest my next task"\n• "Give me a summary"\n• "Create a task to call the client tomorrow"\n• "Mark buy milk as done"`;
      }
    }

    res.json({ success: true, response, data });
  } catch (err) {
    console.error('AI query error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};