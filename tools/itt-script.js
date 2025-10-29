
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadButton = document.getElementById('uploadButton');
        const startOverButton = document.getElementById('startOverButton');
        const uploadContent = document.getElementById('uploadContent');
        const processingContent = document.getElementById('processingContent');
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');

        let extractedResults = [];

        // Only trigger file input when clicking the upload button
        uploadButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up to upload area
            if (!uploadArea.classList.contains('processing')) {
                fileInput.click();
            }
        });

        // Start Over button functionality
        startOverButton.addEventListener('click', () => {
            extractedResults = [];
            renderResults();
            fileInput.value = '';
            startOverButton.style.display = 'none';
        });

        uploadArea.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!uploadArea.classList.contains('processing')) {
                uploadArea.classList.add('drag-over');
            }
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');

            if (!uploadArea.classList.contains('processing')) {
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFile(files[0]);
                }
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        async function handleFile(file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            uploadArea.classList.add('processing');
            uploadContent.style.display = 'none';
            processingContent.style.display = 'block';

            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const imageData = e.target.result;
                        const base64Data = imageData.split(',')[1] || imageData;

                        const formData = new FormData();
                        formData.append('base64Image', `data:image/jpeg;base64,${base64Data}`);
                        formData.append('language', 'eng');
                        formData.append('isOverlayRequired', 'false');
                        formData.append('detectOrientation', 'true');
                        formData.append('scale', 'true');
                        formData.append('OCREngine', '2');

                        const response = await fetch('https://api.ocr.space/parse/image', {
                            method: 'POST',
                            headers: {
                                'apikey': 'K87847422888957',
                            },
                            body: formData,
                        });

                        const result = await response.json();

                        if (result.IsErroredOnProcessing) {
                            throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
                        }

                        const extractedText = result.ParsedResults?.[0]?.ParsedText || '';
                        const lines = result.ParsedResults?.[0]?.TextOverlay?.Lines || [];
                        const confidenceScore = lines.length > 0
                            ? lines.reduce((acc, line) => acc + (line.MaxConfidence || 0), 0) / lines.length
                            : null;

                        addResult({
                            id: Date.now().toString(),
                            filename: file.name,
                            text: extractedText.trim(),
                            confidence: confidenceScore,
                        });

                        fileInput.value = '';
                    } catch (error) {
                        console.error('Error processing image:', error);
                        alert('Failed to process image: ' + error.message);
                    } finally {
                        uploadArea.classList.remove('processing');
                        uploadContent.style.display = 'block';
                        processingContent.style.display = 'none';
                    }
                };

                reader.onerror = () => {
                    alert('Failed to read file');
                    uploadArea.classList.remove('processing');
                    uploadContent.style.display = 'block';
                    processingContent.style.display = 'none';
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred: ' + error.message);
                uploadArea.classList.remove('processing');
                uploadContent.style.display = 'block';
                processingContent.style.display = 'none';
            }
        }

        function addResult(result) {
            extractedResults.unshift(result);
            renderResults();
            startOverButton.style.display = 'inline-block';
        }

        function renderResults() {
            if (extractedResults.length === 0) {
                resultsSection.classList.remove('visible');
                return;
            }

            resultsSection.classList.add('visible');
            resultsContainer.innerHTML = extractedResults.map(result => `
                <div class="result-card">
                    <div class="result-header">
                        <div class="result-info">
                            <svg class="success-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p class="filename">${escapeHtml(result.filename)}</p>
                                ${result.confidence ? `<p class="confidence">Confidence: ${Math.round(result.confidence)}%</p>` : ''}
                            </div>
                        </div>
                        <button class="copy-button" onclick="copyToClipboard('${result.id}', \`${escapeHtml(result.text).replace(/`/g, '\\`')}\`)">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                            <span id="copy-text-${result.id}">Copy</span>
                        </button>
                    </div>
                    ${result.text ? `
                        <div class="text-content">
                            <pre>${escapeHtml(result.text)}</pre>
                        </div>
                    ` : `
                        <div class="no-text-alert">
                            <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <div class="alert-content">
                                <p class="alert-title">No text detected</p>
                                <p class="alert-message">Try uploading a clearer image with visible text</p>
                            </div>
                        </div>
                    `}
                </div>
            `).join('');
        }

        function copyToClipboard(id, text) {
            navigator.clipboard.writeText(text).then(() => {
                const copyTextElement = document.getElementById(`copy-text-${id}`);
                const originalText = copyTextElement.innerHTML;
                copyTextElement.innerHTML = 'Copied';
                setTimeout(() => {
                    copyTextElement.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy text to clipboard');
            });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
  <footer>
    <div class="footer-container">
      <div class="footer-column">
        <h4>Quick Links</h4>
        <a href="https://dhirajgurung.com.np/tools.html">Tools</a>
        <a href="https://dhirajgurung.com.np/about.html">About</a>
        <a href="https://dhirajgurung.com.np/contact.html">Contact</a>
        <a href="https://dhirajgurung.com.np/faq.html">FAQ</a>
      </div>
      <div class="footer-column">
        <h4>Important Pages</h4>
        <a href="https://dhirajgurung.com.np/privacy-policy.html">Privacy Policy</a>
        <a href="https://dhirajgurung.com.np/disclaimer.html">Disclaimer</a>
        <a href="https://dhirajgurung.com.np/terms-of-use.html">Terms of Use</a>
      </div>
    </div>
    <div class="footer-text">
       <p id="copyright"></p>
      </div> 
  </footer>
  <script>
document.addEventListener("DOMContentLoaded", function () {
  let copyrightElement = document.getElementById("copyright");
  if (copyrightElement) {
    copyrightElement.textContent = `© ${new Date().getFullYear()} dhirajgurung.com.np`;
  }
});
