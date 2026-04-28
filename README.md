# PayCompare - Smart Transaction Analysis System

🚀 **Transform your payment decisions with intelligent, real-time transaction analysis**

A comprehensive fintech web application that provides **smart, personalized payment recommendations** based on actual transaction amounts, fees, speed, security, and availability. Now enhanced with AI-powered analytics and modern glassmorphism design.

## ✨ Key Features

### 🎯 Smart Transaction Analysis
- **Real-time Calculations**: Enter any amount and see exact charges instantly
- **Dynamic Fee Structures**: Support for fixed, percentage, hybrid, and conditional fees
- **Intelligent Recommendations**: AI-powered scoring system (40% fee, 25% speed, 20% availability, 15% security)
- **Personalized Filters**: 6 smart filters for different user preferences
- **Live Updates**: Real-time chart updates based on transaction amounts

### 💳 Payment Method Intelligence
- **UPI**: Zero fees, instant processing, 99.9% uptime
- **Net Banking**: Tiered pricing (₹5 below ₹10k, ₹10 above)
- **Credit Cards**: 2% transaction fee with highest security
- **Debit Cards**: 1.5% fee with good balance of features
- **Digital Wallets**: Conditional free tiers and loyalty benefits
- **Hybrid Methods**: Complex fee combinations with thresholds

### 📊 Advanced Analytics Dashboard
- **Dynamic Charts**: Bar, pie, radar, and doughnut charts
- **Transaction Insights**: Fee comparison, availability metrics, security scores
- **Export Capabilities**: PDF reports and CSV data export
- **Performance Metrics**: Real-time statistics and savings calculations

### 🎨 Modern Fintech Experience
- **Glassmorphism Design**: Modern UI similar to Razorpay/CRED
- **Smooth Animations**: Floating elements, pulse effects, shimmer animations
- **Dark Mode Support**: Complete dark/light theme system
- **Mobile Responsive**: Perfect experience on all devices
- **Micro-interactions**: Hover effects, transitions, loading states

### 🔐 Enterprise-Grade Security
- **SQL Injection Protection**: Prepared statements and parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **Session Management**: Secure session handling with expiration
- **Password Hashing**: bcrypt encryption for user passwords
- **Rate Limiting**: API rate limiting to prevent abuse
- **Admin Authentication**: Role-based access control

### 🛠️ Advanced Admin Features
- **Enhanced Payment Management**: Configure percentage fees, flat fees, thresholds
- **Security Scoring**: Numeric security scores (1-100) for each method
- **Processing Time Tracking**: Real-time processing metrics
- **Uptime Monitoring**: Availability percentage tracking
- **Bulk Operations**: Multiple payment method management

## 🚀 Quick Start

### Prerequisites
- **XAMPP** (or similar LAMP/WAMP/MAMP stack)
- **PHP 8.0+** 
- **MySQL 5.7+** or **MariaDB 10.2+**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation Steps
1. **Clone/Download** the project to your web server directory
2. **Import Database**: Use `database/paycompare.sql` to create the enhanced database schema
3. **Configure**: Update `includes/config.php` with your database credentials
4. **Start Services**: Launch Apache and MySQL via XAMPP
5. **Access**: Open `http://localhost/PayCompare/` in your browser

### Default Login
- **Email**: `admin@paycompare.com`
- **Password**: `admin123`

## 📱 How It Works

### Smart Transaction Flow
1. **User enters amount** (e.g., ₹5,000)
2. **System calculates** charges using complex fee structures:
   - **UPI**: ₹0 (0%) → Final: ₹5,000
   - **Credit Card**: ₹100 (2%) → Final: ₹5,100  
   - **Net Banking**: ₹5 (fixed) → Final: ₹5,005
3. **AI recommendation** based on weighted scoring algorithm
4. **Dynamic filtering** for personalized preferences
5. **Live visualization** with interactive charts

### Intelligent Scoring Algorithm
```
Score = (Fee Score × 40%) + (Speed Score × 25%) + (Availability Score × 20%) + (Security Score × 15%)
```

- **Fee Score**: Lower fees = higher scores
- **Speed Score**: Instant (100), Minutes (60), Hours (20)
- **Availability Score**: Higher uptime = higher scores
- **Security Score**: Very High (100), High (85), Medium (70)

