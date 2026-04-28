// PayCompare - E-Payment Comparison Tool
// Main JavaScript File

// Global Variables
let currentTheme = localStorage.getItem('theme') || 'light';
let charts = {};
let comparisonCharts = {}; // Separate object for comparison page charts
let paymentMethods = [];
let userComparisons = [];
let currentTransactionAmount = 0;
let calculatedResults = [];
let currentRecommendation = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Set initial theme
    initTheme(); // Use initTheme instead of setTheme
    
    // Initialize components
    initializeNavigation();
    initializeThemeToggle();
    initializeFAQ();
    initializeScrollAnimations();
    initializeToasts();
    
    // Initialize amount input validation (moved here to avoid duplicate listeners)
    const amountInput = document.getElementById('transactionAmount');
    if (amountInput) {
        amountInput.addEventListener('input', validateAmount);
        amountInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                analyzePaymentMethods();
            }
        });
    }
    
    // Load data
    loadPaymentMethods();
    
    // Initialize charts if on dashboard page
    if (document.getElementById('chartsDashboard')) {
        initializeCharts();
    }
    
    // Initialize comparison table if on comparison page
    if (document.getElementById('comparisonTable')) {
        initializeComparisonTable();
    }
    
    // Initialize forms
    initializeForms();
    
    console.log('PayCompare initialized successfully');
}

// Theme Management - Enhanced with complete component updates
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    updateAllComponentsForTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    updateAllComponentsForTheme(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;
    
    // SVG icon is used in HTML, change fill color based on theme
    const svg = themeToggle.querySelector('svg');
    if (svg) {
        svg.style.fill = theme === 'dark' ? '#FBBF24' : 'currentColor';
    }
}

// Update all components for theme change
function updateAllComponentsForTheme(theme) {
    // Update input fields - Force reflow to ensure theme variables are applied
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"], textarea');
    inputs.forEach(input => {
        // Remove inline styles to let CSS variables take effect
        input.style.color = '';
        input.style.backgroundColor = '';
        input.style.borderColor = '';
    });
    
    // Update charts if they exist
    const textColor = theme === 'dark' ? '#F1F5F9' : '#0F172A';
    
    if (charts.feeComparison) {
        charts.feeComparison.options.scales.y.ticks.color = textColor;
        charts.feeComparison.options.scales.x.ticks.color = textColor;
        charts.feeComparison.update();
    }
    
    if (charts.availability) {
        charts.availability.options.plugins.legend.labels.color = textColor;
        charts.availability.update();
    }
    
    if (charts.scoreRadar) {
        charts.scoreRadar.options.scales.r.ticks.color = textColor;
        charts.scoreRadar.options.scales.r.pointLabels.color = textColor;
        charts.scoreRadar.update();
    }
    
    if (charts.chargePercentage) {
        charts.chargePercentage.options.plugins.legend.labels.color = textColor;
        charts.chargePercentage.update();
    }
    
    // Update table text
    const tableCells = document.querySelectorAll('#dynamicComparisonTable td, #dynamicComparisonTable th');
    tableCells.forEach(cell => {
        cell.style.color = '';
    });
    
    // Update recommendation card text
    const recommendationText = document.querySelectorAll('#recommendationSection *');
    recommendationText.forEach(el => {
        if (el.style.color) {
            el.style.color = '';
        }
    });
}

function initializeThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
            const currentTheme = document.documentElement.getAttribute('data-theme');
            showToast('Theme changed to ' + currentTheme + ' mode', 'success');
        });
    }
}

// Navigation
function initializeNavigation() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    
    if (mobileMenuToggle && navbarMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navbarMenu.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on links
    const navbarLinks = document.querySelectorAll('.navbar-link');
    navbarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navbarMenu) {
                navbarMenu.classList.remove('active');
            }
        });
    });
    
    // Sticky navbar effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = currentTheme === 'dark' 
                    ? 'rgba(15, 23, 42, 0.98)' 
                    : 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = '';
                navbar.style.boxShadow = '';
            }
        });
    }
}

// FAQ Accordion
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', function() {
                const isActive = item.classList.contains('active');
                
                // Close all FAQ items
                faqItems.forEach(faqItem => {
                    faqItem.classList.remove('active');
                });
                
                // Open clicked item if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.card, .feature-card, .payment-card, .testimonial-card');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Toast Notifications
function initializeToasts() {
    // Toast container will be created dynamically when needed
}

function showToast(message, type = 'success', duration = 3000) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${iconMap[type] || 'ℹ'}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    toast.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid var(--${type}-color);
        border-radius: var(--radius-lg);
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        max-width: 400px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Data Loading
async function loadPaymentMethods() {
    try {
        const response = await fetch('api/payment-methods.php');
        if (response.ok) {
            paymentMethods = await response.json();
            updatePaymentMethodCards();
        }
    } catch (error) {
        console.error('Error loading payment methods:', error);
        // Use sample data if API fails
        paymentMethods = getSamplePaymentMethods();
        updatePaymentMethodCards();
    }
}

