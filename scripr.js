class App {
    constructor() {
        this.init();
        this.loadData();
        this.initParticles();
    }

    init() {
        this.themeToggle = document.querySelector('.theme-toggle');
        this.form = document.getElementById('contactForm');
        this.setupEventListeners();
        this.applySavedTheme();
    }

    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        window.addEventListener('scroll', () => this.handleScroll());
    }

    toggleTheme() {
        document.body.dataset.theme = 
            document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', document.body.dataset.theme);
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
    }

    async loadData() {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
            const data = await response.json();
            console.log('Loaded data:', data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        console.log('Form submitted:', data);
        e.target.reset();
        alert('Thank you for your message!');
    }

    initParticles() {
        const canvas = document.getElementById('particles');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 3 - 1.5;
                this.speedY = Math.random() * 3 - 1.5;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width + 10 || this.x < -10 || 
                    this.y > canvas.height + 10 || this.y < -10) {
                    this.reset();
                }
            }

            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const particles = Array(100).fill().map(() => new Particle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            requestAnimationFrame(animate);
        }

        animate();
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        document.documentElement.style.setProperty('--scroll', scrolled * 0.5 + 'px');
    }
}

document.addEventListener('DOMContentLoaded', () => new App());