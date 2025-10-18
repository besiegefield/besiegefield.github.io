/**
 * Progressive Image Loader
 * Loads low-resolution images first, then high-resolution versions
 */

class ProgressiveImageLoader {
    constructor(options = {}) {
        this.options = {
            blurAmount: options.blurAmount || 20,
            transitionDuration: options.transitionDuration || 800,
            lowResScale: options.lowResScale || 0.1,
            ...options
        };
        this.images = [];
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.processImages());
        } else {
            this.processImages();
        }
    }

    processImages() {
        // Find all images with data-src attribute (high-res version)
        const images = document.querySelectorAll('img[data-src]');
        
        images.forEach(img => {
            this.loadProgressively(img);
        });
    }

    loadProgressively(img) {
        const lowResSrc = img.src; // Current src is low-res
        const highResSrc = img.dataset.src; // data-src contains high-res
        
        // Add loading class for blur effect
        img.classList.add('progressive-loading');
        
        // Create a new image object to preload high-res
        const highResImg = new Image();
        
        highResImg.onload = () => {
            // High-res image loaded, swap it in
            img.src = highResSrc;
            img.classList.remove('progressive-loading');
            img.classList.add('progressive-loaded');
            
            // Remove the loaded class after transition
            setTimeout(() => {
                img.classList.remove('progressive-loaded');
            }, this.options.transitionDuration);
        };
        
        highResImg.onerror = () => {
            // If high-res fails to load, just remove loading state
            img.classList.remove('progressive-loading');
            console.error(`Failed to load high-res image: ${highResSrc}`);
        };
        
        // Start loading high-res image
        highResImg.src = highResSrc;
    }

    /**
     * Generate low-res version of an image using Canvas
     * This is a client-side method, but ideally low-res images should be pre-generated
     */
    static generateLowResDataUrl(img, scale = 0.1) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.5);
    }

    /**
     * Convert existing images to progressive loading
     * This scans for images and sets up the progressive loading
     */
    static convertExistingImages(selector = 'img:not([data-src])') {
        const images = document.querySelectorAll(selector);
        
        images.forEach(img => {
            // Skip if already converted or if it's a logo/small image
            if (img.dataset.src || img.classList.contains('no-progressive')) {
                return;
            }
            
            const originalSrc = img.src;
            
            // Create low-res version
            const lowResImg = new Image();
            lowResImg.crossOrigin = 'Anonymous';
            
            lowResImg.onload = () => {
                const lowResDataUrl = ProgressiveImageLoader.generateLowResDataUrl(lowResImg, 0.1);
                img.dataset.src = originalSrc;
                img.src = lowResDataUrl;
            };
            
            lowResImg.src = originalSrc;
        });
    }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    window.ProgressiveImageLoader = ProgressiveImageLoader;
    
    // Initialize the loader
    window.progressiveLoader = new ProgressiveImageLoader({
        blurAmount: 20,
        transitionDuration: 800
    });
}
