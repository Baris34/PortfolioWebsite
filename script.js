const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
        this.color = Math.random() > 0.5 ? '#00ff88' : '#7000ff';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function init() {
    resize();
    for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw connections
    particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - dist / 1000})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        });
    });

    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
init();
animate();

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Glitch effect on hover for hero title
const glitchText = document.querySelector('.glitch');
if (glitchText) {
    glitchText.addEventListener('mouseover', () => {
        glitchText.style.animation = 'glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite';
    });
    glitchText.addEventListener('mouseout', () => {
        glitchText.style.animation = 'none';
    });
}

// Game Data - Loaded from JSON
let games = {};

// Load game data from JSON file
async function loadGames() {
    try {
        const response = await fetch('../assets/data/games.json');
        const gamesArray = await response.json();

        // Convert array to object keyed by ID for compatibility
        games = {};
        gamesArray.forEach(game => {
            games[game.id] = game;
        });

        console.log('Games loaded successfully:', games);

        // Render games grid if container exists
        renderGamesGrid(gamesArray);

    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Render Games Grid
function renderGamesGrid(gamesArray) {
    const gridContainer = document.getElementById('games-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = ''; // Clear existing content

    gamesArray.forEach(game => {
        // Get first image as thumbnail
        const thumbnail = game.media.find(m => m.type === 'image')?.src || 'assets/images/placeholder.png';

        const card = document.createElement('div');
        card.className = 'project-card';
        card.onclick = () => openModal(game.id);

        card.innerHTML = `
            <div class="card-image">
                <img src="${thumbnail}" alt="${game.title}">
                <div class="overlay">
                    <div class="play-btn"><i class="fas fa-expand"></i> İncele</div>
                </div>
            </div>
            <div class="card-content">
                <div class="tags">
                    ${game.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <h3>${game.title}</h3>
                <p>${game.desc.substring(0, 100)}...</p>
            </div>
        `;

        gridContainer.appendChild(card);
    });

    // Initialize card effects (blur background etc)
    initGameCards();
}

// Modal Logic
const modal = document.getElementById('game-modal');
const closeModal = document.querySelector('.close-modal');
let currentMediaIndex = 0;
let currentGameMedia = [];

function openModal(gameId) {
    if (!modal) return;

    const game = games[gameId];
    if (!game) return;

    document.getElementById('modal-title').innerText = game.title;
    document.getElementById('modal-desc').innerText = game.desc;

    // Setup Tags
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = '';
    game.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.innerText = tag;
        tagsContainer.appendChild(span);
    });

    // Setup Action Buttons (GitHub & Play links)
    const githubBtn = document.querySelector('.modal-actions .btn-primary');
    const playBtn = document.querySelector('.modal-actions .btn-secondary');

    if (githubBtn && game.githubUrl) {
        githubBtn.href = game.githubUrl;
        githubBtn.target = '_blank';  // Yeni sekmede aç
    }

    if (playBtn && game.playUrl) {
        playBtn.href = game.playUrl;
        playBtn.target = '_blank';  // Yeni sekmede aç
    }

    // Setup Gallery and Main Media
    const galleryContainer = document.getElementById('modal-gallery');
    const mainImg = document.getElementById('modal-img');
    const mainVideoIframe = document.getElementById('modal-video-iframe');
    const videoPlayBtn = document.getElementById('video-play-btn');

    galleryContainer.innerHTML = '';
    currentGameMedia = game.media || [];
    currentMediaIndex = 0;

    // Function to update main display
    const updateMainDisplay = (index) => {
        if (index < 0 || index >= currentGameMedia.length) return;

        const mediaItem = currentGameMedia[index];
        currentMediaIndex = index;

        if (mediaItem.type === 'video') {
            // Direkt YouTube iframe'ini göster
            mainImg.style.display = 'none';
            videoPlayBtn.style.display = 'none';
            mainVideoIframe.src = mediaItem.videoUrl;
            mainVideoIframe.style.display = 'block';
        } else {
            // Show image
            mainImg.style.display = 'block';
            mainImg.src = mediaItem.src;
            mainVideoIframe.style.display = 'none';
            mainVideoIframe.src = ''; // Clear iframe
            videoPlayBtn.style.display = 'none';
        }

        // Update active thumbnail
        document.querySelectorAll('.gallery-item').forEach((el, idx) => {
            el.classList.toggle('active', idx === index);
        });
    };

    // Initialize with first item
    if (currentGameMedia.length > 0) {
        updateMainDisplay(0);

        currentGameMedia.forEach((item, index) => {
            const thumb = document.createElement('div');
            thumb.className = 'gallery-item';
            if (index === 0) thumb.classList.add('active');

            const img = document.createElement('img');
            img.src = item.type === 'video' ? item.poster : item.src;
            thumb.appendChild(img);

            if (item.type === 'video') {
                const icon = document.createElement('i');
                icon.className = 'fas fa-play-circle gallery-play-icon';
                thumb.appendChild(icon);
            }

            thumb.onclick = () => {
                updateMainDisplay(index);
            };

            galleryContainer.appendChild(thumb);
        });
    }

    // Setup navigation buttons
    const prevBtn = document.getElementById('media-prev-btn');
    const nextBtn = document.getElementById('media-next-btn');

    if (prevBtn && nextBtn) {
        prevBtn.onclick = () => {
            if (currentGameMedia.length > 0) {
                const newIndex = (currentMediaIndex - 1 + currentGameMedia.length) % currentGameMedia.length;
                updateMainDisplay(newIndex);
            }
        };

        nextBtn.onclick = () => {
            if (currentGameMedia.length > 0) {
                const newIndex = (currentMediaIndex + 1) % currentGameMedia.length;
                updateMainDisplay(newIndex);
            }
        };
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

if (closeModal) {
    closeModal.onclick = function () {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Clear iframe when closing
        const mainVideoIframe = document.getElementById('modal-video-iframe');
        if (mainVideoIframe) {
            mainVideoIframe.src = '';
        }
    }
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Clear iframe when closing
        const mainVideoIframe = document.getElementById('modal-video-iframe');
        if (mainVideoIframe) {
            mainVideoIframe.src = '';
        }
    }
}

// Hybrid Layout Logic
function initGameCards() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        const imgContainer = card.querySelector('.card-image');
        const img = imgContainer.querySelector('img');

        if (img) {
            // Set the background image for the blur effect
            const src = img.getAttribute('src');
            imgContainer.style.setProperty('--bg-image', `url(${src})`);

            // Function to check aspect ratio
            const checkAspectRatio = () => {
                const width = img.naturalWidth;
                const height = img.naturalHeight;

                // Remove existing classes
                imgContainer.classList.remove('portrait', 'landscape');

                if (height > width) {
                    imgContainer.classList.add('portrait');
                } else {
                    imgContainer.classList.add('landscape');
                }
            };

            // Check aspect ratio once image is loaded
            if (img.complete) {
                checkAspectRatio();
            } else {
                img.onload = checkAspectRatio;
            }
        }
    });
}

// Load games when page loads
loadGames();
