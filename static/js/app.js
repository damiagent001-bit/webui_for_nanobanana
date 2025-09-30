// Web UI for Large Models - Frontend JavaScript

class WebUIManager {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.currentSection = 'textToImageSection';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadApiKey();
        this.setupFileUpload();
        this.switchSection(this.currentSection, 'textToImageBtn'); // 初始化显示默认区域
    }

    bindEvents() {
        // API Key 相关事件
        const apiKeyBtn = document.getElementById('apiKeyBtn');
        if (apiKeyBtn) {
            apiKeyBtn.addEventListener('click', () => this.showApiKeyModal());
        }
        
        const saveApiKey = document.getElementById('saveApiKey');
        if (saveApiKey) {
            saveApiKey.addEventListener('click', () => this.saveApiKey());
        }
        
        const saveModalApiKey = document.getElementById('saveModalApiKey');
        if (saveModalApiKey) {
            saveModalApiKey.addEventListener('click', () => this.saveApiKeyFromModal());
        }
        
        const cancelApiKey = document.getElementById('cancelApiKey');
        if (cancelApiKey) {
            cancelApiKey.addEventListener('click', () => this.hideApiKeyModal());
        }
        
        // 为主输入框添加失去焦点时自动保存功能
        const mainApiKeyInput = document.getElementById('apiKey');
        if (mainApiKeyInput) {
            mainApiKeyInput.addEventListener('blur', () => this.autoSaveApiKey());
            mainApiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    mainApiKeyInput.blur(); // 触发保存
                }
            });
        }
        
        // 功能按钮事件
        const textToImageBtn = document.getElementById('textToImageBtn');
        if (textToImageBtn) {
            textToImageBtn.addEventListener('click', () => this.switchSection('textToImageSection', 'textToImageBtn'));
        }
        
        const imageEditBtn = document.getElementById('imageEditBtn');
        if (imageEditBtn) {
            imageEditBtn.addEventListener('click', () => this.switchSection('imageEditSection', 'imageEditBtn'));
        }
        
        const imageConcatenateBtn = document.getElementById('imageConcatenateBtn');
        if (imageConcatenateBtn) {
            imageConcatenateBtn.addEventListener('click', () => this.switchSection('imageConcatenateSection', 'imageConcatenateBtn'));
        }
        
        const textToVideoBtn = document.getElementById('textToVideoBtn');
        if (textToVideoBtn) {
            textToVideoBtn.addEventListener('click', () => this.switchSection('textToVideoSection', 'textToVideoBtn'));
        }
        
        const imageToVideoBtn = document.getElementById('imageToVideoBtn');
        if (imageToVideoBtn) {
            imageToVideoBtn.addEventListener('click', () => this.switchSection('imageToVideoSection', 'imageToVideoBtn'));
        }

        // 表单提交事件
        const textToImageForm = document.getElementById('textToImageForm');
        if (textToImageForm) {
            textToImageForm.addEventListener('submit', (e) => this.handleTextToImage(e));
        }
        
        const textToVideoForm = document.getElementById('textToVideoForm');
        if (textToVideoForm) {
            textToVideoForm.addEventListener('submit', (e) => this.handleTextToVideo(e));
        }
        
        const imageToVideoForm = document.getElementById('imageToVideoForm');
        if (imageToVideoForm) {
            imageToVideoForm.addEventListener('submit', (e) => this.handleImageToVideo(e));
        }
        
        const imageEditForm = document.getElementById('imageEditForm');
        if (imageEditForm) {
            imageEditForm.addEventListener('submit', (e) => this.handleImageEdit(e));
        }
        
        const imageConcatenateForm = document.getElementById('imageConcatenateForm');
        if (imageConcatenateForm) {
            imageConcatenateForm.addEventListener('submit', (e) => this.handleImageConcatenate(e));
        }

        // 模型选择事件
        document.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', () => this.selectModel(card));
        });
    }

    loadApiKey() {
        if (this.apiKey) {
            const apiKeyInput = document.getElementById('apiKey');
            if (apiKeyInput) {
                apiKeyInput.value = this.apiKey;
            }
            
            const modalApiKeyInput = document.getElementById('modalApiKey');
            if (modalApiKeyInput) {
                modalApiKeyInput.value = this.apiKey;
            }
            
            this.updateApiKeyStatus(true);
        }
    }
    
    switchSection(sectionId, buttonId) {
        // 隐藏所有功能区域
        const sections = ['textToImageSection', 'imageEditSection', 'imageConcatenateSection', 
                         'textToVideoSection', 'imageToVideoSection'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        // 移除所有按钮的active状态
        const buttons = ['textToImageBtn', 'imageEditBtn', 'imageConcatenateBtn', 
                        'textToVideoBtn', 'imageToVideoBtn'];
        buttons.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('active');
            }
        });
        
        // 显示选中的功能区域
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // 激活选中的按钮
        const targetButton = document.getElementById(buttonId);
        if (targetButton) {
            targetButton.classList.add('active');
        }
        
        this.currentSection = sectionId;
    }
    
    updateApiKeyStatus(isValid) {
        const statusElement = document.getElementById('apiKeyStatus');
        const inputElement = document.getElementById('apiKey');
        
        if (statusElement && inputElement) {
            if (isValid && this.apiKey) {
                statusElement.classList.remove('hidden');
                inputElement.classList.add('api-key-valid');
            } else {
                statusElement.classList.add('hidden');
                inputElement.classList.remove('api-key-valid');
            }
        }
    }

    showApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideApiKeyModal() {
        const modal = document.getElementById('apiKeyModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    saveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            this.showNotification('请输入 API Key', 'error');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        this.updateApiKeyStatus(true);
        this.showNotification('API Key 保存成功', 'success');
    }

    saveApiKeyFromModal() {
        const modalApiKeyInput = document.getElementById('modalApiKey');
        if (!modalApiKeyInput) return;
        
        const apiKey = modalApiKeyInput.value.trim();
        if (!apiKey) {
            this.showNotification('请输入 API Key', 'error');
            return;
        }
        
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
            apiKeyInput.value = apiKey;
        }
        
        this.updateApiKeyStatus(true);
        this.hideApiKeyModal();
        this.showNotification('API Key 保存成功', 'success');
    }

    autoSaveApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        
        // 如果输入框为空，不做任何操作
        if (!apiKey) {
            return;
        }
        
        // 如果API Key与当前存储的相同，不重复保存
        if (apiKey === this.apiKey) {
            return;
        }
        
        // 保存API Key
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        this.updateApiKeyStatus(true);
        
        // 同步到模态框输入框
        const modalApiKeyInput = document.getElementById('modalApiKey');
        if (modalApiKeyInput) {
            modalApiKeyInput.value = apiKey;
        }
        
        this.showNotification('API Key 已自动保存', 'success');
    }

    selectModel(card) {
        document.querySelectorAll('.model-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    }

    setupFileUpload() {
        // 设置文件上传拖拽功能
        const dropZones = document.querySelectorAll('input[type="file"]');
        dropZones.forEach(input => {
            const parent = input.closest('.border-dashed') || input.closest('.file-upload-area');
            if (parent) {
                parent.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    parent.classList.add('border-blue-400', 'bg-blue-50');
                });

                parent.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    parent.classList.remove('border-blue-400', 'bg-blue-50');
                });

                parent.addEventListener('drop', (e) => {
                    e.preventDefault();
                    parent.classList.remove('border-blue-400', 'bg-blue-50');
                    
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        input.files = files;
                        this.updateFileDisplay(input);
                    }
                });
            }

            input.addEventListener('change', (e) => {
                this.updateFileDisplay(e.target);
                
                // 特殊处理多文件上传
                if (e.target.id === 'concatenateImageUpload') {
                    this.updateConcatenatePreview(e.target);
                }
            });
        });
    }

    updateFileDisplay(input) {
        const file = input.files[0];
        if (file) {
            // 尝试查找不同的上传区域结构
            const parent = input.closest('.border-dashed') || input.closest('.file-upload-area');
            if (parent) {
                const label = parent.querySelector('label span') || parent.querySelector('label');
                if (label) {
                    label.textContent = file.name;
                }
            }
        }
    }

    updateConcatenatePreview(input) {
        const files = input.files;
        const previewContainer = document.getElementById('concatenateImagePreview');
        
        if (files.length > 0) {
            previewContainer.classList.remove('hidden');
            
            // 清空之前的预览
            const existingPreviews = previewContainer.querySelectorAll('.preview-item');
            existingPreviews.forEach(preview => preview.remove());
            
            // 添加新的预览
            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item relative group';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}" 
                             class="w-full h-24 object-contain rounded-lg shadow-sm bg-gray-100">
                        <div class="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            ${index + 1}
                        </div>
                    `;
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        } else {
            previewContainer.classList.add('hidden');
        }
    }

    async handleTextToImage(e) {
        e.preventDefault();
        
        if (!this.apiKey) {
            this.showNotification('请先配置 API Key', 'error');
            return;
        }

        const formData = {
            prompt: document.getElementById('imagePrompt').value.trim(),
            aspect_ratio: document.getElementById('imageAspectRatio').value
        };

        if (!formData.prompt) {
            this.showNotification('请输入图片描述', 'error');
            return;
        }

        this.showLoading('正在生成图片...');

        try {
            const response = await fetch(CONFIG.ENDPOINTS.GEMINI.GENERATE_IMAGE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    api_key: this.apiKey
                })
            });

            const result = await response.json();
            this.hideLoading();

            if (result.success) {
                this.displayImages(result.data.files);
                this.showNotification('图片生成成功', 'success');
            } else {
                let errorMessage = result.message || '图片生成失败';
                
                // 如果是因为没有图片返回，提示用户尝试英文
                if (errorMessage.includes('no images returned') || errorMessage.includes('No images in response')) {
                    errorMessage = '图片生成失败，建议尝试使用英文描述';
                }
                
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('请求失败: ' + error.message, 'error');
        }
    }

    async handleTextToVideo(e) {
        e.preventDefault();
        
        if (!this.apiKey) {
            this.showNotification('请先配置 API Key', 'error');
            return;
        }

        const formData = {
            prompt: document.getElementById('videoPrompt').value.trim(),
            person_generation: document.getElementById('personGeneration').value,
            aspect_ratio: document.getElementById('videoAspectRatio').value,
            negative_prompt: document.getElementById('negativePrompt').value,
            duration_seconds: parseInt(document.getElementById('videoDuration').value),
            resolution: document.getElementById('videoResolution').value
        };

        if (!formData.prompt) {
            this.showNotification('请输入视频描述', 'error');
            return;
        }

        this.showLoading('正在生成视频...');

        try {
            const response = await fetch(CONFIG.ENDPOINTS.GEMINI.GENERATE_VIDEO_TEXT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    api_key: this.apiKey
                })
            });

            const result = await response.json();
            this.hideLoading();

            if (result.success) {
                this.displayVideo(result.data.file, 'textVideoPlayer');
                this.showNotification('视频生成成功', 'success');
                document.getElementById('textVideoResult').classList.remove('hidden');
            } else {
                this.showNotification(result.message || '视频生成失败', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('请求失败: ' + error.message, 'error');
        }
    }

    async handleImageToVideo(e) {
        e.preventDefault();
        
        if (!this.apiKey) {
            this.showNotification('请先配置 API Key', 'error');
            return;
        }

        const imageFile = document.getElementById('imageUpload').files[0];
        if (!imageFile) {
            this.showNotification('请选择图片', 'error');
            return;
        }

        const prompt = document.getElementById('imageVideoPrompt').value.trim();
        if (!prompt) {
            this.showNotification('请输入视频描述', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('image', imageFile);
        formData.append('person_generation', document.getElementById('imagePersonGeneration').value);
        formData.append('aspect_ratio', document.getElementById('imageVideoAspectRatio').value);
        formData.append('negative_prompt', document.getElementById('imageNegativePrompt').value);
        formData.append('duration_seconds', document.getElementById('imageVideoDuration').value);
        formData.append('resolution', document.getElementById('imageVideoResolution').value);
        formData.append('api_key', this.apiKey);

        this.showLoading('正在生成视频...');

        try {
            const response = await fetch(CONFIG.ENDPOINTS.GEMINI.GENERATE_VIDEO_IMAGE, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.hideLoading();

            if (result.success) {
                this.displayVideo(result.data.file, 'imageVideoPlayer');
                this.showNotification('视频生成成功', 'success');
                document.getElementById('imageVideoResult').classList.remove('hidden');
            } else {
                this.showNotification(result.message || '视频生成失败', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('请求失败: ' + error.message, 'error');
        }
    }

    async handleImageEdit(e) {
        e.preventDefault();
        
        if (!this.apiKey) {
            this.showNotification('请先配置 API Key', 'error');
            return;
        }

        const imageFile = document.getElementById('editImageUpload').files[0];
        if (!imageFile) {
            this.showNotification('请选择要编辑的图片', 'error');
            return;
        }

        const editPrompt = document.getElementById('editPrompt').value.trim();
        if (!editPrompt) {
            this.showNotification('请输入编辑提示词', 'error');
            return;
        }

        // 将图片转换为base64
        const imageDataUrl = await this.fileToBase64(imageFile);

        const requestData = {
            prompt: editPrompt,
            image_data: imageDataUrl,
            api_key: this.apiKey
        };

        this.showLoading('正在编辑图片...');

        try {
            const response = await fetch(CONFIG.ENDPOINTS.GEMINI.EDIT_IMAGE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            this.hideLoading();

            if (result.success) {
                this.displayEditResult(result.data);
                this.showNotification('图片编辑成功', 'success');
                document.getElementById('editResult').classList.remove('hidden');
            } else {
                this.showNotification(result.message || '图片编辑失败', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('请求失败: ' + error.message, 'error');
        }
    }

    async handleImageConcatenate(e) {
        e.preventDefault();
        
        if (!this.apiKey) {
            this.showNotification('请先配置 API Key', 'error');
            return;
        }

        const imageFiles = document.getElementById('concatenateImageUpload').files;
        if (!imageFiles || imageFiles.length < 2) {
            this.showNotification('请至少选择2张图片进行拼接', 'error');
            return;
        }

        // 将多张图片转换为base64数组
        const imageDataUrls = [];
        for (let i = 0; i < imageFiles.length; i++) {
            const dataUrl = await this.fileToBase64(imageFiles[i]);
            imageDataUrls.push(dataUrl);
        }

        const requestData = {
            images: imageDataUrls,
            api_key: this.apiKey
        };

        this.showLoading('正在拼接图片...');

        try {
            const response = await fetch(CONFIG.ENDPOINTS.GEMINI.CONCATENATE_IMAGES, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            this.hideLoading();

            if (result.success) {
                this.displayConcatenateResult(result.data);
                this.showNotification('图片拼接成功', 'success');
                document.getElementById('concatenateResult').classList.remove('hidden');
            } else {
                this.showNotification(result.message || '图片拼接失败', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('请求失败: ' + error.message, 'error');
        }
    }


    displayImages(imageUrls) {
        const gallery = document.getElementById('imageGallery');
        gallery.innerHTML = '';

        imageUrls.forEach((url, index) => {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'relative group';
            imageDiv.innerHTML = `
                <img src="${url}" alt="Generated Image ${index + 1}" 
                     class="w-full h-auto object-contain rounded-lg shadow-md">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <button onclick="webUI.downloadFile('${url}', 'image_${index + 1}.png')" 
                            class="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-100">
                        <i class="fas fa-download mr-2"></i>下载
                    </button>
                </div>
            `;
            gallery.appendChild(imageDiv);
        });

        document.getElementById('imageResult').classList.remove('hidden');
    }

    displayVideo(videoUrl, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="relative">
                <video controls class="w-full rounded-lg shadow-md">
                    <source src="${videoUrl}" type="video/mp4">
                    您的浏览器不支持视频播放。
                </video>
                <div class="mt-2 flex justify-center">
                    <button onclick="webUI.downloadFile('${videoUrl}', 'video.mp4')" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition duration-200">
                        <i class="fas fa-download mr-2"></i>下载视频
                    </button>
                </div>
            </div>
        `;
    }


    displayEditResult(data) {
        const container = document.getElementById('editImageDisplay');
        container.innerHTML = `
            <div class="relative group">
                <img src="${data.image_data_url}" alt="Edited Image" 
                     class="w-full h-64 object-contain rounded-lg shadow-md bg-gray-100">
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <button onclick="webUI.downloadFile('${data.image_data_url}', 'edited_image.png')" 
                            class="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-100">
                        <i class="fas fa-download mr-2"></i>下载
                    </button>
                </div>
            </div>
        `;
    }

    displayConcatenateResult(data) {
        const container = document.getElementById('concatenateImageDisplay');
        container.innerHTML = `
            <div class="space-y-4">
                <div class="text-sm text-gray-600">
                    拼接了 ${data.image_count} 张图片，尺寸: ${data.width} × ${data.height}
                </div>
                <div class="relative group">
                    <img src="${data.image_data_url}" alt="Concatenated Image" 
                         class="w-full max-h-96 object-contain rounded-lg shadow-md bg-gray-100">
                    <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button onclick="webUI.downloadFile('${data.image_data_url}', 'concatenated_image.png')" 
                                class="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-100">
                            <i class="fas fa-download mr-2"></i>下载
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async downloadFile(url, filename) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            
            this.showNotification('文件下载开始', 'success');
        } catch (error) {
            this.showNotification('下载失败: ' + error.message, 'error');
        }
    }

    showLoading(text = '处理中...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${colors[type] || colors.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    const webUI = new WebUIManager();
    // 将实例挂载到全局，以便在HTML中调用
    window.webUI = webUI;
});
