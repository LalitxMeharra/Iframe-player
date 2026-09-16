/* ==========================================================================
   OG-STREAM PLAYER - CORE LOGIC
   Direct Iframe Bypass & Cinematic Playback
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM ELEMENTS ---
    const streamForm = document.getElementById('streamForm');
    const streamUrlInput = document.getElementById('streamUrl');
    const pasteBtn = document.getElementById('pasteBtn');
    
    const videoWrapper = document.getElementById('videoWrapper');
    const playerPlaceholder = document.getElementById('playerPlaceholder');
    
    const statusTag = document.getElementById('statusTag');
    const streamTitle = document.getElementById('streamTitle');
    const streamMeta = document.getElementById('streamMeta');
    
    const btnFullscreen = document.getElementById('btnFullscreen');
    const btnClearStream = document.getElementById('btnClearStream');
    
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    
    let toastTimeout;

    // --- 2. TOAST NOTIFICATION SYSTEM ---
    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // --- 3. CLIPBOARD PASTE LOGIC ---
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                streamUrlInput.value = text;
                showToast("Clipboard data pasted.");
                streamUrlInput.focus();
            } else {
                showToast("Clipboard is empty.");
            }
        } catch (err) {
            showToast("Paste permission denied. Please paste manually.");
        }
    });

    // --- 4. URL EXTRACTION LOGIC (The Brains) ---
    function extractSource(input) {
        let rawInput = input.trim();
        if (!rawInput) return null;

        // Agar user ne pura <iframe> tag paste kiya hai
        if (rawInput.toLowerCase().includes('<iframe') && rawInput.toLowerCase().includes('src=')) {
            // Regex to extract the src URL accurately
            const match = rawInput.match(/src\s*=\s*["']([^"']+)["']/i);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        // Agar direct URL hai
        try {
            const parsed = new URL(rawInput);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.href;
            }
        } catch (e) {
            // Agar protocol missng hai (jaise vidfast.vc/...) to https laga do
            if (!rawInput.startsWith('http')) {
                return 'https://' + rawInput;
            }
        }
        
        return null;
    }

    // --- 5. STREAM INITIALIZATION LOGIC ---
    function triggerError() {
        const fetchCard = document.querySelector('.fetch-card');
        fetchCard.classList.remove('shake-error');
        void fetchCard.offsetWidth; // Trigger reflow for animation restart
        fetchCard.classList.add('shake-error');
        showToast("Invalid Stream Data. Please check the link.");
    }

    streamForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload
        
        const sourceUrl = extractSource(streamUrlInput.value);
        
        if (!sourceUrl) {
            triggerError();
            return;
        }

        // Update UI Status (Simulating a premium decryption process)
        statusTag.textContent = "STATUS: BYPASSING SERVER & CONNECTING...";
        statusTag.style.color = "var(--crimson)";
        
        // Remove old iframe if exists
        const existingIframe = videoWrapper.querySelector('iframe');
        if (existingIframe) {
            existingIframe.remove();
        }

        // Hide Placeholder
        playerPlaceholder.style.display = "none";

        // Create new Iframe bypassing restrictive sandbox
        const iframe = document.createElement('iframe');
        iframe.src = sourceUrl;
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('frameborder', '0');
        // NOTE: We intentionally leave out the 'sandbox' attribute here 
        // to allow third-party streaming servers to execute their necessary player scripts.

        // Append to wrapper
        videoWrapper.appendChild(iframe);
        
        // Show iframe block
        iframe.style.display = "block";

        // Update Metadata
        statusTag.textContent = "STATUS: STREAM ACTIVE";
        statusTag.style.color = "var(--ink-black)";
        
        try {
            const domain = new URL(sourceUrl).hostname;
            streamTitle.textContent = `Pumping from: ${domain.toUpperCase()}`;
        } catch(e) {
            streamTitle.textContent = "Direct Stream Established";
        }
        
        streamMeta.textContent = "Connection secure. Max bitrate requested.";
        showToast("Stream Initialized. Enjoy!");
        
        // Smooth scroll to player
        document.getElementById('playerBlock').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // --- 6. FULLSCREEN CONTROL ---
    btnFullscreen.addEventListener('click', () => {
        const currentIframe = videoWrapper.querySelector('iframe');
        
        if (!currentIframe) {
            showToast("No active stream to fullscreen.");
            return;
        }

        if (currentIframe.requestFullscreen) {
            currentIframe.requestFullscreen();
        } else if (currentIframe.webkitRequestFullscreen) { /* Safari */
            currentIframe.webkitRequestFullscreen();
        } else if (currentIframe.msRequestFullscreen) { /* IE11 */
            currentIframe.msRequestFullscreen();
        }
    });

    // --- 7. CLEAR/TERMINATE STREAM LOGIC ---
    btnClearStream.addEventListener('click', () => {
        const currentIframe = videoWrapper.querySelector('iframe');
        
        if (currentIframe) {
            currentIframe.remove();
            
            // Reset UI
            playerPlaceholder.style.display = "block";
            streamUrlInput.value = "";
            
            statusTag.textContent = "STATUS: AWAITING SIGNAL";
            statusTag.style.color = "var(--text-muted)";
            streamTitle.textContent = "Direct Pipeline Stream";
            streamMeta.textContent = "Ready to bypass server ads and render raw visuals.";
            
            showToast("Stream Terminated & Cache Cleared.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            showToast("No active stream to terminate.");
        }
    });
});
