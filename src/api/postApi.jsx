import axios from "axios";

// Create an axios instance with base URL for the currency exchange API
const API_KEY = "0c00336606e1a47d47f1f115";
const api = axios.create({
  baseURL: `https://v6.exchangerate-api.com/v6/${API_KEY}`,
  timeout: 10000, // Add timeout for requests
});

// Get list of available currencies
export const getSupportedCurrencies = async () => {
  try {
    const res = await api.get("/latest/USD");
    return Object.keys(res.data.conversion_rates);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    // Return array with main currencies in case of error
    return ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "GEL"];
  }
};

// Currency conversion function
export const currencyConverter = async (fromCurrency, toCurrency, amount) => {
  try {
    if (!amount || amount <= 0) {
      return { result: 0, rate: 0, lastUpdate: new Date().toLocaleDateString() };
    }
    
    // Use endpoint to get exchange rates
    const res = await api.get(`/latest/${fromCurrency}`);
    
    if (res.data && res.data.conversion_rates) {
      const rate = res.data.conversion_rates[toCurrency];
      const result = amount * rate;
      
      return {
        result,
        rate,
        lastUpdate: new Date(res.data.time_last_update_unix * 1000).toLocaleDateString()
      };
    } else {
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    console.error("Conversion error:", error);
    
    // Check error type and provide more informative message
    if (error.response) {
      // Server responded with a non-2xx status code
      if (error.response.status === 404) {
        throw new Error("Currency not found. Please check currency codes.");
      } else if (error.response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      } else if (error.response.status >= 500) {
        throw new Error("Server error. The currency service is currently unavailable.");
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error("No response from server. Check your internet connection.");
    }
    
    // General error
    throw new Error("Failed to convert currency. Please try again later.");
  }
};

// Local function for testing without API
export const localCurrencyConverter = (fromCurrency, toCurrency, amount) => {
  // Fixed rates for testing
  const mockRates = {
    USD: { EUR: 0.92, GBP: 0.79, JPY: 149.82, GEL: 2.65, AUD: 1.52 },
    EUR: { USD: 1.09, GBP: 0.86, JPY: 162.85, GEL: 2.88, AUD: 1.65 },
    GBP: { USD: 1.27, EUR: 1.16, JPY: 189.36, GEL: 3.35, AUD: 1.92 },
    JPY: { USD: 0.0067, EUR: 0.0061, GBP: 0.0053, GEL: 0.018, AUD: 0.010 },
    GEL: { USD: 0.38, EUR: 0.35, GBP: 0.30, JPY: 56.54, AUD: 0.57 },
    AUD: { USD: 0.66, EUR: 0.61, GBP: 0.52, JPY: 98.57, GEL: 1.75 }
  };
  
  // Check if there's a rate for this currency pair
  if (mockRates[fromCurrency] && mockRates[fromCurrency][toCurrency]) {
    const rate = mockRates[fromCurrency][toCurrency];
    return {
      result: amount * rate,
      rate: rate,
      lastUpdate: new Date().toLocaleDateString()
    };
  } else {
    // If no direct rate, use USD as intermediate currency
    const usdRate = fromCurrency === 'USD' ? 1 : (mockRates[fromCurrency]?.USD || 1);
    const targetRate = toCurrency === 'USD' ? 1 : (mockRates['USD']?.[toCurrency] || 1);
    const rate = usdRate * targetRate;
    
    return {
      result: amount * rate,
      rate: rate,
      lastUpdate: new Date().toLocaleDateString()
    };
  }
};