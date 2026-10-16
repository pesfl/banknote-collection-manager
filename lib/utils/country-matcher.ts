/**
 * Comprehensive Country Code & Name Matcher
 * Normalizes banknote country metadata to ISO-2 country codes and world map paths.
 */

const COUNTRY_ALIASES: Record<string, string> = {
  // North America
  'united states': 'US',
  'united states of america': 'US',
  'usa': 'US',
  'us': 'US',
  'canada': 'CA',
  'mexico': 'MX',
  'cuba': 'CU',
  'jamaica': 'JM',
  'haiti': 'HT',
  'dominican republic': 'DO',
  'bahamas': 'BS',
  'costa rica': 'CR',
  'panama': 'PA',
  'guatemala': 'GT',
  'honduras': 'HN',
  'el salvador': 'SV',
  'nicaragua': 'NI',

  // South America
  'brazil': 'BR',
  'brasil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'venezuela': 'VE',
  'ecuador': 'EC',
  'bolivia': 'BO',
  'paraguay': 'PY',
  'uruguay': 'UY',
  'guyana': 'GY',
  'suriname': 'SR',

  // Europe
  'united kingdom': 'GB',
  'great britain': 'GB',
  'britain': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'uk': 'GB',
  'germany': 'DE',
  'deutschland': 'DE',
  'france': 'FR',
  'italy': 'IT',
  'italia': 'IT',
  'spain': 'ES',
  'portugal': 'PT',
  'netherlands': 'NL',
  'holland': 'NL',
  'belgium': 'BE',
  'switzerland': 'CH',
  'austria': 'AT',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'ireland': 'IE',
  'poland': 'PL',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'hungary': 'HU',
  'greece': 'GR',
  'romania': 'RO',
  'bulgaria': 'BG',
  'ukraine': 'UA',
  'russia': 'RU',
  'russian federation': 'RU',
  'ussr': 'RU',
  'soviet union': 'RU',
  'croatia': 'HR',
  'serbia': 'RS',
  'slovakia': 'SK',
  'slovenia': 'SI',
  'iceland': 'IS',
  'turkey': 'TR',
  'turkiye': 'TR',

  // Asia
  'india': 'IN',
  'bharat': 'IN',
  'china': 'CN',
  'peoples republic of china': 'CN',
  'japan': 'JP',
  'nippon': 'JP',
  'philippines': 'PH',
  'philippine islands': 'PH',
  'indonesia': 'ID',
  'malaysia': 'MY',
  'singapore': 'SG',
  'thailand': 'TH',
  'siam': 'TH',
  'vietnam': 'VN',
  'viet nam': 'VN',
  'south korea': 'KR',
  'korea': 'KR',
  'korea, south': 'KR',
  'north korea': 'KP',
  'taiwan': 'TW',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'sri lanka': 'LK',
  'ceylon': 'LK',
  'myanmar': 'MM',
  'burma': 'MM',
  'cambodia': 'KH',
  'laos': 'LA',
  'mongolia': 'MN',
  'nepal': 'NP',
  'bhutan': 'BT',
  'maldives': 'MV',
  'kazakhstan': 'KZ',
  'uzbekistan': 'UZ',

  // Middle East
  'saudi arabia': 'SA',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'israel': 'IL',
  'iran': 'IR',
  'iraq': 'IQ',
  'jordan': 'JO',
  'lebanon': 'LB',
  'qatar': 'QA',
  'kuwait': 'KW',
  'oman': 'OM',

  // Africa
  'south africa': 'ZA',
  'egypt': 'EG',
  'nigeria': 'NG',
  'kenya': 'KE',
  'morocco': 'MA',
  'ghana': 'GH',
  'ethiopia': 'ET',
  'tanzania': 'TZ',
  'uganda': 'UG',
  'algeria': 'DZ',
  'tunisia': 'TN',
  'angola': 'AO',
  'mozambique': 'MZ',
  'zimbabwe': 'ZW',
  'zambia': 'ZM',
  'madagascar': 'MG',
  'senegal': 'SN',
  'ivory coast': 'CI',
  'cote d\'ivoire': 'CI',

  // Oceania
  'australia': 'AU',
  'new zealand': 'NZ',
  'fiji': 'FJ',
  'papua new guinea': 'PG',
  'solomon islands': 'SB',
  'vanuatu': 'VU',
  'samoa': 'WS',
  'tonga': 'TO',
};

/**
 * Match arbitrary country name or code to standardized ISO-2 uppercase code
 */
export function normalizeCountryCode(countryInput?: string | null): string | null {
  if (!countryInput) return null;
  const raw = countryInput.trim().toUpperCase();

  // If already a 2-letter uppercase ISO code
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) {
    return raw;
  }

  // Clean name
  const clean = countryInput
    .toLowerCase()
    .replace(/\b(republic of|kingdom of|state of|federation of|the|islands)\b/gi, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Direct alias lookup
  if (COUNTRY_ALIASES[clean]) {
    return COUNTRY_ALIASES[clean];
  }

  // Fallback substring search across keys
  for (const [alias, code] of Object.entries(COUNTRY_ALIASES)) {
    if (clean.includes(alias) || alias.includes(clean)) {
      return code;
    }
  }

  return null;
}

/**
 * Get country flag emoji by ISO-2 code or name
 */
export function getCountryFlagByCode(code?: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const c = code.toUpperCase();
  return String.fromCodePoint(
    c.charCodeAt(0) + 127397,
    c.charCodeAt(1) + 127397
  );
}
