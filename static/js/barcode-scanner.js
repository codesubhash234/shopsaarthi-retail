// Html5-QRCode Barcode Scanner Implementation
const BarcodeScanner = (function() {
    let scannerActive = false;
    let html5QrCode = null;
    let scanCallback = null;
    let errorCallback = null;
    let debugMode = true;
    let libraryLoaded = false;

    const log = (message, data = null) => {
        if (debugMode) {
            console.log(`[BarcodeScanner] ${message}`, data || '');
        }
    };

    // Check if Html5-QRCode library is loaded
    const checkLibraryLoaded = () => {
        if (typeof Html5Qrcode !== 'undefined' && typeof Html5QrcodeSupportedFormats !== 'undefined') {
            libraryLoaded = true;
            return true;
        }
        return false;
    };

    // Wait for library to load
    const waitForLibrary = (maxAttempts = 50, interval = 100) => {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (checkLibraryLoaded()) {
                    clearInterval(checkInterval);
                    log('Html5-QRCode library loaded successfully');
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    reject(new Error('Html5-QRCode library failed to load'));
                }
            }, interval);
        });
    };

    // Check browser compatibility and camera availability
    const checkCameraAvailability = async () => {
        try {
            // Check HTTPS requirement (relaxed for development)
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && location.hostname !== '0.0.0.0') {
                return { 
                    success: false, 
                    message: 'Camera access requires HTTPS. Please use HTTPS or localhost for camera functionality.' 
                };
            }

            // Check basic browser support
            if (!navigator || !window) {
                return { 
                    success: false, 
                    message: 'Browser environment not supported' 
                };
            }

            // Check MediaDevices API support with fallbacks
            let getUserMedia = null;
            
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
            } else if (navigator.getUserMedia) {
                getUserMedia = navigator.getUserMedia.bind(navigator);
            } else if (navigator.webkitGetUserMedia) {
                getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
            } else if (navigator.mozGetUserMedia) {
                getUserMedia = navigator.mozGetUserMedia.bind(navigator);
            } else {
                return { 
                    success: false, 
                    message: 'Camera API not supported by this browser. Please use a modern browser like Chrome, Firefox, or Safari.' 
                };
            }

            // Check camera permissions (if supported)
            try {
                if (navigator.permissions && navigator.permissions.query) {
                    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                    log('Camera permission status:', permissionStatus.state);
                    
                    if (permissionStatus.state === 'denied') {
                        return { 
                            success: false, 
                            message: 'Camera permission is denied. Please enable camera access in your browser settings.' 
                        };
                    }
                }
            } catch (permError) {
                log('Permission check not supported:', permError);
            }

            // Try to access camera with different methods
            try {
                let stream;
                
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    // Modern API
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            facingMode: { ideal: 'environment' },
                            width: { ideal: 640, min: 320 },
                            height: { ideal: 480, min: 240 }
                        } 
                    });
                } else {
                    // Legacy API with Promise wrapper
                    stream = await new Promise((resolve, reject) => {
                        getUserMedia(
                            { video: true },
                            resolve,
                            reject
                        );
                    });
                }
                
                // Stop the stream immediately
                if (stream && stream.getTracks) {
                    stream.getTracks().forEach(track => track.stop());
                } else if (stream && stream.stop) {
                    stream.stop();
                }
                
                log('Camera access successful');
                return { success: true, message: 'Camera available' };
                
            } catch (streamError) {
                log('Camera stream error:', streamError);
                let message = 'Camera access failed';
                
                if (streamError.name === 'NotAllowedError') {
                    message = 'Camera permission denied. Please allow camera access and try again.';
                } else if (streamError.name === 'NotFoundError') {
                    message = 'No camera found on this device.';
                } else if (streamError.name === 'NotReadableError') {
                    message = 'Camera is already in use by another application.';
                } else if (streamError.name === 'OverconstrainedError') {
                    message = 'Camera constraints not supported. Trying with basic settings...';
                    
                    // Try with minimal constraints
                    try {
                        const basicStream = await getUserMedia({ video: true });
                        if (basicStream && basicStream.getTracks) {
                            basicStream.getTracks().forEach(track => track.stop());
                        } else if (basicStream && basicStream.stop) {
                            basicStream.stop();
                        }
                        return { success: true, message: 'Camera available with basic settings' };
                    } catch (basicError) {
                        message = 'Camera constraints not supported even with basic settings.';
                    }
                } else if (streamError.message) {
                    message = streamError.message;
                }
                
                return { success: false, message: message };
            }
            
        } catch (err) {
            log('Camera check failed:', err);
            return { 
                success: false, 
                message: err.message || 'Unknown camera error occurred' 
            };
        }
    };

    // Request camera permission (legacy function for compatibility)
    const requestCameraPermission = async () => {
        const result = await checkCameraAvailability();
        return result.success;
    };

    // Initialize Html5-QRCode Scanner
    const initScanner = async (targetElement, onDetected, onError, options = {}) => {
        scanCallback = onDetected;
        errorCallback = onError;

        const targetId = targetElement.replace('#', '');
        const targetDiv = document.getElementById(targetId);
        
        if (!targetDiv) {
            console.error('Target element not found:', targetId);
            if (errorCallback) {
                errorCallback(new Error('Target element not found'));
            }
            return;
        }

        try {
            // Wait for library to load
            if (!libraryLoaded) {
                log('Waiting for Html5-QRCode library to load...');
                await waitForLibrary();
            }

            // Check camera availability first
            const cameraCheck = await checkCameraAvailability();
            if (!cameraCheck.success) {
                throw new Error(cameraCheck.message);
            }

            // Html5-QRCode Configuration
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false,
                videoConstraints: {
                    facingMode: "environment"
                },
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.CODE_93,
                    Html5QrcodeSupportedFormats.CODABAR,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.ITF,
                    Html5QrcodeSupportedFormats.PDF_417,
                    Html5QrcodeSupportedFormats.DATA_MATRIX
                ]
            };

            log('Starting Html5-QRCode scanner with config:', config);

            // Initialize Html5QrCode
            html5QrCode = new Html5Qrcode(targetId);
            
            // Success callback
            const onScanSuccess = (decodedText, decodedResult) => {
                log('Barcode detected:', decodedText);
                
                // Visual feedback
                if (targetDiv) {
                    targetDiv.classList.add('scanner-success');
                    setTimeout(() => targetDiv.classList.remove('scanner-success'), 300);
                }
                
                // Haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate(120);
                }
                
                if (scanCallback) {
                    scanCallback(decodedText, decodedResult);
                }
            };

            // Error callback
            const onScanFailure = (error) => {
                // This is called for every frame where no code is detected
                // We don't want to log this as it's normal behavior
            };

            // Try different camera access methods
            let cameraStarted = false;
            
            // Method 1: Try with environment camera
            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    onScanFailure
                );
                cameraStarted = true;
            } catch (envError) {
                log('Environment camera failed, trying user camera:', envError);
                
                // Method 2: Try with user-facing camera
                try {
                    await html5QrCode.start(
                        { facingMode: "user" },
                        config,
                        onScanSuccess,
                        onScanFailure
                    );
                    cameraStarted = true;
                } catch (userError) {
                    log('User camera failed, trying device enumeration:', userError);
                    
                    // Method 3: Try to enumerate and use first available camera
                    try {
                        const devices = await Html5Qrcode.getCameras();
                        if (devices && devices.length > 0) {
                            // Try the first camera
                            await html5QrCode.start(
                                devices[0].id,
                                config,
                                onScanSuccess,
                                onScanFailure
                            );
                            cameraStarted = true;
                        } else {
                            throw new Error('No cameras found');
                        }
                    } catch (deviceError) {
                        log('Device enumeration failed, trying basic constraints:', deviceError);
                        
                        // Method 4: Try with basic video constraints
                        try {
                            await html5QrCode.start(
                                { video: true },
                                {
                                    fps: 10,
                                    qrbox: { width: 250, height: 250 },
                                    formatsToSupport: config.formatsToSupport
                                },
                                onScanSuccess,
                                onScanFailure
                            );
                            cameraStarted = true;
                        } catch (basicError) {
                            throw new Error(`Camera access failed: ${basicError.message || basicError}`);
                        }
                    }
                }
            }
            
            scannerActive = true;
            log('Html5-QRCode scanner started successfully');

        } catch (err) {
            log('Scanner initialization failed:', err);
            if (errorCallback) {
                errorCallback(err);
            }
        }
    };

    // Stop scanner
    const stopScanner = async () => {
        if (scannerActive && html5QrCode) {
            try {
                log('Stopping Html5-QRCode scanner...');
                await html5QrCode.stop();
                scannerActive = false;
                log('Scanner stopped successfully');
            } catch (err) {
                log('Error stopping scanner:', err);
            }
        }
    };

    // Check if scanner is active
    const isActive = () => scannerActive;

    // Create Html5-QRCode-based scanner UI
    const createScannerUI = (containerId, options = {}) => {
        const {
            title = 'Scan Barcode',
            onScan = () => {},
            onError = () => {},
            showManualInput = true,
            autoStart = false
        } = options;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return;
        }

        // Create Html5-QRCode scanner HTML structure
        container.innerHTML = `
            <div class="html5-qrcode-scanner-container">
                <div class="scanner-header">
                    <h5><i class="bi bi-upc-scan"></i> ${title}</h5>
                    <button class="btn btn-sm btn-outline-danger" id="close-scanner">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="scanner-status" id="scanner-status">
                    <div class="alert alert-info border-0 shadow-sm">
                        <i class="bi bi-info-circle me-2"></i> 
                        Ready to scan barcodes and QR codes with Html5-QRCode.
                    </div>
                </div>
                
                <div class="scanner-viewport" id="scanner-viewport">
                    <!-- Html5-QRCode will inject video here -->
                </div>
                
                <div class="scanner-controls text-center my-3">
                    <button class="btn btn-primary btn-lg px-4" id="start-scanner">
                        <i class="bi bi-camera me-2"></i>Start Scanner
                    </button>
                    <button class="btn btn-danger btn-lg px-4 d-none" id="stop-scanner">
                        <i class="bi bi-stop-circle me-2"></i>Stop Scanner
                    </button>
                </div>
                
                ${showManualInput ? `
                <div class="manual-input-section">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <h6 class="card-title mb-3">
                                <i class="bi bi-keyboard me-2"></i>Manual Entry
                            </h6>
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="bi bi-upc"></i>
                                </span>
                                <input type="text" class="form-control" id="manual-barcode" 
                                       placeholder="Enter barcode number" autocomplete="off">
                                <button class="btn btn-success" type="button" id="submit-manual-barcode">
                                    <i class="bi bi-check-lg me-1"></i>Submit
                                </button>
                            </div>
                            <small class="text-muted mt-2 d-block">
                                <i class="bi bi-lightbulb me-1"></i>Can't scan? Enter the barcode number manually
                            </small>
                        </div>
                    </div>
                </div>` : ''}
                
                <div class="scanner-results d-none" id="scanner-results">
                    <div class="alert alert-success border-0 shadow-sm">
                        <h6 class="mb-2">Last Scanned:</h6>
                        <div class="scanned-code fw-bold" id="scanned-code"></div>
                    </div>
                </div>
                
                <div class="privacy-notice text-center mt-3">
                    <small class="text-muted">
                        <i class="bi bi-shield-check me-1"></i>
                        Camera is only active during scanning. Powered by Html5-QRCode.
                    </small>
                </div>
            </div>
        `;

        // Add Html5-QRCode-specific styles
        if (!document.getElementById('html5-qrcode-scanner-styles')) {
            const styles = document.createElement('style');
            styles.id = 'html5-qrcode-scanner-styles';
            styles.textContent = `
                .html5-qrcode-scanner-container {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .scanner-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .scanner-viewport {
                    position: relative;
                    width: 100%;
                    height: 400px;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                    margin: 20px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                #scanner-viewport video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 12px;
                }
                
                #scanner-viewport canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                
                .scanner-success {
                    animation: success-pulse 0.6s ease-in-out;
                }
                
                @keyframes success-pulse {
                    0% { 
                        background: rgba(40, 167, 69, 0);
                        transform: scale(1);
                    }
                    50% { 
                        background: rgba(40, 167, 69, 0.2);
                        transform: scale(1.02);
                    }
                    100% { 
                        background: rgba(40, 167, 69, 0);
                        transform: scale(1);
                    }
                }
                
                .scanned-code {
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    font-weight: bold;
                    color: #198754;
                }
                
                .manual-input-section {
                    margin: 20px 0;
                }
                
                .privacy-notice {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px solid #e9ecef;
                }
                
                /* Mobile responsive */
                @media (max-width: 768px) {
                    .html5-qrcode-scanner-container {
                        padding: 16px;
                        margin: 10px;
                    }
                    
                    .scanner-viewport {
                        height: 300px;
                    }
                    
                    .btn-lg {
                        padding: 0.5rem 1rem;
                        font-size: 1rem;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Get UI elements
        const startBtn = document.getElementById('start-scanner');
        const stopBtn = document.getElementById('stop-scanner');
        const closeBtn = document.getElementById('close-scanner');
        const statusDiv = document.getElementById('scanner-status');
        const resultsDiv = document.getElementById('scanner-results');

        // Start scanner button
        startBtn.addEventListener('click', async () => {
            log('Start button clicked');
            
            statusDiv.innerHTML = `
                <div class="alert alert-warning border-0 shadow-sm">
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                        <div>
                            <strong>Starting Html5-QRCode scanner...</strong><br>
                            <small>Initializing camera</small>
                        </div>
                    </div>
                </div>
            `;
            
            startBtn.classList.add('d-none');
            stopBtn.classList.remove('d-none');
            
            try {
                await initScanner('scanner-viewport', (code) => {
                    log('UI: Code scanned successfully:', code);
                    document.getElementById('scanned-code').textContent = code;
                    document.getElementById('scanner-results').classList.remove('d-none');
                    
                    statusDiv.innerHTML = `
                        <div class="alert alert-success border-0 shadow-sm">
                            <i class="bi bi-check-circle me-2"></i> 
                            <strong>Barcode detected!</strong><br>
                            <small>Code: ${code}</small>
                        </div>
                    `;
                    
                    onScan(code);
                }, (error) => {
                    log('UI: Scanner error:', error);
                    statusDiv.innerHTML = `
                        <div class="alert alert-danger border-0 shadow-sm">
                            <i class="bi bi-exclamation-triangle me-2"></i> 
                            <strong>Scanner Error</strong><br>
                            <small>${error.message || error || 'Unable to start camera'}</small>
                        </div>
                    `;
                    
                    startBtn.classList.remove('d-none');
                    stopBtn.classList.add('d-none');
                    
                    onError(error);
                });
                
                if (scannerActive) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-info border-0 shadow-sm">
                            <i class="bi bi-camera-video me-2"></i> 
                            <strong>Html5-QRCode Scanner Active</strong><br>
                            <small>Hold barcode or QR code steady in view</small>
                        </div>
                    `;
                }
                
            } catch (err) {
                log('UI: Start button error:', err);
                statusDiv.innerHTML = `
                    <div class="alert alert-danger border-0 shadow-sm">
                        <i class="bi bi-x-circle me-2"></i> 
                        <strong>Failed to start scanner</strong><br>
                        <small>Check camera permissions and try again</small>
                    </div>
                `;
                
                startBtn.classList.remove('d-none');
                stopBtn.classList.add('d-none');
            }
        });

        // Stop scanner button
        stopBtn.addEventListener('click', () => {
            stopScanner();
            startBtn.classList.remove('d-none');
            stopBtn.classList.add('d-none');
            statusDiv.innerHTML = `
                <div class="alert alert-info border-0 shadow-sm">
                    <i class="bi bi-info-circle me-2"></i> Scanner stopped. Camera released.
                </div>
            `;
        });

        // Close scanner button
        closeBtn.addEventListener('click', () => {
            stopScanner();
            container.innerHTML = '';
        });

        // Manual input functionality
        if (showManualInput) {
            const manualInput = document.getElementById('manual-barcode');
            const submitBtn = document.getElementById('submit-manual-barcode');
            
            const submitManualCode = () => {
                const code = manualInput.value.trim();
                if (code) {
                    document.getElementById('scanned-code').textContent = code;
                    document.getElementById('scanner-results').classList.remove('d-none');
                    
                    statusDiv.innerHTML = `
                        <div class="alert alert-success border-0 shadow-sm">
                            <i class="bi bi-check-circle me-2"></i> Code entered manually!
                        </div>
                    `;
                    
                    onScan(code);
                    manualInput.value = '';
                }
            };
            
            submitBtn.addEventListener('click', submitManualCode);
            manualInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitManualCode();
                }
            });
        }

        // Auto-start if requested
        if (autoStart) {
            startBtn.click();
        }

        // Cleanup on page unload
        window.addEventListener('beforeunload', stopScanner);
    };


    // Public API
    return {
        init: initScanner,
        stop: stopScanner,
        isActive: isActive,
        createUI: createScannerUI,
        requestPermission: requestCameraPermission
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BarcodeScanner;
}
