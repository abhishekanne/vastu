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
        this.wallHistory = [];
        this.wallHistoryIndex = -1;
        this.isDrawing = false;
        this.centerPoint = null;
        this.directions = [];
        this.showColors = false;
        this.showDirectionsVisible = false;
        this.showRectangleVisible = false;
        this.finalRotation = 0;
        this.doorPoints = [];
        this.isDrawingDoor = false;
        this.selectedExitDirection = null;
        this.exitArrows = [];
        this.showExitLabels = true;
        this.selectedTriangle = null;
        
        this.initializeEventListeners();
        this.setupCanvases();
        this.drawGrid(); // Show grid immediately on step 1
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
        document.getElementById('drawWalls').addEventListener('click', () => this.toggleDrawMode());
        document.getElementById('undoWall').addEventListener('click', () => this.undoWall());
        document.getElementById('redoWall').addEventListener('click', () => this.redoWall());
        document.getElementById('clearWalls').addEventListener('click', () => this.clearWalls());
        document.getElementById('doneWalls').addEventListener('click', () => this.finishWalls());
        document.getElementById('backStep2').addEventListener('click', () => this.goToStep(1));
        document.getElementById('moveBtn2').addEventListener('click', () => this.toggleMoveMode2());
        document.getElementById('zoomIn2').addEventListener('click', () => this.zoom2(1.1));
        document.getElementById('zoomOut2').addEventListener('click', () => this.zoom2(0.9));
        document.getElementById('nextStep2').addEventListener('click', () => this.goToStep(3));
        
        // Step 3 - Map Main Door
        document.getElementById('drawDoor').addEventListener('click', () => this.toggleDrawDoor());
        document.getElementById('clearDoor').addEventListener('click', () => this.clearDoor());
        document.getElementById('backStep3').addEventListener('click', () => this.goToStep(2));
        document.getElementById('nextStep3').addEventListener('click', () => this.goToStep(4));
        
        // Step 4 - Plot Exit Arrow
        document.getElementById('backStep4').addEventListener('click', () => this.goToStep(3));
        document.getElementById('nextStep4').addEventListener('click', () => this.goToStep(5));
        
        // Step 5 - Direction Analysis
        document.getElementById('showRectangle').addEventListener('click', () => this.showImaginaryRectangle());
        document.getElementById('directionCount').addEventListener('change', (e) => this.updateDirections(e.target.value));
        document.getElementById('showDirections').addEventListener('click', () => this.showDirections());
        document.getElementById('colorSections').addEventListener('click', () => this.toggleColors());
        document.getElementById('backStep5').addEventListener('click', () => this.goToStep(4));
        document.getElementById('nextStep5').addEventListener('click', () => this.goToStep(6));
        
        // Step 6 - Final View
        document.getElementById('finalRotateLeft').addEventListener('click', () => this.rotateFinal(-1));
        document.getElementById('finalRotateRight').addEventListener('click', () => this.rotateFinal(1));
        document.getElementById('finalRotateInput').addEventListener('input', (e) => this.setFinalRotation(e.target.value));
        document.getElementById('downloadImage').addEventListener('click', () => this.downloadImage());
        document.getElementById('backStep6').addEventListener('click', () => this.goToStep(5));
    }
    
    setupCanvases() {
        this.imageCanvas = document.getElementById('imageCanvas');
        this.imageCtx = this.imageCanvas.getContext('2d');
        this.drawingCanvas = document.getElementById('drawingCanvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.doorCanvas = document.getElementById('doorCanvas');
        this.doorCtx = this.doorCanvas.getContext('2d');
        this.exitCanvas = document.getElementById('exitCanvas');
        this.exitCtx = this.exitCanvas.getContext('2d');
        this.analysisCanvas = document.getElementById('analysisCanvas');
        this.analysisCtx = this.analysisCanvas.getContext('2d');
        this.finalCanvas = document.getElementById('finalCanvas');
        this.finalCtx = this.finalCanvas.getContext('2d');
        
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
        
        this.setupDrawingEvents();
        this.setupImageEvents();
        this.setupDoorEvents();
        this.setupExitEvents();
    }
    
    resizeCanvases() {
        const containerWidth = Math.min(window.innerWidth - 40, 800);
        const containerHeight = Math.min(window.innerHeight - 300, 500);
        
        [this.imageCanvas, this.drawingCanvas, this.doorCanvas, this.exitCanvas, this.analysisCanvas, this.finalCanvas].forEach(canvas => {
            canvas.width = containerWidth;
            canvas.height = containerHeight;
        });
    }
    
    setupImageEvents() {
        this.imageCanvas.addEventListener('mousedown', (e) => this.startDrag(e));
        this.imageCanvas.addEventListener('mousemove', (e) => this.drag(e));
        this.imageCanvas.addEventListener('mouseup', () => this.endDrag());
        this.imageCanvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }
    
    setupDrawingEvents() {
        this.drawingCanvas.addEventListener('click', (e) => {
            if (document.getElementById('drawWalls').classList.contains('active')) {
                this.addWallPoint(e);
            }
        });
        this.drawingCanvas.addEventListener('mousedown', (e) => this.startDrag2(e));
        this.drawingCanvas.addEventListener('mousemove', (e) => this.drag2(e));
        this.drawingCanvas.addEventListener('mouseup', () => this.endDrag2());
        this.drawingCanvas.addEventListener('wheel', (e) => this.handleWheel2(e));
    }
    
    setupDoorEvents() {
        this.doorCanvas.addEventListener('click', (e) => {
            if (document.getElementById('drawDoor').classList.contains('active')) {
                this.addDoorPoint(e);
            }
        });
    }
    
    setupDoorCanvas() {
        this.doorCtx.clearRect(0, 0, this.doorCanvas.width, this.doorCanvas.height);
        if (this.image) {
            this.drawImageOnCanvas(this.doorCtx, this.doorCanvas);
        }
        this.drawGridOnCanvas(this.doorCtx, this.doorCanvas);
        this.drawWallsOnDoor();
        if (this.doorPoints.length > 0) {
            this.drawDoorPoints();
        }
    }
    
    drawWallsOnDoor() {
        this.doorCtx.strokeStyle = '#3498db';
        this.doorCtx.lineWidth = 2;
        
        if (this.walls.length > 1) {
            this.doorCtx.beginPath();
            this.doorCtx.moveTo(this.walls[0].x, this.walls[0].y);
            for (let i = 1; i < this.walls.length; i++) {
                this.doorCtx.lineTo(this.walls[i].x, this.walls[i].y);
            }
            this.doorCtx.closePath();
            this.doorCtx.stroke();
        }
        
        // Draw wall points
        this.walls.forEach((point, index) => {
            const isConnected = this.isPointConnected(index);
            this.doorCtx.fillStyle = isConnected ? '#27ae60' : '#e74c3c';
            this.doorCtx.beginPath();
            this.doorCtx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.doorCtx.fill();
        });
    }
    
    drawDoorPoints() {
        // Draw door points and line
        if (this.doorPoints.length > 0) {
            this.doorCtx.fillStyle = '#e74c3c';
            this.doorCtx.strokeStyle = '#c0392b';
            this.doorCtx.lineWidth = 4;
            
            // Draw door line if we have 2 points
            if (this.doorPoints.length === 2) {
                this.doorCtx.beginPath();
                this.doorCtx.moveTo(this.doorPoints[0].x, this.doorPoints[0].y);
                this.doorCtx.lineTo(this.doorPoints[1].x, this.doorPoints[1].y);
                this.doorCtx.stroke();
            }
            
            // Draw door points
            this.doorPoints.forEach(point => {
                this.doorCtx.beginPath();
                this.doorCtx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                this.doorCtx.fill();
            });
        }
    }
    
    toggleDrawDoor() {
        const drawBtn = document.getElementById('drawDoor');
        drawBtn.classList.add('active');
        this.doorCanvas.style.cursor = 'crosshair';
        this.isDrawingDoor = true;
    }
    
    addDoorPoint(e) {
        if (this.doorPoints.length >= 2) return;
        
        const rect = this.doorCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.doorPoints.push({x, y});
        this.setupDoorCanvas();
        
        if (this.doorPoints.length === 2) {
            document.getElementById('nextStep3').style.display = 'block';
        }
    }
    
    drawDoor() {
        this.setupDoorCanvas();
    }
    
    clearDoor() {
        this.doorPoints = [];
        this.setupDoorCanvas();
        document.getElementById('nextStep3').style.display = 'none';
    }
    
    toggleMoveMode3() {
        const drawBtn = document.getElementById('drawDoor');
        const moveBtn = document.getElementById('moveBtn3');
        
        moveBtn.classList.toggle('active');
        if (moveBtn.classList.contains('active')) {
            drawBtn.classList.remove('active');
            this.doorCanvas.style.cursor = 'move';
            this.isDrawingDoor = false;
        } else {
            drawBtn.classList.add('active');
            this.doorCanvas.style.cursor = 'crosshair';
            this.isDrawingDoor = true;
        }
    }
    
    startDragDoor(e) {
        if (!document.getElementById('moveBtn3').classList.contains('active')) return;
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    dragDoor(e) {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.setupDoorCanvas();
    }
    
    endDragDoor() {
        this.isDragging = false;
    }
    
    setupExitEvents() {
        this.exitCanvas.addEventListener('click', (e) => this.selectExitDirection(e));
    }
    
    setupExitCanvas() {
        this.exitCtx.clearRect(0, 0, this.exitCanvas.width, this.exitCanvas.height);
        if (this.image) {
            this.drawImageOnCanvas(this.exitCtx, this.exitCanvas);
        }
        this.drawGridOnCanvas(this.exitCtx, this.exitCanvas);
        this.drawWallsOnExit();
        this.drawDoorOnExit();
        this.generateExitArrows();
        this.drawExitArrows();
    }
    
    drawWallsOnExit() {
        this.exitCtx.strokeStyle = '#3498db';
        this.exitCtx.lineWidth = 2;
        
        if (this.walls.length > 1) {
            this.exitCtx.beginPath();
            this.exitCtx.moveTo(this.walls[0].x, this.walls[0].y);
            for (let i = 1; i < this.walls.length; i++) {
                this.exitCtx.lineTo(this.walls[i].x, this.walls[i].y);
            }
            this.exitCtx.closePath();
            this.exitCtx.stroke();
        }
    }
    
    drawDoorOnExit() {
        if (this.doorPoints.length === 2) {
            this.exitCtx.strokeStyle = '#c0392b';
            this.exitCtx.lineWidth = 4;
            this.exitCtx.beginPath();
            this.exitCtx.moveTo(this.doorPoints[0].x, this.doorPoints[0].y);
            this.exitCtx.lineTo(this.doorPoints[1].x, this.doorPoints[1].y);
            this.exitCtx.stroke();
        }
    }
    
    generateExitArrows() {
        if (this.doorPoints.length !== 2) return;
        
        const doorCenterX = (this.doorPoints[0].x + this.doorPoints[1].x) / 2;
        const doorCenterY = (this.doorPoints[0].y + this.doorPoints[1].y) / 2;
        
        // Calculate door direction vector
        const doorVectorX = this.doorPoints[1].x - this.doorPoints[0].x;
        const doorVectorY = this.doorPoints[1].y - this.doorPoints[0].y;
        
        // Calculate perpendicular vectors (both directions)
        const perpX1 = -doorVectorY;
        const perpY1 = doorVectorX;
        const perpX2 = doorVectorY;
        const perpY2 = -doorVectorX;
        
        // Normalize and scale
        const length1 = Math.sqrt(perpX1 * perpX1 + perpY1 * perpY1);
        const length2 = Math.sqrt(perpX2 * perpX2 + perpY2 * perpY2);
        
        const triangleDistance = 30;
        
        this.exitArrows = [
            {
                x: doorCenterX + (perpX1 / length1) * triangleDistance,
                y: doorCenterY + (perpY1 / length1) * triangleDistance,
                direction: 'in',
                color: '#e74c3c',
                selected: false,
                angle: Math.atan2(perpY1, perpX1)
            },
            {
                x: doorCenterX + (perpX2 / length2) * triangleDistance,
                y: doorCenterY + (perpY2 / length2) * triangleDistance,
                direction: 'out',
                color: '#27ae60',
                selected: false,
                angle: Math.atan2(perpY2, perpX2)
            }
        ];
    }
    
    drawExitArrows() {
        this.exitArrows.forEach(arrow => {
            if (this.selectedExitDirection && arrow.direction !== this.selectedExitDirection) {
                return; // Hide unselected triangles
            }
            
            // Draw triangle
            const size = 15;
            this.exitCtx.fillStyle = arrow.selected ? '#f39c12' : arrow.color;
            this.exitCtx.strokeStyle = arrow.selected ? '#f39c12' : arrow.color;
            this.exitCtx.lineWidth = 2;
            
            this.exitCtx.save();
            this.exitCtx.translate(arrow.x, arrow.y);
            this.exitCtx.rotate(arrow.angle);
            
            this.exitCtx.beginPath();
            this.exitCtx.moveTo(size, 0);
            this.exitCtx.lineTo(-size/2, -size/2);
            this.exitCtx.lineTo(-size/2, size/2);
            this.exitCtx.closePath();
            this.exitCtx.fill();
            this.exitCtx.stroke();
            
            this.exitCtx.restore();
            
            // Draw compass direction label on top of triangle head
            const compassDirection = this.getCompassDirection(arrow.angle);
            const headX = arrow.x + Math.cos(arrow.angle) * 20;
            const headY = arrow.y + Math.sin(arrow.angle) * 20;
            
            this.exitCtx.fillStyle = '#000000';
            this.exitCtx.font = 'bold 14px Arial';
            this.exitCtx.textAlign = 'center';
            this.exitCtx.textBaseline = 'middle';
            this.exitCtx.fillText(compassDirection, headX, headY - 10);
        });
    }
    
    selectExitDirection(e) {
        const rect = this.exitCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if click is near any triangle
        this.exitArrows.forEach(arrow => {
            const distance = Math.sqrt((x - arrow.x) ** 2 + (y - arrow.y) ** 2);
            if (distance < 25) {
                // Deselect all arrows
                this.exitArrows.forEach(a => a.selected = false);
                // Select clicked arrow
                arrow.selected = true;
                this.selectedExitDirection = arrow.direction;
                // Store selected triangle data
                this.selectedTriangle = {
                    x: arrow.x,
                    y: arrow.y,
                    angle: arrow.angle,
                    direction: this.getCompassDirection(arrow.angle)
                };
                document.getElementById('nextStep4').style.display = 'block';
                this.setupExitCanvas();
            }
        });
    }
    
    getCompassDirection(angle) {
        // Convert angle to degrees and normalize (0 = East, -90 = North)
        let degrees = (angle * 180 / Math.PI + 360) % 360;
        
        // Adjust so 0 degrees = North (top of screen)
        degrees = (degrees + 90) % 360;
        
        // 16-direction compass
        const directions = [
            'N', 'NNE', 'NE', 'ENE',
            'E', 'ESE', 'SE', 'SSE', 
            'S', 'SSW', 'SW', 'WSW',
            'W', 'WNW', 'NW', 'NNW'
        ];
        
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
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
                document.getElementById('imageTools').style.display = 'flex';
                document.getElementById('controlTools').style.display = 'flex';
                document.getElementById('nextStep1').disabled = false;
                this.imageCanvas.style.cursor = 'move';
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
        this.imageCtx.strokeStyle = '#999';
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
            this.setupDoorCanvas();
        } else if (step === 4) {
            this.setupExitCanvas();
        } else if (step === 5) {
            this.setupAnalysisCanvas();
            this.setupStep5Events();
        } else if (step === 6) {
            this.setupFinalCanvas();
        }
    }
    
    setupStep5Events() {
        // No interactive events for step 5 - view only
    }
    
    setupDrawingCanvas() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.drawGridOnCanvas(this.drawingCtx, this.drawingCanvas);
        if (this.image) {
            this.drawImageOnCanvas(this.drawingCtx, this.drawingCanvas);
        }
        this.drawGridOnCanvas(this.drawingCtx, this.drawingCanvas);
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
    
    drawGridOnCanvas(ctx, canvas) {
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        const gridSize = 20;
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }
    
    toggleDrawMode() {
        const drawBtn = document.getElementById('drawWalls');
        const moveBtn = document.getElementById('moveBtn2');
        
        drawBtn.classList.add('active');
        moveBtn.classList.remove('active');
        this.drawingCanvas.style.cursor = 'crosshair';
    }
    
    toggleMoveMode2() {
        const drawBtn = document.getElementById('drawWalls');
        const moveBtn = document.getElementById('moveBtn2');
        
        moveBtn.classList.toggle('active');
        if (moveBtn.classList.contains('active')) {
            drawBtn.classList.remove('active');
            this.drawingCanvas.style.cursor = 'move';
        } else {
            drawBtn.classList.add('active');
            this.drawingCanvas.style.cursor = 'crosshair';
        }
    }
    
    zoom2(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(3, this.scale));
        this.drawWalls();
    }
    
    startDrag2(e) {
        if (!document.getElementById('moveBtn2').classList.contains('active')) return;
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    drag2(e) {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.drawWalls();
    }
    
    endDrag2() {
        this.isDragging = false;
    }
    
    handleWheel2(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom2(factor);
    }
    
    addWallPoint(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.walls.push({x, y});
        this.saveWallState();
        this.drawWalls();
        this.checkClosedCircuit();
    }
    
    saveWallState() {
        this.wallHistoryIndex++;
        this.wallHistory = this.wallHistory.slice(0, this.wallHistoryIndex);
        this.wallHistory.push([...this.walls]);
        this.updateUndoRedoButtons();
    }
    
    undoWall() {
        if (this.wallHistoryIndex > 0) {
            this.wallHistoryIndex--;
            this.walls = [...this.wallHistory[this.wallHistoryIndex]];
            this.drawWalls();
            this.checkClosedCircuit();
            this.updateUndoRedoButtons();
        }
    }
    
    redoWall() {
        if (this.wallHistoryIndex < this.wallHistory.length - 1) {
            this.wallHistoryIndex++;
            this.walls = [...this.wallHistory[this.wallHistoryIndex]];
            this.drawWalls();
            this.checkClosedCircuit();
            this.updateUndoRedoButtons();
        }
    }
    
    updateUndoRedoButtons() {
        document.getElementById('undoWall').disabled = this.wallHistoryIndex <= 0;
        document.getElementById('redoWall').disabled = this.wallHistoryIndex >= this.wallHistory.length - 1;
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
        this.wallHistory = [[]];
        this.wallHistoryIndex = 0;
        this.setupDrawingCanvas();
        document.getElementById('doneWalls').disabled = true;
        this.updateUndoRedoButtons();
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
        this.drawDoorOnAnalysis();
        this.drawSelectedTriangleOnAnalysis();
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
        
        // Draw points
        this.walls.forEach((point, index) => {
            const isConnected = this.isPointConnected(index);
            this.analysisCtx.fillStyle = isConnected ? '#27ae60' : '#e74c3c';
            this.analysisCtx.beginPath();
            this.analysisCtx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.analysisCtx.fill();
        });
    }
    
    drawDoorOnAnalysis() {
        if (this.doorPoints.length === 2) {
            this.analysisCtx.strokeStyle = '#c0392b';
            this.analysisCtx.lineWidth = 4;
            this.analysisCtx.beginPath();
            this.analysisCtx.moveTo(this.doorPoints[0].x, this.doorPoints[0].y);
            this.analysisCtx.lineTo(this.doorPoints[1].x, this.doorPoints[1].y);
            this.analysisCtx.stroke();
            
            // Draw door points
            this.analysisCtx.fillStyle = '#e74c3c';
            this.doorPoints.forEach(point => {
                this.analysisCtx.beginPath();
                this.analysisCtx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                this.analysisCtx.fill();
            });
        }
    }
    
    drawSelectedTriangleOnAnalysis() {
        if (!this.selectedTriangle) return;
        
        // Draw triangle
        const size = 15;
        this.analysisCtx.fillStyle = '#f39c12';
        this.analysisCtx.strokeStyle = '#f39c12';
        this.analysisCtx.lineWidth = 2;
        
        this.analysisCtx.save();
        this.analysisCtx.translate(this.selectedTriangle.x, this.selectedTriangle.y);
        this.analysisCtx.rotate(this.selectedTriangle.angle);
        
        this.analysisCtx.beginPath();
        this.analysisCtx.moveTo(size, 0);
        this.analysisCtx.lineTo(-size/2, -size/2);
        this.analysisCtx.lineTo(-size/2, size/2);
        this.analysisCtx.closePath();
        this.analysisCtx.fill();
        this.analysisCtx.stroke();
        
        this.analysisCtx.restore();
        
        // Draw compass direction label on top of triangle head
        const headX = this.selectedTriangle.x + Math.cos(this.selectedTriangle.angle) * 20;
        const headY = this.selectedTriangle.y + Math.sin(this.selectedTriangle.angle) * 20;
        
        this.analysisCtx.fillStyle = '#000000';
        this.analysisCtx.font = 'bold 14px Arial';
        this.analysisCtx.textAlign = 'center';
        this.analysisCtx.textBaseline = 'middle';
        this.analysisCtx.fillText(this.selectedTriangle.direction, headX, headY - 10);
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
        this.showRectangleVisible = !this.showRectangleVisible;
        const btn = document.getElementById('showRectangle');
        btn.textContent = this.showRectangleVisible ? 'Hide Imaginary Rectangle' : 'Show Imaginary Rectangle';
        
        this.redrawAnalysisView();
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
        this.showDirectionsVisible = !this.showDirectionsVisible;
        const btn = document.getElementById('showDirections');
        btn.textContent = this.showDirectionsVisible ? 'Hide Directions' : 'Show Directions';
        
        this.redrawAnalysisView();
    }
    
    toggleColors() {
        this.showColors = !this.showColors;
        const btn = document.getElementById('colorSections');
        btn.textContent = this.showColors ? 'Hide Colors' : 'Color Sections';
        
        this.redrawAnalysisView();
    }
    
    redrawAnalysisView() {
        this.setupAnalysisCanvas();
        
        // Draw 3x3 grid if rectangle is visible
        if (this.showRectangleVisible && this.centerPoint) {
            this.draw3x3Grid();
        }
        
        // Draw directions if visible
        if (this.showDirectionsVisible) {
            this.drawDirectionsOnly();
        }
        
        // Always draw center point if it exists
        if (this.centerPoint) {
            this.analysisCtx.fillStyle = 'rgba(230, 126, 34, 0.7)';
            this.analysisCtx.beginPath();
            this.analysisCtx.arc(this.centerPoint.x, this.centerPoint.y, 8, 0, 2 * Math.PI);
            this.analysisCtx.fill();
        }
    }
    
    draw3x3Grid() {
        const rectWidth = this.boundingRect.maxX - this.boundingRect.minX;
        const rectHeight = this.boundingRect.maxY - this.boundingRect.minY;
        const cellWidth = rectWidth / 3;
        const cellHeight = rectHeight / 3;
        
        // Define 9 different transparent colors for 3x3 grid
        const colors = [
            'rgba(255, 0, 0, 0.2)',    // Red
            'rgba(0, 255, 0, 0.2)',    // Green
            'rgba(0, 0, 255, 0.2)',    // Blue
            'rgba(255, 255, 0, 0.2)',  // Yellow
            'rgba(255, 0, 255, 0.2)',  // Magenta
            'rgba(0, 255, 255, 0.2)',  // Cyan
            'rgba(255, 165, 0, 0.2)',  // Orange
            'rgba(128, 0, 128, 0.2)',  // Purple
            'rgba(255, 192, 203, 0.2)' // Pink
        ];
        
        let colorIndex = 0;
        
        // Draw 3x3 grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = this.boundingRect.minX + col * cellWidth;
                const y = this.boundingRect.minY + row * cellHeight;
                
                // Fill with color if colors are enabled
                if (this.showColors) {
                    this.analysisCtx.fillStyle = colors[colorIndex];
                    this.analysisCtx.fillRect(x, y, cellWidth, cellHeight);
                }
                
                // Draw grid lines
                this.analysisCtx.setLineDash([5, 5]);
                this.analysisCtx.strokeStyle = '#95a5a6';
                this.analysisCtx.lineWidth = 1;
                this.analysisCtx.strokeRect(x, y, cellWidth, cellHeight);
                this.analysisCtx.setLineDash([]);
                
                colorIndex++;
            }
        }
    }
    
    toggleMoveMode3() {
        const moveBtn = document.getElementById('moveBtn3');
        moveBtn.classList.toggle('active');
        this.analysisCanvas.style.cursor = moveBtn.classList.contains('active') ? 'move' : 'default';
    }
    
    zoom3(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(3, this.scale));
        
        // Simple redraw without complex method calls
        this.analysisCtx.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        if (this.image) {
            this.drawImageOnCanvas(this.analysisCtx, this.analysisCanvas);
        }
        this.drawWallsOnAnalysis();
        this.calculateCenter();
        
        if (this.showDirectionsVisible) {
            this.drawDirectionsOnly();
        }
        if (this.showColors) {
            this.drawColoredSections();
        }
    }
    
    startDrag3(e) {
        if (!document.getElementById('moveBtn3').classList.contains('active')) return;
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }
    
    drag3(e) {
        if (!this.isDragging) return;
        const deltaX = e.clientX - this.lastX;
        const deltaY = e.clientY - this.lastY;
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        
        // Simple redraw without complex method calls
        this.analysisCtx.clearRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        if (this.image) {
            this.drawImageOnCanvas(this.analysisCtx, this.analysisCanvas);
        }
        this.drawWallsOnAnalysis();
        this.calculateCenter();
        
        if (this.showDirectionsVisible) {
            this.drawDirectionsOnly();
        }
        if (this.showColors) {
            this.drawColoredSections();
        }
    }
    
    endDrag3() {
        this.isDragging = false;
    }
    
    handleWheel3(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom3(factor);
    }
    

    drawDirectionsOnly() {
        if (!this.centerPoint) return;
        
        this.generateDirections();
        
        const radius = 200;
        
        this.directions.forEach(dir => {
            const radians = (dir.angle - 90) * Math.PI / 180;
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
            
            this.analysisCtx.fillStyle = '#000000';
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
    
    drawColoredSections() {
        this.drawDirectionsOnly();
        
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
        this.drawDirectionsOnly();
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
        
        // Draw door
        this.drawDoorOnFinal();
        
        // Draw selected triangle
        this.drawSelectedTriangleOnFinal();
        
        // Draw 3x3 grid if it was visible in step 3
        if (this.showRectangleVisible && this.centerPoint) {
            this.draw3x3GridOnFinal();
        }
        
        // Draw directions if they were visible in step 3
        if (this.showDirectionsVisible) {
            this.drawRotatedDirections();
        }
        
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
    
    drawDoorOnFinal() {
        if (this.doorPoints.length === 2) {
            this.finalCtx.strokeStyle = '#c0392b';
            this.finalCtx.lineWidth = 4;
            this.finalCtx.beginPath();
            this.finalCtx.moveTo(this.doorPoints[0].x, this.doorPoints[0].y);
            this.finalCtx.lineTo(this.doorPoints[1].x, this.doorPoints[1].y);
            this.finalCtx.stroke();
            
            // Draw door points
            this.finalCtx.fillStyle = '#e74c3c';
            this.doorPoints.forEach(point => {
                this.finalCtx.beginPath();
                this.finalCtx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
                this.finalCtx.fill();
            });
        }
    }
    
    drawSelectedTriangleOnFinal() {
        if (!this.selectedTriangle) return;
        
        // Draw triangle
        const size = 15;
        this.finalCtx.fillStyle = '#f39c12';
        this.finalCtx.strokeStyle = '#f39c12';
        this.finalCtx.lineWidth = 2;
        
        this.finalCtx.save();
        this.finalCtx.translate(this.selectedTriangle.x, this.selectedTriangle.y);
        this.finalCtx.rotate(this.selectedTriangle.angle);
        
        this.finalCtx.beginPath();
        this.finalCtx.moveTo(size, 0);
        this.finalCtx.lineTo(-size/2, -size/2);
        this.finalCtx.lineTo(-size/2, size/2);
        this.finalCtx.closePath();
        this.finalCtx.fill();
        this.finalCtx.stroke();
        
        this.finalCtx.restore();
        
        // Draw compass direction label on top of triangle head
        const headX = this.selectedTriangle.x + Math.cos(this.selectedTriangle.angle) * 20;
        const headY = this.selectedTriangle.y + Math.sin(this.selectedTriangle.angle) * 20;
        
        this.finalCtx.fillStyle = '#000000';
        this.finalCtx.font = 'bold 14px Arial';
        this.finalCtx.textAlign = 'center';
        this.finalCtx.textBaseline = 'middle';
        this.finalCtx.fillText(this.selectedTriangle.direction, headX, headY - 10);
    }
    
    draw3x3GridOnFinal() {
        const rectWidth = this.boundingRect.maxX - this.boundingRect.minX;
        const rectHeight = this.boundingRect.maxY - this.boundingRect.minY;
        const cellWidth = rectWidth / 3;
        const cellHeight = rectHeight / 3;
        
        // Define 9 different transparent colors for 3x3 grid
        const colors = [
            'rgba(255, 0, 0, 0.2)',    // Red
            'rgba(0, 255, 0, 0.2)',    // Green
            'rgba(0, 0, 255, 0.2)',    // Blue
            'rgba(255, 255, 0, 0.2)',  // Yellow
            'rgba(255, 0, 255, 0.2)',  // Magenta
            'rgba(0, 255, 255, 0.2)',  // Cyan
            'rgba(255, 165, 0, 0.2)',  // Orange
            'rgba(128, 0, 128, 0.2)',  // Purple
            'rgba(255, 192, 203, 0.2)' // Pink
        ];
        
        let colorIndex = 0;
        
        // Draw 3x3 grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const x = this.boundingRect.minX + col * cellWidth;
                const y = this.boundingRect.minY + row * cellHeight;
                
                // Fill with color if colors were enabled in step 3
                if (this.showColors) {
                    this.finalCtx.fillStyle = colors[colorIndex];
                    this.finalCtx.fillRect(x, y, cellWidth, cellHeight);
                }
                
                // Draw grid lines
                this.finalCtx.setLineDash([5, 5]);
                this.finalCtx.strokeStyle = '#95a5a6';
                this.finalCtx.lineWidth = 1;
                this.finalCtx.strokeRect(x, y, cellWidth, cellHeight);
                this.finalCtx.setLineDash([]);
                
                colorIndex++;
            }
        }
    }
    
    drawRotatedDirections() {
        if (!this.centerPoint || this.directions.length === 0) return;
        
        const radius = 200;
        
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
            this.finalCtx.fillStyle = '#000000';
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