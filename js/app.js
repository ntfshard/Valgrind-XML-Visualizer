/**
 * Valgrind WebUI Application Orchestrator
 */

import { ValgrindParser } from './parser.js';
import { ErrorDeduplicator } from './dedup.js';
import { ErrorFilter } from './filter.js';
import { UIRenderer } from './ui.js';
import { SAMPLES } from './samples.js';

class App {
  constructor() {
    this.currentReport = null;
    this.rawErrors = [];
    this.dedupGroups = [];
    this.activeCriteria = {
      fileFilter: '',
      fnFilter: '',
      kindFilter: 'all',
      userCodeOnly: false
    };
    this.dedupEnabled = true;
    this.hideSystemFrames = false;
    this.currentPage = 1;
    this.pageSize = 50;

    // Cache DOM Elements
    this.dropZone = document.getElementById('dropZone');
    this.fileInput = document.getElementById('fileInput');
    this.sampleSelect = document.getElementById('sampleSelect');
    this.filterFile = document.getElementById('filterFile');
    this.filterFn = document.getElementById('filterFn');
    this.filterKind = document.getElementById('filterKind');
    this.dedupToggle = document.getElementById('dedupToggle');
    this.hideSystemToggle = document.getElementById('hideSystemToggle');
    this.userCodeToggle = document.getElementById('userCodeToggle');
    this.btnClearFilters = document.getElementById('btnClearFilters');
    this.themeToggle = document.getElementById('themeToggle');
    this.summaryContainer = document.getElementById('summaryContainer');
    this.errorContainer = document.getElementById('errorContainer');
    this.paginationTop = document.getElementById('paginationTop');
    this.paginationBottom = document.getElementById('paginationBottom');

    this.init();
  }

  init() {
    this.setupTheme();
    this.setupEventListeners();
    this.setupDragAndDrop();

    // Check if URL has ?sample=... or automatically load Memcheck sample on initial visit
    const urlParams = new URLSearchParams(window.location.search);
    const sampleParam = urlParams.get('sample');
    if (sampleParam && SAMPLES[sampleParam]) {
      this.loadXmlString(SAMPLES[sampleParam]);
      this.sampleSelect.value = sampleParam;
    } else {
      // Default initial view: load memcheck sample so page is never blank
      this.loadXmlString(SAMPLES.memcheck);
      this.sampleSelect.value = 'memcheck';
    }
  }

