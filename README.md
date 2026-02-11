# ✂️ Image Crop Tool

A powerful, feature-rich image cropping application built with React, TypeScript, Vite, and Tailwind CSS.

![Image Crop Tool](https://img.shields.io/badge/React-19.x-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-teal) ![Vite](https://img.shields.io/badge/Vite-7.x-purple)

## ✨ Features

### 🖼️ Image Loading
- **Drag & Drop** - Simply drag an image file and drop it onto the upload area
- **File Browser** - Click to browse and select images from your device
- **Clipboard Paste** - Press `Ctrl/Cmd + V` to paste images directly from clipboard
- **URL Loading** - Enter a direct link to load images from the web
- **Sample Image** - Built-in geometric pattern for testing

### 📐 Aspect Ratio Presets
- **Free** - No aspect ratio constraints
- **1:1** - Square format
- **4:3** - Classic photo format
- **16:9** - Widescreen format
- **3:2** - DSLR camera format
- **2:3** - Portrait orientation
- **9:16** - Mobile/vertical video format

### 🎯 Crop Controls
- **8 Drag Handles** - Corner and edge handles for precise resizing
- **Drag to Move** - Click and drag inside the crop area to reposition
- **Rule of Thirds Grid** - Visual overlay to help with composition
- **Live Size Display** - Real-time dimension indicator

### 🔧 Transform Controls
- **Zoom** - Slider from 50% to 300% with +/- buttons
- **Rotation** - Continuous slider from -180° to 180°
- **Quick Rotate** - 90° left/right rotation buttons
- **Preset Angles** - Quick access to -45°, 0°, 45°, 90°, 180°

### 👁️ Preview Panel
- **Live Preview** - Real-time preview of the cropped area
- **Crop Information** - Position, size, aspect ratio, zoom, and rotation
- **Reset Button** - Quickly reset all transformations
- **Apply Button** - Apply the crop (extensible for export)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/image-crop-tool.git
   cd image-crop-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
image-crop-tool/
├── public/              # Static assets
├── src/
│   ├── utils/
│   │   └── cn.ts        # Tailwind class merge utility
│   ├── App.tsx          # Main application component
│   ├── index.css        # Tailwind CSS imports
│   └── main.tsx         # React entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md            # This file
```

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **Canvas API** - Image manipulation and preview

## 📤 Adding to GitHub

### Option 1: Create a New Repository

1. **Create a new repository on GitHub**
   - Go to [github.com/new](https://github.com/new)
   - Enter repository name: `image-crop-tool`
   - Add description: "A powerful image cropping tool with aspect ratio presets, zoom, and rotation"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have files)
   - Click "Create repository"

2. **Initialize Git in your project** (if not already done)
   ```bash
   git init
   ```

3. **Add all files to Git**
   ```bash
   git add .
   ```

4. **Create your first commit**
   ```bash
   git commit -m "Initial commit: Image Crop Tool with aspect ratios, zoom, rotation, and preview"
   ```

5. **Add GitHub as remote origin**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/image-crop-tool.git
   ```

6. **Push to GitHub**
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Option 2: Using GitHub CLI

1. **Install GitHub CLI** (if not installed)
   ```bash
   # macOS
   brew install gh
   
   # Windows
   winget install GitHub.cli
   
   # Linux
   sudo apt install gh
   ```

2. **Authenticate with GitHub**
   ```bash
   gh auth login
   ```

3. **Create repository and push**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Image Crop Tool"
   gh repo create image-crop-tool --public --source=. --push
   ```

## 🌐 Deploying to GitHub Pages

1. **Add the base path to `vite.config.ts`** (optional, for GitHub Pages)
   ```typescript
   export default defineConfig({
     base: '/image-crop-tool/',
     // ... rest of config
   })
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Deploy to GitHub Pages**

   **Option A: Using `gh-pages` package**
   ```bash
   npm install -D gh-pages
   ```

   Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```

   Then run:
   ```bash
   npm run build
   npm run deploy
   ```

   **Option B: Manual deployment**
   - Go to your repository Settings → Pages
   - Set Source to "GitHub Actions"
   - Create `.github/workflows/deploy.yml`:
   
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Build
           run: npm run build
           
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

---

Made with ❤️ and ☕
