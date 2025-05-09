document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('uploadForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  const resultContainer = document.getElementById('result');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Processing...';
    btnLoader.classList.remove('hidden');

    // Clear previous results
    resultContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Processing your resume...</p>
      </div>
    `;

    try {
      const formData = new FormData(form);

      const response = await fetch('/transform', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unknown server error');
      }

      const data = await response.json();

      resultContainer.innerHTML = `
        <div class="result-item">
          <i class="fas fa-check-circle result-icon" style="color: var(--success)"></i>
          <div class="result-content">
            <div class="result-title">${data.message}</div>
            <div class="result-desc">Download your transformed resume in different formats</div>
          </div>
          <div class="download-actions">
            <button class="download-btn" onclick="window.location.href='${data.downloadHtml}'">
              <i class="fas fa-file-code"></i> HTML
            </button>
            <button class="download-btn" onclick="window.location.href='${data.downloadDocx}'">
              <i class="fas fa-file-word"></i> DOCX
            </button>
            <button class="download-btn" onclick="window.location.href='${data.downloadPdf}'">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
      `;
    } catch (error) {
      resultContainer.innerHTML = `
        <div class="result-item">
          <i class="fas fa-times-circle result-icon" style="color: var(--danger)"></i>
          <div class="result-content">
            <div class="result-title">Error Processing Resume</div>
            <div class="result-desc">${error.message}</div>
          </div>
          <button class="download-btn" onclick="location.reload()">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      `;
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Transform Resume';
      btnLoader.classList.add('hidden');
    }
  });

  // Tab switching (optional)
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  // File preview
  const fileInputs = document.querySelectorAll('.file-input');
  fileInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const fileName = e.target.files[0]?.name || 'No file selected';
      const label = e.target.closest('.upload-label');
      if (label) {
        const span = label.querySelector('span');
        if (span) span.textContent = fileName;
      }
    });
  });
});
