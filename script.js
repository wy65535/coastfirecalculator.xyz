// Currency symbols mapping
const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CNY: '¥',
    JPY: '¥',
    CAD: 'CAD$',
    AUD: 'AUD$'
};

let growthChart = null;
let currentCurrency = 'USD';

// DOM Elements
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const recalculateBtn = document.getElementById('recalculate-btn');
const resultsDiv = document.getElementById('results');
const shareBtn = document.getElementById('share-btn');
const printBtn = document.getElementById('print-btn');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeFAQ();
    loadSavedData();
});

// Event Listeners
function initializeEventListeners() {
    calculateBtn.addEventListener('click', calculateCoastFIRE);
    resetBtn.addEventListener('click', resetCalculator);
    if (recalculateBtn) recalculateBtn.addEventListener('click', scrollToCalculator);
    if (shareBtn) shareBtn.addEventListener('click', shareResults);
    if (printBtn) printBtn.addEventListener('click', printResults);
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Currency change
    document.getElementById('currency').addEventListener('change', function(e) {
        currentCurrency = e.target.value;
    });
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            }
        });
    });
    
    // Auto-save inputs
    const inputs = document.querySelectorAll('.calculator-inputs input, .calculator-inputs select');
    inputs.forEach(input => {
        input.addEventListener('change', saveData);
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
}

// FAQ Functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// Get Input Values
function getInputValues() {
    return {
        currency: document.getElementById('currency').value,
        currentAge: parseFloat(document.getElementById('current-age').value),
        retirementAge: parseFloat(document.getElementById('retirement-age').value),
        currentSavings: parseFloat(document.getElementById('current-savings').value),
        monthlyContribution: parseFloat(document.getElementById('monthly-contribution').value),
        annualExpenses: parseFloat(document.getElementById('annual-expenses').value),
        returnRate: parseFloat(document.getElementById('return-rate').value) / 100,
        inflationRate: parseFloat(document.getElementById('inflation-rate').value) / 100,
        safeWithdrawalRate: parseFloat(document.getElementById('safe-withdrawal-rate').value) / 100
    };
}

// Validate Inputs
function validateInputs(inputs) {
    const errors = [];
    
    if (inputs.currentAge >= inputs.retirementAge) {
        errors.push('Retirement age must be greater than current age');
    }
    
    if (inputs.currentAge < 18 || inputs.currentAge > 100) {
        errors.push('Current age must be between 18 and 100');
    }
    
    if (inputs.annualExpenses <= 0) {
        errors.push('Annual expenses must be greater than 0');
    }
    
    if (inputs.returnRate <= 0 || inputs.returnRate > 0.3) {
        errors.push('Investment return should be between 0% and 30%');
    }
    
    if (inputs.safeWithdrawalRate <= 0 || inputs.safeWithdrawalRate > 0.1) {
        errors.push('Safe withdrawal rate should be between 0% and 10%');
    }
    
    if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return false;
    }
    
    return true;
}

