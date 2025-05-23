import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { currencyConverter, getSupportedCurrencies, localCurrencyConverter } from "./api/postApi";
// Use symbol instead of icon
// import { FaExchangeAlt } from "react-icons/fa";
import "./App.css";

const App = () => {
  // States for storing values
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [conversionHistory, setConversionHistory] = useState([]);
  const [useLocalMode, setUseLocalMode] = useState(false);

  // Query to get list of currencies
  const {
    data: currencies = ["USD", "EUR", "GEL", "GBP", "AUD"], // Default values
    isLoading: loadingCurrencies
  } = useQuery({
    queryKey: ["currencies"],
    queryFn: getSupportedCurrencies,
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours
    onError: (error) => {
      console.error("Failed to fetch currencies:", error);
      // Don't automatically switch to local mode for this error
    }
  });

  // Query for currency conversion
  const {
    data: conversionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["currency", fromCurrency, toCurrency, amount, useLocalMode],
    queryFn: () => {
      // If local mode is active or there was an error in the previous request
      if (useLocalMode) {
        return localCurrencyConverter(fromCurrency, toCurrency, Number(amount) || 0);
      }
      return currencyConverter(fromCurrency, toCurrency, Number(amount) || 0);
    },
    enabled: false, // Request does not run automatically
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Retry the request only once
    onError: (error) => {
      console.error("Conversion error:", error);
      // Automatically switch to local mode on API error
      setUseLocalMode(true);
    }
  });

  // Handler for conversion
  const handleCurrencyConverter = () => {
    if (amount !== "" && Number(amount) > 0) {
      refetch();
    }
  };

  // Add to history after successful conversion
  useEffect(() => {
    if (conversionData && amount) {
      const historyItem = {
        id: Date.now(),
        amount,
        fromCurrency,
        toCurrency,
        result: conversionData.result,
        date: new Date().toLocaleString()
      };
      
      // Add to the beginning of the array and limit to 5 entries
      setConversionHistory(prev => [historyItem, ...prev].slice(0, 5));
    }
  }, [conversionData]);

  // Function to swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Handler for amount change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Accept only digits and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <section className="currency-converter">
      <div className="currency-div">
        <h1>Currency Converter</h1>
        <p className="subtitle">Fast and reliable currency conversion</p>
        <hr />

        {/* Amount input */}
        <div className="amount-input">
          <label>
            Amount:
            <input
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
            />
          </label>
        </div>

        {/* Currency selection */}
        <section className="currency-selector">
          <div className="selector-container">
            <label>
              From:
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                disabled={loadingCurrencies}
              >
                {currencies.map((currency) => (
                  <option key={`from-${currency}`} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>

            {/* Currency swap button */}
            <button 
              className="swap-btn" 
              onClick={swapCurrencies}
              aria-label="Swap currencies"
              title="Swap currencies"
            >
              ⇄
            </button>

            <label>
              To:
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                disabled={loadingCurrencies}
              >
                {currencies.map((currency) => (
                  <option key={`to-${currency}`} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Conversion button */}
        <button
          className="convert-btn"
          disabled={isLoading || amount === "" || Number(amount) <= 0}
          onClick={handleCurrencyConverter}
        >
          {isLoading ? "Converting..." : "Convert"}
        </button>

        {/* Error display */}
        {error && (
          <div className="error-message">
            <p>{error.message}</p>
            <button 
              className="local-mode-btn" 
              onClick={() => setUseLocalMode(true)}
            >
              Try Offline Mode
            </button>
          </div>
        )}

        {/* Local mode notification */}
        {useLocalMode && (
          <div className="local-mode-notice">
            <p>Running in offline mode with approximate rates.</p>
            <button 
              className="try-api-btn" 
              onClick={() => {
                setUseLocalMode(false);
                refetch();
              }}
            >
              Try Online API
            </button>
          </div>
        )}

        {/* Conversion result */}
        {conversionData && (
          <div className="result-container">
            <h2 className="result">
              {amount} {fromCurrency} = {conversionData.result.toFixed(2)} {toCurrency}
            </h2>
            <p className="rate-info">
              1 {fromCurrency} = {conversionData.rate} {toCurrency}
              <span className="update-time">Last updated: {conversionData.lastUpdate}</span>
            </p>
          </div>
        )}

        {/* Conversion history */}
        {conversionHistory.length > 0 && (
          <div className="history-container">
            <h3>Recent Conversions</h3>
            <ul className="history-list">
              {conversionHistory.map((item) => (
                <li key={item.id} className="history-item">
                  <span>{item.amount} {item.fromCurrency} → {item.result.toFixed(2)} {item.toCurrency}</span>
                  <span className="history-date">{item.date}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default App;