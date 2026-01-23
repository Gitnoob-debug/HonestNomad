/**
 * Generate HTML Preview for Manual Validation
 *
 * Creates an HTML page showing all downloaded images for review.
 * Open in browser, click to approve/reject, then run validate.ts
 *
 * Run with: npx tsx scripts/image-migration/generate-preview.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG, Manifest, Progress } from './config';

const MANIFEST_PATH = path.join(process.cwd(), CONFIG.MANIFEST_FILE);
const PROGRESS_PATH = path.join(process.cwd(), CONFIG.PROGRESS_FILE);
const PREVIEW_PATH = path.join(process.cwd(), CONFIG.PREVIEW_FILE);
const IMAGES_DIR = path.join(process.cwd(), CONFIG.IMAGES_DIR);

function loadManifest(): Manifest | null {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch (e) {}
  return null;
}

function loadProgress(): Progress | null {
  try {
    if (fs.existsSync(PROGRESS_PATH)) {
      return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    }
  } catch (e) {}
  return null;
}

function generateHTML(manifest: Manifest, progress: Progress): string {
  const destinations = Object.values(manifest.destinations)
    .filter(d => progress.pendingReview.includes(d.destinationId));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Migration Review</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      padding: 20px;
    }
    h1 { text-align: center; margin-bottom: 10px; }
    .stats { text-align: center; color: #888; margin-bottom: 30px; }
    .controls {
      position: sticky;
      top: 0;
      background: #1a1a2e;
      padding: 15px;
      border-bottom: 1px solid #333;
      margin-bottom: 20px;
      z-index: 100;
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
    }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .btn-approve { background: #22c55e; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .btn-export { background: #3b82f6; color: white; }
    .btn-skip { background: #666; color: white; }

    .destination {
      background: #16213e;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .destination-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }
    .destination-title {
      font-size: 1.5rem;
      font-weight: 600;
    }
    .destination-title .popular { color: #fbbf24; }
    .destination-status {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .status-pending { background: #f59e0b; color: #000; }
    .status-approved { background: #22c55e; color: #fff; }
    .status-rejected { background: #ef4444; color: #fff; }

    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
    }
    .image-card {
      position: relative;
      aspect-ratio: 3/4;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 3px solid transparent;
      transition: all 0.2s;
    }
    .image-card:hover { transform: scale(1.02); }
    .image-card.approved { border-color: #22c55e; }
    .image-card.rejected { border-color: #ef4444; opacity: 0.5; }
    .image-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .image-card .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.2s;
    }
    .image-card:hover .overlay { opacity: 1; }
    .image-card .credit {
      position: absolute;
      bottom: 5px;
      left: 5px;
      right: 5px;
      font-size: 10px;
      color: #fff;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .image-card:hover .credit { opacity: 1; }
    .image-card .badge {
      position: absolute;
      top: 5px;
      right: 5px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .badge-approved { background: #22c55e; }
    .badge-rejected { background: #ef4444; }

    .actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
    }

    .summary {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #16213e;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    @media (max-width: 768px) {
      .image-grid { grid-template-columns: repeat(3, 1fr); }
    }
  </style>
</head>
<body>
  <h1>📸 Image Migration Review</h1>
  <p class="stats">${destinations.length} destinations pending review | ${destinations.reduce((sum, d) => sum + d.images.length, 0)} total images</p>

  <div class="controls">
    <button class="btn-approve" onclick="approveAllVisible()">✓ Approve All Visible</button>
    <button class="btn-reject" onclick="rejectAllVisible()">✗ Reject All Visible</button>
    <button class="btn-export" onclick="exportDecisions()">💾 Export Decisions</button>
  </div>

  <div id="destinations">
    ${destinations.map(dest => `
      <div class="destination" data-id="${dest.destinationId}">
        <div class="destination-header">
          <h2 class="destination-title">
            ${dest.city}, ${dest.country}
          </h2>
          <span class="destination-status status-pending" data-status="pending">
            Pending Review
          </span>
        </div>

        <div class="image-grid">
          ${dest.images.map((img, i) => `
            <div class="image-card" data-dest="${dest.destinationId}" data-img="${img.filename}" onclick="toggleImage(this)">
              <img src="downloaded-images/${dest.destinationId}/${img.filename}" alt="${dest.city}" loading="lazy">
              <div class="overlay"></div>
              <div class="credit">${img.credit}</div>
              <div class="badge" style="display:none;"></div>
            </div>
          `).join('')}
        </div>

        <div class="actions">
          <button class="btn-approve" onclick="approveDestination('${dest.destinationId}')">✓ Approve All</button>
          <button class="btn-reject" onclick="rejectDestination('${dest.destinationId}')">✗ Reject All</button>
          <button class="btn-skip" onclick="skipDestination('${dest.destinationId}')">Skip</button>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="summary">
    <div>Approved: <span id="approvedCount">0</span></div>
    <div>Rejected: <span id="rejectedCount">0</span></div>
  </div>

  <script>
    const decisions = {};

    function toggleImage(el) {
      const dest = el.dataset.dest;
      const img = el.dataset.img;
      const key = dest + '/' + img;

      if (el.classList.contains('approved')) {
        el.classList.remove('approved');
        el.classList.add('rejected');
        decisions[key] = 'rejected';
        el.querySelector('.badge').innerHTML = '✗';
        el.querySelector('.badge').className = 'badge badge-rejected';
      } else if (el.classList.contains('rejected')) {
        el.classList.remove('rejected');
        delete decisions[key];
        el.querySelector('.badge').style.display = 'none';
      } else {
        el.classList.add('approved');
        decisions[key] = 'approved';
        el.querySelector('.badge').innerHTML = '✓';
        el.querySelector('.badge').className = 'badge badge-approved';
        el.querySelector('.badge').style.display = 'flex';
      }

      updateCounts();
      updateDestinationStatus(dest);
    }

    function approveDestination(destId) {
      document.querySelectorAll('.image-card[data-dest="' + destId + '"]').forEach(el => {
        el.classList.remove('rejected');
        el.classList.add('approved');
        const key = destId + '/' + el.dataset.img;
        decisions[key] = 'approved';
        el.querySelector('.badge').innerHTML = '✓';
        el.querySelector('.badge').className = 'badge badge-approved';
        el.querySelector('.badge').style.display = 'flex';
      });
      updateCounts();
      updateDestinationStatus(destId);
    }

    function rejectDestination(destId) {
      document.querySelectorAll('.image-card[data-dest="' + destId + '"]').forEach(el => {
        el.classList.remove('approved');
        el.classList.add('rejected');
        const key = destId + '/' + el.dataset.img;
        decisions[key] = 'rejected';
        el.querySelector('.badge').innerHTML = '✗';
        el.querySelector('.badge').className = 'badge badge-rejected';
        el.querySelector('.badge').style.display = 'flex';
      });
      updateCounts();
      updateDestinationStatus(destId);
    }

    function skipDestination(destId) {
      document.querySelectorAll('.image-card[data-dest="' + destId + '"]').forEach(el => {
        el.classList.remove('approved', 'rejected');
        const key = destId + '/' + el.dataset.img;
        delete decisions[key];
        el.querySelector('.badge').style.display = 'none';
      });
      updateCounts();
      updateDestinationStatus(destId);
    }

    function approveAllVisible() {
      document.querySelectorAll('.destination').forEach(dest => {
        approveDestination(dest.dataset.id);
      });
    }

    function rejectAllVisible() {
      document.querySelectorAll('.destination').forEach(dest => {
        rejectDestination(dest.dataset.id);
      });
    }

    function updateCounts() {
      const approved = Object.values(decisions).filter(v => v === 'approved').length;
      const rejected = Object.values(decisions).filter(v => v === 'rejected').length;
      document.getElementById('approvedCount').textContent = approved;
      document.getElementById('rejectedCount').textContent = rejected;
    }

    function updateDestinationStatus(destId) {
      const dest = document.querySelector('.destination[data-id="' + destId + '"]');
      const cards = dest.querySelectorAll('.image-card');
      const approved = dest.querySelectorAll('.image-card.approved').length;
      const rejected = dest.querySelectorAll('.image-card.rejected').length;
      const statusEl = dest.querySelector('.destination-status');

      if (approved === cards.length) {
        statusEl.textContent = 'Approved';
        statusEl.className = 'destination-status status-approved';
      } else if (rejected === cards.length) {
        statusEl.textContent = 'Rejected';
        statusEl.className = 'destination-status status-rejected';
      } else if (approved > 0 || rejected > 0) {
        statusEl.textContent = 'Partial (' + approved + '/' + cards.length + ')';
        statusEl.className = 'destination-status status-pending';
      } else {
        statusEl.textContent = 'Pending Review';
        statusEl.className = 'destination-status status-pending';
      }
    }

    function exportDecisions() {
      const blob = new Blob([JSON.stringify(decisions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'validation-decisions.json';
      a.click();
      URL.revokeObjectURL(url);
      alert('Decisions exported! Save the file to scripts/image-migration/ and run:\\nnpx tsx scripts/image-migration/apply-validation.ts');
    }
  </script>
</body>
</html>`;
}

function main() {
  console.log('\n📄 Generating preview HTML...\n');

  const manifest = loadManifest();
  const progress = loadProgress();

  if (!manifest || !progress) {
    console.error('❌ No manifest or progress found. Run migrate-images.ts first.\n');
    process.exit(1);
  }

  if (progress.pendingReview.length === 0) {
    console.log('✅ No images pending review!\n');
    return;
  }

  const html = generateHTML(manifest, progress);
  fs.writeFileSync(PREVIEW_PATH, html);

  console.log(`✅ Preview generated: ${CONFIG.PREVIEW_FILE}`);
  console.log(`   Open in browser to review images.`);
  console.log(`   Click images to approve/reject, then export decisions.\n`);
}

main();
