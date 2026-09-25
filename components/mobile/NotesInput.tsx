'use client';

interface NotesInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function NotesInput({
  value,
  onChange,
  placeholder = 'Add optional notes (e.g., condition, special features)...',
}: NotesInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Notes (Optional)
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        rows={3}
        className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
        {value.length}/500
      </p>
    </div>
  );
}
