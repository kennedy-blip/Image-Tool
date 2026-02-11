import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from './utils/cn';

// Generate a sample geometric image as a data URL
const generateGeometricImage = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 600);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);
  
  // Draw geometric shapes
  const colors = ['#e94560', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'];
  
  // Circles
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(100 + i * 90, 150, 40, 0, Math.PI * 2);
    ctx.fillStyle = colors[i % colors.length] + '80';
    ctx.fill();
    ctx.strokeStyle = colors[i % colors.length];
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  // Triangles
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(150 + i * 130, 300);
    ctx.lineTo(200 + i * 130, 220);
    ctx.lineTo(250 + i * 130, 300);
    ctx.closePath();
    ctx.fillStyle = colors[(i + 2) % colors.length] + '90';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Squares with rotation
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.translate(100 + i * 120, 450);
    ctx.rotate((i * 15 * Math.PI) / 180);
    ctx.fillStyle = colors[(i + 4) % colors.length] + '70';
    ctx.fillRect(-30, -30, 60, 60);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-30, -30, 60, 60);
    ctx.restore();
  }
  
  // Hexagons
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const cx = 180 + i * 160;
    const cy = 380;
    const size = 35;
    for (let j = 0; j < 6; j++) {
      const angle = (j * 60 - 30) * Math.PI / 180;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = colors[(i + 1) % colors.length] + '85';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 50, 0);
    ctx.lineTo(i * 50, 600);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 50);
    ctx.lineTo(800, i * 50);
    ctx.stroke();
  }
  
  return canvas.toDataURL('image/png');
};

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AspectRatio {
  name: string;
  value: number | null;
  icon: string;
}

