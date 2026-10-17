/**
 * UI Rendering and DOM Components
 * Minimalist, high-density, accessible DOM renderer with zero external dependencies.
 */

export class UIRenderer {
  /**
   * Escape HTML entities to prevent XSS from parsed files
   */
  static escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format byte sizes into readable units (B, KB, MB)
   */
  static formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Render Report Header & Summary stats
   */
  static renderSummary(container, report, displayedCount, totalDedupCount) {
    if (!report) {
      container.innerHTML = '';
      return;
    }

    const { tool, pid, command, stats } = report;
    const isMemcheck = tool.toLowerCase().includes('memcheck');

    let leakStatHtml = '';
    if (isMemcheck && stats.totalLeakedBytes > 0) {
      leakStatHtml = `
        <div class="summary-badge leak-stat">
          <span class="label">Memory Leaked</span>
          <span class="value">${this.formatBytes(stats.totalLeakedBytes)} (${stats.totalLeakedBlocks} blocks)</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="report-meta">
        <div class="meta-row">
          <span class="badge tool-badge">${this.escapeHtml(tool.toUpperCase())}</span>
          ${pid ? `<span class="badge pid-badge">PID: ${this.escapeHtml(pid)}</span>` : ''}
          ${command ? `<span class="command-line" title="${this.escapeHtml(command)}"><code>$ ${this.escapeHtml(command)}</code></span>` : ''}
        </div>
      </div>
      <div class="summary-stats">
        <div class="summary-badge">
          <span class="label">Displayed</span>
          <span class="value">${displayedCount} / ${totalDedupCount}</span>
        </div>
        <div class="summary-badge">
          <span class="label">Raw Errors</span>
          <span class="value">${stats.totalErrors}</span>
        </div>
        ${leakStatHtml}
      </div>
    `;
  }

  /**
   * Render Error Cards List
   */
  static renderErrorList(container, groups, options = {}) {
    if (!groups || groups.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No errors match the current filter criteria.</p>
        </div>
      `;
      return;
    }

    const html = groups.map((group, idx) => this.renderErrorCard(group, idx, options)).join('');
    container.innerHTML = html;

    // Attach interactive listeners for copy buttons and details toggling
    this.attachCardListeners(container);
  }

  static renderPagination(container, currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange) {
    if (!container) return;
    if (totalItems === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    const isFirst = currentPage <= 1;
    const isLast = currentPage >= totalPages;

    const startIdx = (currentPage - 1) * (pageSize === 'all' ? totalItems : pageSize) + 1;
    const endIdx = pageSize === 'all' ? totalItems : Math.min(currentPage * pageSize, totalItems);

    container.innerHTML = `
      <div class="pagination-info">
        Showing <strong>${startIdx}–${endIdx}</strong> of <strong>${totalItems}</strong>
      </div>
      <div class="pagination-controls">
        <button class="btn btn-sm btn-prev" ${isFirst ? 'disabled' : ''}>← Previous</button>
        <span class="page-indicator">Page ${currentPage} of ${totalPages}</span>
        <button class="btn btn-sm btn-next" ${isLast ? 'disabled' : ''}>Next →</button>
        <div class="page-size-selector">
          <label>Per page:</label>
          <select class="btn btn-sm select-page-size">
            <option value="50" ${pageSize == 50 ? 'selected' : ''}>50</option>
            <option value="100" ${pageSize == 100 ? 'selected' : ''}>100</option>
            <option value="250" ${pageSize == 250 ? 'selected' : ''}>250</option>
            <option value="all" ${pageSize === 'all' ? 'selected' : ''}>All</option>
          </select>
        </div>
      </div>
    `;

    container.querySelector('.btn-prev')?.addEventListener('click', () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    });
    container.querySelector('.btn-next')?.addEventListener('click', () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    });
    container.querySelector('.select-page-size')?.addEventListener('change', (e) => {
      const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
      onPageSizeChange(val);
    });
  }

  static renderErrorCard(group, index, options) {
    const err = group.primary;
    const count = group.count;
    const threads = group.threads || [];
    const threadNames = group.threadNames || [];
    const cardId = `card-${index}`;

    // Color code category class
    const categoryClass = `category-${err.category || 'other'}`;

    // Top location hint
    const topFrame = this.getTopRelevantFrame(err.primaryStack);
    const locationHint = topFrame
      ? `<span class="location-hint">${this.escapeHtml(topFrame.file || topFrame.obj)}:${topFrame.line || '?'}</span>`
      : '';

    const functionHint = topFrame && topFrame.fn
      ? `<span class="function-hint">in <code>${this.escapeHtml(topFrame.fn)}</code></span>`
      : '';

    // Count badge
    const countBadge = count > 1
      ? `<span class="count-badge" title="Occurred ${count} times across threads [${threads.join(', ')}]">× ${count}</span>`
      : '';

    // Thread tag display
    let tidTag = '';
    if (threads.length > 0) {
      const threadStr = threads.length > 5 
        ? `${threads.slice(0, 5).join(', ')}... (+${threads.length - 5})` 
        : threads.join(', ');

      const namesStr = threadNames.length > 0
        ? ` (${threadNames.slice(0, 2).join(', ')}${threadNames.length > 2 ? '...' : ''})`
        : '';

      tidTag = `<span class="tid-tag" title="Thread IDs: ${threads.join(', ')}">TID: ${this.escapeHtml(threadStr + namesStr)}</span>`;
    }

    // Render primary call stack
    const primaryStackHtml = this.renderStack(err.primaryStack, 'Primary Stack Trace', options);

    // Render auxiliary stacks (allocation site, conflicting thread, etc.)
    const auxHtml = (err.auxiliary || []).map((aux, aIdx) => `
      <div class="aux-block">
        <div class="aux-note">${this.escapeHtml(aux.info)}</div>
        ${aux.stack ? this.renderStack(aux.stack, `Auxiliary Stack #${aIdx + 1}`, options) : ''}
      </div>
    `).join('');

    // Suppression button & snippet
    let suppressionHtml = '';
    if (err.suppression) {
      suppressionHtml = `
        <details class="suppression-details">
          <summary>Valgrind Suppression Rule</summary>
          <div class="suppression-code-wrapper">
            <pre><code>${this.escapeHtml(err.suppression)}</code></pre>
            <button class="btn btn-sm btn-copy-suppression" data-supp="${encodeURIComponent(err.suppression)}">Copy Rule</button>
          </div>
        </details>
      `;
    }

    return `
      <div class="error-card ${categoryClass}" id="${cardId}">
        <div class="card-header">
          <div class="header-left">
            <span class="badge kind-badge ${categoryClass}">${this.escapeHtml(err.kind)}</span>
            ${countBadge}
            <span class="error-msg">${this.escapeHtml(err.what)}</span>
          </div>
          <div class="header-right">
            ${tidTag}
          </div>
        </div>

        <div class="card-subhead">
          ${locationHint}
          ${functionHint}
        </div>

        <div class="card-body">
          ${primaryStackHtml}
          ${auxHtml}
          ${suppressionHtml}
        </div>

        <div class="card-footer">
          <button class="btn btn-sm btn-copy-stack" data-card="${cardId}">Copy Stack</button>
          ${err.unique ? `<span class="unique-id">Ref: ${this.escapeHtml(err.unique)}</span>` : ''}
        </div>
      </div>
    `;
  }

  static renderStack(stack, title, options) {
    if (!stack || !stack.frames || stack.frames.length === 0) {
      return '';
    }

    const { hideSystem = false } = options;

    const frameRows = stack.frames.map((frame, idx) => {
      const isSys = frame.isSystem;
      if (hideSystem && isSys) {
        return '';
      }

      const rowClass = isSys ? 'frame-row frame-system' : 'frame-row frame-user';
      const locText = frame.file 
        ? `${frame.file}:${frame.line || '?'}`
        : (frame.obj || '???');

      return `
        <tr class="${rowClass}">
          <td class="col-num">#${idx}</td>
          <td class="col-ip"><code>${this.escapeHtml(frame.ip || '')}</code></td>
          <td class="col-fn"><code>${this.escapeHtml(frame.fn || '(unknown function)')}</code></td>
          <td class="col-loc" title="${this.escapeHtml((frame.dir ? frame.dir + '/' : '') + locText)}">
            ${this.escapeHtml(locText)}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="stack-container">
        <div class="stack-title">${this.escapeHtml(title)}</div>
        <table class="stack-table">
          <thead>
            <tr>
              <th class="col-num">#</th>
              <th class="col-ip">IP</th>
              <th class="col-fn">Function</th>
              <th class="col-loc">Location</th>
            </tr>
          </thead>
          <tbody>
            ${frameRows}
          </tbody>
        </table>
      </div>
    `;
  }

  static getTopRelevantFrame(stack) {
    if (!stack || !stack.frames || stack.frames.length === 0) return null;
    // Prefer first frame with file & line that is not system
    const userFrame = stack.frames.find(f => !f.isSystem && f.file);
    if (userFrame) return userFrame;
    // Fallback to first frame with file
    const fileFrame = stack.frames.find(f => f.file);
    if (fileFrame) return fileFrame;
    // Fallback to top frame
    return stack.frames[0];
  }

  static attachCardListeners(container) {
    // Copy suppression rule
    container.querySelectorAll('.btn-copy-suppression').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = decodeURIComponent(e.target.getAttribute('data-supp') || '');
        this.copyToClipboard(text, 'Suppression copied to clipboard');
      });
    });

    // Copy stack as Markdown
    container.querySelectorAll('.btn-copy-stack').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cardId = e.target.getAttribute('data-card');
        const card = document.getElementById(cardId);
        if (!card) return;

        const kind = card.querySelector('.kind-badge')?.textContent || '';
        const msg = card.querySelector('.error-msg')?.textContent || '';
        
        let md = `**Valgrind Error: ${kind}**\n> ${msg}\n\n`;
        const tables = card.querySelectorAll('.stack-container');
        tables.forEach(table => {
          const title = table.querySelector('.stack-title')?.textContent || 'Stack';
          md += `### ${title}\n\`\`\`\n`;
          table.querySelectorAll('tbody tr').forEach(row => {
            const num = row.querySelector('.col-num')?.textContent.trim() || '';
            const fn = row.querySelector('.col-fn')?.textContent.trim() || '';
            const loc = row.querySelector('.col-loc')?.textContent.trim() || '';
            md += `${num.padEnd(5)} ${fn.padEnd(45)} at ${loc}\n`;
          });
          md += `\`\`\`\n\n`;
        });

        this.copyToClipboard(md, 'Markdown stack trace copied');
      });
    });
  }

  static copyToClipboard(text, toastMsg = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(toastMsg);
    }).catch(err => {
      console.error('Failed to copy to clipboard', err);
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast(toastMsg);
    });
  }

  static showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show';
    setTimeout(() => {
      toast.className = 'toast';
    }, 2500);
  }
}
