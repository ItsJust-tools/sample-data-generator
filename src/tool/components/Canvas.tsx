'use client';

import React from 'react';
import type { ToolState } from '../types';
import { generateRecords } from '../generator';
import { toCsv, toJson } from '../export-data';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

function CopyButton({ value, testid }: { value: string; testid?: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  }, [value]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      data-testid={testid}
      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Copy value"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

const SUMMARY_COLUMNS = ['firstName', 'lastName', 'email', 'ipv4', 'ipv6', 'mac'] as const;

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });

  const generate = React.useCallback(() => {
    const records = generateRecords(state.count, state.locale, state.seed);
    update({ records });
    onSaveHistory?.(`Generated ${records.length} ${state.locale.toUpperCase()} records`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.count, state.locale, state.seed]);

  const currentText =
    state.format === 'csv' ? toCsv(state.records) : JSON.stringify(state.records, null, 2);

  const download = React.useCallback(() => {
    const text = state.format === 'csv' ? toCsv(state.records) : toJson(state.records);
    const blob = new Blob([text], {
      type: state.format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample-data.${state.format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [state.format, state.records]);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="sdg-canvas">
      <div className="flex items-end gap-3" data-testid="generate-controls">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Count (1–1000)
          <input
            type="number"
            min={1}
            max={1000}
            value={state.count}
            onChange={(e) => update({ count: Number.parseInt(e.target.value, 10) || 0 })}
            data-testid="input-count"
            className={`${inputClass} w-32`}
          />
        </label>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Seed (optional)
          <input
            type="text"
            value={state.seed}
            onChange={(e) => update({ seed: e.target.value })}
            placeholder="random"
            data-testid="input-seed"
            className={`${inputClass} w-48`}
          />
        </label>
        <button
          type="button"
          onClick={generate}
          data-testid="btn-generate"
          className="rounded-md bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600"
        >
          Generate
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400"
            data-testid="records-count"
          >
            {state.records.length} record{state.records.length === 1 ? '' : 's'}
          </span>
          <span className="flex gap-2">
            <CopyButton value={currentText} testid="btn-copy-data" />
            <button
              type="button"
              onClick={download}
              data-testid="btn-download"
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Download {state.format.toUpperCase()}
            </button>
          </span>
        </div>

        {state.records.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="empty-state">
            No records yet — press Generate to create sample data.
          </p>
        ) : (
          <div className="overflow-x-auto" data-testid="records-table-wrap">
            <table className="w-full text-left text-xs" data-testid="records-table">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  {SUMMARY_COLUMNS.map((c) => (
                    <th key={c} className="px-2 py-1 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.records.slice(0, 100).map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {SUMMARY_COLUMNS.map((c) => (
                      <td key={c} className="px-2 py-1 font-mono whitespace-nowrap">
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {state.records.length > 100 ? (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Showing first 100 of {state.records.length} — copy or download for the full set.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.records.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No batches generated yet.
          </p>
        ) : null}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        All data is generated locally in your browser; nothing is uploaded.
      </p>
    </div>
  );
};