function getSamplePaymentMethods() {
    return [
        {
            id: 1,
            name: 'UPI',
            description: 'Unified Payments Interface - Instant mobile payments',
            transaction_fee: 0,
            fee_type: 'fixed',
            flat_fee: 0,
            percentage_fee: 0,
            transaction_speed: 'instant',
            speed_value: 1,
            availability_percentage: 99.9,
            security_level: 'high',
            ease_of_use: 'excellent',
            // Amount suitability scores (0-100)
            suitability_small: 95,      // ₹1 - ₹5,000
            suitability_medium: 90,     // ₹5,000 - ₹50,000
            suitability_large: 60,     // ₹50,000 - ₹2,00,000
            suitability_very_large: 30 // > ₹2,00,000
        },
        {
            id: 2,
            name: 'Net Banking',
            description: 'Online banking through bank websites and apps',
            transaction_fee: 0,
            fee_type: 'hybrid',
            flat_fee: 5,
            percentage_fee: 0,
            min_fee: 5,
            max_fee: 10,
            transaction_speed: 'minutes',
            speed_value: 180,
            availability_percentage: 98,
            security_level: 'very_high',
            ease_of_use: 'good',
            suitability_small: 40,
            suitability_medium: 70,
            suitability_large: 95,
            suitability_very_large: 98
        },
        {
            id: 3,
            name: 'Credit Card',
            description: 'Visa, Mastercard, RuPay credit card payments',
            transaction_fee: 2,
            fee_type: 'percentage',
            flat_fee: 0,
            percentage_fee: 2,
            min_fee: 1,
            max_fee: 3,
            transaction_speed: 'instant',
            speed_value: 1,
            availability_percentage: 99,
            security_level: 'very_high',
            ease_of_use: 'excellent',
            suitability_small: 60,
            suitability_medium: 85,
            suitability_large: 80,
            suitability_very_large: 70
        },
        {
            id: 4,
            name: 'Debit Card',
            description: 'Visa, Mastercard, RuPay debit card payments',
            transaction_fee: 1,
            fee_type: 'percentage',
            flat_fee: 0,
            percentage_fee: 1,
            min_fee: 0.5,
            max_fee: 2,
            transaction_speed: 'instant',
            speed_value: 1,
            availability_percentage: 98.5,
            security_level: 'high',
            ease_of_use: 'excellent',
            suitability_small: 70,
            suitability_medium: 85,
            suitability_large: 75,
            suitability_very_large: 60
        },
        {
            id: 5,
            name: 'PayTM Wallet',
            description: 'Digital wallet with cashback offers',
            transaction_fee: 1.5,
            fee_type: 'hybrid',
            flat_fee: 0,
            percentage_fee: 1.5,
            min_amount_threshold: 5000,
            transaction_speed: 'instant',
            speed_value: 1,
            availability_percentage: 99,
            security_level: 'high',
            ease_of_use: 'excellent',
            suitability_small: 85,
            suitability_medium: 60,
            suitability_large: 30,
            suitability_very_large: 10
        },
        {
            id: 6,
            name: 'Amazon Pay',
            description: 'Amazon payment system with rewards',
            transaction_fee: 1.5,
            fee_type: 'hybrid',
            flat_fee: 0,
            percentage_fee: 1.5,
            min_amount_threshold: 1000,
            transaction_speed: 'instant',
            speed_value: 1,
            availability_percentage: 98.5,
            security_level: 'very_high',
            ease_of_use: 'excellent',
            suitability_small: 80,
            suitability_medium: 65,
            suitability_large: 35,
            suitability_very_large: 15
        }
    ];
}

function updatePaymentMethodCards() {
    const paymentGrid = document.querySelector('.payment-grid');
    if (!paymentGrid) return;
    
    paymentGrid.innerHTML = '';
    
    paymentMethods.forEach(method => {
        const card = createPaymentMethodCard(method);
        paymentGrid.appendChild(card);
    });
}

function createPaymentMethodCard(method) {
    const card = document.createElement('div');
    card.className = 'payment-card card';
    
    const feeText = method.fee_type === 'fixed' 
        ? `₹${method.transaction_fee}` 
        : method.fee_type === 'percentage'
        ? `${method.transaction_fee}%`
        : `₹${method.min_fee} - ₹${method.max_fee}`;
    
    const speedText = method.transaction_speed === 'instant' 
        ? 'Instant' 
        : method.transaction_speed === 'minutes'
        ? `1-${Math.floor(method.speed_value / 60)} mins`
        : `${method.speed_value}s`;
    
    card.innerHTML = `
        <div class="payment-icon">
            ${method.name.charAt(0)}
        </div>
        <h3>${method.name}</h3>
        <p>${method.description}</p>
        <div class="payment-stats">
            <div class="stat-item">
                <div class="stat-value">${feeText}</div>
                <div class="stat-label">Fee</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${speedText}</div>
                <div class="stat-label">Speed</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${method.availability_percentage}%</div>
                <div class="stat-label">Uptime</div>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary btn-sm" onclick="comparePaymentMethod(${method.id})">
                Compare
            </button>
        </div>
    `;
    
    return card;
}

// Charts Dashboard
function initializeCharts() {
    // Load Chart.js
    loadChartJS().then(() => {
        createFeeChart();
        createAvailabilityChart();
        createSpeedChart();
        createComparisonChart();
    });
}

function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (window.Chart) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function createFeeChart() {
    const ctx = document.getElementById('feeChart');
    if (!ctx) return;
    
    const fees = paymentMethods.map(method => method.transaction_fee);
    const labels = paymentMethods.map(method => method.name);
    
    charts.fee = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Transaction Fee (₹)',
                data: fees,
                backgroundColor: 'rgba(79, 70, 229, 0.6)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Transaction Fees Comparison'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createAvailabilityChart() {
    const ctx = document.getElementById('availabilityChart');
    if (!ctx) return;
    
    const availability = paymentMethods.map(method => method.availability_percentage);
    const labels = paymentMethods.map(method => method.name);
    
    charts.availability = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: availability,
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Availability Uptime (%)'
                }
            }
        }
    });
}

