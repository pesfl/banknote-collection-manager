'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getAllSpecimens, deleteSpecimen, updateSpecimen, getSpecimen } from '@/lib/offline/idb';
import PhotoAdjusterModal from '@/components/mobile/PhotoAdjusterModal';
import { cleanBanknoteImage, ensureImageBlob } from '@/lib/media/banknote-cleaner';
import {
  Banknote,
  Globe,
  Layers,
  Copy,
  CircleDollarSign,
  Plus,
  Sparkles,
  Printer,
  Search,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  CreditCard,
  MessageSquare,
  CircleDot,
  Box,
  Bell,
  ArrowLeft,
  Clock,
  Trash2,
  TrendingUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Collection categories tabs
const CATEGORIES = [
  { id: 'banknotes', label: 'Banknotes', icon: Banknote, isComingSoon: false },
  { id: 'cards', label: 'Sports Cards', icon: CreditCard, isComingSoon: true },
  { id: 'comics', label: 'Comics', icon: MessageSquare, isComingSoon: true },
  { id: 'pokemon', label: 'Pokémon', icon: CircleDot, isComingSoon: true },
  { id: 'other', label: 'Other', icon: Box, isComingSoon: true },
];

interface ComingSoonInfo {
  title: string;
  subtitle: string;
  description: string;
  targetRelease: string;
  icon: React.ElementType;
  badge: string;
  features: { title: string; desc: string; icon: string }[];
  sampleStats: { label: string; value: string }[];
}

const COMING_SOON_DATA: Record<string, ComingSoonInfo> = {
  cards: {
    title: 'Sports Cards Vault',
    subtitle: 'Baseball • Basketball • Football • Soccer • Hockey',
    description: 'Track raw & graded slabs with automated PSA/BGS/SGC certification lookup, real-time eBay sold pricing, pop report tracking, and rookie card indexing.',
    targetRelease: 'Q4 2026',
    icon: CreditCard,
    badge: 'Coming Soon',
    features: [
      { title: 'Slab Barcode & Cert Scanner', desc: 'Instant PSA, BGS, CGC, and SGC barcode recognition with automatic grade verification.', icon: '🏷️' },
      { title: 'Live Pop Report & Census', desc: 'Real-time population analysis comparing PSA 10 gem mints to raw ungraded print runs.', icon: '📈' },
      { title: 'Raw-to-Graded Arbitrage', desc: 'AI-assisted sub-grade inspection (centering, corners, edges, surface) before submitting for grading.', icon: '💎' },
    ],
    sampleStats: [
      { label: 'Planned Card Sets', value: '12,500+' },
      { label: 'Grading Companies', value: 'PSA • BGS • SGC • CGC' },
      { label: 'Price Feeds', value: 'eBay • Card Ladder • PWCC' },
    ]
  },
  comics: {
    title: 'Comics Collection Vault',
    subtitle: 'Golden Age • Silver Age • Bronze Age • Modern Age',
    description: 'Catalog your comic books with key issue first appearance detection, CGC/CBCS census data, signature series verification, and variant cover archives.',
    targetRelease: 'Q1 2027',
    icon: MessageSquare,
    badge: 'Coming Soon',
    features: [
      { title: 'Key Issue & 1st Appearance AI', desc: 'Automatically tag crucial origin stories, first appearances, and artist deaths from cover scans.', icon: '📖' },
      { title: 'CGC / CBCS Census & Pedigree', desc: 'Track Universal, Signature Series, and Qualified labels alongside historical pedigree provenance.', icon: '🛡️' },
      { title: 'Variant & Incentive Ratios', desc: 'Index 1:25, 1:50, 1:100 retailer incentive variants with cover artist classification.', icon: '🎨' },
    ],
    sampleStats: [
      { label: 'Indexed Titles', value: '45,000+' },
      { label: 'Grading Standard', value: 'Overstreet 10-Point Scale' },
      { label: 'Market Indexes', value: 'GoCollect • GPAnalysis' },
    ]
  },
  pokemon: {
    title: 'Pokémon TCG Vault',
    subtitle: 'WOTC Era • EX Series • Sun & Moon • Sword & Shield • Scarlet & Violet',
    description: 'Comprehensive Pokémon card inventory system featuring set symbol AI recognition, 1st Edition and shadowless detection, holographic scratch grading, and live TCGPlayer valuation.',
    targetRelease: 'Q4 2026',
    icon: CircleDot,
    badge: 'Coming Soon',
    features: [
      { title: 'Set Symbol & 1st Edition AI Scanner', desc: 'Instant camera recognition of Base Set through modern expansion set symbols, rarity stars, and card numbers.', icon: '⚡' },
      { title: 'Holo Foil & Centering Inspection', desc: 'Multi-angle reflection scan to calculate 60/40 centering ratios and micro-scratch detection.', icon: '✨' },
      { title: 'TCGPlayer & Cardmarket Live Feeds', desc: 'Real-time market price syncing across near mint, lightly played, and PSA 10 slabs.', icon: '📊' },
    ],
    sampleStats: [
      { label: 'Expansions Supported', value: '110+ Sets' },
      { label: 'Language Editions', value: 'English • Japanese' },
      { label: 'Valuation Feeds', value: 'TCGPlayer • PriceCharting' },
    ]
  },
  other: {
    title: 'Custom Collectibles & Curiosities',
    subtitle: 'Coins • Bullion • Stamps • Vintage Watches • Historical Artifacts',
    description: 'Versatile cataloging suite for coins (Krause/KM), stamps (Scott/Michel), luxury timepieces, and rare memorabilia with custom schema builder and provenance tracking.',
    targetRelease: 'Q1 2027',
    icon: Box,
    badge: 'Coming Soon',
    features: [
      { title: 'Numismatic Coins & Bullion', desc: 'Gold/silver melt value live calculations tied to spot precious metal price indices.', icon: '🪙' },
      { title: 'Philatelic Stamp Archives', desc: 'Watermark, perforation gauge, and gum condition cataloging with Scott catalog indexing.', icon: '📮' },
      { title: 'Dynamic Schema Builder', desc: 'Create custom attributes, materials, dimensions, and provenance documents for any heirloom.', icon: '⚙️' },
    ],
    sampleStats: [
      { label: 'Asset Types', value: 'Unlimited' },
      { label: 'Spot Metal Feeds', value: 'Gold • Silver • Platinum' },
      { label: 'Media Support', value: 'High-Res Multi-Angle Scans' },
    ]
  }
};

interface BanknoteRow {
  id: string;
  country: string;
  countryFlag: string;
  denomination: string;
  year: string;
  pickNumber: string;
  condition: string;
  qty: number;
  value: string;
  isSpecial: boolean;
  isVerified: boolean;
  hasMissingInfo: boolean;
  frontImage: string;
  backImage: string;
  notes?: string;
  serialNumber?: string;
  pmgValue?: string;
  numistaValue?: string;
  ebayLastSold?: string;
  ebaySoldUrl?: string;
}

const SAMPLE_BANKNOTES: BanknoteRow[] = [
  {
    id: 'BN-BR-001',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    denomination: '500 Cruzeiros',
    year: '1981',
    pickNumber: 'P-198b',
    condition: 'UNC',
    qty: 12,
    value: '$240',
    isSpecial: true,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    notes: 'Deodoro da Fonseca portrait / Central Bank of Brazil engraving.',
    serialNumber: 'A 0482019482 C'
  },
  {
    id: 'BN-AR-002',
    country: 'Argentina',
    countryFlag: '🇦🇷',
    denomination: '100 Australes',
    year: '1985',
    pickNumber: 'P-331a',
    condition: 'UNC',
    qty: 24,
    value: '$168',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    notes: 'Nicolás Avellaneda portrait. Liberty holding torch on reverse.',
    serialNumber: '14.829.301 A'
  },
  {
    id: 'BN-BO-003',
    country: 'Bolivia',
    countryFlag: '🇧🇴',
    denomination: '10 Bolivianos',
    year: '1981',
    pickNumber: 'P-164a',
    condition: 'UNC',
    qty: 30,
    value: '$90',
    isSpecial: true,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    notes: 'Painter Cecilio Guzmán de Rojas / Mount Illimani landscape.',
    serialNumber: '87654321'
  },
  {
    id: 'BN-MX-004',
    country: 'Mexico',
    countryFlag: '🇲🇽',
    denomination: '1000 Pesos',
    year: '1993',
    pickNumber: 'P-94d',
    condition: 'UNC',
    qty: 18,
    value: '$180',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
    notes: 'Sor Juana Inés de la Cruz portrait. Bank of Mexico commemorative issue.',
    serialNumber: 'B4829104'
  },
  {
    id: 'BN-IN-005',
    country: 'India',
    countryFlag: '🇮🇳',
    denomination: '50 Rupees',
    year: '2018',
    pickNumber: 'P-104',
    condition: 'UNC',
    qty: 8,
    value: '$2.00',
    pmgValue: '$2.40',
    numistaValue: '$2.00',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=500&auto=format&fit=crop&q=80',
    notes: 'Mahatma Gandhi new series. RBI issue with Hampi stone chariot reverse.',
    serialNumber: '72D 819203'
  },
  {
    id: 'BN-CA-006',
    country: 'Canada',
    countryFlag: '🇨🇦',
    denomination: '1,000 Dollars',
    year: '1954',
    pickNumber: 'P-45a',
    condition: 'UNC',
    qty: 2,
    value: '$2,750',
    isSpecial: true,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500&auto=format&fit=crop&q=80',
    notes: 'Queen Elizabeth II portrait. Devil face variety verified clean.',
    serialNumber: 'A1234567'
  },
  {
    id: 'BN-US-007',
    country: 'United States',
    countryFlag: '🇺🇸',
    denomination: '$100',
    year: '2013',
    pickNumber: 'P-540',
    condition: 'AU',
    qty: 4,
    value: '$145',
    isSpecial: false,
    isVerified: true,
    hasMissingInfo: false,
    frontImage: 'https://images.unsplash.com/photo-1509017174183-0b7e0278f1ec?w=500&auto=format&fit=crop&q=80',
    backImage: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=80',
    notes: 'Benjamin Franklin portrait. Color-shifting bell in inkwell.',
    serialNumber: 'L12345678A'
  },
];

function getCountryFlag(countryName?: string): string {
  if (!countryName) return '🌐';
  const c = countryName.toLowerCase();
  if (c.includes('canada')) return '🇨🇦';
  if (c.includes('brazil') || c.includes('brasil')) return '🇧🇷';
  if (c.includes('argentina')) return '🇦🇷';
  if (c.includes('bolivia')) return '🇧🇴';
  if (c.includes('mexico') || c.includes('méxico')) return '🇲🇽';
  if (c.includes('united states') || c.includes('usa') || c.includes('us')) return '🇺🇸';
  if (c.includes('india')) return '🇮🇳';
  if (c.includes('china')) return '🇨🇳';
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('england')) return '🇬🇧';
  if (c.includes('japan')) return '🇯🇵';
  if (c.includes('germany')) return '🇩🇪';
  if (c.includes('france')) return '🇫🇷';
  if (c.includes('italy')) return '🇮🇹';
  if (c.includes('spain')) return '🇪🇸';
  return '🌐';
}

