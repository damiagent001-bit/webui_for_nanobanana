// Web UI for Large Models - Frontend JavaScript

class WebUIManager {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || '';
        this.currentSection = 'textToImageSection';
        this.currentVideoChain = null; // 当前视频链
        this.pendingExtendType = null; // 待延长视频的类型
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
        
        const clearApiKey = document.getElementById('clearApiKey');
        if (clearApiKey) {
            clearApiKey.addEventListener('click', () => this.showConfirmClearModal());
        }
        
        const clearMainApiKey = document.getElementById('clearMainApiKey');
        if (clearMainApiKey) {
            clearMainApiKey.addEventListener('click', () => this.showConfirmClearModal());
        }
        
        const confirmClearBtn = document.getElementById('confirmClearBtn');
        if (confirmClearBtn) {
            confirmClearBtn.addEventListener('click', () => this.confirmClearApiKey());
        }
        
        const cancelClearBtn = document.getElementById('cancelClearBtn');
        if (cancelClearBtn) {
            cancelClearBtn.addEventListener('click', () => this.hideConfirmClearModal());
        }
        
        const cancelExtendBtn = document.getElementById('cancelExtendBtn');
        if (cancelExtendBtn) {
            cancelExtendBtn.addEventListener('click', () => this.hideExtendPromptModal());
        }
        
