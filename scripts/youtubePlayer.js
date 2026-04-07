/**
 * youtubePlayer.js
 * Drop-in YouTube player with graceful embed -> popup fallback.
 *
 * 1. Tries a real iframe embed first -- plays inline inside the panel.
 * 2. If the video is restricted (Error 100/101/150/153), automatically
 *    switches to a thumbnail + popup window sized to the container.
 * 3. Popup falls back to a new tab if the browser blocks popups.
 *
 * Usage:
 *   youtubePlayer('https://www.youtube.com/watch?v=VIDEO_ID', container)
 */

function youtubePlayer(url, container) {

  // -- Extract video ID from any YouTube URL format -------------------------
  function extractId(url) {
    try {
      const u = new URL(url);
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      if (u.hostname === 'youtu.be') return u.pathname.slice(1);
      const m = u.pathname.match(/(?:embed|shorts|v)\/([^/?&]+)/);
      if (m) return m[1];
    } catch (_) {}
    return url.trim();
  }

  // -- Inject shared styles once --------------------------------------------
  function injectStyles() {
    if (document.getElementById('yt-player-styles')) return;
    const s = document.createElement('style');
    s.id = 'yt-player-styles';
    s.textContent = `
      .yt-wrap {
        position: relative; width: 100%; height: 100%; min-height: 120px;
        background: #000; border-radius: inherit; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
      }
      .yt-wrap iframe {
        position: absolute; inset: 0; width: 100%; height: 100%; border: none;
      }
      .yt-wrap.yt-fallback {
        cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        user-select: none;
      }
      .yt-thumb {
        position: absolute; inset: 0; width: 100%; height: 100%;
        object-fit: cover; opacity: 0.75; transition: opacity 0.2s;
      }
      .yt-wrap.yt-fallback:hover .yt-thumb { opacity: 0.5; }
      .yt-overlay {
        position: relative; z-index: 1;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
      }
      .yt-btn {
        width: 64px; height: 44px; background: #ff0000; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.15s, background 0.15s;
      }
      .yt-wrap.yt-fallback:hover .yt-btn { transform: scale(1.1); background: #cc0000; }
      .yt-label { color: #fff; font-size: 12px; opacity: 0.8; letter-spacing: 0.03em; }
    `;
    document.head.appendChild(s);
  }

  // -- Open popup sized to the container ------------------------------------
  function openPopup(videoId) {
    const rect     = container.getBoundingClientRect();
    const w        = Math.round(rect.width)  || 854;
    const h        = Math.round(rect.height) || 480;
    const left     = Math.round(window.screenX + rect.left);
    const top      = Math.round(window.screenY + rect.top);
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;

    const popup = window.open(
      watchUrl,
      `yt_${videoId}`,
      `width=${w},height=${h},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(watchUrl, '_blank', 'noopener,noreferrer');
    }
  }

  // -- Render fallback thumbnail + popup trigger ----------------------------
  function renderFallback(videoId) {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    container.innerHTML = `
      <div class="yt-wrap yt-fallback" role="button" tabindex="0" aria-label="Watch on YouTube">
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
    wrap.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPopup(videoId); }
    });
  }

  // -- Render embedded iframe (primary path) --------------------------------
  function renderEmbed(videoId) {
    const origin = (window.location.origin && window.location.origin !== 'null')
      ? '&origin=' + encodeURIComponent(window.location.origin) : '';
    const NASA_CH = 'UCLA_DiR1FfKNvjuUpBHmylQ'; // NASA TV YouTube channel

    // Phase 2: try NASA channel live stream before static thumbnail
    function tryNASALive() {
      window.removeEventListener('message', onVideoMsg);
      container.innerHTML = `
        <div class="yt-wrap">
          <iframe
            src="https://www.youtube.com/embed/live_stream?channel=${NASA_CH}&autoplay=1&mute=1&rel=0"
            title="NASA TV Live"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      `;
      // Channel live stream plays or shows NASA's "not live" UI — no timeout needed
    }

    // Phase 1: specific video embed
    container.innerHTML = `
      <div class="yt-wrap">
        <iframe
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&enablejsapi=1${origin}"
          title="NASA Artemis II Live Coverage"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
    `;

    let videoOk = false;
    // YouTube IFrame API sends error codes via postMessage.
    // 100 = video not found, 101/150 = embedding disabled, 153 = restricted.
    // info may be a plain number or an object like {code: 153}.
    function onVideoMsg(e) {
      if (!String(e.origin).includes('youtube.com')) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'onReady') { videoOk = true; }
        if (data && data.event === 'onError') {
          const code = (data.info != null && typeof data.info === 'object')
            ? data.info.code : data.info;
          if (code === 2 || code === 100 || code === 101 || code === 150 || code === 153) {
            tryNASALive();
          }
        }
      } catch (_) {}
    }
    window.addEventListener('message', onVideoMsg);

    // 8 s timeout → try NASA channel live stream
    setTimeout(() => { if (!videoOk) tryNASALive(); }, 8000);
  }

  // -- Entry point ----------------------------------------------------------
  injectStyles();
  const videoId = extractId(url);
  renderEmbed(videoId);
}