### Smart Filters
- **Lowest Fee**: Prioritizes cost savings
- **Fastest Method**: Emphasizes instant processing
- **Most Secure**: Focuses on security levels
- **Most Available**: Prioritizes uptime
- **Large Amounts**: Optimized for high-value transactions
- **Balanced**: Best overall combination

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern CSS with custom properties and animations
- **JavaScript (ES6+)**: Vanilla JavaScript with modern features
- **Chart.js**: Interactive data visualization
- **Font Awesome**: Icon library
- **Responsive Design**: Flexbox and Grid layouts

### Backend
- **PHP 8+**: Server-side scripting with modern features
- **MySQL**: Relational database with optimized schema
- **RESTful API**: JSON-based API endpoints
- **PDO**: Database abstraction layer
- **Sessions**: Secure user session management

### Security
- **bcrypt**: Password hashing
- **Prepared Statements**: SQL injection prevention
- **Input Validation**: Comprehensive input sanitization
- **HTTPS Ready**: SSL/TLS support
- **CORS**: Cross-origin resource sharing configuration

## 📁 Project Structure

```
PayCompare/
├── assets/                 # Static assets (images, fonts)
├── css/                    # Stylesheets
│   └── style.css          # Main stylesheet with dark mode
├── js/                     # JavaScript files
│   ├── main.js            # Main application logic
│   └── export-features.js # PDF export and advanced features
├── images/                 # Image assets
├── includes/               # PHP includes
│   └── config.php         # Database and app configuration
├── api/                    # API endpoints
│   ├── auth.php           # Authentication API
│   ├── payment-methods.php # Payment methods API
│   └── users.php          # User management API
├── admin/                  # Admin panel
│   ├── index.html         # Admin dashboard
│   └── payment-methods.html # Payment method management
├── database/               # Database files
│   └── paycompare.sql     # MySQL schema and sample data
├── pages/                  # Additional pages
├── index.html             # Home page
├── comparison.html        # Comparison page
├── dashboard.html         # Analytics dashboard
├── login.html             # Login page
└── register.html          # Registration page
```

## 🚀 Quick Start

### Prerequisites
- **XAMPP** (or similar LAMP/WAMP/MAMP stack)
- **PHP 8.0+**
- **MySQL 5.7+** or **MariaDB 10.2+**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation Steps

#### 1. Setup XAMPP
1. Download and install [XAMPP](https://www.apachefriends.org/)
2. Start Apache and MySQL services from XAMPP Control Panel

#### 2. Database Setup
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Create a new database named `paycompare_db`
3. Import the database schema:
   ```sql
   -- Import database/paycompare.sql file
   -- Or run the SQL commands manually
   ```

#### 3. Configure Application
1. Copy the project files to `htdocs/PayCompare/`
2. Update database credentials in `includes/config.php`:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'paycompare_db');
   define('DB_USER', 'root');
   define('DB_PASS', ''); // Your MySQL password
   ```

#### 4. Access the Application
1. Open your browser and navigate to: `http://localhost/PayCompare/`
2. Default admin credentials:
   - **Email**: `admin@paycompare.com`
   - **Password**: `admin123`

## 📊 Database Schema

### Tables

