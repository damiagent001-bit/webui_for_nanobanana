# Web UI for Large Models

A beautiful and user-friendly Web UI interface for calling various functions of large language models. Supports Gemini API, providing text-to-image generation, video generation, image analysis and more features.

<div align="center">
  <img src="static/images/dami-wechat-qrcode.jpg" alt="Dami Enterprise WeChat QR Code" width="200"/>
  <p><b>Scan to add Dami Enterprise WeChat</b></p>
</div>

## ✨ Features

- 🎨 **Text-to-Image Generation** - Generate high-quality images using Gemini Imagen model
- 🎬 **Text-to-Video Generation** - Generate videos from text using Gemini Veo model
- 🖼️ **Image-to-Video Generation** - Generate videos based on uploaded images
- ✏️ **Image Editing** - Intelligent image editing using Gemini API
- 🖼️ **Image Concatenation** - Horizontally concatenate multiple images with automatic size adjustment
- 🔍 **Image Analysis** - Intelligent image content analysis
- 📱 **Responsive Design** - Support for desktop and mobile devices
- 🐳 **Docker Support** - One-click deployment
- 🔧 **Easy Configuration** - Simple environment setup

## 🚀 Quick Start

### Method 1: Using Startup Script (Recommended)

**Linux/Mac:**
```bash
git clone <repository-url>
cd webui_for_largemodels
./run.sh
```

**Windows (Command Prompt):**
```cmd
git clone <repository-url>
cd webui_for_largemodels
run.bat
```

**Windows (PowerShell):**
```powershell
git clone <repository-url>
cd webui_for_largemodels
.\run.ps1
```

The startup script will automatically:
- Check Python environment
- Create and activate virtual environment
- Install dependencies
- Create necessary directories
- Start the application

### 📱 Access Pages

After successful startup, you can access through the following addresses:

- **Homepage (Dami Company Introduction)**: http://localhost:8000/
- **Gemini Features Page**: http://localhost:8000/gemini
- **API Documentation**: http://localhost:8000/api/docs

### Method 2: Manual Installation

1. **Create virtual environment**
```bash
python3 -m venv Webui_env
source Webui_env/bin/activate  # Linux/Mac
# or
Webui_env\Scripts\activate     # Windows
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp env.example .env
# Edit .env file and add your Gemini API Key
```

4. **Start the application**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Method 3: Using Docker

1. **Build image**
```bash
docker build -t webui-for-models .
```

2. **Run container**
```bash
docker run -p 8000:8000 -e GEMINI_API_KEY=your_api_key webui-for-models
```

Or using docker-compose:
```bash
# Set environment variables
export GEMINI_API_KEY=your_api_key

# Start services
docker-compose up -d
```

## 🔑 Getting API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Log in to your Google account
3. Create a new API Key
4. Add the API Key to the `.env` file

## 📁 Project Structure

```
webui_for_largemodels/
├── app/                    # Main application code
│   ├── __init__.py
│   ├── main.py            # FastAPI entry point
│   ├── config.py          # Configuration management
│   ├── routes/            # Route modules
│   │   ├── __init__.py
│   │   ├── gemini.py      # Gemini API routes
│   │   └── health.py      # Health check
│   ├── services/          # Business logic
│   │   ├── __init__.py
│   │   ├── gemini_service.py  # Gemini service
│   │   └── file_service.py    # File service
│   ├── utils/             # Utility functions
│   │   ├── __init__.py
│   │   ├── logger.py      # Logging
│   │   └── helpers.py     # Helper functions
│   └── templates/         # Frontend templates
│       ├── index.html     # Main page
│       └── gemini.html    # Gemini page
├── static/                # Static resources
│   ├── css/
│   ├── js/
│   └── images/
├── outputs/               # Generated files storage
│   ├── images/
│   ├── videos/
│   └── files/
├── logs/                  # Application logs
├── requirements.txt       # Python dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── run.sh               # Startup script
├── env.example          # Environment variables example
└── README.md            # Project documentation
```

## 🎯 Usage Guide

### 1. Configure API Key
- Click the "API Key" button in the top right corner
- Enter your Gemini API Key
- Click save

### 2. Text-to-Image Generation
- Enter description in the "Text-to-Image" area
- Select aspect ratio and generation count
- Click "Generate Images" button
- Wait for generation to complete, preview and download

### 3. Text-to-Video Generation
- Enter description in the "Text-to-Video" area
- Configure video parameters (aspect ratio, resolution, duration, etc.)
- Click "Generate Video" button
- Wait for generation to complete, play and download

### 4. Image-to-Video Generation
- Upload an image
- Enter video description
- Configure video parameters
- Click "Generate Video" button

### 5. Image Editing
- Upload the image to be edited
- Enter editing prompt (describe the edits you want to make)
- Click "Edit Image" button
- Wait for AI processing to complete, view and download the edited image

### 6. Image Concatenation
- Select multiple images (at least 2)
- System will automatically concatenate images horizontally
- Click "Concatenate Images Horizontally" button
- View and download the concatenated image

### 7. Image Analysis
- Upload the image to be analyzed
- Enter analysis prompt
- Click "Analyze Image" button
- View analysis results

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Gemini API key | None |
| `HOST` | Server address | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `DEBUG` | Debug mode | `true` |
| `UPLOAD_FOLDER` | File upload directory | `outputs` |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | `104857600` |

### Supported Image Formats
- JPG/JPEG
- PNG
- WebP
- GIF

### Supported Video Formats
- MP4
- AVI
- MOV
- MKV

## 🚀 Deployment

### Production Environment Deployment

1. **Set environment variables**
```bash
export GEMINI_API_KEY=your_api_key
export DEBUG=false
```

2. **Deploy with Gunicorn**
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

3. **Use Nginx reverse proxy**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /path/to/your/static/;
    }
    
    location /outputs/ {
        alias /path/to/your/outputs/;
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Invalid API Key**
   - Check if the API Key is correct
   - Confirm the API Key has sufficient quota
   - Check network connection

2. **File Upload Failed**
   - Check if file size exceeds limit
   - Confirm file format is supported
   - Check disk space

3. **Generation Failed**
   - Check network connection
   - View log files
   - Confirm API quota

### Log Viewing

```bash
# View application logs
tail -f logs/webui_$(date +%Y%m%d).log

# View Docker logs
docker logs webui-for-models
```

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern, fast web framework
- [Gemini API](https://ai.google.dev/) - Google's AI model API
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Font Awesome](https://fontawesome.com/) - Icon library

---

For questions or suggestions, please submit an Issue or contact the maintainer.