  setupEventListeners() {
    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.readFile(file);
      }
    });

    // Sample selection
    this.sampleSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val && SAMPLES[val]) {
        this.loadXmlString(SAMPLES[val]);
      }
    });

    // Debounced text filters
    let debounceTimer;
    const onSearchChange = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.activeCriteria.fileFilter = this.filterFile.value;
        this.activeCriteria.fnFilter = this.filterFn.value;
        this.currentPage = 1;
        this.render();
      }, 150);
    };

    this.filterFile.addEventListener('input', onSearchChange);
    this.filterFn.addEventListener('input', onSearchChange);

    // Kind filter
    this.filterKind.addEventListener('change', (e) => {
      this.activeCriteria.kindFilter = e.target.value;
      this.currentPage = 1;
      this.render();
    });

    // Deduplication toggle
    this.dedupToggle.addEventListener('change', (e) => {
      this.dedupEnabled = e.target.checked;
      this.currentPage = 1;
      this.recomputeDeduplication();
      this.render();
    });

    // Hide system frames toggle
    this.hideSystemToggle.addEventListener('change', (e) => {
      this.hideSystemFrames = e.target.checked;
      this.render();
    });

    // User code only toggle
    this.userCodeToggle.addEventListener('change', (e) => {
      this.activeCriteria.userCodeOnly = e.target.checked;
      this.currentPage = 1;
      this.render();
    });

    // Clear filters button
    this.btnClearFilters.addEventListener('click', () => {
      this.filterFile.value = '';
      this.filterFn.value = '';
      this.filterKind.value = 'all';
      this.userCodeToggle.checked = false;
      this.activeCriteria = {
        fileFilter: '',
        fnFilter: '',
        kindFilter: 'all',
        userCodeOnly: false
      };
      this.currentPage = 1;
      this.render();
    });

    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('valgrind-theme', nextTheme);
      this.themeToggle.textContent = nextTheme === 'dark' ? '☀ Light' : '☾ Dark';
    });
  }

  setupDragAndDrop() {
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('dragover');
      }, false);
    });

    this.dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        this.readFile(files[0]);
      }
    });

    this.dropZone.addEventListener('click', () => {
      this.fileInput.click();
    });
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('valgrind-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.themeToggle.textContent = savedTheme === 'dark' ? '☀ Light' : '☾ Dark';
  }

  readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        this.loadXmlString(text);
        UIRenderer.showToast(`Loaded: ${file.name}`);
        this.sampleSelect.value = '';
      } catch (err) {
        alert(`Failed to load file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      alert('Error reading file from disk.');
    };
    reader.readAsText(file);
  }

  loadXmlString(xmlString) {
    try {
      this.currentReport = ValgrindParser.parse(xmlString);
      this.rawErrors = this.currentReport.errors;
      this.currentPage = 1;
      this.populateKindFilterOptions();
      this.recomputeDeduplication();
      this.render();
    } catch (err) {
      alert(`Error parsing Valgrind XML: ${err.message}`);
    }
  }

  recomputeDeduplication() {
    this.dedupGroups = ErrorDeduplicator.process(this.rawErrors, this.dedupEnabled);
  }

  populateKindFilterOptions() {
    const { kinds, categories } = ErrorFilter.getFilterOptions(this.rawErrors);
    
    let html = `<option value="all">All Categories &amp; Kinds</option>`;
    
    if (categories.length > 0) {
      html += `<optgroup label="Categories">`;
      categories.forEach(cat => {
        html += `<option value="${cat}">${this.formatCategoryName(cat)}</option>`;
      });
      html += `</optgroup>`;
    }

    if (kinds.length > 0) {
      html += `<optgroup label="Specific Kinds">`;
      kinds.forEach(k => {
        html += `<option value="${k}">${k}</option>`;
      });
      html += `</optgroup>`;
    }

    this.filterKind.innerHTML = html;
    this.filterKind.value = this.activeCriteria.kindFilter;
  }

  formatCategoryName(cat) {
    switch (cat) {
      case 'memory_corruption': return 'Memory Corruption (Invalid Read/Write)';
      case 'leak': return 'Memory Leaks (Lost/Reachable)';
      case 'uninitialized': return 'Uninitialized Values';
      case 'concurrency': return 'Concurrency / Threading Issues';
      default: return 'Other Errors';
    }
  }

  render() {
    if (!this.currentReport) return;

    // Apply active filter pipeline
    const filteredGroups = ErrorFilter.apply(this.dedupGroups, this.activeCriteria);
    const totalItems = filteredGroups.length;

    // Calculate pagination
    const totalPages = this.pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / this.pageSize));
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    const pageGroups = this.pageSize === 'all'
      ? filteredGroups
      : filteredGroups.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

    // Render Summary dashboard
    UIRenderer.renderSummary(
      this.summaryContainer,
      this.currentReport,
      filteredGroups.length,
      this.dedupGroups.length
    );

    // Render Pagination (Top & Bottom)
    const onPageChange = (newPage) => {
      this.currentPage = newPage;
      this.render();
      window.scrollTo({ top: this.summaryContainer.offsetTop - 10, behavior: 'smooth' });
    };

    const onPageSizeChange = (newSize) => {
      this.pageSize = newSize;
      this.currentPage = 1;
      this.render();
    };

    UIRenderer.renderPagination(
      this.paginationTop,
      this.currentPage,
      totalPages,
      totalItems,
      this.pageSize,
      onPageChange,
      onPageSizeChange
    );

    UIRenderer.renderPagination(
      this.paginationBottom,
      this.currentPage,
      totalPages,
      totalItems,
      this.pageSize,
      onPageChange,
      onPageSizeChange
    );

    // Render Error Cards for current page
    UIRenderer.renderErrorList(this.errorContainer, pageGroups, {
      hideSystem: this.hideSystemFrames
    });
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
