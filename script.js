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
            // Migrate existing investments to SIP type if they don't have a type
            this.investments.forEach(inv => {
                if (!inv.type) {
                    inv.type = 'sip';
                }
            });
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
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Modal controls
        document.getElementById('createInvestment').addEventListener('click', () => this.showModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());
        
        // Investment form
        document.getElementById('investmentForm').addEventListener('submit', (e) => this.handleCreateInvestment(e));
        
        // Back to portfolio button
        document.getElementById('backToPortfolio').addEventListener('click', () => this.showPortfolio());
        
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

    // Toggle investment type fields
    toggleInvestmentTypeFields() {
        const investmentType = document.getElementById('investmentType').value;
        const sipFields = document.querySelectorAll('#sipFields, #sipInitialAmount');
        const insuranceFields = document.querySelectorAll('#insuranceFields, #insuranceDetails');
        
        if (investmentType === 'sip') {
            sipFields.forEach(field => field.classList.remove('hidden'));
            insuranceFields.forEach(field => field.classList.add('hidden'));
            // Make SIP fields required
            document.getElementById('annualReturn').required = true;
            document.getElementById('initialAmount').required = true;
            // Make insurance fields not required
            document.getElementById('premiumAmount').required = false;
            document.getElementById('maturityValue').required = false;
        } else {
            sipFields.forEach(field => field.classList.add('hidden'));
            insuranceFields.forEach(field => field.classList.remove('hidden'));
            // Make insurance fields required
            document.getElementById('premiumAmount').required = true;
            document.getElementById('maturityValue').required = true;
            // Make SIP fields not required
            document.getElementById('annualReturn').required = false;
            document.getElementById('initialAmount').required = false;
        }
    }

    // Investment Creation
    handleCreateInvestment(e) {
        e.preventDefault();
        
        const investmentType = document.getElementById('investmentType').value;
        
        let formData = {
            type: investmentType,
            name: document.getElementById('investmentName').value,
            currency: document.getElementById('currency').value,
            startYear: parseInt(document.getElementById('startYear').value),
            period: parseInt(document.getElementById('investmentPeriod').value)
        };

        if (investmentType === 'sip') {
            formData.annualReturn = parseFloat(document.getElementById('annualReturn').value);
            formData.initialAmount = parseFloat(document.getElementById('initialAmount').value) || 0;
        } else if (investmentType === 'insurance') {
            formData.premiumAmount = parseFloat(document.getElementById('premiumAmount').value);
            formData.premiumFrequency = document.getElementById('premiumFrequency').value;
            formData.maturityValue = parseFloat(document.getElementById('maturityValue').value);
        }

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
            type: data.type || 'sip', // 'sip' or 'insurance'
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

        // Add insurance-specific fields if type is insurance
        if (data.type === 'insurance') {
            investment.premiumAmount = data.premiumAmount;
            investment.premiumFrequency = data.premiumFrequency; // 'monthly' or 'annual'
            investment.maturityValue = data.maturityValue;
            // Remove annualReturn for insurance as it's not used
            delete investment.annualReturn;
        }

        const currentYear = new Date().getFullYear();
        
        // Initialize yearly data structure
        for (let year = data.startYear; year <= data.startYear + data.period - 1; year++) {
            const isFutureYear = year > currentYear;
            
            if (data.type === 'insurance') {
                // Insurance: Fixed premiums
                const monthlyPremium = data.premiumFrequency === 'monthly' ? data.premiumAmount : data.premiumAmount / 12;
                investment.yearlyData[year] = {
                    contributions: new Array(12).fill(isFutureYear ? 0 : monthlyPremium),
                    yearStartValue: 0,
                    yearEndValue: 0,
                    yearlyReturns: 0,
                    isComplete: false
                };
            } else {
                // SIP: Variable contributions
                investment.yearlyData[year] = {
                    contributions: new Array(12).fill(isFutureYear ? 0 : data.initialAmount),
                    yearStartValue: 0,
                    yearEndValue: 0,
                    yearlyReturns: 0,
                    isComplete: false
                };
            }
        }

        // Calculate initial values for insurance
        if (data.type === 'insurance') {
            // For insurance, set all years (including current) to have premiums for calculation
            for (let year = data.startYear; year <= data.startYear + data.period - 1; year++) {
                if (year <= currentYear) {
                    const monthlyPremium = data.premiumFrequency === 'monthly' ? data.premiumAmount : data.premiumAmount / 12;
                    investment.yearlyData[year].contributions = new Array(12).fill(monthlyPremium);
                }
            }
            this.recalculateInvestment(investment);
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
                            <i class="fas ${inv.type === 'insurance' ? 'fa-shield-alt text-blue-600' : 'fa-chart-line text-green-600'} mr-2"></i>
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mr-3">${inv.name}</h3>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${
                                inv.type === 'insurance' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            }">
                                ${inv.type === 'insurance' ? 'Insurance' : 'SIP'}
                            </span>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${
                                inv.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                inv.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                            }">
                                ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            ${inv.startYear} - ${inv.endYear} ${inv.type === 'sip' ? `• ${inv.annualReturn}% annual return` : `• ${inv.premiumFrequency} premiums`}
                        </p>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">Invested</p>
                                <p class="font-semibold text-gray-800 dark:text-white">${this.formatCurrencyForInvestment(inv, inv.totalInvested)}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 dark:text-gray-400">${inv.type === 'insurance' ? 'Maturity Value' : 'Current Value'}</p>
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

        // Add calculation logs button
        this.addCalculationLogsButton();
    }

    createYearAccordion() {
        const container = document.getElementById('yearAccordion');
        const inv = this.currentInvestment;
        const currentYear = new Date().getFullYear();
        
        if (inv.type === 'insurance') {
            // Insurance: Show premium schedule instead of contribution grid
            this.createInsuranceAccordion(container, inv, currentYear);
        } else {
            // SIP: Show existing contribution grid
            this.createSIPAccordion(container, inv, currentYear);
        }
    }

    createSIPAccordion(container, inv, currentYear) {
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
                                ${!isFutureYear ? `<button onclick="event.stopPropagation(); calculator.zeroAllMonths(${year})" class="ml-4 text-xs bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700">
                                    <i class="fas fa-times mr-1"></i>Zero Year
                                </button>` : ''}
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600 dark:text-gray-400">Year End: ${this.formatCurrencyForInvestment(inv, yearData.yearEndValue)}</p>
                                <p class="text-xs text-green-600 dark:text-green-400">Returns: ${this.formatCurrencyForInvestment(inv, yearData.yearlyReturns)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="accordion-content ${!isFutureYear ? 'active' : ''}" id="accordion-${year}">
                        <div class="p-4 bg-white dark:bg-gray-800">
                            <div class="mb-4">
                                <div class="flex justify-between items-center mb-2">
                                    <h5 class="font-medium text-gray-700 dark:text-gray-300">Monthly Contributions</h5>
                                    <div class="flex items-center space-x-2">
                                        <div class="flex items-center space-x-1">
                                            <input type="number" 
                                                id="applyAllInput-${year}" 
                                                class="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                                                placeholder="Amount">
                                            <button onclick="calculator.applyToAllMonths(${year}, document.getElementById('applyAllInput-${year}').value)" class="text-xs bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-100 px-2 py-1 rounded hover:bg-primary-200 dark:hover:bg-primary-700">
                                                Apply to All
                                            </button>
                                        </div>
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

    createInsuranceAccordion(container, inv, currentYear) {
        let html = '';
        for (let year = inv.startYear; year <= inv.endYear; year++) {
            const yearData = inv.yearlyData[year];
            const isPastYear = year < currentYear;
            const isCurrentYear = year === currentYear;
            const isFutureYear = year > currentYear;
            const yearTotalContributed = yearData.contributions.reduce((sum, val) => sum + parseFloat(val || 0), 0);
            
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
                                <p class="text-xs text-blue-600 dark:text-blue-400">Maturity Value: ${this.formatCurrencyForInvestment(inv, inv.maturityValue)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="accordion-content ${!isFutureYear ? 'active' : ''}" id="accordion-${year}">
                        <div class="p-4 bg-white dark:bg-gray-800">
                            <div class="mb-4">
                                <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-3">Premium Payment Schedule</h5>
                                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => `
                                        <div class="text-center">
                                            <label class="text-xs text-gray-600 dark:text-gray-400 block mb-1">${month}</label>
                                            <div class="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-center">
                                                ${this.formatCurrencyForInvestment(inv, yearData.contributions[index])}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Yearly Premiums</p>
                                    <p class="font-semibold">${this.formatCurrencyForInvestment(inv, yearTotalContributed)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Premium Frequency</p>
                                    <p class="font-semibold capitalize">${inv.premiumFrequency}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Maturity Year</p>
                                    <p class="font-semibold">${inv.endYear}</p>
                                </div>
                            </div>
                            ${year === inv.endYear ? `
                                <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                    <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-2">Maturity Information</h5>
                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p class="text-blue-600 dark:text-blue-400">Total Premiums Paid</p>
                                            <p class="font-semibold text-blue-800 dark:text-blue-100">${this.formatCurrencyForInvestment(inv, inv.totalInvested)}</p>
                                        </div>
                                        <div>
                                            <p class="text-blue-600 dark:text-blue-400">Guaranteed Maturity Value</p>
                                            <p class="font-semibold text-blue-800 dark:text-blue-100">${this.formatCurrencyForInvestment(inv, inv.maturityValue)}</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
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
        const parsedAmount = parseFloat(amount) || 0;
        inv.yearlyData[year].contributions = new Array(12).fill(parsedAmount);
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

    deleteInvestment(investmentId) {
        if (confirm('Are you sure you want to delete this investment?')) {
            this.investments = this.investments.filter(inv => inv.id !== investmentId);
            this.saveToStorage();
            this.displayPortfolio();
            this.showNotification('Investment deleted', 'info');
        }
    }

    // Advanced Calculation Engine with detailed logging
    recalculateInvestment(investment) {
        if (investment.type === 'insurance') {
            this.recalculateInsurance(investment);
        } else {
            this.recalculateSIP(investment);
        }
    }

    // SIP Calculation (existing logic)
    recalculateSIP(investment) {
        const monthlyReturn = investment.annualReturn / 100 / 12;
        let currentValue = 0;
        let totalInvested = 0;
        const calculationLogs = [];

        // Sort years to ensure proper calculation order
        const years = Object.keys(investment.yearlyData).map(Number).sort((a, b) => a - b);

        calculationLogs.push(`=== ${investment.name} SIP Calculation Log ===`);
        calculationLogs.push(`Annual Return: ${investment.annualReturn}% | Monthly Return: ${(monthlyReturn * 100).toFixed(4)}%`);

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            const yearData = investment.yearlyData[year];
            
            // Ensure all contributions are numbers
            yearData.contributions = yearData.contributions.map(val => parseFloat(val) || 0);
            
            // Set year start value
            yearData.yearStartValue = currentValue;
            calculationLogs.push(`\n--- Year ${year} ---`);
            calculationLogs.push(`Starting Value: ${this.formatCurrencyForInvestment(investment, currentValue)}`);
            
            // Calculate monthly contributions and growth
            let yearEndValue = currentValue;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            
            for (let month = 0; month < 12; month++) {
                const contribution = parseFloat(yearData.contributions[month]) || 0;
                totalInvested += contribution;
                const beforeGrowth = yearEndValue + contribution;
                yearEndValue = beforeGrowth * (1 + monthlyReturn);
                const monthlyGrowth = yearEndValue - beforeGrowth;
                
                calculationLogs.push(`${monthNames[month]}: Contributed ${this.formatCurrencyForInvestment(investment, contribution)}, Growth ${this.formatCurrencyForInvestment(investment, monthlyGrowth)}, End: ${this.formatCurrencyForInvestment(investment, yearEndValue)}`);
            }
            
            // Update year data
            yearData.yearEndValue = yearEndValue;
            const yearTotalContributed = yearData.contributions.reduce((sum, val) => sum + parseFloat(val || 0), 0);
            yearData.yearlyReturns = yearEndValue - currentValue - yearTotalContributed;
            
            calculationLogs.push(`Year ${year} Summary:`);
            calculationLogs.push(`  Total Contributed: ${this.formatCurrencyForInvestment(investment, yearTotalContributed)}`);
            calculationLogs.push(`  Year Growth: ${this.formatCurrencyForInvestment(investment, yearData.yearlyReturns)}`);
            calculationLogs.push(`  Year End Value: ${this.formatCurrencyForInvestment(investment, yearData.yearEndValue)}`);
            
            // Set current value for next year
            currentValue = yearEndValue;
        }

        calculationLogs.push(`\n=== Final Summary ===`);
        calculationLogs.push(`Total Invested: ${this.formatCurrencyForInvestment(investment, totalInvested)}`);
        calculationLogs.push(`Final Value: ${this.formatCurrencyForInvestment(investment, currentValue)}`);
        calculationLogs.push(`Total Returns: ${this.formatCurrencyForInvestment(investment, currentValue - totalInvested)}`);

        // Store calculation logs for display
        investment.calculationLogs = calculationLogs;

        // Update investment totals
        investment.totalInvested = totalInvested;
        investment.currentValue = currentValue;
        investment.totalReturns = currentValue - totalInvested;
    }

    // Insurance Calculation (simple logic)
    recalculateInsurance(investment) {
        const calculationLogs = [];
        const years = Object.keys(investment.yearlyData).map(Number).sort((a, b) => a - b);
        
        calculationLogs.push(`=== ${investment.name} Insurance Calculation Log ===`);
        calculationLogs.push(`Premium Amount: ${this.formatCurrencyForInvestment(investment, investment.premiumAmount)} (${investment.premiumFrequency})`);
        calculationLogs.push(`Guaranteed Maturity Value: ${this.formatCurrencyForInvestment(investment, investment.maturityValue)}`);

        let totalInvested = 0;
        const currentYear = new Date().getFullYear();

        for (let i = 0; i < years.length; i++) {
            const year = years[i];
            const yearData = investment.yearlyData[year];
            
            // Ensure all contributions are numbers
            yearData.contributions = yearData.contributions.map(val => parseFloat(val) || 0);
            
            // Calculate yearly premium total
            const yearTotalContributed = yearData.contributions.reduce((sum, val) => sum + parseFloat(val || 0), 0);
            
            // Only add to total invested if year is not in the future
            if (year <= currentYear) {
                totalInvested += yearTotalContributed;
            }
            
            calculationLogs.push(`\n--- Year ${year} ---`);
            calculationLogs.push(`Premiums This Year: ${this.formatCurrencyForInvestment(investment, yearTotalContributed)}`);
            calculationLogs.push(`Total Premiums to Date: ${this.formatCurrencyForInvestment(investment, totalInvested)}`);
            
            // Update year data
            yearData.yearStartValue = investment.maturityValue; // Insurance shows maturity value from start
            yearData.yearEndValue = investment.maturityValue; // Always show maturity value
            yearData.yearlyReturns = 0; // No returns during term (maturity value is fixed)
        }

        // For insurance, current value is always the maturity value
        const currentValue = investment.maturityValue;
        const totalReturns = currentValue - totalInvested;

        calculationLogs.push(`\n=== Final Summary ===`);
        calculationLogs.push(`Total Premiums Paid: ${this.formatCurrencyForInvestment(investment, totalInvested)}`);
        calculationLogs.push(`Guaranteed Maturity Value: ${this.formatCurrencyForInvestment(investment, currentValue)}`);
        calculationLogs.push(`Total Returns: ${this.formatCurrencyForInvestment(investment, totalReturns)}`);

        // Store calculation logs for display
        investment.calculationLogs = calculationLogs;

        // Update investment totals
        investment.totalInvested = totalInvested;
        investment.currentValue = currentValue;
        investment.totalReturns = totalReturns;
    }

    // Add calculation logs button and modal
    addCalculationLogsButton() {
        // Check if button already exists
        if (document.getElementById('showLogsBtn')) return;
        
        const buttonContainer = document.querySelector('#investmentDetails .flex.justify-between.items-center.mb-6 .flex.space-x-2');
        const logsButton = document.createElement('button');
        logsButton.id = 'showLogsBtn';
        logsButton.className = 'bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200';
        logsButton.innerHTML = '<i class="fas fa-calculator mr-2"></i>Show Calculations';
        logsButton.onclick = () => this.showCalculationLogs();
        buttonContainer.appendChild(logsButton);
    }

    showCalculationLogs() {
        const inv = this.currentInvestment;
        if (!inv.calculationLogs) {
            this.showNotification('No calculation logs available', 'warning');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                            <i class="fas fa-calculator text-purple-600 mr-2"></i>
                            Calculation Logs - ${inv.name}
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto max-h-96">
                        <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${inv.calculationLogs.join('\n')}</pre>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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
