// PayCompare - Export Features
// PDF Export, CSV Export, and Advanced Features

/**
 * PDF Export functionality
 */
class PDFExporter {
    constructor() {
        this.jsPDF = null;
        this.loadJsPDF();
    }
    
    async loadJsPDF() {
        if (window.jspdf) {
            this.jsPDF = window.jspdf.jsPDF;
            return;
        }
        
        // Load jsPDF library
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                this.jsPDF = window.jspdf.jsPDF;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async exportComparisonToPDF(paymentMethods, title = 'Payment Methods Comparison') {
        await this.loadJsPDF();
        
        const doc = new this.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Title
        doc.setFontSize(20);
        doc.text(title, pageWidth / 2, 20, { align: 'center' });
        
        // Date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
        
        // Table headers
        const headers = ['Payment Method', 'Fee', 'Speed', 'Availability', 'Security', 'Ease of Use'];
        const columnWidths = [50, 25, 25, 25, 25, 30];
        let yPos = 50;
        
        // Draw headers
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        let xPos = 15;
        
        headers.forEach((header, index) => {
            doc.text(header, xPos, yPos);
            xPos += columnWidths[index];
        });
        
        yPos += 5;
        doc.line(15, yPos, pageWidth - 15, yPos);
        yPos += 10;
        
        // Table data
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        paymentMethods.forEach((method, index) => {
            // Check if we need a new page
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
                
                // Redraw headers on new page
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                xPos = 15;
                headers.forEach((header, i) => {
                    doc.text(header, xPos, yPos);
                    xPos += columnWidths[i];
                });
                yPos += 5;
                doc.line(15, yPos, pageWidth - 15, yPos);
                yPos += 10;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
            }
            
            // Draw row data
            xPos = 15;
            const rowData = [
                method.name,
                this.getFeeText(method),
                this.getSpeedText(method),
                `${method.availability_percentage}%`,
                method.security_level.replace('_', ' '),
                method.ease_of_use
            ];
            
            rowData.forEach((data, i) => {
                // Handle long text by wrapping
                const lines = doc.splitTextToSize(data, columnWidths[i] - 2);
                lines.forEach((line, lineIndex) => {
                    if (lineIndex > 0) {
                        yPos += 5;
                        xPos = 15;
                    }
                    doc.text(line, xPos, yPos);
                    xPos += columnWidths[i];
                });
            });
            
            yPos += 12;
        });
        
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            doc.text('© 2026 PayCompare - E-Payment Comparison Tool', 15, pageHeight - 10);
        }
        
        // Save PDF
        const fileName = `payment-comparison-${Date.now()}.pdf`;
        doc.save(fileName);
        
        showToast('PDF exported successfully!', 'success');
    }
    
    getFeeText(method) {
        if (method.fee_type === 'fixed') {
            return `₹${method.transaction_fee}`;
        } else if (method.fee_type === 'percentage') {
            return `${method.transaction_fee}%`;
        } else if (method.fee_type === 'range') {
            return `₹${method.min_fee}-${method.max_fee}`;
        }
        return 'N/A';
    }
    
    getSpeedText(method) {
        if (method.transaction_speed === 'instant') {
            return 'Instant';
        } else if (method.transaction_speed === 'minutes') {
            return `1-${Math.floor(method.speed_value / 60)} mins`;
        }
        return `${method.speed_value}s`;
    }
}

