/**
 * youtube-player.js
 * Drop-in YouTube embed fix for Error 153 / restricted videos.
 *
 * Assumes video is restricted. No detection probe. Opens a popup window
 * sized and centered to feel like an in-app player. YouTube sees a real
 * window origin, not an iframe.
 *
 * Usage:
 *   youtubePlayer('https://www.youtube.com/watch?v=dQw4w9WgXcQ', container)
 *
 * The player fills whatever size the container element is.
 */

function youtubePlayer(url, container) {

  // ── Extract video ID from any YouTube URL format ───────────────────────────
  function extractId(url) {
    try {
      const u = new URL(url);
      // youtube.com/watch?v=ID
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      // youtu.be/ID
      if (u.hostname === 'youtu.be') return u.pathname.slice(1);
      // youtube.com/embed/ID  or  youtube.com/shorts/ID
      const match = u.pathname.match(/(?:embed|shorts|v)\/([^/?&]+)/);
      if (match) return match[1];
    } catch (_) {}
    // Raw ID passed directly
    return url.trim();
  }

  // ── Open popup sized to the container ─────────────────────────────────────
  function openPopup(videoId) {
    const rect   = container.getBoundingClientRect();
    const w      = Math.round(rect.width)  || 854;
    const h      = Math.round(rect.height) || 480;
    const left   = Math.round(window.screenX + rect.left);
    const top    = Math.round(window.screenY + rect.top);
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;

    const popup = window.open(
      watchUrl,
      `yt_${videoId}`,
      `width=${w},height=${h},left=${left},top=${top},` +
      `toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
    );

    // If popup blocked fall back to new tab
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(watchUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // ── Styles (injected once) ─────────────────────────────────────────────────
  if (!document.getElementById('yt-player-styles')) {
    const s = document.createElement('style');
    s.id = 'yt-player-styles';
    s.textContent = `
      .yt-wrap {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 120px;
        background: #0a0a0a;
        border-radius: inherit;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        user-select: none;
      }
      .yt-thumb {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.75;
        transition: opacity 0.2s;
      }
      .yt-wrap:hover .yt-thumb { opacity: 0.55; }
      .yt-overlay {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }
      .yt-btn {
        width: 64px;
        height: 44px;
        background: #ff0000;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.15s, background 0.15s;
      }
      .yt-wrap:hover .yt-btn {
        transform: scale(1.1);
        background: #cc0000;
      }
      .yt-label {
        color: #fff;
        font-size: 12px;
        opacity: 0.8;
        letter-spacing: 0.03em;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const videoId  = extractId(url);
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  container.innerHTML = `
    <div class="yt-wrap" role="button" tabindex="0" aria-label="Watch on YouTube">
      <img class="yt-thumb" src="${thumbUrl}" alt="" />
      <div class="yt-overlay">
        <div class="yt-btn">
          <svg width="26" height="18" viewBox="0 0 26 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 4.5L19 9L10 13.5V4.5Z" fill="white"/>
          </svg>
        </div>
        <span class="yt-label">Watch on YouTube</span>
      </div>
    </div>
  `;

  const wrap = container.querySelector('.yt-wrap');

  wrap.addEventListener('click', () => openPopup(videoId));
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopup(videoId); }
  });
}
