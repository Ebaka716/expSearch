document.addEventListener('DOMContentLoaded', () => {
    console.log("Results page JS loaded.");

    // Confidence Controls
    const confidenceSlider = document.getElementById('confidenceSlider');
    const confidenceValue = document.getElementById('confidenceValue');
    // const confidenceDisplay = document.getElementById('confidenceDisplay'); // Removed reference as element might be gone
    const wireframeToggleBtn = document.getElementById('wireframeToggleBtn');
    const answerSection = document.getElementById('answerSection');
    const wayfindSection = document.getElementById('wayfindSection');
    const conversationSection = document.getElementById('conversationSection');
    const resultsContainer = document.querySelector('.results-container');
    const defaultAnswerContent = document.getElementById('defaultAnswerContent'); // Keep reference
    const stockDetails = document.getElementById('stockDetails'); // Keep reference

    // DOM Elements for Search (Assuming results page IDs)
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    const followUpInput = document.getElementById('followUpInput');
    const askFollowUpBtn = document.getElementById('askFollowUpBtn');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');

    // Sample data for typeahead suggestions
    const financialTerms = [
        "Stocks", "Bonds", "Mutual Funds", "ETFs", "High-Yield Savings Account",
        "Checking Account", "Credit Card", "Mortgage", "Loan", "Refinance",
        "Retirement Planning", "401(k)", "IRA", "Roth IRA", "Investment Strategy",
        "Portfolio Management", "Financial Advisor", "Insurance", "Life Insurance",
        "Health Insurance", "Auto Insurance", "Home Insurance", "Cryptocurrency",
        "Bitcoin", "Ethereum", "NFTs", "Taxes", "Tax Filing", "Credit Score"
    ];

    // Sample Stock Ticker Data
    const ALPHA_VANTAGE_API_KEY = 'V561V3LBOADMWJ4S'; // Alpha Vantage API key
    const stockTickers = [
        { symbol: "AAPL", name: "Apple Inc." },
        { symbol: "GOOGL", name: "Alphabet Inc." },
        { symbol: "MSFT", name: "Microsoft Corp." },
        { symbol: "AMZN", name: "Amazon.com, Inc." },
        { symbol: "TSLA", name: "Tesla, Inc." }
    ];

    const savingsRatesData = {
        'High-Yield Savings': [
            [Date.UTC(2023, 0), 4.25], [Date.UTC(2023, 1), 4.30], [Date.UTC(2023, 2), 4.35],
            [Date.UTC(2023, 3), 4.40], [Date.UTC(2023, 4), 4.45], [Date.UTC(2023, 5), 4.50],
            [Date.UTC(2023, 6), 4.55], [Date.UTC(2023, 7), 4.60], [Date.UTC(2023, 8), 4.65],
            [Date.UTC(2023, 9), 4.70], [Date.UTC(2023, 10), 4.75], [Date.UTC(2023, 11), 4.80]
        ],
        'Money Market': [
            [Date.UTC(2023, 0), 3.75], [Date.UTC(2023, 1), 3.80], [Date.UTC(2023, 2), 3.85],
            [Date.UTC(2023, 3), 3.90], [Date.UTC(2023, 4), 3.95], [Date.UTC(2023, 5), 4.00],
            [Date.UTC(2023, 6), 4.05], [Date.UTC(2023, 7), 4.10], [Date.UTC(2023, 8), 4.15],
            [Date.UTC(2023, 9), 4.20], [Date.UTC(2023, 10), 4.25], [Date.UTC(2023, 11), 4.30]
        ],
        'CD (12-month)': [
            [Date.UTC(2023, 0), 4.50], [Date.UTC(2023, 1), 4.55], [Date.UTC(2023, 2), 4.60],
            [Date.UTC(2023, 3), 4.65], [Date.UTC(2023, 4), 4.70], [Date.UTC(2023, 5), 4.75],
            [Date.UTC(2023, 6), 4.80], [Date.UTC(2023, 7), 4.85], [Date.UTC(2023, 8), 4.90],
            [Date.UTC(2023, 9), 4.95], [Date.UTC(2023, 10), 5.00], [Date.UTC(2023, 11), 5.05]
        ]
    };

    let activeSuggestionIndex = -1;
    let currentQuery = ''; // Keep track of the current query

    // --- Auto-Search from URL Parameter ---
    const checkUrlForQuery = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('query');
        if (query) {
            const decodedQuery = decodeURIComponent(query); // Decode query from URL
            console.log(`Query found in URL: ${decodedQuery}`);
            searchInput.value = decodedQuery; // Set the search input value
            performSearch(decodedQuery); // Perform the search automatically
        } else {
            console.log("No query found in URL.");
            showDefaultAnswerContent(); // Show default on initial load
            updateConfidenceLayout(); // Update layout based on default confidence
        }
    };

     // --- Helper functions to show/hide answer content ---
     const showDefaultAnswerContent = () => {
        if (defaultAnswerContent) defaultAnswerContent.style.display = 'block';
        if (stockDetails) stockDetails.style.display = 'none';
        const answerTitle = document.getElementById('stockSymbol'); // The main H5 title
        if (answerTitle) answerTitle.textContent = 'Answer'; // Reset title
         // Reset confidence badge based on slider value
         const confidenceBadge = document.querySelector('.confidence-badge');
         if (confidenceBadge) {
             updateConfidenceLayout(); // This function handles the badge text based on slider
         }
        console.log("Showing default answer content.");
    };

    const showStockDetailsContent = () => {
        if (defaultAnswerContent) defaultAnswerContent.style.display = 'none';
        if (stockDetails) stockDetails.style.display = 'block';
        const answerTitle = document.getElementById('stockSymbol'); // The main H5 title
        if (answerTitle) answerTitle.textContent = 'Answer'; // Keep title generic
        // Set confidence badge to 'Live Data'
         const confidenceBadge = document.querySelector('.confidence-badge');
         if (confidenceBadge) {
             confidenceBadge.textContent = 'Live Data';
             confidenceBadge.style.backgroundColor = 'var(--primary-color)'; // Ensure correct color
             confidenceBadge.style.opacity = '1';
             confidenceBadge.style.transform = 'translateY(0)';
         }
        console.log("Showing stock details content.");
    };

    // Initialize confidence slider and wireframe toggle
    const initControls = () => {
        if (confidenceSlider) {
            confidenceSlider.addEventListener('input', updateConfidenceLayout);
            console.log('Confidence controls initialized');
        } else {
            console.warn("Confidence slider not found.");
        }
        if (wireframeToggleBtn) {
            wireframeToggleBtn.addEventListener('click', toggleWireframeMode);
            console.log('Wireframe toggle initialized');
        } else {
             console.warn("Wireframe toggle button not found.");
        }
    };

    // Update layout based on confidence score
    const updateConfidenceLayout = () => {
        // Ensure elements exist before proceeding
        if (!confidenceSlider || !confidenceValue || !resultsContainer || !answerSection || !wayfindSection || !conversationSection) {
             console.warn("Confidence/layout elements missing, cannot update layout.");
             return;
         }

        const confidence = parseInt(confidenceSlider.value);
        confidenceValue.textContent = confidence;
        // console.log(`Updating layout with confidence: ${confidence}`); // Less verbose logging

        resultsContainer.classList.remove('template-one', 'template-two', 'template-three');
        answerSection.classList.remove('low-confidence', 'medium-confidence', 'high-confidence');

        // Apply template based on confidence level
        if (confidence < 30) {
            resultsContainer.classList.add('template-one'); // Wayfind + Convo
            answerSection.classList.add('low-confidence');
            // Ensure correct sections are displayed for template one
            answerSection.style.display = 'none';
            wayfindSection.style.display = 'block';
            // console.log('Applied template-one (low confidence)');
        } else if (confidence >= 30 && confidence < 70) {
            resultsContainer.classList.add('template-two'); // Answer + Wayfind + Convo
            answerSection.classList.add('medium-confidence');
             // Ensure correct sections are displayed for template two
            answerSection.style.display = 'block';
            wayfindSection.style.display = 'block';
            // console.log('Applied template-two (medium confidence)');
        } else {
            resultsContainer.classList.add('template-three'); // Answer + Convo
            answerSection.classList.add('high-confidence');
            // Ensure correct sections are displayed for template three
            answerSection.style.display = 'block';
            wayfindSection.style.display = 'none'; // Hide wayfind in high confidence
            // console.log('Applied template-three (high confidence)');
        }

        // Update confidence badge text only if NOT showing stock details ('Live Data')
        const confidenceBadge = answerSection.querySelector('.confidence-badge');
        if (confidenceBadge && !(stockDetails && stockDetails.style.display === 'block')) {
            if (confidence < 30) {
                confidenceBadge.textContent = 'Low Confidence';
                confidenceBadge.style.backgroundColor = '#f59e0b'; // Orange
            } else if (confidence >= 30 && confidence < 70) {
                confidenceBadge.textContent = 'Medium Confidence';
                confidenceBadge.style.backgroundColor = '#f59e0b'; // Orange
            } else {
                confidenceBadge.textContent = 'High Confidence';
                confidenceBadge.style.backgroundColor = 'var(--primary-color)'; // Green
            }
        }
    };

    // Initialize main search functionality (Listeners for results page)
    const initSearch = () => {
        if (searchButton) {
            searchButton.addEventListener('click', () => performSearch(searchInput.value));
        } else {
             console.warn("Search button not found.");
        }
        if (searchInput) {
            searchInput.addEventListener('input', handleInput); // Use input for suggestions
            searchInput.addEventListener('keyup', handleSearchKeyup); // Use keyup for Enter/Arrows
        } else {
             console.warn("Search input not found.");
        }
        if (suggestionBtns && suggestionBtns.length > 0) {
             suggestionBtns.forEach(btn => btn.addEventListener('click', handleFollowUpSuggestionClick));
        } else {
             console.warn("Follow-up suggestion buttons not found.");
        }
        if (askFollowUpBtn) {
            askFollowUpBtn.addEventListener('click', handleAskFollowUp);
        } else {
             console.warn("Ask follow-up button not found.");
        }
        if (followUpInput) {
            followUpInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleAskFollowUp(); });
        } else {
             console.warn("Follow-up input not found.");
        }
        document.addEventListener('click', handleDocumentClick); // Close suggestions on outside click
        console.log('Search functionality initialized for results page');
    };

    // --- Search & Typeahead Logic ---
    const handleSearchKeyup = (e) => {
        // console.log(`[handleSearchKeyup] Key: ${e.key}`);
        if (e.key === 'Enter') {
            const selectedSuggestionItem = suggestionsContainer.querySelector('.active');
            if (selectedSuggestionItem) {
                selectedSuggestionItem.click(); // Trigger click logic (performSearch/updateStockDetails)
            } else {
                performSearch(searchInput.value); // Search with input value if no suggestion selected
            }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
             e.preventDefault(); // Prevent cursor jump
            handleSuggestionNavigation(e.key);
        } else if (e.key === 'Escape') {
            clearSuggestions();
        }
        // 'input' event handles suggestion generation
    };

    // Basic typeahead input handler
    const handleInput = () => {
        const query = searchInput.value.trim();
        // console.log(`[handleInput] Query: \"${query}\"`);

        if (query.length === 0) {
            clearSuggestions();
            return;
        }

        const upperCaseQuery = query.toUpperCase();
        let matchedTickers = [];
        // Suggest tickers only if query looks like a ticker (e.g., 1-5 uppercase letters)
        if (/^[A-Z]{1,5}$/.test(upperCaseQuery)) {
            matchedTickers = stockTickers.filter(stock => stock.symbol.startsWith(upperCaseQuery))
                                       .map(stock => ({ ...stock, isTicker: true }));
        }

        const lowerCaseQuery = query.toLowerCase();
        const filteredTerms = financialTerms.filter(term =>
            term.toLowerCase().includes(lowerCaseQuery)
        ).map(term => ({ text: term, isTerm: true }));

        // Personalized suggestions (example, could be enabled)
        let personalizedSuggestion = null;
        if (lowerCaseQuery.length >= 3) { 
            const placeholderBalance = (Math.random() * 5000 + 100).toFixed(2);
            personalizedSuggestion = {
                text: `Check ${lowerCaseQuery} Account Balance`.replace(new RegExp(`(${lowerCaseQuery})`, 'gi'), '<mark>$1</mark>'),
                details: `$${placeholderBalance}`,
                isPersonal: true
            };
        }

        // console.log(`[handleInput] Matched Tickers:`, matchedTickers);
        // console.log(`[handleInput] Filtered Terms:`, filteredTerms);
        // console.log(`[handleInput] Personalized Suggestion:`, personalizedSuggestion);

        displaySuggestions(filteredTerms, lowerCaseQuery, personalizedSuggestion, matchedTickers);
    };

    // Display typeahead suggestions
    const displaySuggestions = async (terms, query, personalizedSuggestion = null, tickers = []) => {
        // console.log('[displaySuggestions] Called with:', { termsCount: terms.length, query, personalizedSuggestion: !!personalizedSuggestion, tickersCount: tickers.length });
        if (!suggestionsContainer) {
            console.error("Suggestions container is missing!");
            return;
        }
        suggestionsContainer.innerHTML = '';
        activeSuggestionIndex = -1;

        // Order: Tickers, Personalized, Terms
        for (const ticker of tickers) {
            const tickerItem = await createTickerSuggestionItem(ticker, query);
            suggestionsContainer.appendChild(tickerItem);
        }

        if (personalizedSuggestion) {
            const personalItem = createPersonalSuggestionItem(personalizedSuggestion, query);
            suggestionsContainer.appendChild(personalItem);
        }

        const tickerNamesLower = tickers.map(t => t.name.toLowerCase());
        const termSuggestions = terms
            .filter(suggestion => suggestion.isTerm && !tickerNamesLower.includes(suggestion.text.toLowerCase()))
            .map(suggestion => ({ text: suggestion.text, isTerm: true }));

        const maxSuggestions = 7;
        const suggestionsToShow = maxSuggestions - suggestionsContainer.children.length;


        termSuggestions.slice(0, suggestionsToShow).forEach(suggestion => {
            const termItem = createTermSuggestionItem(suggestion.text, query);
            suggestionsContainer.appendChild(termItem);
        });

        if (suggestionsContainer.children.length === 0) {
            suggestionsContainer.style.display = 'none';
            // console.log('[displaySuggestions] No suggestions generated, hiding container.');
            return;
        }

        suggestionsContainer.style.display = 'block';
        // console.log(`[displaySuggestions] Displaying ${suggestionsContainer.children.length} suggestions.`);
    };

    // --- Suggestion Item Creation Helpers ---
    const createTickerSuggestionItem = async (ticker, query) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item-ticker');

        const icon = document.createElement('i');
        icon.className = 'fas fa-chart-line';
        item.appendChild(icon);

        const infoWrapper = document.createElement('div');
        infoWrapper.classList.add('ticker-info-wrapper');
        const symbolSpan = document.createElement('span');
        symbolSpan.classList.add('ticker-symbol');
        symbolSpan.textContent = ticker.symbol;
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('ticker-name');
        nameSpan.textContent = ticker.name;
        infoWrapper.appendChild(symbolSpan);
        infoWrapper.appendChild(nameSpan);
        item.appendChild(infoWrapper);

        const financialsWrapper = document.createElement('div');
        financialsWrapper.classList.add('ticker-financials');
        const priceSpan = document.createElement('span');
        priceSpan.classList.add('ticker-price');
        priceSpan.textContent = 'Loading...';
        const changeSpan = document.createElement('span');
        changeSpan.classList.add('ticker-change');
        changeSpan.textContent = 'Loading...';
        financialsWrapper.appendChild(priceSpan);
        financialsWrapper.appendChild(changeSpan);
        item.appendChild(financialsWrapper);

        // Fetch live data for the suggestion
        const liveData = await fetchLiveStockData(ticker.symbol);
        if (liveData) {
            priceSpan.textContent = `$${liveData.price.toFixed(2)}`;
            changeSpan.textContent = liveData.change;
            changeSpan.className = 'ticker-change ' + (liveData.change.startsWith('+') ? 'positive' : 'negative');
        } else {
            priceSpan.textContent = 'N/A';
            changeSpan.textContent = 'N/A';
            changeSpan.className = 'ticker-change';
        }

        item.addEventListener('click', () => {
            // console.log(`Clicked on ticker: ${ticker.symbol}`);
            searchInput.value = ticker.symbol;
            clearSuggestions();
            updateStockDetails(ticker.symbol, ticker.name); // Action on results page
        });
        return item;
    };

     const createPersonalSuggestionItem = (suggestion, query) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item-personal');

        const icon = document.createElement('i');
        icon.className = 'fas fa-user';
        item.appendChild(icon);

        const contentWrapper = document.createElement('div');
        contentWrapper.classList.add('personal-content-wrapper');

        const textSpan = document.createElement('span');
        textSpan.classList.add('personal-text');
        const suggestionText = suggestion.text.replace(/<mark>|<\/mark>/gi, '');
        const startIndex = suggestionText.toLowerCase().indexOf(query.toLowerCase());
        if (startIndex !== -1 && query.length > 0) {
            const before = suggestionText.substring(0, startIndex);
            const match = suggestionText.substring(startIndex, startIndex + query.length);
            const after = suggestionText.substring(startIndex + query.length);
            if (before) textSpan.appendChild(document.createTextNode(before));
            const markElement = document.createElement('mark');
            markElement.textContent = match;
            textSpan.appendChild(markElement);
            if (after) textSpan.appendChild(document.createTextNode(after));
        } else {
            textSpan.textContent = suggestionText;
        }
        contentWrapper.appendChild(textSpan);
        item.appendChild(contentWrapper);

        const detailsSpan = document.createElement('span');
        detailsSpan.classList.add('personal-details');
        detailsSpan.textContent = suggestion.details;
        item.appendChild(detailsSpan);

        item.addEventListener('click', () => {
            const mainText = textSpan.textContent.trim();
            searchInput.value = mainText;
            clearSuggestions();
            performSearch(mainText); // Action on results page
        });
        return item;
    };

    const createTermSuggestionItem = (term, query) => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');

        const icon = document.createElement('i');
        icon.className = 'fas fa-search';
        item.appendChild(icon);

        const textWrapper = document.createElement('span');
        textWrapper.classList.add('suggestion-text-wrapper');

        const startIndex = term.toLowerCase().indexOf(query.toLowerCase());
        if (startIndex !== -1 && query.length > 0) {
            const before = term.substring(0, startIndex);
            const match = term.substring(startIndex, startIndex + query.length);
            const after = term.substring(startIndex + query.length);

            if (before) textWrapper.appendChild(document.createTextNode(before));
            const markElement = document.createElement('mark');
            markElement.textContent = match;
            textWrapper.appendChild(markElement);
            if (after) textWrapper.appendChild(document.createTextNode(after));
        } else {
            textWrapper.appendChild(document.createTextNode(term));
        }
        item.appendChild(textWrapper);

        item.addEventListener('click', () => {
            searchInput.value = term;
            clearSuggestions();
            performSearch(term); // Action on results page
        });
        return item;
    };

    // --- Navigation & Utility ---
    const handleSuggestionNavigation = (key) => {
        if (!suggestionsContainer) return;
        const items = suggestionsContainer.querySelectorAll('.suggestion-item, .suggestion-item-personal, .suggestion-item-ticker');
        if (items.length === 0) return;

        items[activeSuggestionIndex]?.classList.remove('active');

        if (key === 'ArrowDown') activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        else if (key === 'ArrowUp') activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;

        const activeItem = items[activeSuggestionIndex];
        if (activeItem) {
            activeItem.classList.add('active');
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    };

    const clearSuggestions = () => {
        if (suggestionsContainer) {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'none';
        }
        activeSuggestionIndex = -1;
    };

    const handleDocumentClick = (e) => {
        if (searchInput && suggestionsContainer && !searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            clearSuggestions();
        }
    };

    // --- Core Search Execution ---
    const performSearch = (query) => {
        console.log(`Performing search for: ${query}`);
         const trimmedQuery = query.trim(); // Trim whitespace
        if (!trimmedQuery) { // Check if empty after trimming
            console.log('Search query is empty. Showing default content.');
            showDefaultAnswerContent();
            updateConfidenceLayout();
             searchInput.value = ''; // Clear input visually
            return;
        }

        currentQuery = trimmedQuery; // Store trimmed query
        clearSuggestions();
        searchInput.value = currentQuery; // Update input to show trimmed query

        const upperCaseQuery = currentQuery.toUpperCase();
        const ticker = stockTickers.find(t => t.symbol === upperCaseQuery);
        if (ticker) {
            console.log(`Query is a stock ticker: ${ticker.symbol}`);
            updateStockDetails(ticker.symbol, ticker.name);
        } else {
            console.log(`Updating content for regular query: ${currentQuery}`);
            updateAnswerContent(currentQuery);
        }

        updateConfidenceLayout(); // Update layout based on new content/confidence
    };

    // --- Conversation Logic ---
    const handleFollowUpSuggestionClick = (event) => {
         if (!followUpInput) return;
        const btn = event.currentTarget;
        const queryText = btn.textContent;
        followUpInput.value = queryText;
        handleAskFollowUp();
    };

    const handleAskFollowUp = () => {
        if (!followUpInput) return;
        const query = followUpInput.value.trim();
        if (query) {
            console.log(`Asked follow-up: ${query}`);
            const historyContainer = document.querySelector('.conversation-history');
            if (historyContainer) {
                const queryElement = document.createElement('div');
                queryElement.className = 'conversation-query user-query';
                queryElement.innerHTML = `<span class="query-text">${query}</span>`;
                historyContainer.appendChild(queryElement);
                historyContainer.scrollTop = historyContainer.scrollHeight;
            }

            followUpInput.value = '';

            // Simulate response & confidence increase
            setTimeout(() => {
                if (historyContainer) {
                    const responseElement = document.createElement('div');
                    responseElement.className = 'conversation-query system-response';
                    responseElement.innerHTML = `<span class="query-icon"><i class="fas fa-robot"></i></span><span class="query-text">Okay, looking into '${query}'...</span>`;
                    historyContainer.appendChild(responseElement);
                    historyContainer.scrollTop = historyContainer.scrollHeight;
                }

                if (confidenceSlider) {
                    confidenceSlider.value = Math.min(95, parseInt(confidenceSlider.value) + 15);
                    updateConfidenceLayout();
                }
           }, 700);
        }
    };

    // --- Content Updates ---
    const updateAnswerContent = (query) => {
        console.log('Update Answer Content called with query:', query);
        showDefaultAnswerContent(); // Ensure default area is visible, stock area hidden

        const titleElement = document.getElementById('stockSymbol'); // The main H5 'Answer' title
        if (!defaultAnswerContent) {
            console.error("Default answer content container not found.");
            return;
        }
        const basicAnswer = defaultAnswerContent.querySelector('.basic-answer');
        const expandedAnswer = defaultAnswerContent.querySelector('.expanded-answer');
        const detailedAnswer = defaultAnswerContent.querySelector('.detailed-answer');
        const savingsChartContainer = document.getElementById('savingsRatesChart'); // Find chart container within default

        if (!titleElement || !basicAnswer || !expandedAnswer || !detailedAnswer || !savingsChartContainer) {
            console.error('Missing required elements within default answer content:', { titleElement, basicAnswer, expandedAnswer, detailedAnswer, savingsChartContainer });
            return;
        }

        // Keep title generic 'Answer'
        titleElement.textContent = 'Answer';

        // Default HYSA text (used if no other match)
        const defaultBasic = 'A high-yield savings account is a type of deposit account that pays a higher interest rate than a standard savings account.';
        const defaultExpanded = 'These accounts typically offer 10-25 times the national average of a standard savings account interest rate, allowing your money to grow faster while remaining liquid and FDIC-insured.';
        const defaultDetailed = 'Most high-yield savings accounts are offered by online banks, which can offer higher rates due to their lower overhead costs compared to traditional brick-and-mortar banks. Interest is typically compounded daily and paid monthly. While rates can fluctuate based on the Federal Reserve\'s decisions, they generally remain higher than standard savings accounts.';

        // Set content based on query
        let basicContent = defaultBasic;
        let expandedContent = defaultExpanded;
        let detailedContent = defaultDetailed;
        let showChart = false;

        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('compare') && lowerQuery.includes('rate')) {
            console.log('Detected compare rates query');
            basicContent = 'Below is a comparison of interest rates for different types of savings accounts over the past 12 months.';
            expandedContent = 'High-yield savings accounts typically offer the best rates for liquid savings, while CDs offer higher rates in exchange for locking up your money for a specific term. Money market accounts provide a middle ground with competitive rates and check-writing capabilities.';
            detailedContent = 'Rates shown are national averages and may vary by institution. Consider your savings goals, time horizon, and need for liquidity when choosing the right account type.';
            showChart = true;
        } else if (lowerQuery.includes('invest') || lowerQuery.includes('stock')) {
            basicContent = 'Stocks are shares of ownership in a company that are bought and sold on stock exchanges.';
            expandedContent = 'When you buy a stock, you are purchasing a small piece of the company, making you a shareholder. The value of stocks can rise and fall based on company performance and market conditions.';
            detailedContent = 'Stock prices are determined by supply and demand in the market. Factors affecting stock prices include company performance, industry trends, economic indicators, and investor sentiment. Stocks can provide returns through price appreciation and dividends, which are distributions of company profits to shareholders.';
        } else if (lowerQuery.includes('crypto') || lowerQuery.includes('bitcoin')) {
            basicContent = 'Cryptocurrency is a digital or virtual currency that uses cryptography for security and operates on decentralized networks.';
            expandedContent = 'Unlike traditional currencies issued by governments (fiat currencies), cryptocurrencies typically operate on decentralized systems called blockchains, which are distributed ledgers enforced by a network of computers.';
            detailedContent = 'Bitcoin, created in 2009, was the first cryptocurrency. Since then, thousands of alternative cryptocurrencies have been created. These are frequently called altcoins, as a blend of bitcoin alternative. Cryptocurrencies face criticism for their use in illegal transactions, volatility, price bubbles, and environmental impacts of mining.';
        } else if (lowerQuery.includes('loan') || lowerQuery.includes('mortgage')) {
            basicContent = 'A mortgage is a loan used to purchase real estate where the property serves as collateral.';
            expandedContent = 'Mortgages allow individuals to buy homes without paying the entire value upfront. The borrower repays the loan plus interest over a set period, typically 15 to 30 years.';
            detailedContent = 'There are several types of mortgages, including fixed-rate mortgages where the interest rate remains the same throughout the loan term, and adjustable-rate mortgages (ARMs) where the interest rate changes periodically based on market conditions. Factors affecting mortgage approval include credit score, income, debt-to-income ratio, and down payment amount.';
        } else if (query && query.trim().length > 0 && lowerQuery !== 'high-yield savings account') {
            // Generic query fallback
            basicContent = `Here is some general information regarding "${query}".`;
            expandedContent = `More details can be found by exploring related links or asking follow-up questions.`;
            detailedContent = `This section provides a starting point for understanding "${query}".`;
        }
        // If query IS 'high-yield savings account' or empty, the defaults remain.

        // Update the DOM
        basicAnswer.textContent = basicContent;
        expandedAnswer.textContent = expandedContent;
        detailedAnswer.textContent = detailedContent;

        // Handle chart visibility
        if (showChart) {
            savingsChartContainer.style.display = 'block';
            console.log('Attempting to create savings chart');
            setTimeout(() => createSavingsRatesChart(), 100); // Delay slightly
        } else {
            savingsChartContainer.style.display = 'none';
        }
        // Update confidence layout based on showing general answer
         updateConfidenceLayout();
    };

    // --- Stock Details Update ---
    const updateStockDetails = async (symbol, name) => {
        console.log(`Updating stock details for ${symbol} (${name})...`);
        showStockDetailsContent(); // Show stock details area, hide default

        const stockNameElement = document.getElementById('stockName'); // Element to show SYMBOL - Name
        const stockDetailsDiv = document.getElementById('stockDetails');
        if (!stockDetailsDiv || !stockNameElement) {
            console.error("Stock details container or name element not found.");
            return;
        }
        const stockPrice = stockDetailsDiv.querySelector('#stockPrice');
        const stockChange = stockDetailsDiv.querySelector('#stockChange');
        const stockOpen = stockDetailsDiv.querySelector('#stockOpen');
        const stockVolume = stockDetailsDiv.querySelector('#stockVolume');
        const stockHigh = stockDetailsDiv.querySelector('#stockHigh');
        const stockLow = stockDetailsDiv.querySelector('#stockLow');
        const stockChartContainer = stockDetailsDiv.querySelector('#stockChart');

        if (!stockPrice || !stockChange || !stockOpen || !stockVolume || !stockHigh || !stockLow || !stockChartContainer) {
            console.error('One or more required stock metric/chart elements not found');
             stockNameElement.textContent = `${symbol} - ${name}`; // Still show name
             stockPrice.textContent = 'Error loading';
             // Clear others...
            return;
        }

        // Update header - Keep title as 'Answer', put Symbol/Name below
        stockNameElement.textContent = `${symbol} - ${name}`;
        stockNameElement.style.display = 'block';

        // Confidence badge updated to 'Live Data' by showStockDetailsContent()

        // Show loading state
        stockPrice.textContent = 'Loading...';
        stockChange.textContent = 'Loading...';
        stockOpen.textContent = 'Loading...';
        stockVolume.textContent = 'Loading...';
        stockHigh.textContent = 'Loading...';
        stockLow.textContent = 'Loading...';
        stockChartContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Loading chart...</p>';


        // Fetch live data
        const liveData = await fetchLiveStockData(symbol);
        console.log('Received live data:', liveData);

        if (liveData) {
            // Update metrics
            stockPrice.textContent = `$${liveData.price.toFixed(2)}`;
            stockChange.textContent = liveData.change;
            stockChange.className = 'metric-value ' + (liveData.change.startsWith('+') ? 'positive' : 'negative');
            stockOpen.textContent = `$${liveData.open.toFixed(2)}`;
            stockVolume.textContent = liveData.volume.toLocaleString();
            stockHigh.textContent = `$${liveData.high.toFixed(2)}`;
            stockLow.textContent = `$${liveData.low.toFixed(2)}`;
            createStockChart(symbol);
        } else {
            // Show error state
            stockPrice.textContent = 'Data unavailable';
            stockChange.textContent = 'Data unavailable';
            stockOpen.textContent = 'Data unavailable';
            stockVolume.textContent = 'Data unavailable';
            stockHigh.textContent = 'Data unavailable';
            stockLow.textContent = 'Data unavailable';
            stockChange.className = 'metric-value';
            if (stockChartContainer) stockChartContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Chart data unavailable.</p>';
        }
        // Update confidence layout after potential content change
        updateConfidenceLayout();
    };


    // --- Wireframe Mode Toggle Function ---
    const toggleWireframeMode = () => {
        if (!wireframeToggleBtn) return;
        document.body.classList.toggle('wireframe-mode');
        wireframeToggleBtn.classList.toggle('active');
        console.log('Wireframe mode toggled:', document.body.classList.contains('wireframe-mode'));
    };

    // --- Chart Creation Functions ---
    const createSavingsRatesChart = () => {
        if (typeof Highcharts === 'undefined') {
            console.error('Highcharts is not loaded, cannot create savings chart.');
            return;
        }
        const chartContainer = document.getElementById('savingsRatesChart');
        if (!chartContainer) {
             console.error('Savings chart container not found.');
             return;
        }
         try {
             Highcharts.chart('savingsRatesChart', {
                 chart: { type: 'line', backgroundColor: 'transparent', height: 300 },
                 title: { text: 'Historical Savings Rates Comparison', style: { color: 'var(--secondary-color)', fontWeight: '600', fontSize: '1rem' } },
                 subtitle: { text: 'Last 12 Months', style: { color: 'var(--text-light)', fontSize: '0.85rem' } },
                 xAxis: { type: 'datetime', dateTimeLabelFormats: { month: '%b \'%y' }, title: { text: null }, gridLineColor: 'var(--border-color)' },
                 yAxis: { title: { text: 'Interest Rate (%)', style: { color: 'var(--text-color)'} }, labels: { format: '{value}%', style: { color: 'var(--text-color)'} }, gridLineColor: 'var(--border-color)' },
                 tooltip: { shared: true, valueSuffix: '%', valueDecimals: 2, backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'var(--border-color)' },
                 legend: { layout: 'horizontal', align: 'center', verticalAlign: 'bottom', itemStyle: { color: 'var(--text-color)' } },
                 plotOptions: { line: { marker: { enabled: true, radius: 3 } } },
                 series: Object.entries(savingsRatesData).map(([name, data]) => ({
                     name: name,
                     data: data,
                     color: name === 'High-Yield Savings' ? 'var(--primary-color)' :
                            name === 'Money Market' ? '#4299e1' : '#805ad5'
                 })),
                 credits: { enabled: false }
             });
             console.log('Savings chart created successfully');
         } catch (error) {
             console.error('Error creating savings chart:', error);
             if (chartContainer) chartContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Error loading chart.</p>';
         }
    };

    const createStockChart = (symbol) => {
         if (typeof Highcharts === 'undefined') {
            console.error('Highcharts is not loaded, cannot create stock chart.');
            return;
        }
        const chartContainer = document.getElementById('stockChart');
         if (!chartContainer) {
             console.error('Stock chart container not found.');
             return;
         }
         chartContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Loading chart data...</p>';

        fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`)
            .then(response => response.json())
            .then(data => {
                if (data['Time Series (Daily)']) {
                    const timeSeries = data['Time Series (Daily)'];
                    const chartData = Object.entries(timeSeries)
                        .map(([date, values]) => [ new Date(date).getTime(), parseFloat(values['4. close']) ])
                        .reverse();

                     if (chartContainer) {
                         Highcharts.stockChart('stockChart', {
                            chart: { height: 300, backgroundColor: 'transparent' },
                            title: { text: `${symbol} Daily Price`, style: { color: 'var(--secondary-color)', fontWeight: '600', fontSize: '1rem' } },
                            subtitle: { text: 'Last 100 days', style: { color: 'var(--text-light)', fontSize: '0.85rem' } },
                            navigator: { enabled: false },
                            scrollbar: { enabled: false },
                            rangeSelector: { enabled: false },
                            series: [{
                                name: symbol,
                                data: chartData,
                                type: 'line',
                                color: 'var(--primary-color)',
                                tooltip: { valueDecimals: 2, valuePrefix: '$' }
                            }],
                            xAxis: { type: 'datetime', labels: { style: { color: 'var(--text-color)' } }, gridLineColor: 'var(--border-color)' },
                            yAxis: { title: { text: null }, labels: { format: '${value}', style: { color: 'var(--text-color)' } }, gridLineColor: 'var(--border-color)', opposite: false },
                            tooltip: { shared: true, split: false, backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'var(--border-color)' },
                            legend: { enabled: false },
                            credits: { enabled: false }
                        });
                        console.log(`Stock chart created for ${symbol}`);
                     }
                } else {
                     console.warn("No 'Time Series (Daily)' data found for chart.", data);
                     if (chartContainer) chartContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Chart data unavailable.</p>';
                 }
            })
            .catch(error => {
                console.error('Error fetching/creating stock chart:', error);
                if (chartContainer) chartContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-light);">Error loading chart data.</p>';
            });
    };

    // --- Live Data Fetching ---
    const fetchLiveStockData = async (symbol) => {
        try {
            // console.log(`Fetching live data for ${symbol}...`); // Less verbose
            const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
            if (!response.ok) {
                 console.error(`API request failed: ${response.status}`);
                 return null;
            }
            const data = await response.json();
            // console.log('API Response:', data); // Less verbose

             if (data['Note'] && data['Note'].includes('call frequency')) {
                 console.warn('API Rate Limit Reached:', data['Note']);
                 return null;
             }

            if (data['Global Quote'] && Object.keys(data['Global Quote']).length > 0) {
                const quote = data['Global Quote'];
                 if (quote['05. price'] && quote['10. change percent'] && quote['06. volume'] &&
                     quote['02. open'] && quote['03. high'] && quote['04. low']) {
                    const result = {
                        price: parseFloat(quote['05. price']),
                        change: quote['10. change percent'],
                        volume: parseInt(quote['06. volume'], 10),
                        open: parseFloat(quote['02. open']),
                        high: parseFloat(quote['03. high']),
                        low: parseFloat(quote['04. low'])
                    };
                    // console.log('Processed stock data:', result); // Less verbose
                    return result;
                } else {
                    console.warn('Missing fields in Global Quote:', quote);
                    return null;
                }
            } else {
                console.log('No Global Quote data found.');
                return null;
            }
        } catch (error) {
            console.error(`Error fetching live data for ${symbol}:`, error);
            return null;
        }
    };

    // --- Initialize ---
    // These assume the script is running on expSearch.html
    initControls();
    initSearch();
    checkUrlForQuery(); // Check for query param on load

});