#### `users`
User authentication and management
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password_hash` (bcrypt)
- `full_name`
- `phone`
- `role` (user/admin)
- `is_active`
- `created_at`, `updated_at`, `last_login`

#### `payment_methods`
Payment method information
- `id` (Primary Key)
- `name`
- `description`
- `transaction_fee`
- `fee_type` (fixed/percentage/range)
- `min_fee`, `max_fee`
- `transaction_speed`
- `speed_value`
- `availability_percentage`
- `security_level`
- `ease_of_use`
- `logo_url`
- `is_active`
- `created_at`, `updated_at`

#### `comparisons`
User comparison history
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `comparison_data` (JSON)
- `created_at`

#### `logs`
System activity logs
- `id` (Primary Key)
- `user_id` (Foreign Key)
- `action`
- `description`
- `ip_address`
- `user_agent`
- `created_at`

## 🔧 Configuration

### Database Configuration
Edit `includes/config.php` to configure:
- Database connection settings
- Security parameters
- API rate limiting
- Email settings (for notifications)

### Security Settings
```php
// Security Configuration
define('HASH_COST', 12);                    // bcrypt cost factor
define('SESSION_LIFETIME', 86400);           // 24 hours
define('MAX_LOGIN_ATTEMPTS', 5);             // Login attempts
define('LOGIN_LOCKOUT_TIME', 900);           // 15 minutes
```

### API Configuration
```php
// API Configuration
define('RATE_LIMIT_REQUESTS', 100);          // requests per hour
define('RATE_LIMIT_WINDOW', 3600);           // 1 hour
define('CORS_ORIGIN', '*');                  // Set to your domain in production
```

## 🎨 Customization

### Adding New Payment Methods
1. **Via Admin Panel**: Navigate to Admin → Payment Methods → Add New
2. **Via Database**: Insert directly into `payment_methods` table
3. **Via API**: Use `POST /api/payment-methods.php`

### Modifying Styles
- Edit `css/style.css` for visual changes
- CSS variables are defined at the top for easy theming
- Dark mode styles are automatically handled

### Adding New Features
- Follow the existing API structure in `api/` directory
- Use the security functions from `includes/config.php`
- Maintain the responsive design patterns

## 🔐 Security Considerations

### Production Deployment
1. **Change Default Credentials**: Update admin password immediately
2. **Enable HTTPS**: Configure SSL/TLS certificates
3. **Database Security**: Use strong database passwords
4. **File Permissions**: Restrict write permissions on sensitive files
5. **Error Reporting**: Set `DEBUG_MODE` to `false` in production

### Security Best Practices
- All database queries use prepared statements
- User inputs are validated and sanitized
- Passwords are hashed using bcrypt
- Sessions are securely managed
- Rate limiting prevents API abuse
- CSRF tokens protect against cross-site attacks

## 📱 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth.php?action=login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}
```

#### Register
```http
POST /api/auth.php?action=register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "Password123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

### Payment Methods Endpoints

#### Get All Payment Methods
```http
GET /api/payment-methods.php
```

#### Get Specific Payment Method
```http
GET /api/payment-methods.php?id=1
```

#### Create Payment Method (Admin Only)
```http
POST /api/payment-methods.php
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name": "New Payment Method",
  "description": "Description here",
  "fee_type": "fixed",
  "transaction_fee": 5.00,
  "transaction_speed": "instant",
  "speed_value": 1,
  "availability_percentage": 99.5,
  "security_level": "high",
  "ease_of_use": "excellent"
}
```

## 🚀 Performance Optimization

### Database Optimization
- Indexed columns for fast queries
- Optimized JOIN operations
- Connection pooling via PDO

### Frontend Optimization
- Lazy loading of images
- Minified CSS and JavaScript
- Efficient DOM manipulation
- Debounced search functionality

### Caching Strategy
- Browser caching headers
- API response caching (implement as needed)
- Static asset optimization

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
- Check XAMPP services are running
- Verify database credentials in `config.php`
- Ensure database exists and is accessible

#### 404 Errors
- Verify Apache mod_rewrite is enabled
- Check .htaccess configuration
- Ensure file permissions are correct

#### API Not Working
- Check PHP error logs
- Verify API endpoints exist
- Test with browser developer tools

#### Charts Not Loading
- Check browser console for JavaScript errors
- Verify Chart.js library is loading
- Check API responses in Network tab

## 📊 API Documentation

### Enhanced Endpoints

#### Get Payment Methods
```http
GET /api/payment-methods.php
```

#### Calculate Transaction Charges
```http
GET /api/payment-methods.php?action=calculate&amount=5000
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "UPI",
    "chargeAmount": 0,
    "chargePercentage": 0,
    "finalAmount": 5000,
    "score": 96,
    "transaction_speed": "instant",
    "security_level": "high"
  }
]
```

#### Authentication
```http
POST /api/auth.php
Content-Type: application/json

