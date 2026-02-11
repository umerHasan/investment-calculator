// Advanced Investment Calculator App
class AdvancedInvestmentCalculator {
    constructor() {
        this.investments = [];
        this.currentInvestment = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setupTheme();
        this.displayPortfolio();
    }

    // Local Storage Management
    loadFromStorage() {
        const stored = localStorage.getItem('advancedInvestments');
        if (stored) {
            this.investments = JSON.parse(stored);
        }
    }

    saveToStorage() {
        localStorage.setItem('advancedInvestments', JSON.stringify(this.investments));
    }

    // Theme Management
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = isDark ? 'fas fa-sun text-yellow-400' : 'fas fa-moon text-gray-600';
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Modal controls
        document.getElementById('createInvestment').addEventListener('click', () => this.showModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
        
        // Investment form
        document.getElementById('investmentForm').addEventListener('submit', (e) => this.handleCreateInvestment(e));
        
        // Investment detail controls
        document.getElementById('backToPortfolio').addEventListener('click', () => this.showPortfolio());
        document.getElementById('pauseInvestment').addEventListener('click', () => this.pauseInvestment());
        document.getElementById('stopInvestment').addEventListener('click', () => this.stopInvestment());

        // Close modal on outside click
        document.getElementById('investmentModal').addEventListener('click', (e) => {
            if (e.target.id === 'investmentModal') {
                this.hideModal();
            }
        });
    }

    // Modal Management
    showModal() {
        document.getElementById('investmentModal').classList.remove('hidden');
        document.getElementById('investmentForm').reset();
    }

    hideModal() {
        document.getElementById('investmentModal').classList.add('hidden');
    }

    // Investment Creation
    handleCreateInvestment(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('investmentName').value,
            currency: document.getElementById('currency').value,
            startYear: parseInt(document.getElementById('startYear').value),
            period: parseInt(document.getElementById('investmentPeriod').value),
            annualReturn: parseFloat(document.getElementById('annualReturn').value),
            initialAmount: parseFloat(document.getElementById('initialAmount').value) || 0
        };

