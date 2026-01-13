class VastuApp {
    constructor() {
        this.currentStep = 1;
        this.image = null;
        this.rotation = 0;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.walls = [];
        this.isDrawing = false;
        this.centerPoint = null;
        this.directions = [];
        this.showColors = false;
        this.finalRotation = 0;
        
        this.initializeEventListeners();
        this.setupCanvases();
    }
    
    initializeEventListeners() {
        // Step 1 - Image Upload and Alignment
        document.getElementById('imageUpload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('rotateLeft').addEventListener('click', () => this.rotateImage(-1));
        document.getElementById('rotateRight').addEventListener('click', () => this.rotateImage(1));
        document.getElementById('rotateInput').addEventListener('input', (e) => this.setRotation(e.target.value));
        document.getElementById('moveBtn').addEventListener('click', () => this.toggleMoveMode());
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.1));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.9));
        document.getElementById('nextStep1').addEventListener('click', () => this.goToStep(2));
        
        // Step 2 - Drawing Walls
        document.getElementById('clearWalls').addEventListener('click', () => this.clearWalls());
        document.getElementById('doneWalls').addEventListener('click', () => this.finishWalls());
        document.getElementById('nextStep2').addEventListener('click', () => this.goToStep(3));
        
        // Step 3 - Direction Analysis
        document.getElementById('showRectangle').addEventListener('click', () => this.showImaginaryRectangle());
        document.getElementById('directionCount').addEventListener('change', (e) => this.updateDirections(e.target.value));
        document.getElementById('showDirections').addEventListener('click', () => this.showDirections());
        document.getElementById('colorSections').addEventListener('click', () => this.toggleColors());
        document.getElementById('nextStep3').addEventListener('click', () => this.goToStep(4));
        
        // Step 4 - Final View
        document.getElementById('finalRotateLeft').addEventListener('click', () => this.rotateFinal(-1));
        document.getElementById('finalRotateRight').addEventListener('click', () => this.rotateFinal(1));
        document.getElementById('finalRotateInput').addEventListener('input', (e) => this.setFinalRotation(e.target.value));
        document.getElementById('downloadImage').addEventListener('click', () => this.downloadImage());
    }
    
    setupCanvases() {
        this.imageCanvas = document.getElementById('imageCanvas');
        this.imageCtx = this.imageCanvas.getContext('2d');
        this.drawingCanvas = document.getElementById('drawingCanvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.analysisCanvas = document.getElementById('analysisCanvas');
        this.analysisCtx = this.analysisCanvas.getContext('2d');
        this.finalCanvas = document.getElementById('finalCanvas');
        this.finalCtx = this.finalCanvas.getContext('2d');
        
        // Set canvas sizes
        [this.imageCanvas, this.drawingCanvas, this.analysisCanvas, this.finalCanvas].forEach(canvas => {
            canvas.width = 800;
            canvas.height = 600;
        });
        
        this.setupDrawingEvents();
        this.setupImageEvents();
    }
    
    setupImageEvents() {
        this.imageCanvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.imageCanvas.addEventListener('mousemove', (e) => this.drag(e));
        this.imageCanvas.addEventListener('mouseup', () => this.endDrag());
        this.imageCanvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    
    setupDrawingEvents() {
        this.drawingCanvas.addEventListener('click', (e) => this.addWallPoint(e));
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.image = new Image();
            this.image.onload = () => {
                this.resetTransform();
                this.drawImage();
                document.getElementById('imageContainer').style.display = 'block';
                document.getElementById('toolbox').style.display = 'flex';
                document.getElementById('nextStep1').style.display = 'block';
            };
            this.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    resetTransform() {
        this.rotation = 0;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        document.getElementById('rotateInput').value = 0;
    }
    
    drawImage() {
        if (!this.image) return;
        
        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.imageCtx.save();
        
        const centerX = this.imageCanvas.width / 2;
        const centerY = this.imageCanvas.height / 2;
        
        this.imageCtx.translate(centerX + this.offsetX, centerY + this.offsetY);
        this.imageCtx.rotate(this.rotation * Math.PI / 180);
        this.imageCtx.scale(this.scale, this.scale);
        
        const imgWidth = Math.min(this.image.width, 400);
        const imgHeight = (imgWidth / this.image.width) * this.image.height;
        
        this.imageCtx.drawImage(this.image, -imgWidth/2, -imgHeight/2, imgWidth, imgHeight);
        this.imageCtx.restore();
        this.drawGrid();
    }
    
    drawGrid() {
        this.imageCtx.strokeStyle = '#ddd';
        this.imageCtx.lineWidth = 1;
        this.imageCtx.setLineDash([2, 2]);
        
        const gridSize = 20;
        for (let x = 0; x <= this.imageCanvas.width; x += gridSize) {
            this.imageCtx.beginPath();
            this.imageCtx.moveTo(x, 0);
            this.imageCtx.lineTo(x, this.imageCanvas.height);
            this.imageCtx.stroke();
        }
        
        for (let y = 0; y <= this.imageCanvas.height; y += gridSize) {
            this.imageCtx.beginPath();
            this.imageCtx.moveTo(0, y);
            this.imageCtx.lineTo(this.imageCanvas.width, y);
            this.imageCtx.stroke();
        }
        
        this.imageCtx.setLineDash([]);
    }
    
    rotateImage(delta) {
        this.rotation = (this.rotation + delta + 360) % 360;
        document.getElementById('rotateInput').value = this.rotation;
        this.drawImage();
    }
    
    setRotation(value) {
        this.rotation = parseInt(value) || 0;
        this.drawImage();
    }
    
    toggleMoveMode() {
        const btn = document.getElementById('moveBtn');
        btn.classList.toggle('active');
        this.imageCanvas.style.cursor = btn.classList.contains('active') ? 'move' : 'crosshair';
    }
    
    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(3, this.scale));
        this.drawImage();
    }
    
    startDrag(e) {
        if (!document.getElementById('moveBtn').classList.contains('active')) return;
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    drag(e) {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.drawImage();
    }
    
    endDrag() {
        this.isDragging = false;
    }
    
    handleWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    }
    
    goToStep(step) {
        document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
        document.getElementById(`step${step}`).classList.add('active');
        this.currentStep = step;
        
        if (step === 2) {
            this.setupDrawingCanvas();
        } else if (step === 3) {
            this.setupAnalysisCanvas();
        } else if (step === 4) {
            this.setupFinalCanvas();
        }
    }
    
    setupDrawingCanvas() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        if (this.image) {
            this.drawImageOnCanvas(this.drawingCtx, this.drawingCanvas);
        }
    }
    
    drawImageOnCanvas(ctx, canvas) {
        ctx.save();
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.translate(centerX + this.offsetX, centerY + this.offsetY);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.scale(this.scale, this.scale);
        
        const imgWidth = Math.min(this.image.width, 400);
        const imgHeight = (imgWidth / this.image.width) * this.image.height;
        
        ctx.drawImage(this.image, -imgWidth/2, -imgHeight/2, imgWidth, imgHeight);
        ctx.restore();
    }
    
    addWallPoint(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.walls.push({x, y});
        this.drawWalls();
        this.checkClosedCircuit();
    }
    
    drawWalls() {
        this.setupDrawingCanvas();
        
        this.drawingCtx.strokeStyle = '#3498db';
        this.drawingCtx.lineWidth = 2;
        
        // Draw lines
        if (this.walls.length > 1) {
            this.drawingCtx.beginPath();
            this.drawingCtx.moveTo(this.walls[0].x, this.walls[0].y);
            for (let i = 1; i < this.walls.length; i++) {
                this.drawingCtx.lineTo(this.walls[i].x, this.walls[i].y);
            }
            this.drawingCtx.stroke();
        }
        
        // Draw points
        this.walls.forEach((point, index) => {
            const isConnected = this.isPointConnected(index);
            this.drawingCtx.fillStyle = isConnected ? '#27ae60' : '#e74c3c';
            this.drawingCtx.beginPath();
            this.drawingCtx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.drawingCtx.fill();
        });
    }
    
    isPointConnected(index) {
        if (this.walls.length < 3) return false;
        if (index === 0) {
            const lastPoint = this.walls[this.walls.length - 1];
            const firstPoint = this.walls[0];
            const distance = Math.sqrt(Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2));
            return distance < 20;
        }
        return true;
    }
    
    checkClosedCircuit() {
        if (this.walls.length >= 3 && this.isPointConnected(0)) {
            document.getElementById('doneWalls').disabled = false;
        }
    }
    
    clearWalls() {
        this.walls = [];
        this.setupDrawingCanvas();
        document.getElementById('doneWalls').disabled = true;
    }
    
    finishWalls() {
        if (this.walls.length >= 3 && this.isPointConnected(0)) {
            document.getElementById('nextStep2').style.display = 'block';
        }
    }
    
    setupAnalysisCanvas() {
        this.analysisCtx.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        if (this.image) {
            this.drawImageOnCanvas(this.analysisCtx, this.analysisCanvas);
        }
        this.drawWallsOnAnalysis();
        this.calculateCenter();
    }
    
    drawWallsOnAnalysis() {
        this.analysisCtx.strokeStyle = '#3498db';
        this.analysisCtx.lineWidth = 2;
        
        if (this.walls.length > 1) {
            this.analysisCtx.beginPath();
            this.analysisCtx.moveTo(this.walls[0].x, this.walls[0].y);
            for (let i = 1; i < this.walls.length; i++) {
                this.analysisCtx.lineTo(this.walls[i].x, this.walls[i].y);
            }
            this.analysisCtx.closePath();
            this.analysisCtx.stroke();
        }
    }
    
    calculateCenter() {
        if (this.walls.length === 0) return;
        
        // Find bounding rectangle
        let minX = Math.min(...this.walls.map(p => p.x));
        let maxX = Math.max(...this.walls.map(p => p.x));
        let minY = Math.min(...this.walls.map(p => p.y));
        let maxY = Math.max(...this.walls.map(p => p.y));
        
        this.centerPoint = {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2
        };
        
        this.boundingRect = { minX, maxX, minY, maxY };
    }
    
    showImaginaryRectangle() {
        if (!this.centerPoint) return;
        
        this.setupAnalysisCanvas();
        
        // Draw dotted rectangle
        this.analysisCtx.setLineDash([5, 5]);
        this.analysisCtx.strokeStyle = '#95a5a6';
        this.analysisCtx.lineWidth = 1;
        this.analysisCtx.strokeRect(
            this.boundingRect.minX,
            this.boundingRect.minY,
            this.boundingRect.maxX - this.boundingRect.minX,
            this.boundingRect.maxY - this.boundingRect.minY
        );
        
        // Draw center point
        this.analysisCtx.setLineDash([]);
        this.analysisCtx.fillStyle = 'rgba(230, 126, 34, 0.7)';
        this.analysisCtx.beginPath();
        this.analysisCtx.arc(this.centerPoint.x, this.centerPoint.y, 8, 0, 2 * Math.PI);
        this.analysisCtx.fill();
    }
    
    updateDirections(count) {
        this.directionCount = parseInt(count);
        this.generateDirections();
    }
    
    generateDirections() {
        this.directions = [];
        const count = this.directionCount || 4;
        
        const directionNames = {
            4: ['N', 'E', 'S', 'W'],
            8: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
            16: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
        };
        
        const names = directionNames[count];
        const angleStep = 360 / count;
        
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            this.directions.push({
                name: names[i],
                angle: angle,
                color: `hsl(${(i * 360 / count)}, 70%, 50%)`
            });
        }
    }
    
    showDirections() {
        if (!this.centerPoint) return;
        
        this.setupAnalysisCanvas();
        this.generateDirections();
        
        const radius = 200;
        
        this.directions.forEach(dir => {
            const radians = (dir.angle - 90) * Math.PI / 180; // -90 to make North point up
            const endX = this.centerPoint.x + Math.cos(radians) * radius;
            const endY = this.centerPoint.y + Math.sin(radians) * radius;
            
            // Draw direction line
            this.analysisCtx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
            this.analysisCtx.lineWidth = 1;
            this.analysisCtx.beginPath();
            this.analysisCtx.moveTo(this.centerPoint.x, this.centerPoint.y);
            this.analysisCtx.lineTo(endX, endY);
            this.analysisCtx.stroke();
            
            // Draw label
            const labelX = this.centerPoint.x + Math.cos(radians) * (radius + 20);
            const labelY = this.centerPoint.y + Math.sin(radians) * (radius + 20);
            
            this.analysisCtx.fillStyle = '#2c3e50';
            this.analysisCtx.font = '14px Arial';
            this.analysisCtx.textAlign = 'center';
            this.analysisCtx.fillText(dir.name, labelX, labelY);
        });
        
        // Draw center point
        this.analysisCtx.fillStyle = 'rgba(230, 126, 34, 0.7)';
        this.analysisCtx.beginPath();
        this.analysisCtx.arc(this.centerPoint.x, this.centerPoint.y, 8, 0, 2 * Math.PI);
        this.analysisCtx.fill();
    }
    
    toggleColors() {
        this.showColors = !this.showColors;
        const btn = document.getElementById('colorSections');
        btn.textContent = this.showColors ? 'Hide Colors' : 'Color Sections';
        
        if (this.showColors) {
            this.drawColoredSections();
        } else {
            this.showDirections();
        }
    }
    
    drawColoredSections() {
        this.showDirections();
        
        if (!this.centerPoint || this.directions.length === 0) return;
        
        const radius = 180;
        const angleStep = 360 / this.directions.length;
        
        this.directions.forEach((dir, index) => {
            const startAngle = (dir.angle - angleStep/2 - 90) * Math.PI / 180;
            const endAngle = (dir.angle + angleStep/2 - 90) * Math.PI / 180;
            
            this.analysisCtx.fillStyle = dir.color.replace('50%)', '20%)');
            this.analysisCtx.beginPath();
            this.analysisCtx.moveTo(this.centerPoint.x, this.centerPoint.y);
            this.analysisCtx.arc(this.centerPoint.x, this.centerPoint.y, radius, startAngle, endAngle);
            this.analysisCtx.closePath();
            this.analysisCtx.fill();
        });
        
        // Redraw direction lines and labels
        this.showDirections();
    }
    
    setupFinalCanvas() {
        this.finalRotation = 0;
        document.getElementById('finalRotateInput').value = 0;
        this.drawFinalView();
    }
    
    drawFinalView() {
        this.finalCtx.clearRect(0, 0, this.finalCanvas.width, this.finalCanvas.height);
        
        this.finalCtx.save();
        const centerX = this.finalCanvas.width / 2;
        const centerY = this.finalCanvas.height / 2;
        
        this.finalCtx.translate(centerX, centerY);
        this.finalCtx.rotate(this.finalRotation * Math.PI / 180);
        this.finalCtx.translate(-centerX, -centerY);
        
        // Draw image
        if (this.image) {
            this.drawImageOnCanvas(this.finalCtx, this.finalCanvas);
        }
        
        // Draw walls
        this.drawWallsOnFinal();
        
        // Draw directions with rotated labels
        this.drawRotatedDirections();
        
        this.finalCtx.restore();
    }
    
    drawWallsOnFinal() {
        this.finalCtx.strokeStyle = '#3498db';
        this.finalCtx.lineWidth = 2;
        
        if (this.walls.length > 1) {
            this.finalCtx.beginPath();
            this.finalCtx.moveTo(this.walls[0].x, this.walls[0].y);
            for (let i = 1; i < this.walls.length; i++) {
                this.finalCtx.lineTo(this.walls[i].x, this.walls[i].y);
            }
            this.finalCtx.closePath();
            this.finalCtx.stroke();
        }
    }
    
    drawRotatedDirections() {
        if (!this.centerPoint || this.directions.length === 0) return;
        
        const radius = 200;
        
        // Draw colored sections if enabled
        if (this.showColors) {
            const angleStep = 360 / this.directions.length;
            this.directions.forEach((dir, index) => {
                const startAngle = (dir.angle - angleStep/2 - 90) * Math.PI / 180;
                const endAngle = (dir.angle + angleStep/2 - 90) * Math.PI / 180;
                
                this.finalCtx.fillStyle = dir.color.replace('50%)', '20%)');
                this.finalCtx.beginPath();
                this.finalCtx.moveTo(this.centerPoint.x, this.centerPoint.y);
                this.finalCtx.arc(this.centerPoint.x, this.centerPoint.y, radius, startAngle, endAngle);
                this.finalCtx.closePath();
                this.finalCtx.fill();
            });
        }
        
        this.directions.forEach(dir => {
            const radians = (dir.angle - 90) * Math.PI / 180;
            const endX = this.centerPoint.x + Math.cos(radians) * radius;
            const endY = this.centerPoint.y + Math.sin(radians) * radius;
            
            // Draw direction line
            this.finalCtx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
            this.finalCtx.lineWidth = 1;
            this.finalCtx.beginPath();
            this.finalCtx.moveTo(this.centerPoint.x, this.centerPoint.y);
            this.finalCtx.lineTo(endX, endY);
            this.finalCtx.stroke();
            
            // Draw rotated label
            const labelX = this.centerPoint.x + Math.cos(radians) * (radius + 20);
            const labelY = this.centerPoint.y + Math.sin(radians) * (radius + 20);
            
            this.finalCtx.save();
            this.finalCtx.translate(labelX, labelY);
            this.finalCtx.rotate(-this.finalRotation * Math.PI / 180); // Counter-rotate text
            this.finalCtx.fillStyle = '#2c3e50';
            this.finalCtx.font = '14px Arial';
            this.finalCtx.textAlign = 'center';
            this.finalCtx.fillText(dir.name, 0, 0);
            this.finalCtx.restore();
        });
        
        // Draw center point
        this.finalCtx.fillStyle = 'rgba(230, 126, 34, 0.7)';
        this.finalCtx.beginPath();
        this.finalCtx.arc(this.centerPoint.x, this.centerPoint.y, 8, 0, 2 * Math.PI);
        this.finalCtx.fill();
    }
    
    rotateFinal(delta) {
        this.finalRotation = (this.finalRotation + delta + 360) % 360;
        document.getElementById('finalRotateInput').value = this.finalRotation;
        this.drawFinalView();
    }
    
    setFinalRotation(value) {
        this.finalRotation = parseInt(value) || 0;
        this.drawFinalView();
    }
    
    downloadImage() {
        const link = document.createElement('a');
        link.download = 'vastu-analysis.png';
        link.href = this.finalCanvas.toDataURL();
        link.click();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new VastuApp();
});