{
  "action": "login",
  "email": "admin@paycompare.com",
  "password": "admin123"
}
```

## 🎨 Customization Guide

### Modify Scoring Algorithm
Edit `js/main.js` in `calculateMethodScore()`:
```javascript
// Adjust weights for your business needs
score += feeScore * 0.4;        // Fee weight (40%)
score += speedScore * 0.25;      // Speed weight (25%)
score += availabilityScore * 0.2; // Availability weight (20%)
score += securityScore * 0.15;    // Security weight (15%)
```

### Add New Payment Method
```sql
INSERT INTO payment_methods (
    name, description, fee_type, percentage_fee, flat_fee,
    min_amount_threshold, max_amount_threshold,
    transaction_speed, security_score, availability_percentage
) VALUES (
    'New Method', 'Description', 'hybrid', 1.5, 5.00,
    0, 0, 'instant', 85, 99.5
);
```

### Customize Colors
Edit `css/style.css` variables:
```css
:root {
    --primary-color: #4F46E5;    /* Main brand color */
    --gradient-fintech: linear-gradient(...); /* Fintech gradient */
}
```

## 📱 Mobile Testing

### Test on Different Devices
- **iOS**: Safari on iPhone/iPad
- **Android**: Chrome on mobile devices
- **Tablets**: Both portrait and landscape
- **Desktop**: Various screen resolutions

### Mobile-Specific Features
- Touch-friendly buttons (minimum 44px)
- Responsive tables with horizontal scroll
- Optimized form inputs
- Fast loading times

## 🔄 Updates & Maintenance

### Regular Tasks
1. **Database Backups**: Weekly backups of `paycompare_db`
2. **Log Review**: Check application logs monthly
3. **Security Updates**: Update PHP and dependencies
4. **Performance Monitoring**: Track page load times
5. **User Feedback**: Collect and analyze user suggestions

### Adding New Features
1. Update database schema if needed
2. Modify API endpoints
3. Update frontend JavaScript
4. Test thoroughly
5. Update documentation

## 📈 Performance Metrics

### Monitor These Metrics
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Mobile Page Speed**: > 80/100
- **Uptime**: > 99.9%

### Optimization Tips
1. Enable browser caching
2. Compress images and assets
3. Use CDN for static files
4. Optimize database queries
5. Implement lazy loading

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description
5. Code review and merge

### Code Style
- Follow PSR-12 for PHP
- Use ES6+ for JavaScript
- Maintain consistent indentation
- Add comments for complex logic
- Test all functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** for beautiful data visualization
- **Font Awesome** for amazing icons
- **Bootstrap** for responsive grid system inspiration
- **XAMPP** for easy local development environment

## 📞 Support

### Getting Help
1. **Check Documentation**: Review this README and DEPLOYMENT.md
2. **Test Features**: Use the built-in testing suite at `test-features.html`
3. **Check Logs**: Review Apache and PHP error logs
4. **Community**: Open an issue for bug reports or feature requests

### Contact Information
- **Issues**: Report bugs via GitHub Issues
- **Features**: Request features via GitHub Discussions
- **Security**: Report security issues privately

---

## 🎉 Ready to Transform Payment Decisions?

Your **PayCompare Smart Transaction Analysis System** is now complete and ready to help users make intelligent, data-driven payment decisions!

### Next Steps:
1. ✅ **Deploy** using the DEPLOYMENT.md guide
2. ✅ **Test** all features with the testing suite
3. ✅ **Customize** for your specific needs
4. ✅ **Launch** and start helping users save money!

**Enjoy your enhanced fintech platform!** 🚀💳📊
- Ensure proper HTTP methods are used

#### Login Issues
- Clear browser cookies and cache
- Check session configuration
- Verify database user records

### Debug Mode
Enable debug mode in `includes/config.php`:
```php
define('DEBUG_MODE', true);
```

## 📈 Future Enhancements

### Planned Features
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Advanced analytics with ML
- [ ] Payment gateway integration
- [ ] Real-time payment status
- [ ] API rate limiting per user
- [ ] Email notifications
- [ ] Social login integration

### Scalability Considerations
- Database sharding for large datasets
- Load balancing for high traffic
- CDN integration for static assets
- Microservices architecture

## 🤝 Contributing

### Development Guidelines
1. Follow existing code style and patterns
2. Write comprehensive comments
3. Test all functionality
4. Update documentation
5. Use semantic versioning

### Submitting Changes
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Await code review

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

### Documentation
- Check this README file
- Review inline code comments
- Examine database schema

### Contact
- **Email**: support@paycompare.com
- **Website**: https://paycompare.com
- **Issues**: Report via GitHub Issues

## 🙏 Acknowledgments

- **Chart.js** for data visualization
- **Font Awesome** for icons
- **Bootstrap** for design inspiration
- **PHP Community** for best practices

---

**© 2026 PayCompare - E-Payment Comparison Tool. All Rights Reserved.**
