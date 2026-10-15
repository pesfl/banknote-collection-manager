'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BanknoteDetailView from '@/components/banknote/BanknoteDetailView';
import type { Banknote } from '@/types';
import { getBanknoteById } from '@/lib/data/banknote-repository';
import { ArrowLeft, Layers, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BanknoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? decodeURIComponent(params.id) : Array.isArray(params.id) ? params.id[0] : '';
  
  const [banknote, setBanknote] = useState<Banknote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const item = await getBanknoteById(id);
        setBanknote(item);
      } catch (err) {
        console.error('Error fetching banknote by id:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading specimen details...</p>
      </div>
    );
  }

  if (!banknote) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white dark:bg-[#0b132b] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="h-16 w-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Specimen Not Found
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We could not locate a banknote record with identifier <code className="font-mono font-bold text-blue-500">{id}</code> in your local collection or catalog.
        </p>
        <div className="pt-2">
          <Link
            href="/banknotes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0066ff] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Banknote Inventory</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6">
      <BanknoteDetailView
        banknote={banknote}
        isStandalonePage={true}
        onSpecimenUpdated={(updated) => setBanknote(updated)}
      />
    </div>
  );
}
