const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const previewContainer = document.getElementById('previewContainer');
        const previewGrid = document.getElementById('previewGrid');
        const fileInfo = document.getElementById('fileInfo');
        const convertBtn = document.getElementById('convertBtn');
        const clearBtn = document.getElementById('clearBtn');
        const loading = document.getElementById('loading');

        let selectedFiles = [];

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(file =>
                file.type === 'image/jpeg' || file.type === 'image/jpg'
            );
            handleFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleFiles(files);
        });

        function handleFiles(files) {
            if (files.length === 0) return;

            selectedFiles = [...selectedFiles, ...files];
            updatePreview();
            previewContainer.style.display = 'block';
        }

        function updatePreview() {
            previewGrid.innerHTML = '';
            fileInfo.textContent = `${selectedFiles.length} image${selectedFiles.length !== 1 ? 's' : ''} selected`;

            selectedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button class="remove-btn" onclick="removeFile(${index})">×</button>
                    `;
                    previewGrid.appendChild(div);
                };
                reader.readAsDataURL(file);
            });

            if (selectedFiles.length === 0) {
                previewContainer.style.display = 'none';
            }
        }

        window.removeFile = function(index) {
            selectedFiles.splice(index, 1);
            updatePreview();
        };

        clearBtn.addEventListener('click', () => {
            selectedFiles = [];
            fileInput.value = '';
            updatePreview();
        });

        convertBtn.addEventListener('click', async () => {
            if (selectedFiles.length === 0) return;

            loading.style.display = 'block';
            convertBtn.disabled = true;

            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF();
                let isFirstPage = true;

                for (const file of selectedFiles) {
                    const imageData = await readFileAsDataURL(file);
                    const img = await loadImage(imageData);

                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

                    const width = imgWidth * ratio;
                    const height = imgHeight * ratio;
                    const x = (pageWidth - width) / 2;
                    const y = (pageHeight - height) / 2;

                    if (!isFirstPage) {
                        pdf.addPage();
                    }

                    pdf.addImage(imageData, 'JPEG', x, y, width, height);
                    isFirstPage = false;
                }

                pdf.save('converted.pdf');
            } catch (error) {
                alert('Error converting to PDF: ' + error.message);
            } finally {
                loading.style.display = 'none';
                convertBtn.disabled = false;
            }
        });

        function readFileAsDataURL(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }
