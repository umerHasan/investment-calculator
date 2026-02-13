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
                    actualYearEndValue: null, // Manual override value
                    isManualOverride: false,
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
                                ${yearData.isManualOverride ? '<span class="ml-2 text-xs bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100 px-2 py-1 rounded">Manual</span>' : ''}
                                ${isPastYear ? `<button onclick="event.stopPropagation(); calculator.editYearEndValue(${year})" class="ml-4 text-xs bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-100 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-700">
                                    <i class="fas fa-edit mr-1"></i>Edit Value
                                </button>` : ''}
                                ${!isFutureYear ? `<button onclick="event.stopPropagation(); calculator.zeroAllMonths(${year})" class="ml-2 text-xs bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700">
                                    <i class="fas fa-times mr-1"></i>Zero Year
                                </button>` : ''}
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600 dark:text-gray-400">Year End: ${this.formatCurrencyForInvestment(inv, yearData.yearEndValue)}</p>
                                ${yearData.isManualOverride ? `<p class="text-xs text-orange-600 dark:text-orange-400">Actual: ${this.formatCurrencyForInvestment(inv, yearData.actualYearEndValue)}</p>` : ''}
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
                                    ${yearData.isManualOverride ? `<p class="text-xs text-orange-600 dark:text-orange-400">Manual: ${this.formatCurrencyForInvestment(inv, yearData.actualYearEndValue)}</p>` : ''}
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

    // Edit year end value for past years
    editYearEndValue(year) {
        const inv = this.currentInvestment;
        const yearData = inv.yearlyData[year];
        
        // Create modal for editing year end value
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                            <i class="fas fa-edit text-purple-600 mr-2"></i>
                            Edit Year ${year} End Value
                        </h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Calculated Year End Value
                            </label>
                            <div class="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                ${this.formatCurrencyForInvestment(inv, yearData.yearEndValue)}
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Actual Year End Value
                            </label>
                            <input type="number" 
                                id="actualYearEndValue" 
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white" 
                                value="${yearData.actualYearEndValue || yearData.yearEndValue}" 
                                placeholder="Enter actual year end value"
                                step="0.01">
                        </div>
                        
                        <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-3">
                            <p class="text-sm text-blue-800 dark:text-blue-200">
                                <i class="fas fa-info-circle mr-2"></i>
                                This will override the calculated year end value and use the actual value for future calculations.
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button onclick="calculator.saveYearEndValue(${year}, document.getElementById('actualYearEndValue').value)" class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            <i class="fas fa-save mr-2"></i>Save Value
                        </button>
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

    // Save edited year end value
    saveYearEndValue(year, actualValue) {
        const inv = this.currentInvestment;
        const yearData = inv.yearlyData[year];
        const parsedValue = parseFloat(actualValue);
        
        if (isNaN(parsedValue) || parsedValue < 0) {
            this.showNotification('Please enter a valid positive number', 'error');
            return;
        }
        
        // Update year data
        yearData.actualYearEndValue = parsedValue;
        yearData.isManualOverride = true;
        
        // Recalculate investment with new manual override
        this.recalculateInvestment(inv);
        this.saveToStorage();
        this.updateInvestmentDetails();
        this.createYearAccordion();
        
        // Close modal
        document.querySelector('.fixed').remove();
        
        this.showNotification(`Year ${year} end value updated successfully`, 'success');
    }

    // Reset manual override for a year
    resetYearEndValue(year) {
        const inv = this.currentInvestment;
        const yearData = inv.yearlyData[year];
        
        if (confirm(`Reset year ${year} to calculated value? This will remove your manual override.`)) {
            yearData.actualYearEndValue = null;
            yearData.isManualOverride = false;
            
            // Recalculate investment
            this.recalculateInvestment(inv);
            this.saveToStorage();
            this.updateInvestmentDetails();
            this.createYearAccordion();
            
            this.showNotification(`Year ${year} reset to calculated value`, 'success');
        }
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

    // SIP Calculation (existing logic with manual override support)
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
            
            // Check if this year has manual override
            if (yearData.isManualOverride && yearData.actualYearEndValue !== null) {
                // Use manual override value
                const yearTotalContributed = yearData.contributions.reduce((sum, val) => sum + parseFloat(val || 0), 0);
                totalInvested += yearTotalContributed;
                
                yearData.yearEndValue = yearData.actualYearEndValue;
                yearData.yearlyReturns = yearData.actualYearEndValue - currentValue - yearTotalContributed;
                currentValue = yearData.actualYearEndValue;
                
                calculationLogs.push(`MANUAL OVERRIDE: Using actual year end value: ${this.formatCurrencyForInvestment(investment, yearData.actualYearEndValue)}`);
                calculationLogs.push(`Total Contributed: ${this.formatCurrencyForInvestment(investment, yearTotalContributed)}`);
                calculationLogs.push(`Year Returns: ${this.formatCurrencyForInvestment(investment, yearData.yearlyReturns)}`);
                calculationLogs.push(`Year End Value: ${this.formatCurrencyForInvestment(investment, yearData.yearEndValue)}`);
            } else {
                // Use calculated value
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

// Investment Analysis Dashboard Class
class InvestmentAnalysisDashboard {
    constructor() {
        this.currentAssets = [];
        this.analyses = [];
        this.currentAnalysis = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAnalysesFromStorage();
        this.loadAssetsFromStorage();
    }

    // Local Storage Management
    loadAnalysesFromStorage() {
        const stored = localStorage.getItem('investmentAnalyses');
        if (stored) {
            this.analyses = JSON.parse(stored);
        }
    }

    saveAnalysesToStorage() {
        localStorage.setItem('investmentAnalyses', JSON.stringify(this.analyses));
    }

    loadAssetsFromStorage() {
        const stored = localStorage.getItem('currentAnalysisAssets');
        if (stored) {
            this.currentAssets = JSON.parse(stored);
            this.displayAssetsList();
        }
    }

    saveAssetsToStorage() {
        localStorage.setItem('currentAnalysisAssets', JSON.stringify(this.currentAssets));
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('analyzeBtn').addEventListener('click', () => this.showAnalysisDashboard());
        document.getElementById('backToPortfolioFromAnalysis').addEventListener('click', () => this.showPortfolio());
        
        // Asset management
        document.getElementById('addNewAsset').addEventListener('click', () => this.showAssetForm());
        document.getElementById('cancelAssetForm').addEventListener('click', () => this.hideAssetForm());
        document.getElementById('clearAllAssets').addEventListener('click', () => this.clearAllAssets());
        document.getElementById('runAnalysis').addEventListener('click', () => this.runCumulativeAnalysis());
        
        // Form controls
        document.getElementById('investmentAnalysisForm').addEventListener('submit', (e) => this.handleAssetSubmit(e));
    }

    // Navigation Methods
    showAnalysisDashboard() {
        // Hide all sections
        document.querySelector('main > section:first-child').classList.add('hidden');
        document.getElementById('investmentDetails').classList.add('hidden');
        document.getElementById('analysisDashboard').classList.remove('hidden');
        
        // Reset and load assets
        this.hideAnalysisResults();
        this.hideAssetForm();
        this.displayAssetsList();
    }

    showPortfolio() {
        document.getElementById('analysisDashboard').classList.add('hidden');
        document.getElementById('investmentDetails').classList.add('hidden');
        document.querySelector('main > section:first-child').classList.remove('hidden');
        calculator.displayPortfolio();
    }

    // Asset Management Methods
    showAssetForm() {
        document.getElementById('assetForm').classList.remove('hidden');
        document.getElementById('investmentAnalysisForm').reset();
        // Set default risk profile
        document.querySelector('input[name="riskProfile"][value="moderate"]').checked = true;
    }

    hideAssetForm() {
        document.getElementById('assetForm').classList.add('hidden');
    }

    clearAllAssets() {
        if (confirm('Are you sure you want to clear all assets? This will remove all current assets from the analysis.')) {
            this.currentAssets = [];
            this.saveAssetsToStorage();
            this.displayAssetsList();
            this.hideAnalysisResults();
            calculator.showNotification('All assets cleared', 'info');
        }
    }

    hideAnalysisResults() {
        document.getElementById('analysisResults').classList.add('hidden');
    }

    showAnalysisResults() {
        document.getElementById('analysisResults').classList.remove('hidden');
    }

    // Asset Submission
    handleAssetSubmit(e) {
        e.preventDefault();
        
        const assetData = this.getFormData();
        const asset = {
            id: Date.now(),
            ...assetData,
            addedDate: new Date().toISOString()
        };
        
        this.currentAssets.push(asset);
        this.saveAssetsToStorage();
        this.displayAssetsList();
        this.hideAssetForm();
        
        calculator.showNotification('Asset added successfully!', 'success');
    }

    // Asset List Display
    displayAssetsList() {
        const container = document.getElementById('assetsList');
        const actionsDiv = document.getElementById('analysisActions');
        
        if (this.currentAssets.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 dark:text-gray-400 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <i class="fas fa-chart-pie text-4xl mb-3"></i>
                    <p>No assets added yet. Click "Add Asset" to start your analysis.</p>
                </div>
            `;
            actionsDiv.classList.add('hidden');
        } else {
            container.innerHTML = this.currentAssets.map((asset, index) => `
                <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <h4 class="font-semibold text-gray-800 dark:text-white mr-3">${asset.assetName}</h4>
                                <span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                                    ${this.formatAssetType(asset.assetType)}
                                </span>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${
                                    asset.riskProfile === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                    asset.riskProfile === 'medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                    asset.riskProfile === 'moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                    asset.riskProfile === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                                    'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                }">
                                    ${this.formatRiskProfile(asset.riskProfile)} Risk
                                </span>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-500 dark:text-gray-400">Investment</p>
                                    <p class="font-medium text-gray-800 dark:text-white">${this.formatCurrency(asset.investmentAmount, asset.currency)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500 dark:text-gray-400">Current Value</p>
                                    <p class="font-medium text-gray-800 dark:text-white">${this.formatCurrency(asset.currentValue, asset.currency)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-500 dark:text-gray-400">Period</p>
                                    <p class="font-medium text-gray-800 dark:text-white">${asset.years}y ${asset.months}m</p>
                                </div>
                                <div>
                                    <p class="text-gray-500 dark:text-gray-400">Profit/Loss</p>
                                    <p class="font-medium ${(asset.currentValue - asset.investmentAmount) >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        ${this.formatCurrency(asset.currentValue - asset.investmentAmount, asset.currency)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="ml-4">
                            <button onclick="analysisDashboard.removeAsset(${asset.id})" class="text-red-500 hover:text-red-700 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            actionsDiv.classList.remove('hidden');
        }
    }

    removeAsset(assetId) {
        if (confirm('Are you sure you want to remove this asset?')) {
            this.currentAssets = this.currentAssets.filter(asset => asset.id !== assetId);
            this.saveAssetsToStorage();
            this.displayAssetsList();
            calculator.showNotification('Asset removed', 'info');
        }
    }

    getFormData() {
        return {
            investmentAmount: parseFloat(document.getElementById('analysisInvestmentAmount').value),
            years: parseInt(document.getElementById('analysisYears').value),
            months: parseInt(document.getElementById('analysisMonths').value) || 0,
            assetName: document.getElementById('analysisAssetName').value,
            assetType: document.getElementById('analysisAssetType').value,
            riskProfile: document.querySelector('input[name="riskProfile"]:checked').value,
            currentValue: parseFloat(document.getElementById('analysisCurrentValue').value),
            currency: document.getElementById('analysisCurrency').value
        };
    }

    // Cumulative Analysis
    runCumulativeAnalysis() {
        if (this.currentAssets.length === 0) {
            calculator.showNotification('Please add at least one asset to analyze', 'warning');
            return;
        }
        
        // Perform individual analysis for each asset
        const individualAnalyses = this.currentAssets.map(asset => this.performAnalysis(asset));
        
        // Calculate cumulative metrics
        const cumulativeAnalysis = this.calculateCumulativeAnalysis(individualAnalyses);
        
        this.currentAnalysis = {
            individual: individualAnalyses,
            cumulative: cumulativeAnalysis,
            analysisDate: new Date().toISOString()
        };
        
        this.analyses.push(this.currentAnalysis);
        this.saveAnalysesToStorage();
        
        this.displayCumulativeResults(this.currentAnalysis);
        this.showAnalysisResults();
        
        calculator.showNotification('Multi-asset analysis completed successfully!', 'success');
    }

    calculateCumulativeAnalysis(individualAnalyses) {
        const totalInvestment = individualAnalyses.reduce((sum, analysis) => sum + analysis.investmentAmount, 0);
        const totalCurrentValue = individualAnalyses.reduce((sum, analysis) => sum + analysis.currentValue, 0);
        const totalProfit = totalCurrentValue - totalInvestment;
        const totalReturnPercentage = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
        
        // Calculate weighted average annualized return
        const weightedAnnualizedReturn = individualAnalyses.reduce((sum, analysis) => {
            return sum + (analysis.annualizedReturn * analysis.investmentAmount);
        }, 0) / totalInvestment;
        
        // Calculate weighted average risk score
        const weightedRiskScore = individualAnalyses.reduce((sum, analysis) => {
            return sum + (analysis.riskScore * analysis.investmentAmount);
        }, 0) / totalInvestment;
        
        // Calculate average period
        const avgPeriod = individualAnalyses.reduce((sum, analysis) => sum + analysis.totalPeriodInYears, 0) / individualAnalyses.length;
        const profitPerYear = totalProfit / avgPeriod;
        
        return {
            totalInvestment,
            totalCurrentValue,
            totalProfit,
            totalReturnPercentage,
            weightedAnnualizedReturn,
            weightedRiskScore,
            avgPeriod,
            profitPerYear,
            assetCount: individualAnalyses.length,
            currency: individualAnalyses[0]?.currency || 'PKR'
        };
    }

    // Analysis Calculation Engine
    performAnalysis(data) {
        const totalPeriodInYears = data.years + (data.months / 12);
        const profit = data.currentValue - data.investmentAmount;
        const totalReturnPercentage = ((profit / data.investmentAmount) * 100);
        const profitPerYear = profit / totalPeriodInYears;
        
        // Calculate annualized return (CAGR)
        let annualizedReturn = 0;
        if (data.investmentAmount > 0 && totalPeriodInYears > 0) {
            annualizedReturn = (Math.pow(data.currentValue / data.investmentAmount, 1 / totalPeriodInYears) - 1) * 100;
        }

        // Risk assessment
        const riskScore = this.getRiskScore(data.riskProfile);
        const riskAdjustedReturn = this.calculateRiskAdjustedReturn(annualizedReturn, riskScore);
        
        // Benchmark comparison
        const benchmarkReturn = this.getBenchmarkReturn(data.assetType);
        const performanceVsBenchmark = annualizedReturn - benchmarkReturn;

        return {
            id: Date.now(),
            ...data,
            totalPeriodInYears,
            profit,
            totalReturnPercentage,
            profitPerYear,
            annualizedReturn,
            riskScore,
            riskAdjustedReturn,
            benchmarkReturn,
            performanceVsBenchmark,
            analysisDate: new Date().toISOString()
        };
    }

    getRiskScore(riskProfile) {
        const riskScores = {
            'low': 1,
            'medium': 2,
            'moderate': 3,
            'high': 4,
            'very-high': 5
        };
        return riskScores[riskProfile] || 3;
    }

    calculateRiskAdjustedReturn(annualizedReturn, riskScore) {
        // Simple risk-adjusted calculation: higher risk reduces the quality of return
        const riskMultiplier = 1 - (riskScore - 1) * 0.1; // 10% reduction per risk level
        return annualizedReturn * riskMultiplier;
    }

    getBenchmarkReturn(assetType) {
        const benchmarks = {
            'stocks': 10,
            'money-market': 3,
            'bonds': 5,
            'debts': 4,
            'commodity': 7,
            'real-estate': 8,
            'crypto': 15,
            'mutual-funds': 8,
            'etf': 9,
            'other': 6
        };
        return benchmarks[assetType] || 6;
    }

    // Display Cumulative Results
    displayCumulativeResults(analysisData) {
        const resultsContainer = document.getElementById('analysisResults');
        const { individual, cumulative } = analysisData;
        
        resultsContainer.innerHTML = `
            <!-- Cumulative Summary Cards -->
            <div class="mb-8">
                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                    Cumulative Analysis Summary
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                        <p class="text-sm text-gray-600 dark:text-gray-300">Total Profit/Loss</p>
                        <p class="text-2xl font-bold ${cumulative.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                            ${this.formatCurrency(cumulative.totalProfit, cumulative.currency)}
                        </p>
                    </div>
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                        <p class="text-sm text-gray-600 dark:text-gray-300">Total Return %</p>
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${cumulative.totalReturnPercentage.toFixed(2)}%
                        </p>
                    </div>
                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                        <p class="text-sm text-gray-600 dark:text-gray-300">Weighted Annualized Return</p>
                        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            ${cumulative.weightedAnnualizedReturn.toFixed(2)}%
                        </p>
                    </div>
                    <div class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                        <p class="text-sm text-gray-600 dark:text-gray-300">Assets Analyzed</p>
                        <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            ${cumulative.assetCount}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Individual Asset Results -->
            <div class="mb-8">
                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                    <i class="fas fa-list text-purple-600 mr-2"></i>
                    Individual Asset Performance
                </h3>
                <div class="space-y-4">
                    ${individual.map((asset, index) => `
                        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <h4 class="text-lg font-semibold text-gray-800 dark:text-white">${asset.assetName}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">${this.formatAssetType(asset.assetType)} • ${this.formatRiskProfile(asset.riskProfile)} Risk</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-bold ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        ${this.formatCurrency(asset.profit, asset.currency)}
                                    </p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">${asset.totalReturnPercentage.toFixed(2)}% return</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Investment</p>
                                    <p class="font-medium text-gray-800 dark:text-white">${this.formatCurrency(asset.investmentAmount, asset.currency)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Current Value</p>
                                    <p class="font-medium text-gray-800 dark:text-white">${this.formatCurrency(asset.currentValue, asset.currency)}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Annualized Return</p>
                                    <p class="font-medium text-gray-800 dark:text-white">${asset.annualizedReturn.toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">vs Benchmark</p>
                                    <p class="font-medium ${asset.performanceVsBenchmark >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        ${asset.performanceVsBenchmark >= 0 ? '+' : ''}${asset.performanceVsBenchmark.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Comparison Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Performance Comparison</h3>
                    <div class="h-64">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Return Distribution</h3>
                    <div class="h-64">
                        <canvas id="distributionChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Portfolio Insights -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    <i class="fas fa-lightbulb text-purple-600 mr-2"></i>
                    Portfolio Insights
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            ${cumulative.weightedRiskScore.toFixed(1)}/5
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Weighted Risk Score</p>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            ${cumulative.avgPeriod.toFixed(1)} years
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Average Investment Period</p>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            ${this.formatCurrency(cumulative.profitPerYear, cumulative.currency)}
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Average Annual Profit</p>
                    </div>
                </div>
            </div>
        `;
        
        // Create charts after DOM is updated
        setTimeout(() => {
            this.createPerformanceChart(individual);
            this.createDistributionChart(individual);
        }, 100);
    }

    createPerformanceChart(individualAnalyses) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.performanceChartInstance) {
            this.performanceChartInstance.destroy();
        }

        const labels = individualAnalyses.map(asset => asset.assetName);
        const returnsData = individualAnalyses.map(asset => asset.totalReturnPercentage);
        const benchmarkData = individualAnalyses.map(asset => asset.benchmarkReturn);
        
        this.performanceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Actual Return %',
                        data: returnsData,
                        backgroundColor: 'rgba(147, 51, 234, 0.5)',
                        borderColor: 'rgba(147, 51, 234, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Benchmark Return %',
                        data: benchmarkData,
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    createDistributionChart(individualAnalyses) {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.distributionChartInstance) {
            this.distributionChartInstance.destroy();
        }

        const labels = individualAnalyses.map(asset => asset.assetName);
        const profitData = individualAnalyses.map(asset => asset.profit);
        
        this.distributionChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: profitData,
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.5)',
                        'rgba(59, 130, 246, 0.5)',
                        'rgba(147, 51, 234, 0.5)',
                        'rgba(251, 146, 60, 0.5)',
                        'rgba(239, 68, 68, 0.5)',
                        'rgba(6, 182, 212, 0.5)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(147, 51, 234, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(6, 182, 212, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                const value = new InvestmentAnalysisDashboard().formatCurrency(context.parsed, individualAnalyses[0].currency);
                                return context.label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    calculateRiskAdjustedReturn(annualizedReturn, riskScore) {
        // Simple risk-adjusted calculation: higher risk reduces the quality of return
        const riskMultiplier = 1 - (riskScore - 1) * 0.1; // 10% reduction per risk level
        return annualizedReturn * riskMultiplier;
    }

    getBenchmarkReturn(assetType) {
        const benchmarks = {
            'stocks': 10,
            'money-market': 3,
            'bonds': 5,
            'debts': 4,
            'commodity': 7,
            'real-estate': 8,
            'crypto': 15,
            'mutual-funds': 8,
            'etf': 9,
            'other': 6
        };
        return benchmarks[assetType] || 6;
    }

    // Display Results
    displayAnalysisResults(analysis) {
        const resultsContainer = document.getElementById('analysisResults');
        
        resultsContainer.innerHTML = `
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-gradient-to-r from-green-50 to-green-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-300">Total Profit/Loss</p>
                    <p class="text-2xl font-bold ${analysis.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        ${this.formatCurrency(analysis.profit, analysis.currency)}
                    </p>
                </div>
                <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-300">Total Return %</p>
                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        ${analysis.totalReturnPercentage.toFixed(2)}%
                    </p>
                </div>
                <div class="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-300">Annualized Return</p>
                    <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ${analysis.annualizedReturn.toFixed(2)}%
                    </p>
                </div>
                <div class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
                    <p class="text-sm text-gray-600 dark:text-gray-300">Profit Per Year</p>
                    <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        ${this.formatCurrency(analysis.profitPerYear, analysis.currency)}
                    </p>
                </div>
            </div>

            <!-- Detailed Analysis -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Investment Details -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Investment Details</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Asset Name:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${analysis.assetName}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Asset Type:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${this.formatAssetType(analysis.assetType)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Risk Profile:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${this.formatRiskProfile(analysis.riskProfile)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Investment Period:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${analysis.years} years ${analysis.months} months</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Initial Investment:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${this.formatCurrency(analysis.investmentAmount, analysis.currency)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Current Value:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${this.formatCurrency(analysis.currentValue, analysis.currency)}</span>
                        </div>
                    </div>
                </div>

                <!-- Performance Analysis -->
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Performance Analysis</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Risk Score:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${analysis.riskScore}/5</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Risk-Adjusted Return:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${analysis.riskAdjustedReturn.toFixed(2)}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Benchmark Return:</span>
                            <span class="font-medium text-gray-800 dark:text-white">${analysis.benchmarkReturn}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">vs Benchmark:</span>
                            <span class="font-medium ${analysis.performanceVsBenchmark >= 0 ? 'text-green-600' : 'text-red-600'}">
                                ${analysis.performanceVsBenchmark >= 0 ? '+' : ''}${analysis.performanceVsBenchmark.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chart Section -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Profit Visualization</h3>
                <div class="h-64">
                    <canvas id="analysisChart"></canvas>
                </div>
            </div>
        `;
        
        // Create chart after DOM is updated
        setTimeout(() => this.createAnalysisChart(analysis), 100);
    }

    createAnalysisChart(analysis) {
        const ctx = document.getElementById('analysisChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.analysisChartInstance) {
            this.analysisChartInstance.destroy();
        }

        const labels = ['Initial Investment', 'Current Value'];
        const data = [analysis.investmentAmount, analysis.currentValue];
        
        this.analysisChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Value',
                    data: data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.5)',
                        analysis.profit >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        analysis.profit >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 2
                }]
            },
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
                                return context.dataset.label + ': ' + new InvestmentAnalysisDashboard().formatCurrency(context.parsed.y, analysis.currency);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new InvestmentAnalysisDashboard().formatCurrency(value, analysis.currency);
                            }
                        }
                    }
                }
            }
        });
    }

    // Utility Functions
    formatCurrency(amount, currency = 'PKR') {
        const symbol = currency === 'USD' ? '$' : 'Rs';
        
        if (currency === 'USD') {
            return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else {
            return symbol + Math.round(amount).toLocaleString('en-PK');
        }
    }

    formatAssetType(assetType) {
        const formatted = {
            'stocks': 'Stocks',
            'money-market': 'Money Market',
            'bonds': 'Bonds',
            'debts': 'Debts',
            'commodity': 'Commodity',
            'real-estate': 'Real Estate',
            'crypto': 'Cryptocurrency',
            'mutual-funds': 'Mutual Funds',
            'etf': 'ETF',
            'other': 'Other'
        };
        return formatted[assetType] || assetType;
    }

    formatRiskProfile(riskProfile) {
        const formatted = {
            'low': 'Low',
            'medium': 'Medium',
            'moderate': 'Moderate',
            'high': 'High',
            'very-high': 'Very High'
        };
        return formatted[riskProfile] || riskProfile;
    }
}

// Initialize Analysis Dashboard
const analysisDashboard = new InvestmentAnalysisDashboard();
