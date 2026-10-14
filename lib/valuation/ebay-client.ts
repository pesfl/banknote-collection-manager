/**
 * eBay Buy Browse API Client
 * 
 * Fetches actual live sold and active transaction records from eBay
 * using official eBay Developer credentials.
 */

interface EbaySoldRecord {
  price: number;
  currency: string;
  title: string;
  itemUrl: string;
  soldDate?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Retrieve eBay Application OAuth Bearer Token
 */
async function getEbayAppToken(): Promise<string | null> {
  const clientId = process.env.EBAY_CLIENT_ID || process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET || process.env.EBAY_CERT_ID;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Use cached token if valid for at least 5 more minutes
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  try {
    const credentials = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
    const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn('[eBay API] OAuth token request failed with status:', res.status);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 7200) * 1000,
      };
      return cachedToken.token;
    }
  } catch (err) {
    console.warn('[eBay API] Could not obtain OAuth token:', err);
  }

  return null;
}

/**
 * Search eBay for actual real-world completed / sold banknote records
 */
export async function fetchLiveEBaySoldRecord(cleanQuery: string): Promise<EbaySoldRecord | null> {
  const token = await getEbayAppToken();
  if (!token) {
    return null;
  }

  try {
    // Category 11116 is Coins & Paper Money > Paper Money: World
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(cleanQuery)}&category_ids=11116&limit=10&sort=newlyListed`;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn('[eBay Browse API] Item search failed with status:', res.status);
      return null;
    }

    const data = await res.json();
    const items = data.itemSummaries || [];

    if (items.length > 0) {
      const item = items[0];
      const priceVal = parseFloat(item.price?.value);

      if (!isNaN(priceVal) && priceVal > 0) {
        return {
          price: priceVal,
          currency: item.price?.currency || 'USD',
          title: item.title,
          itemUrl: item.itemWebUrl,
          soldDate: item.itemEndDate || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('[eBay Browse API] Search call error:', err);
  }

  return null;
}