// Calculate Coast FIRE
function calculateCoastFIRE() {
    const inputs = getInputValues();
    
    if (!validateInputs(inputs)) {
        return;
    }
    
    const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
    const realReturnRate = inputs.returnRate - inputs.inflationRate;
    
    // Calculate Traditional FIRE Number (amount needed to retire today)
    const traditionalFIRENumber = inputs.annualExpenses / inputs.safeWithdrawalRate;
    
    // Calculate Future FIRE Number (accounting for inflation)
    const futureValue = inputs.annualExpenses * Math.pow(1 + inputs.inflationRate, yearsToRetirement);
    const futureFIRENumber = futureValue / inputs.safeWithdrawalRate;
    
    // Calculate Coast FIRE Number (present value of future FIRE number)
    const coastFIRENumber = futureFIRENumber / Math.pow(1 + realReturnRate, yearsToRetirement);
    
    // Calculate time to reach Coast FIRE
    const monthlyRate = Math.pow(1 + inputs.returnRate, 1/12) - 1;
    let timeToCoastFIRE = 0;
    let currentBalance = inputs.currentSavings;
    
    if (currentBalance >= coastFIRENumber) {
        timeToCoastFIRE = 0;
    } else {
        // Calculate months to reach Coast FIRE with contributions
        let months = 0;
        while (currentBalance < coastFIRENumber && months < 1200) { // Max 100 years
            currentBalance = currentBalance * (1 + monthlyRate) + inputs.monthlyContribution;
            months++;
        }
        timeToCoastFIRE = months / 12;
    }
    
    // Calculate time to reach Traditional FIRE
    let timeToTraditionalFIRE = 0;
    currentBalance = inputs.currentSavings;
    let adjustedFIRETarget = traditionalFIRENumber;
    
    if (currentBalance >= traditionalFIRENumber) {
        timeToTraditionalFIRE = 0;
    } else {
        let months = 0;
        while (currentBalance < adjustedFIRETarget && months < 1200) {
            currentBalance = currentBalance * (1 + monthlyRate) + inputs.monthlyContribution;
            // Adjust target for inflation each year
            if (months % 12 === 0 && months > 0) {
                adjustedFIRETarget *= (1 + inputs.inflationRate);
            }
            months++;
        }
        timeToTraditionalFIRE = months / 12;
    }
    
    // Calculate total contributions
    const totalContributions = inputs.monthlyContribution * 12 * timeToCoastFIRE;
    
    // Calculate investment growth (Coast FIRE number - current savings - contributions)
    const investmentGrowth = coastFIRENumber - inputs.currentSavings - totalContributions;
    
    // Display results
    displayResults({
        coastFIRENumber,
        traditionalFIRENumber,
        timeToCoastFIRE,
        timeToTraditionalFIRE,
        totalContributions,
        investmentGrowth,
        futureFIRENumber,
        inputs
    });
    
    // Generate chart
    generateChart(inputs, coastFIRENumber, futureFIRENumber, timeToCoastFIRE);
    
    // Generate comparison table
    generateComparisonTable(inputs);
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Display Results
function displayResults(results) {
    const symbol = currencySymbols[currentCurrency];
    
    document.getElementById('coast-fire-number').textContent = 
        formatCurrency(results.coastFIRENumber, symbol);
    
    document.getElementById('traditional-fire-number').textContent = 
        formatCurrency(results.traditionalFIRENumber, symbol);
    
    document.getElementById('time-to-coast').textContent = 
        formatYears(results.timeToCoastFIRE);
    
    document.getElementById('time-to-fire').textContent = 
        formatYears(results.timeToTraditionalFIRE);
    
    document.getElementById('total-contributions').textContent = 
        formatCurrency(results.totalContributions, symbol);
    
    document.getElementById('investment-growth').textContent = 
        formatCurrency(Math.max(0, results.investmentGrowth), symbol);
    
    resultsDiv.style.display = 'block';
}

// Format Currency
function formatCurrency(amount, symbol) {
    return symbol + amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Format Years
function formatYears(years) {
    if (years === 0) {
        return 'Already reached!';
    }
    
    const wholeYears = Math.floor(years);
    const months = Math.round((years - wholeYears) * 12);
    
    if (wholeYears === 0) {
        return `${months} month${months !== 1 ? 's' : ''}`;
    }
    
    if (months === 0) {
        return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}`;
    }
    
    return `${wholeYears} year${wholeYears !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
}

// Generate Chart
function generateChart(inputs, coastFIRENumber, futureFIRENumber, timeToCoastFIRE) {
    const ctx = document.getElementById('growth-chart');
    
    if (!ctx) return;
    
    // Destroy existing chart
    if (growthChart) {
        growthChart.destroy();
    }
    
    const years = [];
    const savingsPhase = [];
    const coastingPhase = [];
    const traditionalFIREPath = [];
    
    const monthlyRate = Math.pow(1 + inputs.returnRate, 1/12) - 1;
    const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
    const totalYears = Math.min(yearsToRetirement, 50); // Cap at 50 years for display
    
    // Calculate growth paths
    let balance = inputs.currentSavings;
    let traditionalBalance = inputs.currentSavings;
    const coastYears = Math.ceil(timeToCoastFIRE);
    
    for (let year = 0; year <= totalYears; year++) {
        years.push(inputs.currentAge + year);
        
        if (year === 0) {
            savingsPhase.push(inputs.currentSavings);
            coastingPhase.push(null);
            traditionalFIREPath.push(inputs.currentSavings);
        } else {
            // Calculate for 12 months
            for (let month = 0; month < 12; month++) {
                if (year <= coastYears) {
                    balance = balance * (1 + monthlyRate) + inputs.monthlyContribution;
                } else {
                    balance = balance * (1 + monthlyRate);
                }
                
                traditionalBalance = traditionalBalance * (1 + monthlyRate) + inputs.monthlyContribution;
            }
            
            if (year <= coastYears) {
                savingsPhase.push(balance);
                coastingPhase.push(null);
            } else {
                savingsPhase.push(null);
                coastingPhase.push(balance);
            }
            
            traditionalFIREPath.push(traditionalBalance);
        }
    }
    
    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Savings Phase (Contributing)',
                    data: savingsPhase,
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Coasting Phase (No Contributions)',
                    data: coastingPhase,
                    borderColor: '#06d6a0',
                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Traditional FIRE Path',
                    data: traditionalFIREPath,
                    borderColor: '#004e89',
                    backgroundColor: 'rgba(0, 78, 137, 0.05)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Investment Growth Over Time',
                    font: {
                        size: 18,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y, currencySymbols[currentCurrency]);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return currencySymbols[currentCurrency] + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Portfolio Value'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Age'
                    }
                }
            }
        }
    });
}

