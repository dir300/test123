
const API_KEY = '2acf7b5bcb8242f5b7f749c071dbee0f'; // Replace with your actual API key
const BASE_URL = 'https://newsapi.org/v2/top-headlines';

class NewsApp {
    constructor() {
        this.newsContainer = document.getElementById('newsContainer');
        this.categorySelect = document.getElementById('categorySelect');
        this.themeToggle = document.querySelector('.theme-toggle');
        this.currentCategory = 'general';
        this.page = 1;
        this.observer = null;
        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.applySavedTheme();
        this.loadNews();
    }

    setupEventListeners() {
        this.categorySelect.addEventListener('change', () => this.handleCategoryChange());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        window.addEventListener('scroll', () => this.handleScroll());
    }

    async loadNews() {
        try {
            this.showLoader();
            const url = `${BASE_URL}?country=us&category=${this.currentCategory}&pageSize=12&page=${this.page}&apiKey=${API_KEY}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.displayNews(data.articles);
            this.page++;
        } catch (error) {
            console.error('Error fetching news:', error);
            this.showError('Failed to load news. Please try again later.');
        } finally {
            this.hideLoader();
        }
    }

    displayNews(articles) {
        const newsHTML = articles.map(article => `
            <article class="news-card">
                <div class="news-image">
                    <img src="${article.urlToImage || 'https://placehold.co/600x400'}" 
                         alt="${article.title}" 
                         loading="lazy">
                </div>
                <div class="news-content">
                    <div class="news-source">
                        <i class="fas fa-newspaper"></i>
                        ${article.source.name}
                    </div>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || ''}</p>
                    <div class="news-footer">
                        <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                        <a href="${article.url}" target="_blank" rel="noopener">
                            Read More <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </article>
        `).join('');

        this.newsContainer.insertAdjacentHTML('beforeend', newsHTML);
        this.setupImageObservers();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadNews();
                }
            });
        }, { threshold: 0.1 });

        this.observer.observe(document.querySelector('.loader'));
    }

    setupImageObservers() {
        const images = document.querySelectorAll('.news-image img');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => {
            img.dataset.src = img.src;
            img.src = 'https://placehold.co/600x400';
            imageObserver.observe(img);
        });
    }

    handleCategoryChange() {
        this.currentCategory = this.categorySelect.value;
        this.page = 1;
        this.newsContainer.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
        this.loadNews();
    }

    toggleTheme() {
        const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        this.themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    applySavedTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
        this.themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    showLoader() {
        document.querySelector('.loader').style.display = 'flex';
    }

    hideLoader() {
        document.querySelector('.loader').style.display = 'none';
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        this.newsContainer.appendChild(errorEl);
    }
}

document.addEventListener('DOMContentLoaded', () => new NewsApp());