/**
 * LUMEN PHOTOBOOK - INTERACTIVE 3D ENGINE
 * Realistic page flip, sound synthesis, dynamic layouts, and lightbox.
 */

// ==========================================================================
// SPREAD DATA & METADATA
// ==========================================================================
const SPREAD_NAMES = [
  "Hardcover • Lumen Journal",
  "Spread 1 • Table of Contents & Hero Plate",
  "Spread 2 • Vertical & Horizontal Zigzag",
  "Spread 3 • Alpine Double-Page Panorama",
  "Spread 4 • Fine-Art Solo & Staggered Duo",
  "Spread 5 • Asymmetric Horizon & Coastal Zigzag",
  "Spread 6 • Azure Coast Double-Page Panorama",
  "Spread 7 • Staggered Tides & Night Rim Hero",
  "Spread 8 • Inverted Asymmetric Duo & Finale",
  "Back Cover • Lumen Editions"
];

let currentSpread = 0;
const totalLeaves = 9; // Leaves 0 to 8
let soundEnabled = true;
let autoPlayInterval = null;
let audioContext = null;

// ==========================================================================
// SOUND SYNTHESIS (REALISTIC PAPER FLIP VIA WEB AUDIO API)
// ==========================================================================
function playPageFlipSound() {
  if (!soundEnabled) return;
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Synthesize organic paper rustle using brown/pink noise decay
    const duration = 0.14;
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      const decay = Math.pow(1 - (i / bufferSize), 2.2);
      data[i] = lastOut * decay * 1.5;
    }
    
    const noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = buffer;
    
    // Filter to simulate soft linen paper friction
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(280, audioContext.currentTime + duration);
    
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.45, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    noiseNode.start();
  } catch (e) {
    // Graceful fallback if Web Audio is restricted
  }
}

// ==========================================================================
// 3D PAGE FLIP ENGINE
// ==========================================================================
function flipToSpread(targetIndex) {
  const newIndex = Math.max(0, Math.min(totalLeaves, targetIndex));
  if (newIndex === currentSpread) return;
  
  const leaves = document.querySelectorAll('.book-leaf');
  const isMovingForward = newIndex > currentSpread;
  const prevIndex = currentSpread;
  currentSpread = newIndex;
  
  playPageFlipSound();
  
  // Update leaf flip states and z-indexing
  leaves.forEach((leaf, i) => {
    const isFlipped = i < currentSpread;
    
    // Calculate realistic z-indices
    let zIndex;
    if (isFlipped) {
      // Flipped pages stack on the left: higher index is on top
      zIndex = i + 1;
    } else {
      // Unflipped pages stack on the right: lower index is on top
      zIndex = totalLeaves - i + 1;
    }
    
    // Elevate the moving leaf during transition so it renders above static stacks
    const isMoving = isMovingForward ? (i >= prevIndex && i < currentSpread) : (i >= currentSpread && i < prevIndex);
    if (isMoving) {
      zIndex = 60 + Math.abs(i - currentSpread);
    }
    
    leaf.style.zIndex = zIndex;
    
    // Stagger flipping for multi-page jumps
    let delay = 0;
    if (isMoving) {
      delay = isMovingForward ? (i - prevIndex) * 90 : (prevIndex - 1 - i) * 90;
    }
    leaf.style.transitionDelay = `${delay}ms`;
    
    if (isFlipped) {
      leaf.classList.add('flipped');
    } else {
      leaf.classList.remove('flipped');
    }
  });

  // Reset z-indices cleanly after flip completes
  setTimeout(() => {
    leaves.forEach((leaf, i) => {
      const isFlipped = i < currentSpread;
      const zIndex = isFlipped ? (i + 1) : (totalLeaves - i + 1);
      leaf.style.zIndex = zIndex;
      leaf.style.transitionDelay = '0ms';
    });
  }, 1200);

  updateUI();
}

function nextSpread() {
  if (currentSpread < totalLeaves) {
    flipToSpread(currentSpread + 1);
  }
}

function prevSpread() {
  if (currentSpread > 0) {
    flipToSpread(currentSpread - 1);
  }
}

