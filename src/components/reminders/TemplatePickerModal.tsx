'use client';

import React, { useState } from 'react';
import { CardTemplatePreset, CARD_TEMPLATES } from '@/components/reminders/ReminderImageModal';
import { PaymentReminder, Company } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  Check,
  Palette,
  QrCode,
  ArrowRight,
  Sliders,
  Layers,
  Ratio,
  FileCheck,
  MessageCircle
} from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: PaymentReminder | null;
  company: Company;
  onSelectTemplate: (templateId: string, action: 'customize' | 'whatsapp' | 'view') => void;
}

export function TemplatePickerModal({
  isOpen,
  onClose,
  reminder,
  company,
  onSelectTemplate
}: TemplatePickerModalProps) {
  const [selectedId, setSelectedId] = useState<string>(CARD_TEMPLATES[0].id);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  if (!isOpen || !reminder) return null;

  const categories = ['All', 'Modern', 'Corporate', 'Minimal', 'Creative', 'Tech'];

  const filteredTemplates = filterCategory === 'All'
    ? CARD_TEMPLATES
    : CARD_TEMPLATES.filter((t) => t.category === filterCategory);

  const selectedTemplate = CARD_TEMPLATES.find((t) => t.id === selectedId) || CARD_TEMPLATES[0];

  const handleConfirm = (action: 'customize' | 'whatsapp' | 'view') => {
    onSelectTemplate(selectedId, action);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Image Template"
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Top Header Information Banner */}
        <div className="bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-slate-900 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Select a Design Template for {reminder.party_name || 'Party'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {formatCurrency(reminder.amount, company.currency)}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Which template would you like to use? Choose below or click "Customize in Studio" to fine-tune layout and QR code.
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Visual Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredTemplates.map((tpl) => {
            const isSelected = selectedId === tpl.id;

            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`group rounded-2xl border p-3.5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/60 shadow-lg shadow-purple-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-700 hover:scale-[1.01]'
                }`}
              >
                <div>
                  {/* Card Mini Preview Mock */}
                  <div
                    className={`h-36 rounded-xl bg-gradient-to-br ${tpl.previewBg} p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden shadow-inner mb-3`}
                  >
                    <div
                      className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-xl opacity-60 pointer-events-none"
                      style={{ backgroundColor: tpl.accent }}
                    />

                    {/* Preview Header */}
                    <div className="flex items-center justify-between text-[10px] z-10 text-white">
                      <span className="font-extrabold truncate max-w-[120px]">{company.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-white/20 backdrop-blur-xs">
                        {tpl.aspectRatio}
                      </span>
                    </div>

                    {/* Preview Center Body */}
                    <div className="z-10 my-auto text-center py-1">
                      <div className="text-[9px] uppercase tracking-wider text-slate-300 font-medium">
                        {reminder.reminder_type === 'to_collect' ? 'Receivable' : 'Payable'}
                      </div>
                      <div
                        className="text-base font-black font-mono tracking-tight"
                        style={{ color: tpl.accent }}
                      >
                        {formatCurrency(reminder.amount, company.currency)}
                      </div>
                      <div className="text-[10px] font-bold text-white truncate max-w-[150px] mx-auto">
                        {reminder.party_name || 'Client'}
                      </div>
                    </div>

                    {/* Preview Footer */}
                    <div className="flex items-center justify-between z-10 pt-1 border-t border-white/10 text-[9px] text-slate-300">
                      <span className="flex items-center gap-1 font-mono">
                        <QrCode className="w-3 h-3" />
                        <span>UPI QR</span>
                      </span>
                      <span>{formatDate(reminder.due_date)}</span>
                    </div>
                  </div>

                  {/* Template Details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-400 transition-colors">
                        {tpl.name}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                      {tpl.description}
                    </p>
                  </div>
                </div>

                {/* Selection Indicator & Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Font: {tpl.font.replace('font-', '')}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'border border-slate-300 dark:border-slate-700 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Selected Template:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {selectedTemplate.name}
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirm('customize')}
              className="text-xs cursor-pointer gap-1.5 border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex-1 sm:flex-none"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleConfirm('whatsapp')}
              className="text-xs cursor-pointer gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none shadow-md shadow-emerald-950/40"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