const aspectRatios: AspectRatio[] = [
  { name: 'Free', value: null, icon: '⬚' },
  { name: '1:1', value: 1, icon: '◻' },
  { name: '4:3', value: 4 / 3, icon: '▭' },
  { name: '16:9', value: 16 / 9, icon: '▬' },
  { name: '3:2', value: 3 / 2, icon: '▭' },
  { name: '2:3', value: 2 / 3, icon: '▯' },
  { name: '9:16', value: 9 / 16, icon: '▯' },
];

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 100, y: 75, width: 300, height: 225 });
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(aspectRatios[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | HandlePosition | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const containerWidth = 500;
  const containerHeight = 375;

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please upload an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageUrl(result);
      setImageName(file.name);
      resetCrop();
    };
    reader.onerror = () => {
      setImageError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle URL input
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    setImageError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageUrl(urlInput);
      setImageName('Image from URL');
      setShowUrlInput(false);
      setUrlInput('');
      resetCrop();
    };
    img.onerror = () => {
      setImageError('Failed to load image from URL. Make sure the URL is correct and the image allows cross-origin access.');
    };
    img.src = urlInput;
  };

  // Load sample image
  const loadSampleImage = () => {
    const sampleUrl = generateGeometricImage();
    setImageUrl(sampleUrl);
    setImageName('Sample Geometric Image');
    setImageError(null);
    resetCrop();
  };

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      updatePreview();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Update preview whenever crop area, zoom, or rotation changes
  const updatePreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    const previewSize = 200;
    
    // Calculate the actual image coordinates from the display coordinates
    const scaleX = img.width / (containerWidth * zoom);
    const scaleY = img.height / (containerHeight * zoom);
    
    const sourceX = cropArea.x * scaleX;
    const sourceY = cropArea.y * scaleY;
    const sourceWidth = cropArea.width * scaleX;
    const sourceHeight = cropArea.height * scaleY;

    // Set canvas size to maintain aspect ratio
    const aspectRatio = cropArea.width / cropArea.height;
    if (aspectRatio > 1) {
      canvas.width = previewSize;
      canvas.height = previewSize / aspectRatio;
    } else {
      canvas.width = previewSize * aspectRatio;
      canvas.height = previewSize;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Apply rotation around center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, canvas.width, canvas.height
    );
    
    ctx.restore();
  }, [cropArea, zoom, rotation, containerWidth, containerHeight]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...cropArea });
  };

  const constrainToRatio = (width: number, height: number, handle: HandlePosition): { width: number; height: number } => {
    if (!selectedRatio.value) return { width, height };
    
    const ratio = selectedRatio.value;
    const isHorizontalHandle = handle === 'e' || handle === 'w';
    const isVerticalHandle = handle === 'n' || handle === 's';
    
    if (isHorizontalHandle) {
      return { width, height: width / ratio };
    } else if (isVerticalHandle) {
      return { width: height * ratio, height };
    } else {
      // Corner handles - use the larger dimension
      const newHeightFromWidth = width / ratio;
      const newWidthFromHeight = height * ratio;
      
      if (Math.abs(width - initialCrop.width) > Math.abs(height - initialCrop.height)) {
        return { width, height: newHeightFromWidth };
      } else {
        return { width: newWidthFromHeight, height };
      }
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    const minSize = 50;

    if (dragType === 'move') {
      const newX = Math.max(0, Math.min(containerWidth - cropArea.width, initialCrop.x + deltaX));
      const newY = Math.max(0, Math.min(containerHeight - cropArea.height, initialCrop.y + deltaY));
      setCropArea({ ...cropArea, x: newX, y: newY });
    } else {
      let newCrop = { ...initialCrop };

      switch (dragType) {
        case 'nw':
          newCrop.width = Math.max(minSize, initialCrop.width - deltaX);
          newCrop.height = Math.max(minSize, initialCrop.height - deltaY);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.width = constrained.width;
            newCrop.height = constrained.height;
          }
          newCrop.x = initialCrop.x + initialCrop.width - newCrop.width;
          newCrop.y = initialCrop.y + initialCrop.height - newCrop.height;
          break;
        case 'n':
          newCrop.height = Math.max(minSize, initialCrop.height - deltaY);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.width = constrained.width;
            newCrop.x = initialCrop.x + (initialCrop.width - constrained.width) / 2;
          }
          newCrop.y = initialCrop.y + initialCrop.height - newCrop.height;
          break;
        case 'ne':
          newCrop.width = Math.max(minSize, initialCrop.width + deltaX);
          newCrop.height = Math.max(minSize, initialCrop.height - deltaY);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.width = constrained.width;
            newCrop.height = constrained.height;
          }
          newCrop.y = initialCrop.y + initialCrop.height - newCrop.height;
          break;
        case 'e':
          newCrop.width = Math.max(minSize, initialCrop.width + deltaX);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.height = constrained.height;
            newCrop.y = initialCrop.y + (initialCrop.height - constrained.height) / 2;
          }
          break;
        case 'se':
          newCrop.width = Math.max(minSize, initialCrop.width + deltaX);
          newCrop.height = Math.max(minSize, initialCrop.height + deltaY);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.width = constrained.width;
            newCrop.height = constrained.height;
          }
          break;
        case 's':
          newCrop.height = Math.max(minSize, initialCrop.height + deltaY);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.width = constrained.width;
            newCrop.x = initialCrop.x + (initialCrop.width - constrained.width) / 2;
          }
          break;
        case 'sw':
          newCrop.width = Math.max(minSize, initialCrop.width - deltaX);
          newCrop.height = Math.max(minSize, initialCrop.height + deltaY);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.width = constrained.width;
            newCrop.height = constrained.height;
          }
          newCrop.x = initialCrop.x + initialCrop.width - newCrop.width;
          break;
        case 'w':
          newCrop.width = Math.max(minSize, initialCrop.width - deltaX);
          if (selectedRatio.value) {
            const constrained = constrainToRatio(newCrop.width, newCrop.height, dragType);
            newCrop.height = constrained.height;
            newCrop.y = initialCrop.y + (initialCrop.height - constrained.height) / 2;
          }
          newCrop.x = initialCrop.x + initialCrop.width - newCrop.width;
          break;
      }

      // Constrain to container bounds
      newCrop.x = Math.max(0, Math.min(containerWidth - minSize, newCrop.x));
      newCrop.y = Math.max(0, Math.min(containerHeight - minSize, newCrop.y));
      newCrop.width = Math.min(newCrop.width, containerWidth - newCrop.x);
      newCrop.height = Math.min(newCrop.height, containerHeight - newCrop.y);

      setCropArea(newCrop);
    }
  }, [isDragging, dragType, dragStart, initialCrop, cropArea, selectedRatio, containerWidth, containerHeight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const applyAspectRatio = (ratio: AspectRatio) => {
    setSelectedRatio(ratio);
    if (ratio.value) {
      const currentCenterX = cropArea.x + cropArea.width / 2;
      const currentCenterY = cropArea.y + cropArea.height / 2;
      
      let newWidth = cropArea.width;
      let newHeight = newWidth / ratio.value;
      
      if (newHeight > containerHeight) {
        newHeight = containerHeight * 0.8;
        newWidth = newHeight * ratio.value;
      }
      if (newWidth > containerWidth) {
        newWidth = containerWidth * 0.8;
        newHeight = newWidth / ratio.value;
      }
      
      let newX = currentCenterX - newWidth / 2;
      let newY = currentCenterY - newHeight / 2;
      
      newX = Math.max(0, Math.min(containerWidth - newWidth, newX));
      newY = Math.max(0, Math.min(containerHeight - newHeight, newY));
      
      setCropArea({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  };

  const resetCrop = () => {
    setCropArea({ x: 100, y: 75, width: 300, height: 225 });
    setZoom(1);
    setRotation(0);
    setSelectedRatio(aspectRatios[0]);
  };

  const handlePositions: { pos: HandlePosition; className: string; cursor: string }[] = [
    { pos: 'nw', className: '-top-2 -left-2', cursor: 'nwse-resize' },
    { pos: 'n', className: '-top-2 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
    { pos: 'ne', className: '-top-2 -right-2', cursor: 'nesw-resize' },
    { pos: 'e', className: 'top-1/2 -right-2 -translate-y-1/2', cursor: 'ew-resize' },
    { pos: 'se', className: '-bottom-2 -right-2', cursor: 'nwse-resize' },
    { pos: 's', className: '-bottom-2 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
    { pos: 'sw', className: '-bottom-2 -left-2', cursor: 'nesw-resize' },
    { pos: 'w', className: 'top-1/2 -left-2 -translate-y-1/2', cursor: 'ew-resize' },
  ];

  // Hidden file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">✂️</span>
            Image Crop Tool
          </h1>
          <p className="text-slate-400">Upload an image to get started</p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Upload Area - shown when no image is loaded */}
        {!imageUrl ? (
          <div className="max-w-2xl mx-auto">
            {/* Drag & Drop Zone */}
            <div
              className={cn(
                "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300",
                isDraggingFile
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-600 hover:border-slate-500 bg-slate-800/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-6xl mb-4">📁</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Drag & Drop your image here
              </h2>
              <p className="text-slate-400 mb-6">
                Supports JPG, PNG, GIF, WebP
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors flex items-center gap-2"
                >
                  <span>📂</span> Browse Files
                </button>
                <span className="text-slate-500">or</span>
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-6 py-3 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <span>🔗</span> Use URL
                </button>
              </div>

              {/* Paste hint */}
              <p className="text-slate-500 text-sm mt-6">
                💡 Tip: You can also paste an image from your clipboard (Ctrl/Cmd + V)
              </p>
            </div>

            {/* URL Input */}
            {showUrlInput && (
              <div className="mt-4 bg-slate-800/50 rounded-xl p-4">
                <label className="text-sm text-slate-300 mb-2 block">Enter image URL:</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600 focus:border-indigo-500 focus:outline-none placeholder-slate-400"
                  />
                  <button
                    onClick={handleUrlSubmit}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
                  >
                    Load
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {imageError && (
              <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300">
                ⚠️ {imageError}
              </div>
            )}

            {/* Sample Image Button */}
            <div className="mt-6 text-center">
              <p className="text-slate-500 mb-3">Want to try it out first?</p>
              <button
                onClick={loadSampleImage}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 mx-auto"
              >
                <span>🎨</span> Load Sample Image
              </button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Editor */}
          <div className="flex-1">
            {/* Image Source Info */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div>
                  <p className="text-white font-medium">{imageName}</p>
                  <p className="text-slate-400 text-sm">Ready to crop</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setImageUrl(null);
                  setImageName('');
                  imageRef.current = null;
                }}
                className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <span>↻</span> Change Image
              </button>
            </div>

            {/* Aspect Ratio Presets */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Aspect Ratio</h3>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.name}
                    onClick={() => applyAspectRatio(ratio)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "flex items-center gap-2",
                      selectedRatio.name === ratio.name
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    )}
                  >
                    <span>{ratio.icon}</span>
                    {ratio.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Canvas */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 mb-4">
              <div
                ref={containerRef}
                className="relative bg-slate-900 rounded-lg overflow-hidden mx-auto"
                style={{ width: containerWidth, height: containerHeight }}
              >
                {/* Image with zoom and rotation */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Source"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                {/* Darkened overlay outside crop area */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top */}
                  <div
                    className="absolute bg-black/60"
                    style={{
                      top: 0,
                      left: 0,
                      right: 0,
                      height: cropArea.y,
                    }}
                  />
                  {/* Bottom */}
                  <div
                    className="absolute bg-black/60"
                    style={{
                      top: cropArea.y + cropArea.height,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  {/* Left */}
                  <div
                    className="absolute bg-black/60"
                    style={{
                      top: cropArea.y,
                      left: 0,
                      width: cropArea.x,
                      height: cropArea.height,
                    }}
                  />
                  {/* Right */}
                  <div
                    className="absolute bg-black/60"
                    style={{
                      top: cropArea.y,
                      left: cropArea.x + cropArea.width,
                      right: 0,
                      height: cropArea.height,
                    }}
                  />
                </div>

                {/* Crop area */}
                <div
                  className="absolute border-2 border-white shadow-lg"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                    cursor: isDragging && dragType === 'move' ? 'grabbing' : 'grab',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                  {/* Rule of thirds grid */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
                  </div>

                  {/* Drag handles */}
                  {handlePositions.map(({ pos, className, cursor }) => (
                    <div
                      key={pos}
                      className={cn(
                        "absolute w-4 h-4 bg-white rounded-full shadow-lg border-2 border-indigo-500",
                        "hover:scale-125 transition-transform",
                        className
                      )}
                      style={{ cursor }}
                      onMouseDown={(e) => handleMouseDown(e, pos)}
                    />
                  ))}

                  {/* Size indicator */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                  </div>
                </div>
              </div>
            </div>

            {/* Zoom & Rotation Controls */}
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Zoom Control */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <span>🔍</span> Zoom
                    </label>
                    <span className="text-sm text-slate-400">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Rotation Control */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <span>🔄</span> Rotation
                    </label>
                    <span className="text-sm text-slate-400">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRotation(rotation - 90)}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors text-sm"
                    >
                      ↶
                    </button>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <button
                      onClick={() => setRotation(rotation + 90)}
                      className="w-8 h-8 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors text-sm"
                    >
                      ↷
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick rotation buttons */}
              <div className="flex gap-2 mt-4">
                {[-45, 0, 45, 90, 180].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setRotation(deg)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      rotation === deg
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    )}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:w-80">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>👁️</span> Preview
              </h3>
              
              {/* Preview Canvas */}
              <div className="bg-slate-900 rounded-lg p-4 flex items-center justify-center mb-4" style={{ minHeight: 200 }}>
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full rounded shadow-lg"
                />
              </div>

              {/* Crop Info */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Position:</span>
                  <span className="text-white font-mono">
                    {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Size:</span>
                  <span className="text-white font-mono">
                    {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Aspect Ratio:</span>
                  <span className="text-white">{selectedRatio.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Zoom:</span>
                  <span className="text-white">{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Rotation:</span>
                  <span className="text-white">{rotation}°</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={resetCrop}
                  className="w-full py-2.5 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>↺</span> Reset All
                </button>
                <button
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                >
                  <span>✓</span> Apply Crop
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        {imageUrl && (
          <div className="text-center mt-8 text-slate-500 text-sm">
            Drag the corners or edges to resize • Drag inside to move • Use controls to zoom and rotate
          </div>
        )}
      </div>
    </div>
  );
}