// Generate Comparison Table
function generateComparisonTable(inputs) {
    const tbody = document.getElementById('comparison-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const scenarios = [
        {
            name: 'Coast FIRE (Current Plan)',
            monthly: inputs.monthlyContribution
        },
        {
            name: 'Aggressive Savings (+50%)',
            monthly: inputs.monthlyContribution * 1.5
        },
        {
            name: 'Conservative Savings (-25%)',
            monthly: inputs.monthlyContribution * 0.75
        },
        {
            name: 'Minimal Savings ($500/mo)',
            monthly: 500
        }
    ];
    
    scenarios.forEach(scenario => {
        const result = calculateScenario(inputs, scenario.monthly);
        const row = tbody.insertRow();
        
        row.insertCell(0).textContent = scenario.name;
        row.insertCell(1).textContent = formatYears(result.yearsToCoast);
        row.insertCell(2).textContent = Math.round(inputs.currentAge + result.yearsToCoast);
        row.insertCell(3).textContent = formatCurrency(scenario.monthly, currencySymbols[currentCurrency]);
    });
}

// Calculate Scenario
function calculateScenario(inputs, monthlyContribution) {
    const yearsToRetirement = inputs.retirementAge - inputs.currentAge;
    const realReturnRate = inputs.returnRate - inputs.inflationRate;
    const futureValue = inputs.annualExpenses * Math.pow(1 + inputs.inflationRate, yearsToRetirement);
    const futureFIRENumber = futureValue / inputs.safeWithdrawalRate;
    const coastFIRENumber = futureFIRENumber / Math.pow(1 + realReturnRate, yearsToRetirement);
    
    const monthlyRate = Math.pow(1 + inputs.returnRate, 1/12) - 1;
    let currentBalance = inputs.currentSavings;
    let months = 0;
    
    if (currentBalance >= coastFIRENumber) {
        return { yearsToCoast: 0 };
    }
    
    while (currentBalance < coastFIRENumber && months < 1200) {
        currentBalance = currentBalance * (1 + monthlyRate) + monthlyContribution;
        months++;
    }
    
    return { yearsToCoast: months / 12 };
}

// Reset Calculator
function resetCalculator() {
    document.getElementById('currency').value = 'USD';
    document.getElementById('current-age').value = '30';
    document.getElementById('retirement-age').value = '65';
    document.getElementById('current-savings').value = '50000';
    document.getElementById('monthly-contribution').value = '1000';
    document.getElementById('annual-expenses').value = '40000';
    document.getElementById('return-rate').value = '7';
    document.getElementById('inflation-rate').value = '3';
    document.getElementById('safe-withdrawal-rate').value = '4';
    
    resultsDiv.style.display = 'none';
    
    if (growthChart) {
        growthChart.destroy();
        growthChart = null;
    }
    
    localStorage.removeItem('coastFireCalculatorData');
    currentCurrency = 'USD';
}

// Scroll to Calculator
function scrollToCalculator() {
    document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
}

// Share Results
function shareResults() {
    const inputs = getInputValues();
    const shareText = `I calculated my Coast FIRE number! 🔥\n\nCheck out the Coast FIRE Calculator at ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Coast FIRE Results',
            text: shareText,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Unable to share results. Please copy the URL manually.');
        });
    }
}

// Print Results
function printResults() {
    window.print();
}

// Save Data to Local Storage
function saveData() {
    const data = {
        currency: document.getElementById('currency').value,
        currentAge: document.getElementById('current-age').value,
        retirementAge: document.getElementById('retirement-age').value,
        currentSavings: document.getElementById('current-savings').value,
        monthlyContribution: document.getElementById('monthly-contribution').value,
        annualExpenses: document.getElementById('annual-expenses').value,
        returnRate: document.getElementById('return-rate').value,
        inflationRate: document.getElementById('inflation-rate').value,
        safeWithdrawalRate: document.getElementById('safe-withdrawal-rate').value
    };
    
    localStorage.setItem('coastFireCalculatorData', JSON.stringify(data));
}

// Load Saved Data
function loadSavedData() {
    const savedData = localStorage.getItem('coastFireCalculatorData');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            document.getElementById('currency').value = data.currency || 'USD';
            document.getElementById('current-age').value = data.currentAge || '30';
            document.getElementById('retirement-age').value = data.retirementAge || '65';
            document.getElementById('current-savings').value = data.currentSavings || '50000';
            document.getElementById('monthly-contribution').value = data.monthlyContribution || '1000';
            document.getElementById('annual-expenses').value = data.annualExpenses || '40000';
            document.getElementById('return-rate').value = data.returnRate || '7';
            document.getElementById('inflation-rate').value = data.inflationRate || '3';
            document.getElementById('safe-withdrawal-rate').value = data.safeWithdrawalRate || '4';
            
            currentCurrency = data.currency || 'USD';
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Analytics tracking (placeholder - replace with your Google Analytics)
function trackEvent(eventName, eventParams) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, eventParams);
    }
}

// Track calculation
if (calculateBtn) {
    calculateBtn.addEventListener('click', function() {
        trackEvent('calculate_coast_fire', {
            event_category: 'calculator',
            event_label: 'coast_fire_calculation'
        });
    });
}