        const investment = this.createInvestmentStructure(formData);
        this.investments.push(investment);
        this.saveToStorage();
        this.hideModal();
        this.displayPortfolio();
        this.showNotification('Investment created successfully!', 'success');
    }

    createInvestmentStructure(data) {
        const investment = {
            id: Date.now(),
            name: data.name,
            currency: data.currency,
            startYear: data.startYear,
            endYear: data.startYear + data.period - 1,
            annualReturn: data.annualReturn,
            status: 'active',
            yearlyData: {},
            totalInvested: 0,
            currentValue: 0,
            totalReturns: 0,
            createdAt: new Date().toISOString()
        };

        // Initialize yearly data structure
        for (let year = data.startYear; year <= data.startYear + data.period - 1; year++) {
            investment.yearlyData[year] = {
                contributions: new Array(12).fill(data.initialAmount),
                yearStartValue: 0,
                yearEndValue: 0,
                yearlyReturns: 0,
                isComplete: false
            };
        }

        return investment;
    }

    // Portfolio Display
    displayPortfolio() {
        this.updatePortfolioSummary();
        this.displayInvestmentsList();
    }

    updatePortfolioSummary() {
        const totalInvestments = this.investments.length;
        const totalInvested = this.investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
        const currentValue = this.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalReturns = currentValue - totalInvested;

        document.getElementById('totalInvestments').textContent = totalInvestments;
        document.getElementById('totalInvested').textContent = this.formatCurrency(totalInvested);
        document.getElementById('currentValue').textContent = this.formatCurrency(currentValue);
        document.getElementById('totalReturns').textContent = this.formatCurrency(totalReturns);
    }

    displayInvestmentsList() {
        const container = document.getElementById('investmentsList');
        
        if (this.investments.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-8">No investments yet. Create your first investment to get started!</p>';
            return;
        }

        container.innerHTML = this.investments.map(inv => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer animate-slide-up" onclick="calculator.showInvestmentDetails(${inv.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mr-3">${inv.name}</h3>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${
                                inv.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                inv.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            }">
                                ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            ${inv.startYear} - ${inv.endYear} • ${inv.annualReturn}% annual return
                        </p>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Invested</p>
                                <p class="font-semibold text-gray-800 dark:text-white">${this.formatCurrencyForInvestment(inv, inv.totalInvested)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
                                <p class="font-semibold text-primary-600 dark:text-primary-400">${this.formatCurrencyForInvestment(inv, inv.currentValue)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Returns</p>
                                <p class="font-semibold text-green-600 dark:text-green-400">${this.formatCurrencyForInvestment(inv, inv.totalReturns)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="ml-4">
                        <button onclick="event.stopPropagation(); calculator.deleteInvestment(${inv.id})" class="text-red-500 hover:text-red-700 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Investment Details View
    showInvestmentDetails(investmentId) {
        this.currentInvestment = this.investments.find(inv => inv.id === investmentId);
        if (!this.currentInvestment) return;

        document.querySelector('section').classList.add('hidden');
        document.getElementById('investmentDetails').classList.remove('hidden');
        
        this.updateInvestmentDetails();
        this.createYearAccordion();
    }

    showPortfolio() {
        document.getElementById('investmentDetails').classList.add('hidden');
        document.querySelector('section').classList.remove('hidden');
        this.displayPortfolio();
    }

    updateInvestmentDetails() {
        const inv = this.currentInvestment;
        
        document.getElementById('detailTitle').textContent = inv.name;
        document.getElementById('investmentStatus').textContent = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
        document.getElementById('detailInvested').textContent = this.formatCurrencyForInvestment(inv, inv.totalInvested);
        document.getElementById('detailValue').textContent = this.formatCurrencyForInvestment(inv, inv.currentValue);
        document.getElementById('detailReturns').textContent = this.formatCurrencyForInvestment(inv, inv.totalReturns);

        // Update button states
        const pauseBtn = document.getElementById('pauseInvestment');
        const stopBtn = document.getElementById('stopInvestment');
        
        if (inv.status === 'stopped') {
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.classList.add('opacity-50', 'cursor-not-allowed');
            stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else if (inv.status === 'paused') {
            pauseBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Resume';
            pauseBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            pauseBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>Pause';
            pauseBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
            pauseBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        }
    }

    createYearAccordion() {
        const container = document.getElementById('yearAccordion');
        const inv = this.currentInvestment;
        const currentYear = new Date().getFullYear();
        
        let html = '';
        for (let year = inv.startYear; year <= inv.endYear; year++) {
            const yearData = inv.yearlyData[year];
            const isPastYear = year < currentYear;
            const isCurrentYear = year === currentYear;
            const isFutureYear = year > currentYear;
            
            html += `
                <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div class="accordion-header bg-gray-50 dark:bg-gray-700 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors" onclick="calculator.toggleAccordion(${year})">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <i class="fas fa-chevron-right mr-3 transition-transform" id="chevron-${year}"></i>
                                <h4 class="font-semibold text-gray-800 dark:text-white">${year}</h4>
                                ${isPastYear ? '<span class="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 px-2 py-1 rounded">Complete</span>' : 
                                  isCurrentYear ? '<span class="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded">Current</span>' :
                                  '<span class="ml-2 text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 px-2 py-1 rounded">Future</span>'}
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600 dark:text-gray-400">Year End: ${this.formatCurrencyForInvestment(inv, yearData.yearEndValue)}</p>
                                <p class="text-xs text-green-600 dark:text-green-400">Returns: ${this.formatCurrencyForInvestment(inv, yearData.yearlyReturns)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="accordion-content" id="accordion-${year}">
                        <div class="p-4 bg-white dark:bg-gray-800">
                            <div class="mb-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h5 class="font-medium text-gray-700 dark:text-gray-300">Monthly Contributions</h5>
                                    <div class="space-x-2">
                                        <button onclick="calculator.applyToAllMonths(${year}, ${inv.yearlyData[year].contributions[0] || 0})" class="text-xs bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-100 px-2 py-1 rounded hover:bg-primary-200 dark:hover:bg-primary-700">
                                            Apply to All
                                        </button>
                                        <button onclick="calculator.zeroAllMonths(${year})" class="text-xs bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700">
                                            Zero All
                                        </button>
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => `
                                        <div class="text-center">
                                            <label class="text-xs text-gray-600 dark:text-gray-400 block mb-1">${month}</label>
                                            <input type="number" 
                                                class="month-input w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                                                value="${yearData.contributions[index]}" 
                                                onchange="calculator.updateMonthlyContribution(${year}, ${index}, this.value)"
                                                ${inv.status === 'stopped' || (isPastYear && inv.status !== 'active') ? 'disabled' : ''}>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Year Start Value</p>
                                    <p class="font-semibold">${this.formatCurrencyForInvestment(inv, yearData.yearStartValue)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Total Contributed</p>
                                    <p class="font-semibold">${this.formatCurrencyForInvestment(inv, yearData.contributions.reduce((a, b) => a + b, 0))}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Year End Value</p>
                                    <p class="font-semibold">${this.formatCurrencyForInvestment(inv, yearData.yearEndValue)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Yearly Returns</p>
                                    <p class="font-semibold text-green-600 dark:text-green-400">${this.formatCurrencyForInvestment(inv, yearData.yearlyReturns)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    toggleAccordion(year) {
        const content = document.getElementById(`accordion-${year}`);
        const chevron = document.getElementById(`chevron-${year}`);
        
        content.classList.toggle('active');
        chevron.classList.toggle('rotate-90');
    }

    // Monthly Contribution Management
    updateMonthlyContribution(year, monthIndex, value) {
        const inv = this.currentInvestment;
        inv.yearlyData[year].contributions[monthIndex] = parseFloat(value) || 0;
        this.recalculateInvestment(inv);
        this.saveToStorage();
        this.updateInvestmentDetails();
        this.createYearAccordion();
    }

    applyToAllMonths(year, amount) {
        const inv = this.currentInvestment;
        inv.yearlyData[year].contributions = new Array(12).fill(amount);
        this.recalculateInvestment(inv);
        this.saveToStorage();
        this.updateInvestmentDetails();
        this.createYearAccordion();
    }

    zeroAllMonths(year) {
        const inv = this.currentInvestment;
        inv.yearlyData[year].contributions = new Array(12).fill(0);
        this.recalculateInvestment(inv);
        this.saveToStorage();
        this.updateInvestmentDetails();
        this.createYearAccordion();
    }

    // Investment Control
    pauseInvestment() {
        if (this.currentInvestment.status === 'paused') {
            this.currentInvestment.status = 'active';
            this.showNotification('Investment resumed', 'success');
        } else {
            this.currentInvestment.status = 'paused';
            this.showNotification('Investment paused', 'info');
        }
        this.saveToStorage();
        this.updateInvestmentDetails();
        this.displayPortfolio();
    }

    stopInvestment() {
        if (confirm('Are you sure you want to stop this investment? The existing amount will continue to grow but no more contributions will be accepted.')) {
            this.currentInvestment.status = 'stopped';
            // Zero out all future contributions
            const currentYear = new Date().getFullYear();
            for (let year = currentYear + 1; year <= this.currentInvestment.endYear; year++) {
                if (this.currentInvestment.yearlyData[year]) {
                    this.currentInvestment.yearlyData[year].contributions = new Array(12).fill(0);
                }
            }
            this.recalculateInvestment(this.currentInvestment);
            this.saveToStorage();
            this.updateInvestmentDetails();
            this.displayPortfolio();
            this.showNotification('Investment stopped', 'warning');
        }
    }

    deleteInvestment(investmentId) {
        if (confirm('Are you sure you want to delete this investment?')) {
            this.investments = this.investments.filter(inv => inv.id !== investmentId);
            this.saveToStorage();
            this.displayPortfolio();
            this.showNotification('Investment deleted', 'info');
        }
    }

    // Advanced Calculation Engine
    recalculateInvestment(investment) {
        const monthlyReturn = investment.annualReturn / 100 / 12;
        let currentValue = 0;
        let totalInvested = 0;

        // Sort years to ensure proper calculation order
        const years = Object.keys(investment.yearlyData).map(Number).sort((a, b) => a - b);

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            const yearData = investment.yearlyData[year];
            
            // Set year start value
            yearData.yearStartValue = currentValue;
            
            // Calculate monthly contributions and growth
            let yearEndValue = currentValue;
            for (let month = 0; month < 12; month++) {
                const contribution = yearData.contributions[month] || 0;
                totalInvested += contribution;
                yearEndValue = (yearEndValue + contribution) * (1 + monthlyReturn);
            }
            
            // Update year data
            yearData.yearEndValue = yearEndValue;
            yearData.yearlyReturns = yearEndValue - currentValue - yearData.contributions.reduce((a, b) => a + b, 0);
            
            // Set current value for next year
            currentValue = yearEndValue;
        }

        // Update investment totals
        investment.totalInvested = totalInvested;
        investment.currentValue = currentValue;
        investment.totalReturns = currentValue - totalInvested;
    }

    // Utility Functions
    formatCurrency(amount) {
        const currency = this.currentInvestment ? this.currentInvestment.currency : 'PKR';
        const symbol = currency === 'USD' ? '$' : 'Rs';
        
        if (currency === 'USD') {
            return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else {
            return symbol + Math.round(amount).toLocaleString('en-PK');
        }
    }

    formatCurrencyForInvestment(investment, amount) {
        const currency = investment.currency;
        const symbol = currency === 'USD' ? '$' : 'Rs';
        
        if (currency === 'USD') {
            return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else {
            return symbol + Math.round(amount).toLocaleString('en-PK');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 animate-slide-up ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' :
                    'fa-info-circle'
                } mr-2"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize app
const calculator = new AdvancedInvestmentCalculator();