export default function DashboardPage() {
  const [banknotesList, setBanknotesList] = useState<BanknoteRow[]>(SAMPLE_BANKNOTES);

  useEffect(() => {
    function getSafeBlobUrl(blob?: any): string {
      if (!blob) return '';
      try {
        if (blob instanceof Blob || (typeof blob === 'object' && blob.size)) {
          return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn('Could not create object URL for blob:', e);
      }
      return '';
    }

    async function loadLocalNotes() {
      try {
        const local = await getAllSpecimens();
        if (local && local.length > 0) {
          const mapped: BanknoteRow[] = local.map((l) => {
            const ex = (l.extractedData || {}) as any;
            const realValuation = 
              ex.collectorMarketValue ||
              ex.valuation?.collectorMarketValue ||
              (typeof ex.valuation === 'string' && ex.valuation !== '$150' ? ex.valuation : null) ||
              'Valuation Pending';
            const countryName = ex.countryOfOrigin || ex.country || 'Unknown';

            return {
              id: l.id,
              country: countryName,
              countryFlag: getCountryFlag(countryName),
              denomination: ex.denomination && ex.denomination !== 'Unknown' ? ex.denomination : '—',
              year: ex.issueYear || ex.seriesDate || new Date(l.capturedAt).getFullYear().toString(),
              pickNumber: ex.pickNumber || 'P-Pending',
              condition: ex.conditionGrade || 'UNC',
              qty: 1,
              value: realValuation,
              pmgValue: ex.pmgValue || ex.valuation?.pmgValue,
              numistaValue: ex.numistaValue || ex.valuation?.numistaValue,
              ebayLastSold: ex.ebayLastSold || ex.valuation?.ebayLastSold,
              ebaySoldUrl: ex.valuation?.ebaySoldUrl,
              isSpecial: Boolean(ex.fancySerialType && ex.fancySerialType !== 'None') || Boolean(ex.isReplacementNote),
              isVerified: l.syncStatus === 'synced',
              hasMissingInfo: !ex.pickNumber || !ex.issueYear,
              frontImage: getSafeBlobUrl(l.frontImageBlob),
              backImage: getSafeBlobUrl(l.backImageBlob),
              notes: ex.notes || l.notes || 'Specimen captured locally',
              serialNumber: ex.fullSerialNumber || ex.serialNumeric || 'Local IDB',
            };
          });
          setBanknotesList([...mapped, ...SAMPLE_BANKNOTES]);
        }
      } catch (err) {
        console.warn('Error loading local banknotes for dashboard:', err);
      }
    }

    loadLocalNotes();
    const interval = setInterval(loadLocalNotes, 3000);

    const handleSpecimenUpdated = () => {
      loadLocalNotes();
    };
    window.addEventListener('banknote-specimen-updated', handleSpecimenUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('banknote-specimen-updated', handleSpecimenUpdated);
    };
  }, []);

  const [activeCategory, setActiveCategory] = useState('banknotes');
  const currentComingSoon = COMING_SOON_DATA[activeCategory];
  const [countryFilter, setCountryFilter] = useState('All');
  const [denomFilter, setDenomFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [pickFilter, setPickFilter] = useState('All');
  const [conditionFilter, setConditionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [inspectSpecimen, setInspectSpecimen] = useState<BanknoteRow | null>(null);

  const [isFixing, setIsFixing] = useState(false);
  const [adjustingSide, setAdjustingSide] = useState<'front' | 'back' | null>(null);
  const [adjustingBlob, setAdjustingBlob] = useState<Blob | null>(null);
  const [originalImages, setOriginalImages] = useState<{ [id: string]: { front?: string; back?: string } }>({});
  const [isRefreshingValuation, setIsRefreshingValuation] = useState(false);

  const handleRefreshValuation = async () => {
    if (!inspectSpecimen) return;
    setIsRefreshingValuation(true);
    try {
      const res = await fetch(`/api/valuation/${inspectSpecimen.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryOfOrigin: inspectSpecimen.country,
          denomination: inspectSpecimen.denomination,
          issueYear: inspectSpecimen.year,
          conditionGrade: inspectSpecimen.condition,
          serialNumeric: inspectSpecimen.serialNumber,
          isReplacementNote: inspectSpecimen.isSpecial,
        })
      });
      if (res.ok) {
        const json = await res.json();
        const valData = json?.data || json;
        const updated: BanknoteRow = {
          ...inspectSpecimen,
          value: valData.collectorMarketValue || inspectSpecimen.value,
          pmgValue: valData.pmgValue || inspectSpecimen.pmgValue,
          numistaValue: valData.numistaValue || inspectSpecimen.numistaValue,
          ebayLastSold: valData.ebayLastSold || inspectSpecimen.ebayLastSold,
          ebaySoldUrl: valData.ebaySoldUrl || inspectSpecimen.ebaySoldUrl,
        };
        setInspectSpecimen(updated);
        setBanknotesList(prev => prev.map(n => n.id === updated.id ? updated : n));

        const local = await getSpecimen(inspectSpecimen.id);
        if (local) {
          await updateSpecimen({
            ...local,
            extractedData: {
              ...(local.extractedData || {}),
              valuation: valData,
              collectorMarketValue: valData.collectorMarketValue,
              pmgValue: valData.pmgValue,
              numistaValue: valData.numistaValue,
              ebayLastSold: valData.ebayLastSold,
            }
          });
        }
        toast.success(`Valuation updated: ${valData.collectorMarketValue}`);
      } else {
        toast.error('Could not refresh valuation');
      }
    } catch {
      toast.error('Failed to contact valuation service');
    } finally {
      setIsRefreshingValuation(false);
    }
  };

  const handleStartAdjust = async (side: 'front' | 'back') => {
    if (!inspectSpecimen) return;
    const url = side === 'front' ? inspectSpecimen.frontImage : inspectSpecimen.backImage;
    if (!url) {
      toast.error(`No ${side} image available to adjust`);
      return;
    }
    try {
      toast.info(`Preparing ${side} image editor...`);
      const blob = await ensureImageBlob(url);
      setAdjustingBlob(blob);
      setAdjustingSide(side);
    } catch (err) {
      console.error('Error loading image for adjuster:', err);
      toast.error(`Could not load ${side} image for editing`);
    }
  };

  const handleAutoFixSide = async (side: 'front' | 'back') => {
    if (!inspectSpecimen) return;
    const url = side === 'front' ? inspectSpecimen.frontImage : inspectSpecimen.backImage;
    if (!url) {
      toast.error(`No ${side} image available`);
      return;
    }
    setIsFixing(true);
    try {
      toast.info(`Straightening and cropping ${side} photo...`);
      const blob = await ensureImageBlob(url);
      const cleanRes = await cleanBanknoteImage(blob, {
        autoStraighten: true,
        autoCropEdges: true,
        autoRotateLandscape: false,
        cropMarginPercent: 0,
        enhanceClarity: false,
      });

      if (cleanRes && cleanRes.cleanedBlob) {
        if (!originalImages[inspectSpecimen.id]) {
          setOriginalImages(prev => ({
            ...prev,
            [inspectSpecimen.id]: {
              front: inspectSpecimen.frontImage,
              back: inspectSpecimen.backImage,
            }
          }));
        }

        const updated: BanknoteRow = {
          ...inspectSpecimen,
          [side === 'front' ? 'frontImage' : 'backImage']: cleanRes.dataUrl,
        };
        setInspectSpecimen(updated);
        setBanknotesList(prev => prev.map(n => n.id === updated.id ? updated : n));

        try {
          const local = await getSpecimen(inspectSpecimen.id);
          if (local) {
            await updateSpecimen({
              ...local,
              [side === 'front' ? 'frontImageBlob' : 'backImageBlob']: cleanRes.cleanedBlob,
            });
          }
        } catch (e) {
          console.warn('IDB update skipped:', e);
        }

        toast.success(`✨ ${side === 'front' ? 'Front' : 'Back'} image straightened & cropped!`);
      }
    } catch (err) {
      console.error('Auto fix error:', err);
      toast.error(`Could not fix ${side} image`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleAutoFixBoth = async () => {
    if (!inspectSpecimen) return;
    const frontUrl = inspectSpecimen.frontImage;
    const backUrl = inspectSpecimen.backImage;
    if (!frontUrl && !backUrl) {
      toast.error('No images available to fix');
      return;
    }

    setIsFixing(true);
    try {
      toast.info('Straightening and cropping both note images...');
      if (!originalImages[inspectSpecimen.id]) {
        setOriginalImages(prev => ({
          ...prev,
          [inspectSpecimen.id]: {
            front: inspectSpecimen.frontImage,
            back: inspectSpecimen.backImage,
          }
        }));
      }

      const fixes: Promise<any>[] = [];
      if (frontUrl) {
        fixes.push(
          ensureImageBlob(frontUrl).then(b =>
            cleanBanknoteImage(b, {
              autoStraighten: true,
              autoCropEdges: true,
              autoRotateLandscape: false,
              cropMarginPercent: 0,
              enhanceClarity: false,
            })
          )
        );
      } else {
        fixes.push(Promise.resolve(null));
      }

      if (backUrl) {
        fixes.push(
          ensureImageBlob(backUrl).then(b =>
            cleanBanknoteImage(b, {
              autoStraighten: true,
              autoCropEdges: true,
              autoRotateLandscape: false,
              cropMarginPercent: 0,
              enhanceClarity: false,
            })
          )
        );
      } else {
        fixes.push(Promise.resolve(null));
      }

      const [cleanFront, cleanBack] = await Promise.all(fixes);

      const updated: BanknoteRow = {
        ...inspectSpecimen,
        frontImage: cleanFront?.dataUrl || inspectSpecimen.frontImage,
        backImage: cleanBack?.dataUrl || inspectSpecimen.backImage,
      };
      setInspectSpecimen(updated);
      setBanknotesList(prev => prev.map(n => n.id === updated.id ? updated : n));

      try {
        const local = await getSpecimen(inspectSpecimen.id);
        if (local) {
          await updateSpecimen({
            ...local,
            ...(cleanFront?.cleanedBlob ? { frontImageBlob: cleanFront.cleanedBlob } : {}),
            ...(cleanBack?.cleanedBlob ? { backImageBlob: cleanBack.cleanedBlob } : {}),
          });
        }
      } catch (e) {
        console.warn('IDB update skipped:', e);
      }

      toast.success('✨ Both specimen images straightened and cropped!');
    } catch (err) {
      console.error('Auto fix both error:', err);
      toast.error('Could not fix specimen images');
    } finally {
      setIsFixing(false);
    }
  };

  const handleResetOriginal = async (side: 'front' | 'back') => {
    if (!inspectSpecimen) return;
    const orig = originalImages[inspectSpecimen.id];
    const origUrl = side === 'front' ? orig?.front : orig?.back;
    if (!origUrl) {
      toast.info(`${side === 'front' ? 'Front' : 'Back'} image is already at original state`);
      return;
    }

    try {
      const updated: BanknoteRow = {
        ...inspectSpecimen,
        [side === 'front' ? 'frontImage' : 'backImage']: origUrl,
      };
      setInspectSpecimen(updated);
      setBanknotesList(prev => prev.map(n => n.id === updated.id ? updated : n));

      try {
        const local = await getSpecimen(inspectSpecimen.id);
        if (local) {
          const origBlob = await ensureImageBlob(origUrl);
          await updateSpecimen({
            ...local,
            [side === 'front' ? 'frontImageBlob' : 'backImageBlob']: origBlob,
          });
        }
      } catch (e) {
        console.warn('IDB revert skipped:', e);
      }

      toast.success(`Reset ${side} photo to original`);
    } catch {
      toast.error(`Could not reset ${side} photo`);
    }
  };

  const handleApplyAdjustment = async (cleanedBlob: Blob, cleanedPreview: string) => {
    if (!inspectSpecimen || !adjustingSide) return;
    try {
      if (!originalImages[inspectSpecimen.id]) {
        setOriginalImages(prev => ({
          ...prev,
          [inspectSpecimen.id]: {
            front: inspectSpecimen.frontImage,
            back: inspectSpecimen.backImage,
          }
        }));
      }

      const updated: BanknoteRow = {
        ...inspectSpecimen,
        [adjustingSide === 'front' ? 'frontImage' : 'backImage']: cleanedPreview,
      };
      setInspectSpecimen(updated);
      setBanknotesList(prev => prev.map(n => n.id === updated.id ? updated : n));

      try {
        const local = await getSpecimen(inspectSpecimen.id);
        if (local) {
          await updateSpecimen({
            ...local,
            [adjustingSide === 'front' ? 'frontImageBlob' : 'backImageBlob']: cleanedBlob,
          });
        }
      } catch (e) {
        console.warn('IDB update skipped:', e);
      }

      toast.success(`✨ ${adjustingSide === 'front' ? 'Front' : 'Back'} photo updated and saved!`);
    } catch {
      toast.error('Failed to save adjusted photo');
    }
  };

  // Filtered rows
  const filteredNotes = useMemo(() => {
    return banknotesList.filter((note) => {
      const matchCountry = countryFilter === 'All' || note.country === countryFilter;
      const matchDenom = denomFilter === 'All' || note.denomination.includes(denomFilter);
      const matchYear = yearFilter === 'All' || note.year === yearFilter;
      const matchPick = pickFilter === 'All' || note.pickNumber === pickFilter;
      const matchCondition = conditionFilter === 'All' || note.condition === conditionFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        note.country.toLowerCase().includes(q) ||
        note.denomination.toLowerCase().includes(q) ||
        note.year.toLowerCase().includes(q) ||
        note.pickNumber.toLowerCase().includes(q) ||
        (note.notes && note.notes.toLowerCase().includes(q));

      return matchCountry && matchDenom && matchYear && matchPick && matchCondition && matchQuery;
    });
  }, [banknotesList, countryFilter, denomFilter, yearFilter, pickFilter, conditionFilter, searchQuery]);

  const handleExport = (format: string) => {
    setShowExportMenu(false);
    toast.success(`Exporting inventory as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* TOP CATEGORY SWITCHER TABS (Banknotes, Sports Cards, Comics, etc.)        */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                ? 'bg-[#0a1931] text-white dark:bg-[#00246b] dark:text-blue-50 shadow-md shadow-slate-900/15'
                : 'bg-white dark:bg-[#0b132b] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 shadow-2xs hover:border-slate-400'
                }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
              <span>{cat.label}</span>
              {cat.isComingSoon && (
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${isActive
                    ? 'bg-amber-400/25 text-amber-200 border border-amber-300/40'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-400/30'
                    }`}
                >
                  {/* Coming Soon */}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER: BANKNOTES ACTIVE OR COMING SOON MODULE PREVIEW            */}
      {/* ========================================================================= */}
      {activeCategory === 'banknotes' ? (
        <div className="bg-white dark:bg-[#0a1329] rounded-2xl border border-slate-300/90 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-6">

          {/* Section Title Header */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#002b80] dark:text-blue-400 shadow-2xs">
              <Banknote className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Banknotes
            </h2>
          </div>

          {/* ========================================================================= */}
          {/* 5 SUMMARY STAT CARDS GRID (Uniform Deep Navy Color & Bigger Icons)         */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">

            {/* Card 1: Total Notes */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Banknote className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Total Notes
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  18,700
                </span>
              </div>
            </div>

            {/* Card 2: Countries */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Globe className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Countries
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  142
                </span>
              </div>
            </div>

            {/* Card 3: Different Notes */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Layers className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Different Notes
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  3,850
                </span>
              </div>
            </div>

            {/* Card 4: Duplicates */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <Copy className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Duplicates
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  14,850
                </span>
              </div>
            </div>

            {/* Card 5: Estimated Value */}
            <div className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f1a36] p-4 flex items-center gap-4 shadow-sm hover:border-slate-400 transition-colors col-span-2 sm:col-span-1">
              <div className="text-[#002b80] dark:text-[#60a5fa] shrink-0">
                <CircleDollarSign className="h-9 w-9 sm:h-10 sm:w-10 stroke-[1.6]" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Estimated Value
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  $1,248,750
                </span>
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* FILTER DROPDOWNS & SEARCH ROW (Distinct Light Theme Borders)              */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">

            {/* Country */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Country
              </label>
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Bolivia">Bolivia</option>
                  <option value="Mexico">Mexico</option>
                  <option value="India">India</option>
                  <option value="Canada">Canada</option>
                  <option value="United States">United States</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Denomination */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Denomination
              </label>
              <div className="relative">
                <select
                  value={denomFilter}
                  onChange={(e) => setDenomFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="10">10</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="500">500</option>
                  <option value="1000">1000</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Year
              </label>
              <div className="relative">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="1954">1954</option>
                  <option value="1981">1981</option>
                  <option value="1985">1985</option>
                  <option value="1993">1993</option>
                  <option value="2013">2013</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Pick # */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pick #
              </label>
              <div className="relative">
                <select
                  value={pickFilter}
                  onChange={(e) => setPickFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="P-45a">P-45a</option>
                  <option value="P-198b">P-198b</option>
                  <option value="P-331a">P-331a</option>
                  <option value="P-164a">P-164a</option>
                  <option value="P-94d">P-94d</option>
                  <option value="P-540">P-540</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <div className="relative">
                <select
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white font-medium outline-none focus:border-[#003399] shadow-2xs pr-8 hover:border-slate-400 transition-colors"
                >
                  <option value="All">All</option>
                  <option value="UNC">UNC</option>
                  <option value="AU">AU</option>
                  <option value="XF">XF</option>
                  <option value="VF">VF</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Search Banknotes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Search Banknotes
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by country, denomination, year, pick #..."
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#003399] shadow-2xs hover:border-slate-400 transition-colors"
                />
                <Search className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* ACTION BUTTONS ROW (+ Add Note, Export)                                    */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">

            {/* Left Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">

              {/* + Add Note (Solid Dark Blue) */}
              <Link
                href="/capture"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#003399] hover:bg-[#002b80] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Note</span>
              </Link>
            </div>

            {/* Right Action: Export / Print Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-200 text-xs font-semibold transition-colors shadow-2xs hover:border-slate-400"
              >
                <Printer className="h-3.5 w-3.5 text-slate-500" />
                <span>Export / Print</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#0b132b] border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-30 animate-in fade-in">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Export as CSV / Excel
                  </button>
                  <button
                    onClick={() => { setShowExportMenu(false); window.print(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800"
                  >
                    Print Inventory Catalog
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* BANKNOTES DATA TABLE                                                      */}
          {/* ========================================================================= */}
          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 shadow-xs">
            <table className="w-full text-left border-collapse bg-white dark:bg-[#0a1329]">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold">
                  <th className="py-3 px-4 text-center w-48">Photo</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Denomination</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Pick #</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4 text-center">Special</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {filteredNotes.map((note) => (
                  <tr
                    key={note.id}
                    onClick={() => setInspectSpecimen(note)}
                    className="hover:bg-[#f1f5f9]/80 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                  >
                    {/* Photo Column: Side-by-Side Front & Back Mini Images */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="h-10 w-16 rounded overflow-hidden bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                          <img
                            src={note.frontImage}
                            alt={`${note.country} Front`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="h-10 w-16 rounded overflow-hidden bg-slate-100 border border-slate-300 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                          <img
                            src={note.backImage}
                            alt={`${note.country} Back`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Country Column (Flag + Name) */}
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none" role="img" aria-label={note.country}>
                          {note.countryFlag}
                        </span>
                        <span>{note.country}</span>
                      </div>
                    </td>

                    {/* Denomination Column */}
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {note.denomination}
                    </td>

                    {/* Year Column */}
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {note.year === '—' ? (
                        <span className="text-rose-500 font-bold">—</span>
                      ) : (
                        note.year
                      )}
                    </td>

                    {/* Pick # Column */}
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {note.pickNumber === '—' ? (
                        <span className="text-rose-500 font-bold">—</span>
                      ) : (
                        note.pickNumber
                      )}
                    </td>

                    {/* Condition Column */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {note.condition}
                      </span>
                    </td>

                    {/* Qty Column */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {note.qty}
                    </td>

                    {/* Value Column */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {note.value === '—' ? (
                        <span className="text-rose-500 font-bold">—</span>
                      ) : (
                        note.value
                      )}
                    </td>

                    {/* Special Column (Star, Green Check, Red Exclamation) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {note.isSpecial && (
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                        )}
                        {note.isVerified && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {note.hasMissingInfo && (
                          <AlertCircle className="h-4 w-4 text-rose-500 fill-rose-50 dark:fill-rose-950/40" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* PAGINATION & FOOTER                                                       */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-600 dark:text-slate-400">

            {/* Total info */}
            <div>
              Showing 1 to {filteredNotes.length} of 18,700 notes
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="First page"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <button className="h-7 w-7 rounded-lg bg-[#003399] text-white font-bold flex items-center justify-center shadow-xs">
                1
              </button>
              <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
                2
              </button>
              <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
                3
              </button>
              <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
                4
              </button>
              <button className="h-7 w-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium flex items-center justify-center">
                5
              </button>

              <button
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                title="Last page"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Per Page Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                defaultValue="25"
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111c3d] text-slate-800 dark:text-slate-200 font-medium outline-none shadow-2xs"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

          </div>

        </div>
      ) : (
        currentComingSoon && (
          <div className="bg-white dark:bg-[#0a1329] rounded-2xl border border-slate-300/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-[#002b80] dark:text-blue-400 shadow-sm">
                  <currentComingSoon.icon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {currentComingSoon.title}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                      <Clock className="h-3 w-3" />
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {currentComingSoon.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => setActiveCategory('banknotes')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Banknotes</span>
                </button>
                <button
                  onClick={() => toast.success(`You're subscribed! We'll notify you when ${currentComingSoon.title} launches.`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#002b80] hover:bg-blue-900 text-white shadow-sm transition-all active:scale-95"
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span>Notify Me</span>
                </button>
              </div>
            </div>

            {/* Hero description & timeline */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/60 dark:from-blue-950/20 dark:via-slate-900/40 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Vault Module In Active Development</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentComingSoon.description}
                </p>
              </div>
              <div className="shrink-0 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Launch</span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{currentComingSoon.targetRelease}</span>
              </div>
            </div>

            {/* 3 Key Feature Previews */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Upcoming Capabilities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentComingSoon.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1a36] shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="text-2xl">{feat.icon}</div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{feat.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Specifications / Matrix */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Engine Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {currentComingSoon.sampleStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">{stat.label}</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* HIGH-RES SPECIMEN INSPECTOR MODAL                                         */}
      {/* ========================================================================= */}
      {inspectSpecimen && (
        <div
          onClick={() => setInspectSpecimen(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white dark:bg-[#0b132b] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none">{inspectSpecimen.countryFlag}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {inspectSpecimen.country} {inspectSpecimen.denomination} ({inspectSpecimen.year})
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Pick #{inspectSpecimen.pickNumber} | Serial: {inspectSpecimen.serialNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectSpecimen(null)}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Auto-Fix Both Button */}
            <button
              type="button"
              onClick={handleAutoFixBoth}
              disabled={isFixing}
              className="w-full py-2.5 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span className={isFixing ? 'animate-spin' : ''}>🪄</span>
              <span>{isFixing ? 'Auto-Fixing Images...' : 'Auto-Fix Both Images (Crop & Straighten)'}</span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Front Specimen Scan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResetOriginal('front')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Restore original unedited photo"
                    >
                      <span>↺ Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoFixSide('front')}
                      disabled={isFixing}
                      className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>🪄 Fix Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAdjust('front')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>✂️ Adjust</span>
                    </button>
                  </div>
                </div>
                <img
                  src={inspectSpecimen.frontImage}
                  alt="Front Scan"
                  className="w-full h-56 object-contain bg-slate-950/60 p-2"
                />
              </div>

              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 bg-slate-100 dark:bg-slate-900">
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Back Specimen Scan
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleResetOriginal('back')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-md transition-colors cursor-pointer"
                      title="Restore original unedited photo"
                    >
                      <span>↺ Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoFixSide('back')}
                      disabled={isFixing}
                      className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>🪄 Fix Image</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartAdjust('back')}
                      className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>✂️ Adjust</span>
                    </button>
                  </div>
                </div>
                <img
                  src={inspectSpecimen.backImage}
                  alt="Back Scan"
                  className="w-full h-56 object-contain bg-slate-950/60 p-2"
                />
              </div>
            </div>

            {/* Multi-Source Valuation Matrix */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0e172e] border border-emerald-500/30 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                      Multi-Source Valuation Matrix
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Live Consensus
                      </span>
                    </h4>
                    <p className="text-[10px] text-slate-400">Harmonized from PMG World Paper Money, Numista, & completed eBay sales</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshValuation}
                  disabled={isRefreshingValuation}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-800/60 border border-emerald-500/40 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Re-query valuation engine with current condition and serial features"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshingValuation ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingValuation ? 'Updating...' : 'Refresh Live'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1. PMG Catalog */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>🏛️ PMG Catalog</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-200">
                    {inspectSpecimen.pmgValue || '—'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Catalog Anchor</div>
                </div>

                {/* 2. Numista Value */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>🪙 Numista</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-cyan-300">
                    {inspectSpecimen.numistaValue || '—'}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Community Curve</div>
                </div>

                {/* 3. eBay Last Sold */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>🛒 eBay Last Sold</span>
                    {inspectSpecimen.ebaySoldUrl && (
                      <a
                        href={inspectSpecimen.ebaySoldUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="View completed sold listings on eBay"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-300">
                    {inspectSpecimen.ebayLastSold ? (
                      inspectSpecimen.ebayLastSold
                    ) : inspectSpecimen.ebaySoldUrl ? (
                      <a
                        href={inspectSpecimen.ebaySoldUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 font-sans flex items-center gap-1 underline"
                      >
                        <span>Check Sold ↗</span>
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {inspectSpecimen.ebayLastSold ? 'Verified Sale' : 'Live Marketplace Search'}
                  </div>
                </div>

                {/* 4. Collector Market Value */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-emerald-300 mb-1">
                    <span className="font-semibold">💎 Market Consensus</span>
                  </div>
                  <div className="text-sm font-extrabold font-mono text-emerald-400">
                    {inspectSpecimen.value}
                  </div>
                  <div className="text-[9px] text-emerald-300/80 mt-0.5">Condition Weighted</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#111c3d] p-3 rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Condition</span>
                <span className="font-bold text-emerald-600">{inspectSpecimen.condition}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Quantity</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{inspectSpecimen.qty} notes</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Value</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{inspectSpecimen.value}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Special Tag</span>
                <span className="font-bold text-amber-500">{inspectSpecimen.isSpecial ? '⭐ Valuable Item' : 'Standard Specimen'}</span>
              </div>
            </div>

            {inspectSpecimen.notes && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111c3d] text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">Specimen Notes:</span>
                <p className="text-slate-600 dark:text-slate-300">{inspectSpecimen.notes}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Are you sure you want to permanently delete ${inspectSpecimen.country} ${inspectSpecimen.denomination}?`)) return;
                  try {
                    await fetch(`/api/banknotes/${inspectSpecimen.id}`, { method: 'DELETE' }).catch(() => {});
                    await deleteSpecimen(inspectSpecimen.id).catch(() => {});
                    setBanknotesList(prev => prev.filter(n => n.id !== inspectSpecimen.id));
                    setInspectSpecimen(null);
                    toast.success('Specimen removed from collection');
                  } catch (err) {
                    toast.error('Failed to delete specimen');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Specimen</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectSpecimen(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Photo Deskew & Edge Trimming Modal */}
      <PhotoAdjusterModal
        isOpen={adjustingSide !== null}
        onClose={() => {
          setAdjustingSide(null);
          setAdjustingBlob(null);
        }}
        imageBlob={adjustingBlob}
        initialPreviewUrl={adjustingSide === 'front' ? inspectSpecimen?.frontImage || null : inspectSpecimen?.backImage || null}
        sideLabel={adjustingSide === 'front' ? 'Front' : 'Back'}
        onApply={handleApplyAdjustment}
      />

    </div>
  );
}