function createSpeedChart() {
    const ctx = document.getElementById('speedChart');
    if (!ctx) return;
    
    const speeds = paymentMethods.map(method => method.speed_value);
    const labels = paymentMethods.map(method => method.name);
    
    charts.speed = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Transaction Speed (seconds)',
                data: speeds,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Transaction Speed Comparison'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createComparisonChart() {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;
    
    const overallScores = paymentMethods.map(method => {
        // Calculate overall score based on multiple factors
        const feeScore = Math.max(0, 100 - method.transaction_fee * 10);
        const speedScore = Math.max(0, 100 - method.speed_value / 10);
        const availabilityScore = method.availability_percentage;
        const securityScore = getSecurityScore(method.security_level) * 25;
        const easeScore = getEaseScore(method.ease_of_use) * 25;
        
        return (feeScore + speedScore + availabilityScore + securityScore + easeScore) / 5;
    });
    
    const labels = paymentMethods.map(method => method.name);
    
    charts.comparison = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Fee', 'Speed', 'Availability', 'Security', 'Ease of Use'],
            datasets: labels.map((label, index) => ({
                label: label,
                data: [
                    Math.max(0, 100 - paymentMethods[index].transaction_fee * 10),
                    Math.max(0, 100 - paymentMethods[index].speed_value / 10),
                    paymentMethods[index].availability_percentage,
                    getSecurityScore(paymentMethods[index].security_level) * 25,
                    getEaseScore(paymentMethods[index].ease_of_use) * 25
                ],
                borderColor: `hsla(${index * 45}, 70%, 50%, 1)`,
                backgroundColor: `hsla(${index * 45}, 70%, 50%, 0.2)`,
                borderWidth: 2
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Overall Comparison'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function getSecurityScore(level) {
    const scores = {
        'low': 1,
        'medium': 2,
        'high': 3,
        'very_high': 4
    };
    return scores[level] || 1;
}

function getEaseScore(level) {
    const scores = {
        'poor': 1,
        'fair': 2,
        'good': 3,
        'excellent': 4
    };
    return scores[level] || 1;
}

// Comparison Table
function initializeComparisonTable() {
    const table = document.getElementById('comparisonTable');
    if (!table) return;
    
    updateComparisonTable();
    
    // Initialize filters
    initializeFilters();
}

function updateComparisonTable() {
    const tableBody = document.querySelector('#comparisonTable tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    paymentMethods.forEach(method => {
        const row = createComparisonRow(method);
        tableBody.appendChild(row);
    });
    
    // Highlight best option
    highlightBestOption();
}

function createComparisonRow(method) {
    const row = document.createElement('tr');
    
    const feeText = method.fee_type === 'fixed' 
        ? `₹${method.transaction_fee}` 
        : method.fee_type === 'percentage'
        ? `${method.transaction_fee}%`
        : `₹${method.min_fee} - ₹${method.max_fee}`;
    
    const speedText = method.transaction_speed === 'instant' 
        ? 'Instant' 
        : method.transaction_speed === 'minutes'
        ? `1-${Math.floor(method.speed_value / 60)} mins`
        : `${method.speed_value}s`;
    
    row.innerHTML = `
        <td>
            <strong>${method.name}</strong>
            <br>
            <small>${method.description}</small>
        </td>
        <td>${feeText}</td>
        <td>${speedText}</td>
        <td>${method.availability_percentage}%</td>
        <td>
            <span class="badge badge-${method.security_level}">${method.security_level}</span>
        </td>
        <td>
            <span class="badge badge-${method.ease_of_use}">${method.ease_of_use}</span>
        </td>
        <td>
            <button class="btn btn-primary btn-sm" onclick="viewDetails(${method.id})">
                View Details
            </button>
        </td>
    `;
    
    return row;
}

function highlightBestOption() {
    // Calculate scores and highlight the best option
    const rows = document.querySelectorAll('#comparisonTable tbody tr');
    let bestScore = -1;
    let bestRowIndex = -1;
    
    rows.forEach((row, index) => {
        const method = paymentMethods[index];
        const score = calculateMethodScore(method);
        
        if (score > bestScore) {
            bestScore = score;
            bestRowIndex = index;
        }
    });
    
    if (bestRowIndex >= 0) {
        rows[bestRowIndex].classList.add('recommended');
        const badge = document.createElement('span');
        badge.className = 'badge badge-success';
        badge.textContent = 'Recommended';
        badge.style.cssText = `
            background: var(--success-color);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            margin-left: 0.5rem;
        `;
        rows[bestRowIndex].querySelector('td strong').appendChild(badge);
    }
}

function calculateMethodScore(method) {
    const feeScore = Math.max(0, 100 - method.transaction_fee * 10);
    const speedScore = Math.max(0, 100 - method.speed_value / 10);
    const availabilityScore = method.availability_percentage;
    const securityScore = getSecurityScore(method.security_level) * 25;
    const easeScore = getEaseScore(method.ease_of_use) * 25;
    
    return (feeScore + speedScore + availabilityScore + securityScore + easeScore) / 5;
}

// Filters
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const feeFilter = document.getElementById('feeFilter');
    const speedFilter = document.getElementById('speedFilter');
    const securityFilter = document.getElementById('securityFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
    
    if (feeFilter) {
        feeFilter.addEventListener('change', filterTable);
    }
    
    if (speedFilter) {
        speedFilter.addEventListener('change', filterTable);
    }
    
    if (securityFilter) {
        securityFilter.addEventListener('change', filterTable);
    }
}

function filterTable() {
    const searchInput = document.getElementById('searchInput');
    const feeFilter = document.getElementById('feeFilter');
    const speedFilter = document.getElementById('speedFilter');
    const securityFilter = document.getElementById('securityFilter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const maxFee = feeFilter ? parseFloat(feeFilter.value) : Infinity;
    const maxSpeed = speedFilter ? parseInt(speedFilter.value) : Infinity;
    const minSecurity = securityFilter ? securityFilter.value : 'low';
    
    const rows = document.querySelectorAll('#comparisonTable tbody tr');
    
    rows.forEach((row, index) => {
        const method = paymentMethods[index];
        if (!method) return;
        
        let show = true;
        
        // Search filter
        if (searchTerm && !method.name.toLowerCase().includes(searchTerm) && 
            !method.description.toLowerCase().includes(searchTerm)) {
            show = false;
        }
        
        // Fee filter
        if (method.transaction_fee > maxFee) {
            show = false;
        }
        
        // Speed filter
        if (method.speed_value > maxSpeed) {
            show = false;
        }
        
        // Security filter
        const securityLevels = ['low', 'medium', 'high', 'very_high'];
        if (securityLevels.indexOf(method.security_level) < securityLevels.indexOf(minSecurity)) {
            show = false;
        }
        
        row.style.display = show ? '' : 'none';
    });
}

// Form Handling
function initializeForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
    });
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Basic validation
    if (!validateForm(form)) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Submit form (this would normally send to backend)
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    // Simulate API call
    setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        
        showToast('Form submitted successfully!', 'success');
        form.reset();
    }, 2000);
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}

// Utility Functions
function comparePaymentMethod(methodId) {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method) {
        // Navigate to comparison page or add to comparison
        window.location.href = 'comparison.php?method=' + methodId;
    }
}

function viewDetails(methodId) {
    const method = paymentMethods.find(m => m.id === methodId);
    if (method) {
        // Show modal or navigate to details page
        showModal(method);
    }
}

function showModal(method) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content card';
    modalContent.style.cssText = `
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: fadeInUp 0.3s ease;
    `;
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${method.name}</h2>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
            <p>${method.description}</p>
            <div class="method-details">
                <div class="detail-row">
                    <strong>Transaction Fee:</strong> ${method.fee_type === 'fixed' ? `₹${method.transaction_fee}` : method.fee_type === 'percentage' ? `${method.transaction_fee}%` : `₹${method.min_fee} - ₹${method.max_fee}`}
                </div>
                <div class="detail-row">
                    <strong>Transaction Speed:</strong> ${method.transaction_speed === 'instant' ? 'Instant' : method.transaction_speed === 'minutes' ? `1-${Math.floor(method.speed_value / 60)} mins` : `${method.speed_value}s`}
                </div>
                <div class="detail-row">
                    <strong>Availability:</strong> ${method.availability_percentage}%
                </div>
                <div class="detail-row">
                    <strong>Security Level:</strong> ${method.security_level}
                </div>
                <div class="detail-row">
                    <strong>Ease of Use:</strong> ${method.ease_of_use}
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Export Functions
function exportToPDF() {
    // This would use a library like jsPDF to export the comparison
    showToast('PDF export feature coming soon!', 'info');
}

