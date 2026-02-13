# Advanced Investment Calculator

A comprehensive web-based investment calculator that helps you plan and track your financial future with support for SIP (Systematic Investment Plan), Insurance investments, and advanced multi-asset portfolio analysis.

## Features

### 📊 Investment Portfolio Management
- Create and manage multiple investments
- Track total invested amount, current value, and returns
- Support for both SIP and Insurance investment types
- Multi-currency support (PKR, USD)

### 📊 **NEW: Investment Analysis Dashboard**
- **Multi-Asset Analysis**: Add and analyze multiple investments simultaneously
- **Separate & Cumulative Insights**: View individual asset performance and portfolio-wide metrics
- **Advanced Calculations**: CAGR, risk-adjusted returns, weighted averages
- **Comprehensive Metrics**: Profit per year, total percentage returns, benchmark comparisons
- **Asset Types Support**: Stocks, Money Market, Bonds, Debts, Commodity, Real Estate, Crypto, Mutual Funds, ETF, and more
- **Risk Assessment**: 5-level risk profiling with risk-adjusted return calculations
- **Interactive Visualizations**: Performance comparison charts and return distribution analysis
- **Portfolio Insights**: Weighted risk scores, average investment periods, annual profit metrics

### 💰 SIP Investment Calculator
- Calculate returns on monthly SIP investments
- Variable monthly contributions with annual increments
- Project future value based on expected annual returns
- Year-wise breakdown of investments and returns

### 🛡️ Insurance Investment Tracker
- Track insurance premium payments (monthly/annual)
- Monitor maturity value and guaranteed returns
- Calculate total premiums paid vs expected maturity amount

### 🎨 Modern UI/UX
- Dark/Light theme toggle
- Responsive design for all devices
- Beautiful glass morphism effects
- Smooth animations and transitions
- Interactive charts and visualizations

### 💾 Data Management
- Local storage persistence
- Export investment data
- Import investment portfolios
- Real-time calculations
- **Asset Analysis Storage**: Save and restore multi-asset analysis sessions

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Font Awesome
- **Charts**: Chart.js
- **Storage**: LocalStorage API

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies required

### Installation
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start planning your investments!

### Usage

#### Investment Analysis Dashboard (NEW)
1. Click the "Analyze" button in the header to access the analysis dashboard
2. **Add Assets**: Click "Add Asset" to input investment details:
   - Investment amount and period (years + months)
   - Asset name and type (stocks, bonds, crypto, etc.)
   - Risk profile (low to very high)
   - Current market value
3. **Manage Assets**: View all added assets in the list, remove individual assets or clear all
4. **Run Analysis**: Click "Run Analysis" to get comprehensive insights:
   - **Cumulative Summary**: Total profit, return percentage, weighted annualized return
   - **Individual Performance**: Detailed analysis for each asset
   - **Interactive Charts**: Performance comparison and return distribution
   - **Portfolio Insights**: Risk scores, average periods, annual profit metrics

#### Creating a New Investment
1. Click the "New Investment" button
2. Fill in the investment details:
   - Investment name
   - Type (SIP or Insurance)
   - Currency
   - Start year
   - Investment period
   - Expected returns (for SIP)
   - Premium details (for Insurance)

#### Managing SIP Investments
- Set initial monthly investment amount
- Adjust contributions for specific months
- View year-wise growth projections
- Track total invested vs current value

#### Managing Insurance Investments
- Set premium amount and frequency
- Enter guaranteed maturity value
- Track premium payments over time
- Monitor returns on maturity

## File Structure

```
investment-calculator/
├── index.html          # Main HTML file with multi-asset analysis dashboard
├── script.js           # JavaScript application logic with InvestmentAnalysisDashboard class
└── README.md           # This file
```

## Key Components

### InvestmentAnalysisDashboard Class
- **Multi-Asset Management**: Add, remove, and manage multiple investment assets
- **Cumulative Analysis Engine**: Calculate portfolio-wide metrics and weighted averages
- **Interactive Charts**: Performance comparison and distribution visualizations
- **Risk Assessment**: Advanced risk profiling with benchmark comparisons
- **Data Persistence**: Save and restore analysis sessions

### AdvancedInvestmentCalculator Class
- **Portfolio Management**: SIP and Insurance investment tracking
- **Real-time Calculations**: Dynamic return projections and value tracking
- **Year-wise Breakdowns**: Detailed monthly and annual investment analysis
- **Manual Overrides**: Edit actual values for accurate historical tracking

## Analysis Capabilities

### Multi-Asset Portfolio Analysis
- **CAGR Calculation**: Compound Annual Growth Rate for each asset and portfolio
- **Risk-Adjusted Returns**: Returns adjusted for risk profile (1-5 scale)
- **Benchmark Comparison**: Performance vs industry standard returns
- **Weighted Metrics**: Investment-weighted averages for accurate portfolio analysis
- **Profit Distribution**: Visual breakdown of profit contribution by asset

### Supported Asset Types
- **Stocks**: Equity investments with 10% benchmark return
- **Money Market**: Low-risk investments with 3% benchmark return
- **Bonds**: Fixed-income securities with 5% benchmark return
- **Debts**: Debt instruments with 4% benchmark return
- **Commodity**: Physical goods with 7% benchmark return
- **Real Estate**: Property investments with 8% benchmark return
- **Cryptocurrency**: Digital assets with 15% benchmark return
- **Mutual Funds**: Professional fund management with 8% benchmark return
- **ETF**: Exchange-traded funds with 9% benchmark return
- **Other**: Custom investments with 6% benchmark return

### Risk Profiling
- **Low Risk**: Conservative investments, minimal volatility
- **Medium Risk**: Balanced approach, moderate growth potential
- **Moderate Risk**: Standard investment profile
- **High Risk**: Aggressive growth, higher volatility
- **Very High Risk**: Speculative investments, maximum volatility

## Browser Compatibility

This application is compatible with all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- LocalStorage API
- Modern CSS properties

## Data Privacy

- All investment data is stored locally in your browser
- No data is sent to external servers
- Your financial information remains private and secure

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this calculator.

## License

This project is open source and available under the MIT License.

## Future Enhancements

- [ ] More investment types (Mutual Funds, Stocks, Real Estate)
- [ ] Advanced charting and analytics
- [ ] Goal-based investment planning
- [ ] Risk assessment tools
- [ ] Tax calculation features
- [ ] Mobile app version

---

**Disclaimer**: This calculator provides estimates for educational purposes only. Please consult with a qualified financial advisor before making investment decisions.