        const confirmExtendBtn = document.getElementById('confirmExtendBtn');
        if (confirmExtendBtn) {
            confirmExtendBtn.addEventListener('click', () => this.confirmExtendVideo());
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
        
        // 延长按钮事件
        const extendTextVideoBtn = document.getElementById('extendTextVideoBtn');
        if (extendTextVideoBtn) {
            extendTextVideoBtn.addEventListener('click', () => this.handleExtendCurrentVideo('textVideo'));
        }
        
        const extendImageVideoBtn = document.getElementById('extendImageVideoBtn');
        if (extendImageVideoBtn) {
            extendImageVideoBtn.addEventListener('click', () => this.handleExtendCurrentVideo('imageVideo'));
        }
        
        // 下载按钮事件
        const downloadTextVideoCurrentBtn = document.getElementById('downloadTextVideoCurrentBtn');
        if (downloadTextVideoCurrentBtn) {
            downloadTextVideoCurrentBtn.addEventListener('click', () => this.downloadCurrentVideo('textVideo'));
        }
        
        const downloadTextVideoLatestBtn = document.getElementById('downloadTextVideoLatestBtn');
        if (downloadTextVideoLatestBtn) {
            downloadTextVideoLatestBtn.addEventListener('click', () => this.downloadLatestVideo('textVideo'));
        }
        
        const downloadImageVideoCurrentBtn = document.getElementById('downloadImageVideoCurrentBtn');
        if (downloadImageVideoCurrentBtn) {
            downloadImageVideoCurrentBtn.addEventListener('click', () => this.downloadCurrentVideo('imageVideo'));
        }
        
        const downloadImageVideoLatestBtn = document.getElementById('downloadImageVideoLatestBtn');
        if (downloadImageVideoLatestBtn) {
            downloadImageVideoLatestBtn.addEventListener('click', () => this.downloadLatestVideo('imageVideo'));
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
    
    showConfirmClearModal() {
        const modal = document.getElementById('confirmClearModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
    
    hideConfirmClearModal() {
        const modal = document.getElementById('confirmClearModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    showExtendPromptModal(type) {
        this.pendingExtendType = type; // 保存要延长的视频类型
        const modal = document.getElementById('extendPromptModal');
        const input = document.getElementById('extendPromptInput');
        if (modal && input) {
            input.value = ''; // 清空上次输入
            modal.classList.remove('hidden');
            input.focus();
        }
    }
    
    hideExtendPromptModal() {
        const modal = document.getElementById('extendPromptModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.pendingExtendType = null;
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
    
    confirmClearApiKey() {
        // 清除内存中的API Key
        this.apiKey = '';
        
        // 清除localStorage
        localStorage.removeItem('gemini_api_key');
        
        // 清除主页面输入框
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput) {
            apiKeyInput.value = '';
        }
        
        // 清除模态框输入框
        const modalApiKeyInput = document.getElementById('modalApiKey');
        if (modalApiKeyInput) {
            modalApiKeyInput.value = '';
        }
        
        // 更新状态显示
        this.updateApiKeyStatus(false);
        
        // 关闭所有模态框
        this.hideApiKeyModal();
        this.hideConfirmClearModal();
        
        // 清除视频缓存（因为API Key变了，Video对象也失效了）
        this.currentVideoChain = null;
        
        this.showNotification('API Key 已清除', 'success');
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
                const filename = result.data.file;
                // 初始化视频链
                this.currentVideoChain = {
                    type: 'textVideo',  // 修正类型名称
                    chain: [filename],
                    currentIndex: 0
                };
                // 显示视频和轨道
                this.displayVideoWithTrack(filename, 'textVideoPlayer', 'textVideoTrack', 'textVideo');
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
                const filename = result.data.file;
                // 初始化视频链
                this.currentVideoChain = {
                    type: 'imageVideo',  // 修正类型名称
                    chain: [filename],
                    currentIndex: 0
                };
                // 显示视频和轨道
                this.displayVideoWithTrack(filename, 'imageVideoPlayer', 'imageVideoTrack', 'imageVideo');
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
    
    displayVideoWithTrack(filename, playerContainerId, trackContainerId, prefix) {
        // 显示视频播放器
        this.displayVideo(filename, playerContainerId);
        
        // 显示视频轨道
        this.renderVideoTrack(trackContainerId, prefix);
    }
    
    renderVideoTrack(trackContainerId, prefix) {
        if (!this.currentVideoChain || this.currentVideoChain.chain.length === 0) {
            return;
        }
        
        const trackContainer = document.getElementById(trackContainerId);
        const chain = this.currentVideoChain.chain;
        const currentIndex = this.currentVideoChain.currentIndex;
        
        let trackHTML = '';
        for (let i = 0; i < chain.length; i++) {
            const isActive = i === currentIndex;
            const activeClass = isActive ? 'active' : '';
            
            // 只有非第一个视频才能删除（保留原始视频）
            const canDelete = i > 0;
            const deleteButton = canDelete ? `
                <button class="video-track-delete" onclick="webUI.removeVideoFromChain(${i}, '${prefix}'); event.stopPropagation();" title="删除此视频及之后的所有延长">
                    <i class="fas fa-times"></i>
                </button>
            ` : '';
            
            trackHTML += `
                <div class="video-track-item ${activeClass}" data-index="${i}" data-filename="${chain[i]}">
                    <video class="video-track-thumbnail" muted>
                        <source src="${chain[i]}" type="video/mp4">
                    </video>
                    <div class="video-track-label">#${i + 1}</div>
                    <button class="video-track-download" onclick="webUI.downloadFile('${chain[i]}', 'video_${i + 1}.mp4'); event.stopPropagation();" title="下载此视频">
                        <i class="fas fa-download"></i>
                    </button>
                    ${deleteButton}
                </div>
            `;
            
            if (i < chain.length - 1) {
                trackHTML += '<div class="video-track-arrow"><i class="fas fa-arrow-right"></i></div>';
            }
        }
        
        const innerContainer = trackContainer.querySelector('.flex');
        if (innerContainer) {
            innerContainer.innerHTML = trackHTML;
            
            // 添加点击事件 - 切换到对应的视频
            innerContainer.querySelectorAll('.video-track-item').forEach(item => {
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index);
                    const filename = item.dataset.filename;
                    this.switchToVideoInChain(index, filename, `${prefix}Player`);
                });
            });
            
            // 视频缩略图悬停播放
            innerContainer.querySelectorAll('.video-track-thumbnail').forEach(video => {
                video.addEventListener('mouseenter', () => {
                    video.currentTime = 1;
                    video.play().catch(() => {});
                });
                video.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 1;
                });
            });
        }
    }
    
    switchToVideoInChain(index, filename, playerContainerId) {
        this.currentVideoChain.currentIndex = index;
        this.displayVideo(filename, playerContainerId);
        
        // 更新轨道UI
        const trackContainer = document.getElementById(playerContainerId.replace('Player', 'Track'));
        if (trackContainer) {
            trackContainer.querySelectorAll('.video-track-item').forEach((item, i) => {
                if (i === index) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
    }
    
    async handleExtendCurrentVideo(type) {
        if (!this.apiKey) {
            this.showNotification('请先配置 API Key', 'error');
            this.showApiKeyModal();
            return;
        }
        
        if (!this.currentVideoChain || this.currentVideoChain.type !== type) {
            this.showNotification('没有可延长的视频', 'error');
            return;
        }
        
        // 显示自定义提示词输入框
        this.showExtendPromptModal(type);
    }
    
    async confirmExtendVideo() {
        try {
            const type = this.pendingExtendType;
            if (!type) {
                return;
            }
            
            // 获取输入的提示词
            const promptInput = document.getElementById('extendPromptInput');
            const prompt = promptInput ? promptInput.value.trim() : '';
            
            // 关闭模态框
            this.hideExtendPromptModal();
            
            const chain = this.currentVideoChain.chain;
            const currentFilename = chain[chain.length - 1]; // 获取最新的视频
            
            this.showLoading('正在延长视频...');
            const response = await fetch(CONFIG.ENDPOINTS.GEMINI.EXTEND_VIDEO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: currentFilename,
                    prompt: prompt,
                    resolution: '720p',
                    api_key: this.apiKey
                })
            });
            
            const result = await response.json();
            this.hideLoading();
            
            if (result.success) {
                // 将新视频添加到链中
                this.currentVideoChain.chain.push(result.data.file);
                this.currentVideoChain.currentIndex = this.currentVideoChain.chain.length - 1;
                
                // 更新显示
                const prefix = type === 'textVideo' ? 'textVideo' : 'imageVideo';
                this.displayVideoWithTrack(result.data.file, `${prefix}Player`, `${prefix}Track`, prefix);
                
                this.showNotification(`视频延长成功！当前链长度：${this.currentVideoChain.chain.length}`, 'success');
                
                // 更新延长信息
                const infoEl = document.getElementById(`${prefix}ExtendInfo`);
                if (infoEl) {
                    const remaining = 20 - (this.currentVideoChain.chain.length - 1);
                    infoEl.textContent = `已延长 ${this.currentVideoChain.chain.length - 1} 次，还可延长 ${remaining} 次`;
                }
            } else {
                this.showNotification(result.message || '视频延长失败', 'error');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('请求失败: ' + error.message, 'error');
        }
    }
    
    downloadCurrentVideo(type) {
        if (!this.currentVideoChain || this.currentVideoChain.type !== type) {
            this.showNotification('没有可下载的视频', 'error');
            return;
        }
        
        const currentIndex = this.currentVideoChain.currentIndex;
        const currentFilename = this.currentVideoChain.chain[currentIndex];
        
        // 提取文件名
        const filename = currentFilename.split('/').pop();
        const displayName = `video_${currentIndex + 1}_${filename}`;
        
        this.downloadFile(currentFilename, displayName);
        this.showNotification(`正在下载第 ${currentIndex + 1} 个视频...`, 'success');
    }
    
    downloadLatestVideo(type) {
        if (!this.currentVideoChain || this.currentVideoChain.type !== type) {
            this.showNotification('没有可下载的视频', 'error');
            return;
        }
        
        const chain = this.currentVideoChain.chain;
        const latestFilename = chain[chain.length - 1];
        
        // 提取文件名
        const filename = latestFilename.split('/').pop();
        const displayName = `latest_video_${filename}`;
        
        this.downloadFile(latestFilename, displayName);
        this.showNotification('正在下载最新视频...', 'success');
    }
    
    removeVideoFromChain(index, prefix) {
        if (!this.currentVideoChain) {
            this.showNotification('没有可操作的视频链', 'error');
            return;
        }
        
        // 不能删除第一个视频（原始视频）
        if (index === 0) {
            this.showNotification('无法删除原始视频', 'error');
            return;
        }
        
        const chain = this.currentVideoChain.chain;
        const deletedCount = chain.length - index;
        
        // 确认删除
        const confirmMsg = `确定要删除视频 #${index + 1} 及之后的所有延长吗？\n这将删除 ${deletedCount} 个视频。`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // 删除从index开始到末尾的所有视频
        this.currentVideoChain.chain = chain.slice(0, index);
        
        // 如果当前播放的视频被删除了，切换到最后一个保留的视频
        if (this.currentVideoChain.currentIndex >= index) {
            this.currentVideoChain.currentIndex = this.currentVideoChain.chain.length - 1;
        }
        
        // 更新显示
        const lastVideo = this.currentVideoChain.chain[this.currentVideoChain.chain.length - 1];
        this.displayVideoWithTrack(lastVideo, `${prefix}Player`, `${prefix}Track`, prefix);
        
        // 更新延长信息
        const infoEl = document.getElementById(`${prefix}ExtendInfo`);
        if (infoEl) {
            const remaining = 20 - (this.currentVideoChain.chain.length - 1);
            infoEl.textContent = `已延长 ${this.currentVideoChain.chain.length - 1} 次，还可延长 ${remaining} 次`;
        }
        
        this.showNotification(`已删除 ${deletedCount} 个视频，可以重新延长`, 'success');
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
