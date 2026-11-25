'use client';

import React from 'react';
import { FORMATS, LOCALES } from '../ui-shared';
import type { ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="sdg-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Locale</h3>
        <div className="flex gap-2">
          {LOCALES.map((l) => (
            <button
              key={l.value}
              type="button"
              role="tab"
              aria-selected={state.locale === l.value}
              data-testid={`locale-${l.value}`}
              onClick={() => onChange({ ...state, locale: l.value })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                state.locale === l.value
                  ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Export format</h3>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={state.format === f.value}
              data-testid={`format-${f.value}`}
              onClick={() => onChange({ ...state, format: f.value })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                state.format === f.value
                  ? 'border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-900/40 dark:text-violet-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Deterministic seeds</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Leave the seed empty for fresh random data every run. Enter a seed (e.g.{' '}
          <code>ci-tests</code>) to get the exact same records on every generate — great for tests
          and reproducible mockups.
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Records</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-record-count">
          {state.records.length} record{state.records.length === 1 ? '' : 's'} in the current batch
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>G</kbd> — Generate a batch
          </li>
          <li>
            <kbd>Y</kbd> — Copy current data
          </li>
          <li>
            <kbd>L</kbd> — Toggle locale
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing count, locale and seed; open it to
          reproduce the dataset.
        </p>
      </div>
    </div>
  );
};