// ==========================================================================
// UI & CONTROLS UPDATE
// ==========================================================================
function updateUI() {
  // Update Spread Indicator
  const indicator = document.getElementById('spreadIndicator');
  if (indicator) {
    indicator.textContent = SPREAD_NAMES[currentSpread] || `Spread ${currentSpread}`;
  }
  
  // Update Progress Track
  const progressFill = document.getElementById('progressFill');
  if (progressFill) {
    const pct = (currentSpread / totalLeaves) * 100;
    progressFill.style.width = `${pct}%`;
  }
  
  // Update Navigation Buttons State
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = (currentSpread === 0);
  if (nextBtn) nextBtn.disabled = (currentSpread === totalLeaves);
  
  // Update Navigation Dots
  document.querySelectorAll('.nav-dot').forEach((dot, index) => {
    if (index === currentSpread) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
  
  // Update Drawer active card
  document.querySelectorAll('.drawer-card').forEach((card, index) => {
    if (index === currentSpread) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // Update Unified Panoramic Spread Floating Center Captions (One title across both pages)
  const cap3 = document.getElementById('spreadCap3');
  const cap6 = document.getElementById('spreadCap6');
  if (cap3) cap3.classList.toggle('active', currentSpread === 3);
  if (cap6) cap6.classList.toggle('active', currentSpread === 6);
}

// ==========================================================================
// LIGHTBOX MODAL
// ==========================================================================
function setupLightbox() {
  const modal = document.getElementById('lightboxModal');
  const modalImg = document.getElementById('lightboxImg');
  const modalTitle = document.getElementById('lightboxTitle');
  const modalDesc = document.getElementById('lightboxDesc');
  const closeBtn = document.getElementById('lightboxClose');
  
  if (!modal) return;
  
  // Attach click listener to all photo items
  document.querySelectorAll('.photo-frame, .polaroid-card, .page-spread-half').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't trigger lightbox if user clicked hot-spot turn buttons
      if (e.target.closest('.flip-hotspot-left') || e.target.closest('.flip-hotspot-right') || e.target.closest('.cover-open-btn')) return;
      
      const img = item.querySelector('img');
      if (!img) return;
      
      const title = item.dataset.title || img.alt || "Lumen Editorial Photograph";
      const desc = item.dataset.desc || "Curated seasonal collection • High-resolution archival print";
      
      modalImg.src = img.src;
      modalTitle.textContent = title;
      modalDesc.textContent = desc;
      modal.classList.add('active');
    });
  });
  
  const closeModal = () => modal.classList.remove('active');
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('lightbox-modal')) {
      closeModal();
    }
  });
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// ==========================================================================
// SPREADS FILMSTRIP DRAWER
// ==========================================================================
function setupDrawer() {
  const toggleBtn = document.getElementById('toggleDrawerBtn');
  const closeBtn = document.getElementById('closeDrawerBtn');
  const drawer = document.getElementById('spreadsDrawer');
  const overlay = document.getElementById('drawerOverlay');
  
  if (!toggleBtn || !drawer || !overlay) return;
  
  const openDrawer = () => {
    drawer.classList.add('active');
    overlay.classList.add('active');
  };
  
  const closeDrawer = () => {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  };
  
  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  
  // Jump to spread on card click
  document.querySelectorAll('.drawer-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      flipToSpread(i);
      closeDrawer();
    });
  });
}

// ==========================================================================
// AUTOPLAY & SOUND TOGGLES
// ==========================================================================
function setupExtraControls() {
  // Sound Toggle
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      soundBtn.classList.toggle('active', soundEnabled);
      const label = soundBtn.querySelector('.sound-label');
      if (label) label.textContent = soundEnabled ? 'Audio On' : 'Audio Off';
    });
  }
  
  // Slideshow Auto-play
  const autoPlayBtn = document.getElementById('autoplayBtn');
  if (autoPlayBtn) {
    autoPlayBtn.addEventListener('click', () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        autoPlayBtn.classList.remove('active');
        autoPlayBtn.querySelector('span').textContent = 'Auto Play';
      } else {
        autoPlayBtn.classList.add('active');
        autoPlayBtn.querySelector('span').textContent = 'Pause';
        autoPlayInterval = setInterval(() => {
          if (currentSpread >= totalLeaves) {
            flipToSpread(0);
          } else {
            nextSpread();
          }
        }, 5000);
      }
    });
  }
  
  // Fullscreen Toggle
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }
  
  // Cover Open Buttons
  document.querySelectorAll('.cover-open-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      flipToSpread(1);
    });
  });
  
  // TOC Links
  document.querySelectorAll('.toc-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = parseInt(item.dataset.spread, 10);
      if (!isNaN(target)) {
        flipToSpread(target);
      }
    });
  });
  
  // Restart button
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => flipToSpread(0));
  }
}

// ==========================================================================
// GESTURE & KEYBOARD LISTENERS
// ==========================================================================
function setupInteractions() {
  // Navigation Buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevSpread);
  if (nextBtn) nextBtn.addEventListener('click', nextSpread);
  
  // Page hotspot edge clicking
  const leftHotspot = document.getElementById('flipHotspotLeft');
  const rightHotspot = document.getElementById('flipHotspotRight');
  if (leftHotspot) leftHotspot.addEventListener('click', prevSpread);
  if (rightHotspot) rightHotspot.addEventListener('click', nextSpread);
  
  // Dots Clicking
  document.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => flipToSpread(i));
  });
  
  // Keyboard Arrow Keys
  window.addEventListener('keydown', (e) => {
    // Ignore if modal is open
    const modal = document.getElementById('lightboxModal');
    if (modal && modal.classList.contains('active')) return;
    
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      nextSpread();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSpread();
    } else if (e.key === 'Home') {
      flipToSpread(0);
    } else if (e.key === 'End') {
      flipToSpread(totalLeaves);
    }
  });
  
  // Touch / Swipe handling
  let touchStartX = 0;
  let touchEndX = 0;
  const bookStage = document.querySelector('.book-stage');
  
  if (bookStage) {
    bookStage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    bookStage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }
  
  function handleSwipe() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 45) {
      if (diff < 0) {
        nextSpread(); // Swiped left -> advance forward
      } else {
        prevSpread(); // Swiped right -> go backward
      }
    }
  }
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupInteractions();
  setupLightbox();
  setupDrawer();
  setupExtraControls();
  flipToSpread(0);
});