function exportToCSV() {
    let csv = 'Payment Method,Transaction Fee,Speed,Availability,Security,Ease of Use\n';
    
    paymentMethods.forEach(method => {
        const feeText = method.fee_type === 'fixed' 
            ? `₹${method.transaction_fee}` 
            : method.fee_type === 'percentage'
            ? `${method.transaction_fee}%`
            : `₹${method.min_fee} - ₹${method.max_fee}`;
        
        const speedText = method.transaction_speed === 'instant' 
            ? 'Instant' 
            : method.transaction_speed === 'minutes'
            ? `1-${Math.floor(method.speed_value / 60)} mins`
            : `${method.speed_value}s`;
        
        csv += `"${method.name}","${feeText}","${speedText}","${method.availability_percentage}%","${method.security_level}","${method.ease_of_use}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment-comparison.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Comparison exported to CSV!', 'success');
}

// Recommendation Engine
function getRecommendation(preferences) {
    const { maxFee, maxSpeed, minSecurity } = preferences;
    
    const recommendations = paymentMethods.map(method => {
        const score = calculateRecommendationScore(method, preferences);
        return { method, score };
    });
    
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations.slice(0, 3);
}

function calculateRecommendationScore(method, preferences) {
    const { maxFee, maxSpeed, minSecurity } = preferences;
    
    let score = 100;
    
    // Fee penalty
    if (method.transaction_fee > maxFee) {
        score -= (method.transaction_fee - maxFee) * 10;
    }
    
    // Speed penalty
    if (method.speed_value > maxSpeed) {
        score -= (method.speed_value - maxSpeed) / 10;
    }
    
    // Security bonus/penalty
    const securityLevels = ['low', 'medium', 'high', 'very_high'];
    const methodSecurityIndex = securityLevels.indexOf(method.security_level);
    const minSecurityIndex = securityLevels.indexOf(minSecurity);
    
    if (methodSecurityIndex < minSecurityIndex) {
        score -= 20;
    } else {
        score += (methodSecurityIndex - minSecurityIndex) * 5;
    }
    
    return Math.max(0, score);
}

// Initialize on page load - Moved to DOMContentLoaded to avoid duplicate initialization
// Loading animation removal handled in initializeApp()

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// ============================================
// TRANSACTION ANALYSIS FUNCTIONS
// ============================================

// Set transaction amount from quick buttons
function setAmount(amount) {
    const amountInput = document.getElementById('transactionAmount');
    if (amountInput) {
        amountInput.value = amount;
        validateAmount();
        animateAmountInput();
    }
}

// Validate transaction amount
function validateAmount() {
    const amountInput = document.getElementById('transactionAmount');
    const validation = document.getElementById('amountValidation');
    
    if (!amountInput || !validation) return;
    
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        validation.textContent = 'Please enter a valid amount';
        validation.style.color = 'rgba(255, 100, 100, 0.9)';
        return false;
    }
    
    if (amount > 9999999) {
        validation.textContent = 'Maximum amount is ₹99,99,999';
        validation.style.color = 'rgba(255, 100, 100, 0.9)';
        return false;
    }
    
    validation.textContent = 'Valid amount ready for analysis';
    validation.style.color = 'rgba(100, 255, 100, 0.9)';
    return true;
}

// Animate amount input
function animateAmountInput() {
    const container = document.querySelector('.amount-input-container');
    if (container) {
        container.style.transform = 'scale(1.05)';
        setTimeout(() => {
            container.style.transform = 'scale(1)';
        }, 200);
    }
}

// Main transaction analysis function
async function analyzePaymentMethods() {
    const amountInput = document.getElementById('transactionAmount');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!amountInput) {
        showToast('Please enter a transaction amount', 'error');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    if (!validateAmount()) {
        showToast('Please enter a valid transaction amount', 'error');
        return;
    }
    
    currentTransactionAmount = amount;
    
    // Show loading state
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    }
    
    try {
        // Load payment methods if not already loaded
        if (paymentMethods.length === 0) {
            await loadPaymentMethods();
        }
        
        // Calculate transaction charges for each method
        calculatedResults = calculateTransactionCharges(amount, paymentMethods);
        
        // Generate smart recommendation
        currentRecommendation = generateSmartRecommendation(calculatedResults, amount);
        
        // Update UI with results
        updateTransactionResults(amount, calculatedResults, currentRecommendation);
        
        // Show results sections
        showTransactionResults();
        
        // Update charts if on comparison page
        if (typeof updateTransactionCharts === 'function') {
            updateTransactionCharts(calculatedResults, amount);
        }
        
        showToast('Analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Failed to analyze payment methods. Please try again.', 'error');
    } finally {
        // Reset button state
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze Payment Methods';
        }
    }
}

// Calculate transaction charges for all payment methods
function calculateTransactionCharges(amount, methods) {
    return methods.map(method => {
        const charge = calculateCharge(method, amount);
        const finalAmount = amount + charge.amount;
        const percentage = ((charge.amount / amount) * 100).toFixed(2);
        
        return {
            ...method,
            originalAmount: amount,
            chargeAmount: charge.amount,
            chargePercentage: parseFloat(percentage),
            finalAmount: finalAmount,
            chargeType: charge.type,
            chargeDescription: charge.description,
            savings: calculateSavings(method, amount, charge.amount),
            score: calculateMethodScore(method, charge, amount)
        };
    }).sort((a, b) => a.finalAmount - b.finalAmount); // Sort by final amount (lowest first)
}

// Calculate charge for a single payment method
// Realistic Indian payment ecosystem fee calculation
function calculateCharge(method, amount) {
    let chargeAmount = 0;
    let chargeType = 'fixed';
    let description = '';
    
    const methodName = method.name.toLowerCase();
    
    switch (method.fee_type) {
        case 'fixed':
            // UPI - Zero fee for customers
            chargeAmount = method.flat_fee || 0;
            chargeType = 'fixed';
            description = chargeAmount === 0 ? 'Zero fee for customers' : `Fixed fee ₹${chargeAmount}`;
            break;
            
        case 'percentage':
            // Credit/Debit Cards - Percentage based MDR
            chargeAmount = (amount * (method.percentage_fee || 0)) / 100;
            chargeType = 'percentage';
            description = `${method.percentage_fee}% MDR charge`;
            break;
            
        case 'hybrid':
            if (methodName.includes('net banking')) {
                // Net Banking: Flat fee tiered by amount
                // ₹5 for amounts ≤ ₹10,000
                // ₹10 for amounts > ₹10,000
                chargeAmount = amount <= 10000 ? 5 : 10;
                chargeType = 'tiered';
                description = amount <= 10000 
                    ? 'Flat ₹5 for amounts ≤ ₹10,000' 
                    : 'Flat ₹10 for amounts > ₹10,000';
            } else if (methodName.includes('wallet') || methodName.includes('paytm') || methodName.includes('amazon')) {
                // Wallets: Convenience fee
                // Usually percentage-based with minimum
                const percentageCharge = (amount * (method.percentage_fee || 1.5)) / 100;
                chargeAmount = Math.max(percentageCharge, method.flat_fee || 0);
                chargeType = 'convenience';
                description = `${method.percentage_fee || 1.5}% convenience fee`;
            } else {
                // Default hybrid
                chargeAmount = (amount * (method.percentage_fee || 0)) / 100 + (method.flat_fee || 0);
                chargeType = 'hybrid';
                description = `${method.percentage_fee || 0}% + ₹${method.flat_fee || 0}`;
            }
            break;
            
        default:
            chargeAmount = 0;
            chargeType = 'free';
            description = 'Free transaction';
    }
    
    // Apply amount thresholds for wallet promotions
    if (method.min_amount_threshold && amount < method.min_amount_threshold) {
        chargeAmount = 0;
        chargeType = 'promotional';
        description = `Free for amounts < ₹${method.min_amount_threshold.toLocaleString('en-IN')}`;
    }
    
    return {
        amount: Math.max(0, chargeAmount),
        type: chargeType,
        description: description
    };
}

// Calculate savings compared to most expensive option
function calculateSavings(method, amount, chargeAmount) {
    if (!calculatedResults || calculatedResults.length === 0) return 0;
    
    const maxCharge = Math.max(...calculatedResults.map(r => r.chargeAmount));
    return Math.max(0, maxCharge - chargeAmount); // Ensure non-negative
}

// Determine amount category for transaction
function getAmountCategory(amount) {
    if (amount <= 5000) return 'small';
    if (amount <= 50000) return 'medium';
    if (amount <= 200000) return 'large';
    return 'very_large';
}

// Calculate comprehensive score for recommendation engine
// Advanced weighted scoring based on realistic Indian payment ecosystem
function calculateMethodScore(method, charge, amount) {
    let score = 0;
    
    // 1. Fee Score (40% weight) - Lower fee = higher score
    const feePercentage = (charge.amount / amount) * 100;
    const feeScore = Math.max(0, 100 - feePercentage * 10); // 1% fee = 90 score, 0% fee = 100 score
    score += feeScore * 0.4;
    
    // 2. Amount Suitability Score (25% weight) - Dynamic based on transaction size
    const amountCategory = getAmountCategory(amount);
    const suitabilityKey = `suitability_${amountCategory}`;
    const suitabilityScore = method[suitabilityKey] || 50; // Default to 50 if not defined
    score += suitabilityScore * 0.25;
    
    // 3. Speed Score (15% weight) - Faster = higher score
    let speedScore = 0;
    if (method.transaction_speed === 'instant') speedScore = 100;
    else if (method.speed_value <= 60) speedScore = 80;  // 1 minute
    else if (method.speed_value <= 300) speedScore = 60; // 5 minutes
    else if (method.speed_value <= 1800) speedScore = 40; // 30 minutes
    else speedScore = 20;
    score += speedScore * 0.15;
    
    // 4. Availability/Uptime Score (10% weight)
    const availabilityScore = method.availability_percentage || 99;
    score += availabilityScore * 0.1;
    
    // 5. Security Score (10% weight)
    let securityScore = 0;
    if (method.security_level === 'very_high') securityScore = 100;
    else if (method.security_level === 'high') securityScore = 85;
    else if (method.security_level === 'medium') securityScore = 70;
    else securityScore = 50;
    score += securityScore * 0.1;
    
    // Ensure score is within valid range
    return Math.min(100, Math.max(0, Math.round(score)));
}

// Generate smart recommendation based on calculated results
// Provides intelligent, context-aware recommendations
function generateSmartRecommendation(results, amount) {
    if (!results || results.length === 0) return null;
    
    // Find best method based on score (not just lowest fee)
    const bestMethod = results.reduce((best, current) => 
        current.score > best.score ? current : best
    );
    
    // Calculate savings compared to most expensive option
    const maxCharge = Math.max(...results.map(r => r.chargeAmount));
    const savings = Math.max(0, maxCharge - bestMethod.chargeAmount); // Ensure non-negative
    
    // Get amount category for context
    const amountCategory = getAmountCategory(amount);
    
    // Generate intelligent recommendation reasons based on context
    let reasons = [];
    
    // Fee-based reasoning
    if (bestMethod.chargeAmount === 0) {
        reasons.push('Zero transaction fee');
    } else if (bestMethod.chargeAmount < (amount * 0.01)) {
        reasons.push('Minimal fee (< 1%)');
    } else {
        reasons.push(`Competitive fee of ₹${bestMethod.chargeAmount.toFixed(2)}`);
    }
    
    // Speed-based reasoning
    if (bestMethod.transaction_speed === 'instant') {
        reasons.push('Instant processing');
    } else if (bestMethod.speed_value <= 60) {
        reasons.push('Fast processing (< 1 min)');
    }
    
    // Amount suitability reasoning - Fix: Check if properties exist before accessing
    if (amountCategory === 'small' && (bestMethod.suitability_small || 0) >= 90) {
        reasons.push('Best for small transactions');
    } else if (amountCategory === 'medium' && (bestMethod.suitability_medium || 0) >= 85) {
        reasons.push('Ideal for medium transactions');
    } else if (amountCategory === 'large' && (bestMethod.suitability_large || 0) >= 85) {
        reasons.push('Optimal for large transactions');
    } else if (amountCategory === 'very_large' && (bestMethod.suitability_very_large || 0) >= 90) {
        reasons.push('Best for very large transactions');
    }
    
    // Security reasoning
    if (bestMethod.security_level === 'very_high') {
        reasons.push('Highest security level');
    }
    
    // Availability reasoning
    if (bestMethod.availability_percentage >= 99.5) {
        reasons.push('Excellent reliability');
    }
    
    // Practical usage reasoning
    if (bestMethod.name.toLowerCase().includes('upi') && amount <= 100000) {
        reasons.push('Most convenient & widely accepted');
    } else if (bestMethod.name.toLowerCase().includes('net banking') && amount > 50000) {
        reasons.push('Reliable for high-value transfers');
    } else if (bestMethod.name.toLowerCase().includes('credit card') && amount >= 1000) {
        reasons.push('Earn rewards & cashback');
    }
    
    return {
        method: bestMethod,
        savings: savings,
        reasons: reasons,
        score: bestMethod.score,
        rank: 1,
        amountCategory: amountCategory
    };
}

// Update UI with transaction results
function updateTransactionResults(amount, results, recommendation) {
    // Show results section
    const resultsSection = document.getElementById('comparisonResultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
    
    // Update transaction amount display
    const amountDisplay = document.getElementById('transactionAmountDisplay');
    if (amountDisplay) {
        amountDisplay.textContent = `₹${amount.toLocaleString('en-IN')}`;
    }
    
    // Update table
    updateDynamicComparisonTable(results);
    
    // Hide loading state
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Update charts
    updateTransactionCharts(results, recommendation);
    
    // Show recommendation
    if (recommendation) {
        showRecommendation(recommendation);
    }
}

// Update dynamic comparison table
function updateDynamicComparisonTable(results) {
    const tableBody = document.getElementById('dynamicComparisonTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    results.forEach((result, index) => {
        const row = createDynamicTableRow(result, index);
        tableBody.appendChild(row);
    });
}

// Create dynamic table row
function createDynamicTableRow(result, index) {
    const row = document.createElement('tr');
    row.style.cssText = 'border-bottom: 1px solid var(--border-light); transition: all 0.3s ease;';
    
    // Highlight recommended method
    if (currentRecommendation && result.id === currentRecommendation.method.id) {
        row.style.background = 'linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, transparent 100%)';
        row.style.borderLeft = '4px solid var(--primary-color)';
    }
    
    const isRecommended = currentRecommendation && result.id === currentRecommendation.method.id;
    
    row.innerHTML = `
        <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 40px; height: 40px; background: var(--gradient-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                    ${result.name.charAt(0)}
                </div>
                <div>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                        ${result.name} ${isRecommended ? '<span style="background: var(--gradient-primary); color: white; padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.75rem; margin-left: 0.5rem;">⭐ RECOMMENDED</span>' : ''}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${result.chargeDescription}</div>
                </div>
            </div>
        </td>
        <td style="padding: 1rem;">
            <span class="badge badge-${result.chargeType}" style="text-transform: capitalize;">
                ${result.chargeType}
            </span>
        </td>
        <td style="padding: 1rem; color: var(--text-primary); font-weight: 600;">
            ${result.chargePercentage}%
        </td>
        <td style="padding: 1rem; color: ${result.chargeAmount > 0 ? 'var(--warning-color)' : 'var(--success-color)'}; font-weight: 700;">
            ₹${result.chargeAmount.toFixed(2)}
        </td>
        <td style="padding: 1rem; color: var(--text-primary); font-weight: 700;">
            ₹${result.finalAmount.toFixed(2)}
        </td>
        <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 8px; height: 8px; background: ${getSpeedColor(result.transaction_speed)}; border-radius: var(--radius-full);"></div>
                <span style="color: var(--text-primary); font-weight: 500;">${getSpeedText(result)}</span>
            </div>
        </td>
        <td style="padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 8px; height: 8px; background: ${getAvailabilityColor(result.availability_percentage)}; border-radius: var(--radius-full);"></div>
                <span style="color: var(--text-primary); font-weight: 500;">${result.availability_percentage}%</span>
            </div>
        </td>
        <td style="padding: 1rem;">
            <span class="badge badge-${result.security_level}" style="text-transform: capitalize;">
                ${result.security_level.replace('_', ' ')}
            </span>
        </td>
        <td style="padding: 1rem;">
            <div style="text-align: center;">
                <div style="font-size: 1.25rem; font-weight: 700; color: ${isRecommended ? 'var(--primary-color)' : 'var(--text-secondary)'};">
                    ${result.score}/100
                </div>
                ${isRecommended ? '<div style="font-size: 0.75rem; color: var(--primary-color); font-weight: 600;">BEST CHOICE</div>' : ''}
            </div>
        </td>
    `;
    
    return row;
}

// Show transaction results sections
function showTransactionResults() {
    // Show recommendation section first
    const recommendationSection = document.getElementById('recommendationSection');
    if (recommendationSection) {
        recommendationSection.style.display = 'block';
        recommendationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Show smart filters
    const smartFiltersSection = document.getElementById('smartFiltersSection');
    if (smartFiltersSection) {
        smartFiltersSection.style.display = 'block';
    }
    
    // Show comparison table
    const comparisonResultsSection = document.getElementById('comparisonResultsSection');
    if (comparisonResultsSection) {
        comparisonResultsSection.style.display = 'block';
    }
    
    // Show charts section after table
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection) {
        chartsSection.style.display = 'block';
    }
}

// Show recommendation details at top
function showRecommendation(recommendation) {
    if (!recommendation) return;
    
    // Update recommendation section
    const methodElement = document.getElementById('recommendedMethod');
    const reasonElement = document.getElementById('recommendedReason');
    const savingsElement = document.getElementById('recommendedSavings');
    const scoreElement = document.getElementById('recommendedScore');
    
    if (methodElement) {
        methodElement.textContent = recommendation.method.name;
    }
    if (reasonElement) {
        reasonElement.innerHTML = recommendation.reasons.map(r => `<span class="reason-tag">${r}</span>`).join('');
    }
    if (savingsElement) {
        savingsElement.innerHTML = `<i class="fas fa-piggy-bank"></i> You save ₹${recommendation.savings.toFixed(2)} compared to other methods`;
    }
    if (scoreElement) {
        scoreElement.innerHTML = `<div class="score-circle">${recommendation.score}</div><div class="score-label">/100</div>`;
    }
}

// Update transaction charts
function updateTransactionCharts(results, recommendation) {
    // Show charts section
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection) {
        chartsSection.style.display = 'block';
    }
    
    // Update radar chart
    updateRadarChart(results);
    
    // Update fee comparison chart
    updateFeeComparisonChart(results, currentTransactionAmount);
    
    // Update final amount chart
    updateFinalAmountChart(results, currentTransactionAmount);
    
    // Update speed comparison chart
    updateSpeedComparisonChart(results);
    
    // Update availability chart
    updateAvailabilityChart(results);
    
    // Update score radar chart
    updateScoreRadarChart(results);
    
    // Update charge percentage chart
    updateChargePercentageChart(results, currentTransactionAmount);
}

// Update final amount chart
function updateFinalAmountChart(results, amount) {
    const ctx = document.getElementById('finalAmountChart');
    if (!ctx) return;
    
    const labels = results.map(r => r.name);
    const finalAmounts = results.map(r => r.finalAmount);
    
    // Find recommended index for highlighting
    const recommendedIndex = currentRecommendation ? 
        results.findIndex(r => r.id === currentRecommendation.method.id) : -1;
    
    // Destroy existing chart
    if (comparisonCharts.finalAmount) {
        comparisonCharts.finalAmount.destroy();
        comparisonCharts.finalAmount = null;
    }
    
    comparisonCharts.finalAmount = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Final Amount Payable (₹)',
                data: finalAmounts,
                backgroundColor: finalAmounts.map((f, i) => 
                    i === recommendedIndex ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 158, 11, 0.6)'
                ),
                borderColor: finalAmounts.map((f, i) => 
                    i === recommendedIndex ? 'rgba(16, 185, 129, 1)' : 'rgba(245, 158, 11, 1)'
                ),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Final Amount Payable' }
            },
            scales: {
                y: { 
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Update speed comparison chart
function updateSpeedComparisonChart(results) {
    const ctx = document.getElementById('speedComparisonChart');
    if (!ctx) return;
    
    const labels = results.map(r => r.name);
    const speeds = results.map(r => r.speed_value);
    
    // Find recommended index for highlighting
    const recommendedIndex = currentRecommendation ? 
        results.findIndex(r => r.id === currentRecommendation.method.id) : -1;
    
    // Destroy existing chart
    if (comparisonCharts.speed) {
        comparisonCharts.speed.destroy();
        comparisonCharts.speed = null;
    }
    
    comparisonCharts.speed = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Speed (seconds)',
                data: speeds,
                backgroundColor: speeds.map((s, i) => 
                    i === recommendedIndex ? 'rgba(16, 185, 129, 0.8)' : 'rgba(79, 70, 229, 0.6)'
                ),
                borderColor: speeds.map((s, i) => 
                    i === recommendedIndex ? 'rgba(16, 185, 129, 1)' : 'rgba(79, 70, 229, 1)'
                ),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Transaction Speed (lower is better)' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Update radar chart for comparison page
function updateRadarChart(results) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    
    const labels = results.map(r => r.name);
    const datasets = [
        {
            label: 'Fee Score',
            data: results.map(r => Math.max(0, 100 - (r.chargeAmount / currentTransactionAmount) * 100)),
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2
        },
        {
            label: 'Speed Score',
            data: results.map(r => r.transaction_speed === 'instant' ? 100 : Math.max(0, 100 - r.speed_value / 10)),
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgba(16, 185, 129, 1)',
            borderWidth: 2
        },
        {
            label: 'Availability',
            data: results.map(r => r.availability_percentage),
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 1)',
            borderWidth: 2
        }
    ];
    
    // Destroy existing chart
    if (comparisonCharts.radar) {
        comparisonCharts.radar.destroy();
        comparisonCharts.radar = null;
    }
    
    comparisonCharts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Apply smart filter with advanced scoring
// Recalculates scores based on filter criteria
function applySmartFilter(filterType) {
    if (!calculatedResults || calculatedResults.length === 0) {
        showToast('Please analyze payment methods first', 'warning');
        return;
    }
    
    let filteredResults = [...calculatedResults];
    let newRecommendation = null;
    
    switch (filterType) {
        case 'lowest_fee':
            // Sort by charge amount (lowest first)
            filteredResults.sort((a, b) => a.chargeAmount - b.chargeAmount);
            newRecommendation = { 
                method: filteredResults[0], 
                reasons: ['Lowest transaction fee', 'Maximum savings'],
                score: 100
            };
            break;
            
        case 'fastest':
            // Sort by speed (instant first, then by speed_value)
            filteredResults.sort((a, b) => {
                const speedOrder = { 'instant': 0, 'seconds': 1, 'minutes': 2, 'hours': 3 };
                const aSpeed = speedOrder[a.transaction_speed] ?? 4;
                const bSpeed = speedOrder[b.transaction_speed] ?? 4;
                if (aSpeed !== bSpeed) return aSpeed - bSpeed;
                return a.speed_value - b.speed_value;
            });
            newRecommendation = { 
                method: filteredResults[0], 
                reasons: ['Fastest processing', 'Immediate completion'],
                score: 100
            };
            break;
            
        case 'most_secure':
            // Sort by security level
            const securityOrder = { 'very_high': 4, 'high': 3, 'medium': 2, 'low': 1 };
            filteredResults.sort((a, b) => securityOrder[b.security_level] - securityOrder[a.security_level]);
            newRecommendation = { 
                method: filteredResults[0], 
                reasons: ['Highest security level', 'Safe transactions'],
                score: 100
            };
            break;
            
        case 'most_available':
            // Sort by availability percentage
            filteredResults.sort((a, b) => b.availability_percentage - a.availability_percentage);
            newRecommendation = { 
                method: filteredResults[0], 
                reasons: ['Best availability', 'Highest uptime'],
                score: 100
            };
            break;
            
        case 'large_amounts':
            // For large amounts, prioritize suitability_very_large and suitability_large
            filteredResults.sort((a, b) => {
                const aSuitability = (a.suitability_very_large || 0) * 0.7 + (a.suitability_large || 0) * 0.3;
                const bSuitability = (b.suitability_very_large || 0) * 0.7 + (b.suitability_large || 0) * 0.3;
                return bSuitability - aSuitability;
            });
            newRecommendation = { 
                method: filteredResults[0], 
                reasons: ['Best for large transactions', 'High-value compatibility'],
                score: 100
            };
            break;
            
        case 'balanced':
            // Sort by overall score (default recommendation)
            filteredResults.sort((a, b) => b.score - a.score);
            newRecommendation = { 
                method: filteredResults[0], 
                reasons: ['Best overall balance', 'Optimal mix of fee, speed & security'],
                score: filteredResults[0].score
            };
            break;
    }
    
    // Update UI with filtered results
    updateTransactionResults(currentTransactionAmount, filteredResults, newRecommendation);
    
    // Highlight active filter - Fix: Use event.currentTarget instead of event.target
    document.querySelectorAll('.smart-filter-btn').forEach(btn => {
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = '';
    });
    
    // Use event.currentTarget to get the button element (not child elements)
    const clickedBtn = event && event.currentTarget ? event.currentTarget : null;
    if (clickedBtn) {
        clickedBtn.style.background = 'var(--gradient-primary)';
        clickedBtn.style.borderColor = 'var(--primary-color)';
        clickedBtn.style.color = 'white';
    }
    
    showToast(`Filtered by: ${filterType.replace('_', ' ').toUpperCase()}`, 'info');
}

// Reset smart filters
function resetSmartFilters() {
    if (!calculatedResults || calculatedResults.length === 0) return;
    
    // Reset to original recommendation
    updateTransactionResults(currentTransactionAmount, calculatedResults, currentRecommendation);
    
    // Reset filter buttons
    document.querySelectorAll('.smart-filter-btn').forEach(btn => {
        btn.style.background = 'var(--bg-tertiary)';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = '';
    });
    
    showToast('Filters reset to original analysis', 'info');
}

// Helper functions for colors and text
function getSpeedColor(speed) {
    const colors = {
        'instant': 'var(--success-color)',
        'seconds': 'var(--primary-color)',
        'minutes': 'var(--warning-color)',
        'hours': 'var(--danger-color)'
    };
    return colors[speed] || 'var(--text-secondary)';
}

function getSpeedText(method) {
    if (method.transaction_speed === 'instant') return 'Instant';
    if (method.transaction_speed === 'seconds') return `${method.speed_value}s`;
    if (method.transaction_speed === 'minutes') return `${Math.floor(method.speed_value / 60)}m`;
    return `${Math.floor(method.speed_value / 3600)}h`;
}

function getAvailabilityColor(percentage) {
    if (percentage >= 99.5) return 'var(--success-color)';
    if (percentage >= 98) return 'var(--primary-color)';
    if (percentage >= 95) return 'var(--warning-color)';
    return 'var(--danger-color)';
}

// Initialize amount input validation - Moved to initializeApp to avoid duplicate listeners
// Hover effects handled by CSS instead of JS for better performance

// ============================================
// DASHBOARD CHART FUNCTIONS
// ============================================

// Update dashboard charts based on transaction amount
async function updateDashboardCharts() {
    const amountInput = document.getElementById('dashboardAmount');
    const updateBtn = document.getElementById('updateChartsBtn');
    
    if (!amountInput) {
        showToast('Please enter a transaction amount', 'error');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    
    // Show loading state
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    try {
        // Load payment methods if not already loaded
        if (paymentMethods.length === 0) {
            await loadPaymentMethods();
        }
        
        // Calculate transaction charges
        const results = calculateTransactionCharges(amount, paymentMethods);
        
        // Update all charts
        updateFeeComparisonChart(results, amount);
        updateAvailabilityChart(results);
        updateScoreRadarChart(results);
        updateChargePercentageChart(results, amount);
        
        // Update stats
        updateDashboardStats(results, amount);
        
        showToast('Charts updated successfully!', 'success');
        
    } catch (error) {
        console.error('Dashboard update error:', error);
        showToast('Failed to update charts. Please try again.', 'error');
    } finally {
        // Reset button state
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Update Charts';
        }
    }
}

// Update fee comparison bar chart
function updateFeeComparisonChart(results, amount) {
    const ctx = document.getElementById('feeComparisonChart');
    if (!ctx) return;
    
    const chartData = {
        labels: results.map(r => r.name),
        datasets: [{
            label: 'Transaction Fee (₹)',
            data: results.map(r => r.chargeAmount),
            backgroundColor: results.map(r => 
                r.chargeAmount === 0 ? 'rgba(16, 185, 129, 0.8)' : 
                r.chargeAmount < 10 ? 'rgba(79, 70, 229, 0.8)' : 
                'rgba(245, 158, 11, 0.8)'
            ),
            borderColor: results.map(r => 
                r.chargeAmount === 0 ? 'rgb(16, 185, 129)' : 
                r.chargeAmount < 10 ? 'rgb(79, 70, 229)' : 
                'rgb(245, 158, 11)'
            ),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
        }]
    };
    
    // Destroy existing chart instance to prevent memory leak
    if (charts.feeComparison) {
        charts.feeComparison.destroy();
        charts.feeComparison = null;
    }
    
    charts.feeComparison = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const method = results[context.dataIndex];
                            return [
                                `Fee: ₹${method.chargeAmount.toFixed(2)}`,
                                `Percentage: ${method.chargePercentage}%`,
                                `Final: ₹${method.finalAmount.toFixed(2)}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Update availability doughnut chart
function updateAvailabilityChart(results) {
    const ctx = document.getElementById('availabilityChart');
    if (!ctx) return;
    
    const chartData = {
        labels: results.map(r => r.name),
        datasets: [{
            data: results.map(r => r.availability_percentage),
            backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(79, 70, 229, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(14, 165, 233, 0.8)',
                'rgba(168, 85, 247, 0.8)'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };
    
    // Destroy existing chart instance to prevent memory leak
    if (charts.availability) {
        charts.availability.destroy();
        charts.availability = null;
    }
    
    charts.availability = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update score radar chart
function updateScoreRadarChart(results) {
    const ctx = document.getElementById('scoreRadarChart');
    if (!ctx) return;
    
    const chartData = {
        labels: results.map(r => r.name),
        datasets: [{
            label: 'Overall Score',
            data: results.map(r => r.score),
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(79, 70, 229, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(79, 70, 229, 1)'
        }]
    };
    
    // Destroy existing chart instance to prevent memory leak
    if (charts.scoreRadar) {
        charts.scoreRadar.destroy();
        charts.scoreRadar = null;
    }
    
    charts.scoreRadar = new Chart(ctx, {
        type: 'radar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

// Update charge percentage pie chart
function updateChargePercentageChart(results, amount) {
    const ctx = document.getElementById('chargePercentageChart');
    if (!ctx) return;
    
    // Group by percentage ranges
    const ranges = {
        '0%': 0,
        '0.1-1%': 0,
        '1-2%': 0,
        '2%+': 0
    };
    
    results.forEach(result => {
        if (result.chargePercentage === 0) ranges['0%']++;
        else if (result.chargePercentage <= 1) ranges['0.1-1%']++;
        else if (result.chargePercentage <= 2) ranges['1-2%']++;
        else ranges['2%+']++;
    });
    
    const chartData = {
        labels: Object.keys(ranges),
        datasets: [{
            data: Object.values(ranges),
            backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(79, 70, 229, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: '#ffffff',
            borderWidth: 2
        }]
    };
    
    // Destroy existing chart instance to prevent memory leak
    if (charts.chargePercentage) {
        charts.chargePercentage.destroy();
        charts.chargePercentage = null;
    }
    
    charts.chargePercentage = new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + context.parsed + ' methods (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Update dashboard statistics
function updateDashboardStats(results, amount) {
    // Update total methods
    const totalMethodsEl = document.getElementById('totalMethods');
    if (totalMethodsEl) {
        totalMethodsEl.textContent = results.length;
    }
    
    // Update average fee
    const avgFeeEl = document.getElementById('avgFee');
    if (avgFeeEl) {
        const avgFee = results.reduce((sum, r) => sum + r.chargeAmount, 0) / results.length;
        avgFeeEl.textContent = '₹' + avgFee.toFixed(2);
    }
    
    // Update average speed
    const avgSpeedEl = document.getElementById('avgSpeed');
    if (avgSpeedEl) {
        const avgSpeed = results.reduce((sum, r) => sum + r.speed_value, 0) / results.length;
        avgSpeedEl.textContent = avgSpeed < 60 ? 'Instant' : Math.floor(avgSpeed / 60) + 'm';
    }
    
    // Update best method
    const bestMethodEl = document.getElementById('bestMethod');
    if (bestMethodEl) {
        const bestMethod = results.reduce((best, current) => 
            current.score > best.score ? current : best
        );
        bestMethodEl.textContent = bestMethod.name;
    }
    
    // Update savings
    const savingsEl = document.getElementById('totalSavings');
    if (savingsEl) {
        const maxCharge = Math.max(...results.map(r => r.chargeAmount));
        const minCharge = Math.min(...results.map(r => r.chargeAmount));
        const totalSavings = maxCharge - minCharge;
        savingsEl.textContent = '₹' + totalSavings.toFixed(2);
    }
}

// Performance monitoring
if (window.performance) {
    window.addEventListener('load', function() {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time:', pageLoadTime + 'ms');
    });
}
