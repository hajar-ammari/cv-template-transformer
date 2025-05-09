document.getElementById('transformForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const transformBtn = document.getElementById('transformBtn');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    error.classList.add('hidden');
    transformBtn.disabled = true;
    
    try {
      const formData = new FormData(form);
      
      const response = await fetch('/transform', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = data.downloadUrl;
        downloadLink.textContent = `Download ${data.filename}`;
        result.classList.remove('hidden');
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (err) {
      document.getElementById('errorMessage').textContent = err.message;
      error.classList.remove('hidden');
    } finally {
      loading.classList.add('hidden');
      transformBtn.disabled = false;
    }
  });