/**
 * Advanced Notification System
 */
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.createContainer();
        this.requestPermission();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }
    
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
    
    show(message, type = 'info', options = {}) {
        const duration = options.duration || this.defaultDuration;
        const persistent = options.persistent || false;
        const action = options.action || null;
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted' && !document.hidden) {
            this.showBrowserNotification(message, type, action);
        }
        
        // In-app notification
        const notification = this.createInAppNotification(message, type, action);
        this.addNotification(notification);
        
        if (!persistent) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        return notification;
    }
    
    showBrowserNotification(message, type, action) {
        const icon = this.getNotificationIcon(type);
        const options = {
            body: message,
            icon: icon,
            badge: '../images/favicon.png',
            tag: 'paycompare-notification'
        };
        
        if (action) {
            options.actions = [{
                action: action.id,
                title: action.title
            }];
        }
        
        const notification = new Notification('PayCompare', options);
        
        notification.onclick = () => {
            window.focus();
            if (action && action.callback) {
                action.callback();
            }
        };
    }
    
    createInAppNotification(message, type, action) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = this.getNotificationIconHTML(type);
        const actionButton = action ? `<button class="notification-action" data-action="${action.id}">${action.title}</button>` : '';
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
            ${actionButton ? `<div class="notification-actions">${actionButton}</div>` : ''}
        `;
        
        notification.style.cssText = `
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-left: 4px solid ${this.getTypeColor(type)};
            border-radius: var(--radius-lg);
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: var(--shadow-xl);
            display: flex;
            flex-direction: column;
            animation: slideInRight 0.3s ease-out;
            transition: all var(--transition-normal);
        `;
        
        // Add event listeners
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        if (action) {
            const actionBtn = notification.querySelector('.notification-action');
            actionBtn.addEventListener('click', () => {
                if (action.callback) {
                    action.callback();
                }
                this.removeNotification(notification);
            });
        }
        
        return notification;
    }
    
    addNotification(notification) {
        // Remove oldest notification if limit reached
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotification(oldest);
        }
        
        this.notifications.push(notification);
        this.container.appendChild(notification);
    }
    
    removeNotification(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    getNotificationIconHTML(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }
    
    getTypeColor(type) {
        const colors = {
            success: 'var(--success-color)',
            error: 'var(--danger-color)',
            warning: 'var(--warning-color)',
            info: 'var(--primary-color)'
        };
        return colors[type] || colors.info;
    }
    
    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }
}

/**
 * Advanced Recommendation Engine
 */
class RecommendationEngine {
    constructor() {
        this.weights = {
            fee: 0.3,
            speed: 0.25,
            availability: 0.2,
            security: 0.15,
            ease: 0.1
        };
    }
    
    getRecommendations(paymentMethods, preferences = {}) {
        const scoredMethods = paymentMethods.map(method => ({
            method,
            score: this.calculateScore(method, preferences),
            factors: this.getFactorScores(method, preferences)
        }));
        
        // Sort by score (descending)
        scoredMethods.sort((a, b) => b.score - a.score);
        
        return scoredMethods.map(item => ({
            ...item.method,
            recommendationScore: Math.round(item.score),
            factors: item.factors,
            rank: scoredMethods.indexOf(item) + 1
        }));
    }
    
    calculateScore(method, preferences) {
        const factors = this.getFactorScores(method, preferences);
        
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.keys(factors).forEach(factor => {
            const weight = this.weights[factor] || 0;
            totalScore += factors[factor] * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }
    
    getFactorScores(method, preferences) {
        const scores = {};
        
        // Fee score (lower is better)
        scores.fee = this.getFeeScore(method, preferences.maxFee);
        
        // Speed score (faster is better)
        scores.speed = this.getSpeedScore(method, preferences.maxSpeed);
        
        // Availability score (higher is better)
        scores.availability = method.availability_percentage;
        
        // Security score
        scores.security = this.getSecurityScore(method, preferences.minSecurity);
        
        // Ease of use score
        scores.ease = this.getEaseScore(method);
        
        return scores;
    }
    
    getFeeScore(method, maxFee) {
        let fee = method.transaction_fee;
        
        if (method.fee_type === 'range') {
            fee = method.max_fee;
        }
        
        if (maxFee && fee > maxFee) {
            return 0; // Penalty for exceeding max fee
        }
        
        // Score based on fee (0-100, lower fee = higher score)
        return Math.max(0, 100 - (fee * 10));
    }
    
    getSpeedScore(method, maxSpeed) {
        const speed = method.speed_value;
        
        if (maxSpeed && speed > maxSpeed) {
            return 0; // Penalty for exceeding max speed
        }
        
        // Score based on speed (0-100, faster = higher score)
        if (speed === 1) return 100; // Instant
        return Math.max(0, 100 - (speed / 60)); // Convert to penalty per minute
    }
    
    getSecurityScore(method, minSecurity) {
        const securityLevels = ['low', 'medium', 'high', 'very_high'];
        const methodLevel = securityLevels.indexOf(method.security_level);
        const minLevel = securityLevels.indexOf(minSecurity || 'low');
        
        if (methodLevel < minLevel) {
            return 0; // Penalty for not meeting minimum security
        }
        
        // Score based on security level (0-100)
        return (methodLevel + 1) * 25;
    }
    
    getEaseScore(method) {
        const easeLevels = ['poor', 'fair', 'good', 'excellent'];
        const methodLevel = easeLevels.indexOf(method.ease_of_use);
        
        // Score based on ease of use (0-100)
        return (methodLevel + 1) * 25;
    }
    
    getPersonalizedRecommendations(userHistory = []) {
        // Analyze user's past comparisons and preferences
        const preferences = this.analyzeUserPreferences(userHistory);
        
        // Return recommendations based on user behavior
        return {
            preferences,
            insights: this.generateInsights(userHistory),
            trends: this.identifyTrends(userHistory)
        };
    }
    
    analyzeUserPreferences(userHistory) {
        if (!userHistory.length) {
            return {
                preferredFeeType: 'fixed',
                maxFee: 10,
                maxSpeed: 300,
                minSecurity: 'medium',
                priorities: ['fee', 'speed']
            };
        }
        
        // Analyze patterns in user's comparisons
        const feeTypes = {};
        const avgFee = 0;
        const avgSpeed = 0;
        const securityLevels = {};
        
        userHistory.forEach(comparison => {
            // Analyze fee types user compares
            comparison.methods.forEach(method => {
                feeTypes[method.fee_type] = (feeTypes[method.fee_type] || 0) + 1;
                securityLevels[method.security_level] = (securityLevels[method.security_level] || 0) + 1;
            });
        });
        
        // Determine most preferred fee type
        const preferredFeeType = Object.keys(feeTypes).reduce((a, b) => 
            feeTypes[a] > feeTypes[b] ? a : b
        );
        
        return {
            preferredFeeType,
            maxFee: 15,
            maxSpeed: 180,
            minSecurity: 'medium',
            priorities: ['fee', 'security']
        };
    }
    
    generateInsights(userHistory) {
        return [
            "You tend to compare payment methods with lower fees",
            "Security is an important factor in your comparisons",
            "You frequently look at instant payment options"
        ];
    }
    
    identifyTrends(userHistory) {
        return {
            mostCompared: "UPI",
            growingInterest: "Digital Wallets",
            seasonalPatterns: "Higher activity during month-end"
        };
    }
    
    updateWeights(customWeights) {
        this.weights = { ...this.weights, ...customWeights };
    }
}

/**
 * Advanced Search and Filter System
 */
class AdvancedSearch {
    constructor(paymentMethods) {
        this.paymentMethods = paymentMethods;
        this.index = this.buildSearchIndex();
    }
    
    buildSearchIndex() {
        const index = {};
        
        this.paymentMethods.forEach((method, id) => {
            const searchableText = [
                method.name,
                method.description,
                method.fee_type,
                method.transaction_speed,
                method.security_level,
                method.ease_of_use
            ].join(' ').toLowerCase();
            
            // Tokenize and index
            const tokens = searchableText.split(/\s+/);
            tokens.forEach(token => {
                if (!index[token]) {
                    index[token] = [];
                }
                index[token].push(id);
            });
        });
        
        return index;
    }
    
    search(query, filters = {}) {
        let results = [];
        
        if (query) {
            const tokens = query.toLowerCase().split(/\s+/);
            const resultSets = tokens.map(token => this.index[token] || []);
            
            // Intersect results (AND search)
            results = resultSets.reduce((a, b) => 
                a.filter(id => b.includes(id))
            );
        } else {
            results = this.paymentMethods.map((_, id) => id);
        }
        
        // Apply filters
        results = results.filter(id => {
            const method = this.paymentMethods[id];
            return this.matchesFilters(method, filters);
        });
        
        // Sort by relevance
        return results.map(id => this.paymentMethods[id]);
    }
    
    matchesFilters(method, filters) {
        // Fee filter
        if (filters.maxFee && method.transaction_fee > filters.maxFee) {
            return false;
        }
        
        // Speed filter
        if (filters.maxSpeed && method.speed_value > filters.maxSpeed) {
            return false;
        }
        
        // Security filter
        if (filters.minSecurity) {
            const levels = ['low', 'medium', 'high', 'very_high'];
            const methodLevel = levels.indexOf(method.security_level);
            const minLevel = levels.indexOf(filters.minSecurity);
            
            if (methodLevel < minLevel) {
                return false;
            }
        }
        
        // Fee type filter
        if (filters.feeType && method.fee_type !== filters.feeType) {
            return false;
        }
        
        // Availability filter
        if (filters.minAvailability && method.availability_percentage < filters.minAvailability) {
            return false;
        }
        
        return true;
    }
    
    getSuggestions(partialQuery) {
        const suggestions = new Set();
        const tokens = partialQuery.toLowerCase().split(/\s+/);
        
        tokens.forEach(token => {
            Object.keys(this.index).forEach(indexToken => {
                if (indexToken.startsWith(token)) {
                    suggestions.add(indexToken);
                }
            });
        });
        
        return Array.from(suggestions).slice(0, 10);
    }
}

// Initialize global instances
let pdfExporter;
let notificationManager;
let recommendationEngine;
let advancedSearch;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    pdfExporter = new PDFExporter();
    notificationManager = new NotificationManager();
    recommendationEngine = new RecommendationEngine();
    
    // Override global showToast to use notification manager
    window.showToast = function(message, type = 'success', duration = 3000) {
        notificationManager.show(message, type, { duration });
    };
});

// Export functions for global access
window.PDFExporter = PDFExporter;
window.NotificationManager = NotificationManager;
window.RecommendationEngine = RecommendationEngine;
window.AdvancedSearch = AdvancedSearch;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .notification-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-color);
    }
    
    .notification-message {
        flex: 1;
        color: var(--text-primary);
        line-height: 1.4;
    }
    
    .notification-close {
        flex-shrink: 0;
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0;
        line-height: 1;
    }
    
    .notification-close:hover {
        color: var(--text-primary);
    }
    
    .notification-actions {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-light);
    }
    
    .notification-action {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 0.375rem 0.75rem;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        cursor: pointer;
        transition: background-color var(--transition-fast);
    }
    
    .notification-action:hover {
        background: var(--primary-dark);
    }
    
    .notification-success {
        border-left-color: var(--success-color);
    }
    
    .notification-success .notification-icon {
        color: var(--success-color);
    }
    
    .notification-error {
        border-left-color: var(--danger-color);
    }
    
    .notification-error .notification-icon {
        color: var(--danger-color);
    }
    
    .notification-warning {
        border-left-color: var(--warning-color);
    }
    
    .notification-warning .notification-icon {
        color: var(--warning-color);
    }
    
    .notification-info {
        border-left-color: var(--primary-color);
    }
    
    .notification-info .notification-icon {
        color: var(--primary-color);
    }
`;

document.head.appendChild(style);
