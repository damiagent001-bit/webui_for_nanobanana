// Web UI for Large Models - 配置文件

const CONFIG = {
    // API Base URL
    API_BASE_URL: window.location.origin,
    
    // API Endpoints
    ENDPOINTS: {
        // 健康检查
        HEALTH: '/health',
        
        // API 文档
        DOCS: '/api/docs',
        
        // Gemini API 端点
        GEMINI: {
            GENERATE_IMAGE: '/api/v1/gemini/generate/image',
            GENERATE_VIDEO_TEXT: '/api/v1/gemini/generate/video/text',
            GENERATE_VIDEO_IMAGE: '/api/v1/gemini/generate/video/image',
            EDIT_IMAGE: '/api/v1/gemini/edit/image',
            CONCATENATE_IMAGES: '/api/v1/gemini/concatenate/images',
            ANALYZE_IMAGE: '/api/v1/gemini/analyze/image',
            EXTEND_VIDEO: '/api/v1/gemini/extend/video',
            UPLOAD_VIDEO: '/api/v1/gemini/upload/video',
            LIST_VIDEOS: '/api/v1/gemini/files/videos'
        }
    },
    
    // 默认配置
    DEFAULTS: {
        IMAGE_ASPECT_RATIO: '1:1',
        IMAGE_COUNT: 1,
        VIDEO_ASPECT_RATIO: '16:9',
        VIDEO_DURATION: 8,
        VIDEO_RESOLUTION: '720p',
        PERSON_GENERATION: 'allow_adult'
    },
    
    // 文件上传配置
    UPLOAD: {
        MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
        ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/mkv']
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
