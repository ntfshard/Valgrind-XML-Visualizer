# Valgrind XML Visualizer (`valgrind-webui`)

A fast, client-side, minimalist visualizer for Valgrind XML reports designed for C/C++ developers. Hosted completely on **GitHub Pages** with **zero external dependencies** and **no build step**.

---

## Features

- **100% Client-Side:** Parses XML in your browser using the native `DOMParser` Web API. Your code and logs never leave your machine.
- **Zero External Dependencies / Vendored Only:** No CDN requests, no external fonts, no npm packages. Resistant to network outages and supply-chain vulnerabilities.
- **Multi-Tool Compatibility:** Supports reports from:
  - `memcheck` (memory corruption, leaks, uninitialized values)
  - `helgrind` & `drd` (data races, lock order inversions)
- **Smart Deduplication:** Automatically groups identical errors occurring repeatedly across loops or threads, showing total occurrence count (`× N`) and associated thread IDs.
- **Granular Filtering:**
  - **Filename / Path Filter:** Real-time search by source file or directory.
  - **Function Name Filter:** Real-time search by function signature.
  - **Error Kind Filter:** Filter by category (Memory Corruption, Leaks, Uninitialized, Concurrency) or specific error kinds.
  - **System Frame Filtering:** Dim or collapse non-user frames (`libc`, `ld-linux`, `libstdc++`, etc.) to focus on your code.
- **Developer Utilities:**
  - 1-click **Copy Suppression Rule** for `.supp` files.
  - 1-click **Copy Stack** formatted as Markdown for GitHub / Jira issues.
  - Dark / Light theme toggle.

---

## How to Generate Valgrind XML Reports

To produce XML output suitable for this visualizer, run Valgrind with `--xml=yes` and `--xml-file=<output.xml>`.

### 1. Memcheck (Memory Leaks & Corruptions)
```bash
valgrind --tool=memcheck \
         --xml=yes \
         --xml-file=memcheck.xml \
         --leak-check=full \
         --show-leak-kinds=all \
         --track-origins=yes \
         ./your_binary [args...]
```

### 2. Helgrind (Thread Race & Lock Inversion)
```bash
valgrind --tool=helgrind \
         --xml=yes \
         --xml-file=helgrind.xml \
         ./your_multithreaded_binary [args...]
```

### 3. DRD (Thread Error Detector)
```bash
valgrind --tool=drd \
         --xml=yes \
         --xml-file=drd.xml \
         ./your_multithreaded_binary [args...]
```

---

## Hosting on GitHub Pages (Zero Build Steps)

Because this project is written in pure vanilla HTML, CSS, and modern ES6 modules, it requires **no npm, Webpack, or Vite build**:

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of valgrind-webui"
   git branch -M main
   git remote add origin https://github.com/<your-username>/valgrind-webui.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select Branch: `main` and folder: `/ (root)`.
   - Click **Save**.
3. Your visualizer is now live at `https://<your-username>.github.io/valgrind-webui/`.

---

## Running Locally

To run locally in a web browser:

### Option A: Python HTTP Server (Recommended)
```bash
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

### Option B: Node.js (if installed)
```bash
npx serve .
```

### Option C: VS Code / IDE
Install the "Live Server" extension and click **Go Live**.

---

## Project Structure

```text
valgrind_webui/
├── index.html            # Application entrypoint & layout
├── css/
│   └── styles.css        # Minimalist, dark/light theme CSS
├── js/
│   ├── app.js            # Main application orchestrator & events
│   ├── parser.js         # Valgrind XML DOMParser module
│   ├── dedup.js          # Grouping & deduplication engine
│   ├── filter.js         # Filename, function, and kind filtering
│   ├── ui.js             # Minimalist DOM renderer & clipboard tools
│   └── samples.js        # Embedded sample reports for offline exploration
├── samples/
│   ├── memcheck_sample.xml  # Sample Memcheck XML report
│   └── helgrind_sample.xml  # Sample Helgrind XML report
├── SPEC.md               # Technical specification document
└── README.md             # This file
```

---

## License
MIT
