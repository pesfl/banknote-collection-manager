'use client';

import { useEffect, useState } from 'react';
import type { AIExtraction } from '@/types';
import SyncStatusBadge from './SyncStatusBadge';

interface ExtractionResultsProps {
  data: AIExtraction;
  onClose?: () => void;
}

export default function ExtractionResults({ data, onClose }: ExtractionResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sections = [
    {
      title: 'Identity',
      icon: '🪪',
      fields: [
        { label: 'Country', value: data.countryOfOrigin },
        { label: 'Denomination', value: data.denomination },
        { label: 'Currency', value: data.currency },
        { label: 'Pick Number', value: data.pickNumber },
      ],
    },
    {
      title: 'Serial Number',
      icon: '#️⃣',
      fields: [
        { label: 'Full Serial', value: data.fullSerialNumber },
        { label: 'Prefix', value: data.serialPrefix },
        { label: 'Numeric', value: data.serialNumeric },
        { label: 'Suffix', value: data.serialSuffix },
        { label: 'Type', value: data.fancySerialType },
      ],
    },
    {
      title: 'Condition & Grade',
      icon: '📊',
      fields: [
        { label: 'Condition', value: data.conditionGrade },
        { label: 'Machine Grade', value: data.machineEstimatedGrade },
        { label: 'Replacement Note', value: data.isReplacementNote ? 'Yes' : 'No' },
        { label: 'Error Type', value: data.errorType },
      ],
    },
    {
      title: 'Signatures',
      icon: '✍️',
      fields: [
        { label: 'Signature 1', value: `${data.signature1Name} - ${data.signature1Title}` },
        { label: 'Signature 2', value: `${data.signature2Name} - ${data.signature2Title}` },
      ],
    },
    {
      title: 'Security Features',
      icon: '🔒',
      fields: [
        { label: 'Watermarks', value: data.watermarks },
        { label: 'Security Features', value: data.securityFeatures },
      ],
    },
    {
      title: 'Details',
      icon: '📝',
      fields: [
        { label: 'Issue Year', value: data.issueYear },
        { label: 'Series Date', value: data.seriesDate },
        { label: 'Defects', value: data.defectsAndAnomalies },
        { label: 'Notes', value: data.notes },
      ],
    },
  ];

  return (
    <div className="w-full space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h3 className="font-bold text-gray-900 dark:text-white">
            AI Extraction Results
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Country</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.countryOfOrigin}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Denomination</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.denomination}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Condition</p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {data.conditionGrade || 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Pick #</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {data.pickNumber || '—'}
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4 pt-3">
          {sections.map(section => (
            <div key={section.title} className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <span>{section.icon}</span>
                {section.title}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {section.fields.map(field => {
                  if (!field.value) return null;
                  return (
                    <div key={field.label} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <p className="text-gray-600 dark:text-gray-400">{field.label}</p>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {String(field.value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-3 py-2 mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Close Results
        </button>
      )}
    </div>
  );
}
