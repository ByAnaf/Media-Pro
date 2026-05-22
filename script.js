async function handleDownload() {
    const url = document.getElementById('urlInput').value.trim();
    const status = document.getElementById('status');
    const btn = document.getElementById('mainBtn');

    if(!url) return alert("Please paste a link!");

    status.innerHTML = "⚡ Initializing Secure Stream...";
    btn.disabled = true;
    btn.style.opacity = "0.5";

    try {
        // Primary API: Cobalt (High Quality JSON Engine)
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, videoQuality: '1080' })
        });

        const data = await response.json();

        if (data.url) {
            status.innerHTML = "⏳ Processing stream pipeline... Please wait.";
            await downloadFileDirectly(data.url, "Video-Download.mp4");
            status.innerHTML = "✅ Download complete! Saved directly to your device.";
        } else {
            throw new Error("API Limit reached or platform unsupported by primary engine.");
        }

    } catch (err) {
        console.warn("Primary API failed, running in-browser download bypass...", err);
        status.innerHTML = "⏳ Primary route busy. Attempting direct browser bypass streaming...";
        
        try {
            // Internal Bypass: Forcing browser download locally using a secure CORS proxy block
            const proxiedUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
            await downloadFileDirectly(proxiedUrl, "Media-Download.mp4");
            status.innerHTML = "✅ Bypass successful! File saved.";
        } catch (fallbackErr) {
            status.innerHTML = "❌ Stream failed. The server rejected direct extraction. Try an alternative URL.";
        }
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

// Intercepts the download stream, buffers it to memory, and forces a native file save
async function downloadFileDirectly(fileUrl, defaultName) {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to fetch stream source.");
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const hiddenAnchor = document.createElement('a');
    hiddenAnchor.href = blobUrl;
    hiddenAnchor.download = defaultName;
    
    document.body.appendChild(hiddenAnchor);
    hiddenAnchor.click();
    
    // Clean up temporary DOM strings and garbage collect memory
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(hiddenAnchor);
}
