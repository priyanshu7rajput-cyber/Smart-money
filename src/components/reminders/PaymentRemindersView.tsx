'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentReminder, ReminderType, ReminderStatus, Party, WhatsAppTemplate } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  BellRing,
  Plus,
  Search,
  Filter,
  Calendar,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
  Sparkles,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coins,
  Wallet,
  Landmark,
  Send,
  SlidersHorizontal,
  Copy,
  Check,
  FileText,
  Settings,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { MonthlyReminderCashflowChart } from '@/components/reminders/MonthlyReminderCashflowChart';
import { ReminderImageModal, CARD_TEMPLATES } from '@/components/reminders/ReminderImageModal';
import { TemplatePickerModal } from '@/components/reminders/TemplatePickerModal';

const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'default-friendly-collect',
    name: 'Friendly Reminder (Receivable)',
    type: 'to_collect',
    message: '*Payment Reminder from {company_name}*\n\nDear {party_name},\n\nThis is a polite reminder regarding pending payment of *{amount}* due on *{due_date}*{invoice_ref}.\n\nKindly process the payment at your earliest convenience. Thank you!',
  },
  {
    id: 'default-formal-collect',
    name: 'Formal Invoice Advisory (Receivable)',
    type: 'to_collect',
    message: '*Official Payment Reminder*\n\nFrom: {company_name}\nTo: {party_name}\nAmount Due: *{amount}*\nDue Date: *{due_date}*\nReference: {invoice_ref}\n\nPlease arrange for the settlement of this invoice per payment terms. If payment has already been initiated, please share the transaction reference.\n\nBest Regards,\n{company_name}',
  },
  {
    id: 'default-urgent-collect',
    name: 'Urgent Overdue Alert (Receivable)',
    type: 'to_collect',
    message: '*URGENT: Outstanding Payment Alert - {company_name}*\n\nDear {party_name},\n\nThis is an urgent reminder regarding your overdue payment of *{amount}* for {invoice_ref} (Due: *{due_date}*).\n\nKindly clear this outstanding balance today to avoid disruption in services.\n\nThank you,\n{company_name}',
  },
  {
    id: 'default-payment-advice',
    name: 'Scheduled Payment Advice (Payable)',
    type: 'to_pay',
    message: '*Payment Notification - {company_name}*\n\nDear {party_name},\n\nWe have scheduled your payment of *{amount}* for *{due_date}*{invoice_ref}.\n\nThank you for your business.',
  },
  {
    id: 'default-quick-notice',
    name: 'Quick Short Notice',
    type: 'all',
    message: 'Hello {party_name}, this is regarding {amount} due on {due_date} from {company_name}. Please check ref: {invoice_ref}.',
  },
];

export function PaymentRemindersView() {
  const {
    reminders,
    parties,
    accounts,
    categories,
    currentCompany,
    addPaymentReminder,
    updatePaymentReminder,
    deletePaymentReminder,
    markPaymentReminderStatus,
    createTransaction
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'to_collect' | 'to_pay' | 'overdue' | 'paid' | 'image_templates'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<PaymentReminder | null>(null);

  // Template Manager State (Stored in LocalStorage)
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smartmoney_whatsapp_templates');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return DEFAULT_TEMPLATES;
        }
      }
    }
    return DEFAULT_TEMPLATES;
  });

  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    type: 'all' as 'to_collect' | 'to_pay' | 'all',
    message: '',
  });

  // Save templates to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartmoney_whatsapp_templates', JSON.stringify(templates));
    }
  }, [templates]);

  // WhatsApp Send Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppReminder, setWhatsAppReminder] = useState<PaymentReminder | null>(null);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Visual Image Card Template Modal & Studio State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalReminder, setImageModalReminder] = useState<PaymentReminder | null>(null);
  const [selectedImageTemplateId, setSelectedImageTemplateId] = useState<string | null>(null);
  const [imageModalTab, setImageModalTab] = useState<'templates' | 'design' | 'elements' | 'presets'>('templates');
  const [autoSendWhatsAppImage, setAutoSendWhatsAppImage] = useState(false);

  // Quick Template Selection Prompt Modal State
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [templatePickerReminder, setTemplatePickerReminder] = useState<PaymentReminder | null>(null);

  // When clicking Card Image button on reminder, ask which template to use first!
  const handleCardImageButtonClick = (reminder: PaymentReminder) => {
    setTemplatePickerReminder(reminder);
    setIsTemplatePickerOpen(true);
  };

  const handleOpenImageModal = (
    reminder: PaymentReminder,
    tplId?: string,
    tab: 'templates' | 'design' | 'elements' | 'presets' = 'templates',
    autoSend: boolean = false
  ) => {
    setImageModalReminder(reminder);
    setSelectedImageTemplateId(tplId || null);
    setImageModalTab(tab);
    setAutoSendWhatsAppImage(autoSend);
    setIsImageModalOpen(true);
  };

  // Settlement (Mark as Paid) Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlingReminder, setSettlingReminder] = useState<PaymentReminder | null>(null);
  const [settlementData, setSettlementData] = useState({
    accountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    referenceNo: '',
    utrNo: '',
    chequeNo: '',
    narration: '',
    categoryId: '',
  });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    reminder_type: 'to_collect' as ReminderType,
    party_id: '',
    party_name: '',
    phone: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
    invoice_ref: '',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto calculate dynamic status check for display
  const remindersWithComputedStatus = reminders.map(r => {
    let currentStatus = r.status;
    if (currentStatus === 'pending' && r.due_date < todayStr) {
      currentStatus = 'overdue';
    }
    return { ...r, status: currentStatus };
  });

  // Extract all distinct available months from reminders for the month selector dropdown
  const availableMonths = React.useMemo(() => {
    const monthSet = new Set<string>();
    // Always include current month
    const currentMonthKey = todayStr.substring(0, 7);
    monthSet.add(currentMonthKey);

    reminders.forEach(r => {
      if (r.due_date) {
        monthSet.add(r.due_date.substring(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [reminders, todayStr]);

  // Format YYYY-MM to readable name e.g. "October 2026"
  const formatMonthLabel = (monthKey: string) => {
    if (monthKey === 'all') return 'All Time / All Months';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Reminders filtered by selected month
  const monthFilteredReminders = React.useMemo(() => {
    if (selectedMonth === 'all') return remindersWithComputedStatus;
    return remindersWithComputedStatus.filter(r => r.due_date && r.due_date.startsWith(selectedMonth));
  }, [remindersWithComputedStatus, selectedMonth]);

  // Filtered Reminders (including tab and search)
  const filteredReminders = monthFilteredReminders.filter(r => {
    // Tab filter
    if (activeTab === 'to_collect' && r.reminder_type !== 'to_collect') return false;
    if (activeTab === 'to_pay' && r.reminder_type !== 'to_pay') return false;
    if (activeTab === 'overdue' && r.status !== 'overdue') return false;
    if (activeTab === 'paid' && r.status !== 'paid') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchParty = (r.party_name || '').toLowerCase().includes(q);
      const matchRef = (r.invoice_ref || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || r.party_phone || '').includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      return matchTitle || matchParty || matchRef || matchPhone || matchNotes;
    }

    return true;
  });

  // Calculate Summary metrics for the active selected month
  const totalToCollect = monthFilteredReminders
    .filter(r => r.reminder_type === 'to_collect' && r.status !== 'paid' && r.status !== 'dismissed')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalToPay = monthFilteredReminders
    .filter(r => r.reminder_type === 'to_pay' && r.status !== 'paid' && r.status !== 'dismissed')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const overdueCount = monthFilteredReminders.filter(r => r.status === 'overdue').length;
  const pendingCount = monthFilteredReminders.filter(r => r.status === 'pending').length;
  const completedCount = monthFilteredReminders.filter(r => r.status === 'paid').length;
  const netCashflowPosition = totalToCollect - totalToPay; // Kitne lene hai vs kitne dene hai difference

  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setFormData({
      title: '',
      reminder_type: 'to_collect',
      party_id: '',
      party_name: '',
      phone: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      notes: '',
      invoice_ref: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder: PaymentReminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      reminder_type: reminder.reminder_type,
      party_id: reminder.party_id || '',
      party_name: reminder.party_name || '',
      phone: reminder.phone || '',
      amount: reminder.amount ? String(reminder.amount) : '',
      due_date: reminder.due_date,
      priority: reminder.priority || 'medium',
      notes: reminder.notes || '',
      invoice_ref: reminder.invoice_ref || '',
    });
    setIsModalOpen(true);
  };

  const handlePartySelect = (partyId: string) => {
    const selected = parties.find(p => p.id === partyId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        party_id: selected.id,
        party_name: selected.name,
        phone: selected.phone || prev.phone,
        title: prev.title || `Payment reminder for ${selected.name}`,
        reminder_type: (selected.type || '').toLowerCase().includes('supp') || (selected.type || '').toLowerCase().includes('vend') ? 'to_pay' : 'to_collect',
        amount: prev.amount || (selected.opening_balance > 0 ? String(selected.opening_balance) : '')
      }));
    } else {
      setFormData(prev => ({ ...prev, party_id: '', party_name: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const payload = {
      title: formData.title.trim(),
      reminder_type: formData.reminder_type,
      party_id: formData.party_id || undefined,
      party_name: formData.party_name || undefined,
      phone: formData.phone || undefined,
      amount: Number(formData.amount) || 0,
      due_date: formData.due_date,
      status: (editingReminder ? editingReminder.status : 'pending') as ReminderStatus,
      priority: formData.priority,
      notes: formData.notes || undefined,
      invoice_ref: formData.invoice_ref || undefined,
    };

    if (editingReminder) {
      updatePaymentReminder(editingReminder.id, payload);
    } else {
      addPaymentReminder(payload);
    }

    setIsModalOpen(false);
  };

  // Open Settlement Modal (Triggered by Mark Paid)
  const handleOpenSettleModal = (reminder: PaymentReminder) => {
    // Pick first available account or matching type
    const defaultAcc = accounts.length > 0 ? accounts[0].id : '';
    const today = new Date().toISOString().split('T')[0];

    // Auto-match category
    const defaultCat = categories.find(c => 
      reminder.reminder_type === 'to_collect' ? c.type === 'income' : c.type === 'expense'
    )?.id || (categories.length > 0 ? categories[0].id : '');

    setSettlingReminder(reminder);
    setSettlementData({
      accountId: defaultAcc,
      paymentDate: today,
      amount: String(reminder.amount || 0),
      referenceNo: reminder.invoice_ref || '',
      utrNo: '',
      chequeNo: '',
      narration: `Payment settlement for reminder: ${reminder.title}${reminder.party_name ? ` (${reminder.party_name})` : ''}`,
      categoryId: defaultCat,
    });
    setIsSettleModalOpen(true);
  };

  // Execute settlement: create Cash/Bank entry and update reminder status to 'paid'
  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingReminder || !settlementData.accountId) return;

    const selectedAccount = accounts.find(a => a.id === settlementData.accountId);
    if (!selectedAccount) return;

    const isBank = selectedAccount.type === 'bank';
    const isCollect = settlingReminder.reminder_type === 'to_collect';

    // Determine exact transaction type:
    // to_collect: cash_receipt or bank_receipt
    // to_pay: cash_payment or bank_payment
    let txType: 'cash_receipt' | 'bank_receipt' | 'cash_payment' | 'bank_payment';
    if (isCollect) {
      txType = isBank ? 'bank_receipt' : 'cash_receipt';
    } else {
      txType = isBank ? 'bank_payment' : 'cash_payment';
    }

    const settleAmount = Number(settlementData.amount) || settlingReminder.amount;

    // Post Double-entry transaction
    const txResult = createTransaction({
      type: txType,
      date: settlementData.paymentDate,
      amount: settleAmount,
      accountId: settlementData.accountId,
      partyId: settlingReminder.party_id || undefined,
      categoryId: settlementData.categoryId || undefined,
      referenceNo: settlementData.referenceNo || settlingReminder.invoice_ref || undefined,
      utrNo: settlementData.utrNo || undefined,
      chequeNo: settlementData.chequeNo || undefined,
      narration: settlementData.narration || `Settlement of reminder: ${settlingReminder.title}`,
    });

    if (txResult.success) {
      // Mark reminder as paid
      markPaymentReminderStatus(settlingReminder.id, 'paid');
      setIsSettleModalOpen(false);
      setSettlingReminder(null);
    } else {
      alert(txResult.error || 'Failed to record payment transaction.');
    }
  };

  // Populate template placeholders with actual reminder data
  const applyTemplateToReminder = (templateText: string, reminder: PaymentReminder) => {
    const formattedAmt = formatCurrency(reminder.amount, currentCompany.currency);
    const dateFormatted = formatDate(reminder.due_date);
    const invoiceRefStr = reminder.invoice_ref ? ` (Ref: ${reminder.invoice_ref})` : '';

    return templateText
      .replace(/{company_name}/g, currentCompany.name)
      .replace(/{party_name}/g, reminder.party_name || 'Sir/Madam')
      .replace(/{amount}/g, formattedAmt)
      .replace(/{due_date}/g, dateFormatted)
      .replace(/{invoice_ref}/g, invoiceRefStr)
      .replace(/{title}/g, reminder.title);
  };

  // Open WhatsApp Send Modal with Template Pre-selected
  const handleOpenWhatsAppModal = (reminder: PaymentReminder) => {
    setWhatsAppReminder(reminder);
    setWhatsAppPhone(reminder.phone || reminder.party_phone || '');
    
    // Pick the most relevant template based on reminder type
    const matchedTemplates = templates.filter(t => t.type === 'all' || t.type === reminder.reminder_type);
    const initialTpl = matchedTemplates[0] || templates[0];
    
    if (initialTpl) {
      setSelectedTemplateId(initialTpl.id);
      setCustomMessage(applyTemplateToReminder(initialTpl.message, reminder));
    } else {
      setSelectedTemplateId('');
      setCustomMessage('');
    }

    setIsCopied(false);
    setIsWhatsAppModalOpen(true);
  };

  // Handle Changing Selected Template in Send Modal
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find(t => t.id === templateId);
    if (tpl && whatsAppReminder) {
      setCustomMessage(applyTemplateToReminder(tpl.message, whatsAppReminder));
    }
  };

  // Template Manager Handlers
  const handleOpenTemplateManager = () => {
    setEditingTemplate(null);
    setTemplateFormData({
      name: '',
      type: 'all',
      message: '',
    });
    setIsTemplateManagerOpen(true);
  };

  const handleEditTemplate = (tpl: WhatsAppTemplate) => {
    setEditingTemplate(tpl);
    setTemplateFormData({
      name: tpl.name,
      type: tpl.type,
      message: tpl.message,
    });
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFormData.name.trim() || !templateFormData.message.trim()) {
      alert('Template name and message are required.');
      return;
    }

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? {
        ...t,
        name: templateFormData.name.trim(),
        type: templateFormData.type,
        message: templateFormData.message.trim(),
      } : t));
    } else {
      const newTpl: WhatsAppTemplate = {
        id: `tpl-${Date.now()}`,
        name: templateFormData.name.trim(),
        type: templateFormData.type,
        message: templateFormData.message.trim(),
      };
      setTemplates(prev => [...prev, newTpl]);
    }

    setEditingTemplate(null);
    setTemplateFormData({ name: '', type: 'all', message: '' });
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this WhatsApp template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (editingTemplate && editingTemplate.id === id) {
        setEditingTemplate(null);
        setTemplateFormData({ name: '', type: 'all', message: '' });
      }
    }
  };

  // Send WhatsApp message directly via WhatsApp API link
  const handleSendWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!whatsAppReminder) return;

    const cleanPhone = (whatsAppPhone || '').replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (!cleanPhone) {
      alert('Please enter a valid WhatsApp phone number.');
      return;
    }

    // Save phone number if updated
    if (whatsAppPhone !== whatsAppReminder.phone) {
      updatePaymentReminder(whatsAppReminder.id, { phone: whatsAppPhone });
    }

    const waUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(customMessage)}`;
    window.open(waUrl, '_blank');
    setIsWhatsAppModalOpen(false);
  };

  // Copy customized text to clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Payment Reminders & Schedule</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <CalendarDays className="w-3 h-3" />
                  Monthly View
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track monthly receivables vs payables and send WhatsApp reminder alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector Filter Dropdown */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
            <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2 mr-1.5 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 py-1.5 pr-3 pl-1 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                📅 All Months (Full History)
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  📅 {formatMonthLabel(m)} {m === todayStr.substring(0, 7) ? '(Current Month)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Image Templates Studio Button */}
          <Button
            variant="outline"
            onClick={() => setActiveTab('image_templates')}
            className={`gap-1.5 text-xs cursor-pointer shadow-2xs ${
              activeTab === 'image_templates'
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:text-white'
                : 'border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image Studio (10 Templates)</span>
          </Button>

          {/* WhatsApp Templates Configuration Button */}
          <Button
            variant="outline"
            onClick={handleOpenTemplateManager}
            className="gap-1.5 text-xs border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shadow-2xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WA Templates</span>
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reminder</span>
          </Button>
        </div>
      </div>

      {/* Monthly Net Position Banner (Kitne Lene Hai vs Kitne Dene Hai) */}
      <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                {selectedMonth === 'all' ? 'Overall Treasury Position' : `${formatMonthLabel(selectedMonth)} Summary`}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                ({monthFilteredReminders.length} scheduled reminders)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> To Collect: <strong>{formatCurrency(totalToCollect, currentCompany.currency)}</strong>
              </span>
              <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> To Pay: <strong>{formatCurrency(totalToPay, currentCompany.currency)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900/90 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Net Expected Surplus / (Deficit)
            </span>
            <span className={`text-base font-bold font-mono ${netCashflowPosition >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {netCashflowPosition >= 0 ? '+' : ''}{formatCurrency(netCashflowPosition, currentCompany.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* To Collect (Receivables) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>To Collect</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(totalToCollect, currentCompany.currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {selectedMonth === 'all' ? 'Total customer & party dues' : `Expected inflow in ${formatMonthLabel(selectedMonth)}`}
          </p>
        </div>

        {/* To Pay (Payables) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>To Pay</span>
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(totalToPay, currentCompany.currency)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {selectedMonth === 'all' ? 'Total vendor bills & obligations' : `Scheduled payout in ${formatMonthLabel(selectedMonth)}`}
          </p>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Overdue Reminders</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {overdueCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Passed due date requiring follow-up</p>
        </div>

        {/* Upcoming Pending */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Pending Scheduled</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {completedCount > 0 ? `${completedCount} already paid/completed` : 'Awaiting due date fulfillment'}
          </p>
        </div>
      </div>

      {/* Monthly Comparative Graphical Analytics (Savings / Collect vs Spend / Pay) */}
      <MonthlyReminderCashflowChart 
        reminders={remindersWithComputedStatus}
        selectedMonth={selectedMonth}
        onSelectMonth={(monthKey) => setSelectedMonth(monthKey)}
      />

      {/* Tabs and Search Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            All ({monthFilteredReminders.length})
          </button>
          <button
            onClick={() => setActiveTab('to_collect')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'to_collect'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            To Collect
          </button>
          <button
            onClick={() => setActiveTab('to_pay')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'to_pay'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            To Pay
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'overdue'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${activeTab === 'paid'
              ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setActiveTab('image_templates')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'image_templates'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Image Templates ({CARD_TEMPLATES.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party, title, ref..."
            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* DEDICATED IMAGE TEMPLATES SECTION */}
      {activeTab === 'image_templates' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-950/20 via-slate-900 to-indigo-950/30 p-6 rounded-3xl border border-purple-500/20 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Template Studio
                  </span>
                  <span className="text-xs text-slate-400 font-mono">10 Curated Styles</span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  Payment Reminder & Receipt Image Templates
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                  Select any design archetype below to open our drag & drop canvas studio. Every template includes dynamic UPI QR code generator, customizable typography, and high-res PNG export.
                </p>
              </div>

              {reminders.length > 0 && (
                <Button
                  onClick={() => handleOpenImageModal(reminders[0])}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2 text-xs cursor-pointer shrink-0 shadow-lg shadow-purple-950"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Full Canvas Studio</span>
                </Button>
              )}
            </div>

            {/* Grid of 10 Visual Card Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
              {CARD_TEMPLATES.map((tpl) => {
                const sampleReminder = reminders[0] || {
                  id: 'sample',
                  company_id: currentCompany.id,
                  party_id: 'p1',
                  party_name: 'Acme Enterprises',
                  reminder_type: 'to_collect',
                  title: 'Invoice Settlement',
                  amount: 45000,
                  due_date: new Date().toISOString().split('T')[0],
                  status: 'pending',
                  invoice_ref: 'INV-2026-089',
                  phone: '9876543210',
                  notes: 'Annual Maintenance Service',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as PaymentReminder;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleOpenImageModal(sampleReminder, tpl.id)}
                    className="group bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-purple-500/60 p-4 transition-all hover:scale-[1.02] cursor-pointer shadow-lg hover:shadow-purple-950/50 flex flex-col justify-between"
                  >
                    <div>
                      {/* Mini Visual Preview Card Mock */}
                      <div
                        className={`h-40 rounded-xl bg-gradient-to-br ${tpl.previewBg} p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden shadow-inner mb-3`}
                      >
                        <div
                          className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl opacity-50 pointer-events-none"
                          style={{ backgroundColor: tpl.accent }}
                        />

                        <div className="flex items-center justify-between text-[10px] z-10">
                          <span className="font-extrabold truncate text-white">{currentCompany.name}</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                            style={{ backgroundColor: `${tpl.accent}30`, color: tpl.accent }}
                          >
                            STATEMENT
                          </span>
                        </div>

                        <div className="text-center z-10">
                          <span className="text-[9px] uppercase tracking-widest text-slate-300 block font-semibold">
                            Total Due
                          </span>
                          <span
                            className="text-lg font-black font-mono block"
                            style={{ color: tpl.accent }}
                          >
                            {formatCurrency(45000, currentCompany.currency)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-slate-400 z-10 pt-1 border-t border-white/10">
                          <span>Client: Acme Enterprises</span>
                          <span className="font-mono uppercase font-bold text-white">SCAN UPI QR</span>
                        </div>
                      </div>

                      {/* Template Details */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-white group-hover:text-purple-400 transition-colors">
                            {tpl.name}
                          </h4>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {tpl.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tpl.aspectRatio}
                      </span>
                      <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                        <span>Use Template</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reminders List Table / Grid */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <BellRing className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No payment reminders found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search criteria or switch filter tabs.' : 'Create your first payment reminder to keep track of upcoming collections and vendor dues.'}
          </p>
          {!searchQuery && (
            <Button onClick={handleOpenCreateModal} className="mt-4 gap-2 text-xs" size="sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Reminder</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReminders.map((reminder) => {
            const isOverdue = reminder.status === 'overdue';
            const isPaid = reminder.status === 'paid';
            const isCollect = reminder.reminder_type === 'to_collect';

            return (
              <div
                key={reminder.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${isOverdue
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                  : isPaid
                    ? 'border-slate-200 dark:border-slate-800 opacity-75'
                    : isCollect
                      ? 'border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-rose-500/40'
                  }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isCollect
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      }`}>
                      {isCollect ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {isCollect ? 'To Collect' : 'To Pay'}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isPaid
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                      : isOverdue
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 animate-pulse'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      }`}>
                      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {reminder.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Amount */}
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">
                    {reminder.title}
                  </h3>

                  <div className="mt-2.5 flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Amount</span>
                    <span className={`text-lg font-bold font-mono ${isCollect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                      {formatCurrency(reminder.amount, currentCompany.currency)}
                    </span>
                  </div>

                  {/* Party and Date details */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    {reminder.party_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> Party:
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{reminder.party_name}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Due Date:
                      </span>
                      <span className={`font-medium ${isOverdue ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
                        {formatDate(reminder.due_date)}
                      </span>
                    </div>

                    {reminder.invoice_ref && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500">Ref / Invoice:</span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{reminder.invoice_ref}</span>
                      </div>
                    )}

                    {reminder.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 line-clamp-2">
                        "{reminder.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Mark as Paid / Pending Toggle */}
                    <button
                      onClick={() => {
                        if (isPaid) {
                          markPaymentReminderStatus(reminder.id, 'pending');
                        } else {
                          handleOpenSettleModal(reminder);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${isPaid
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                        }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPaid ? 'Unmark' : 'Mark Paid'}</span>
                    </button>

                    {/* Direct WhatsApp Action Button */}
                    <button
                      onClick={() => handleOpenWhatsAppModal(reminder)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Visual Image Card Generator Button */}
                    <button
                      onClick={() => handleCardImageButtonClick(reminder)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer active:scale-95 border border-blue-200 dark:border-blue-800/80"
                      title="Generate Customized Visual Image Template with QR Code"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Card Image</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(reminder)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit reminder"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this payment reminder?')) {
                          deletePaymentReminder(reminder.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Reminder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReminder ? 'Edit Payment Reminder' : 'Create New Payment Reminder'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reminder Type: To Collect or To Pay */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reminder Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, reminder_type: 'to_collect' }))}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${formData.reminder_type === 'to_collect'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                  }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>To Collect (Receivable)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, reminder_type: 'to_pay' }))}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${formData.reminder_type === 'to_pay'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                  }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>To Pay (Vendor Bill)</span>
              </button>
            </div>
          </div>

          {/* Quick Select Party */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Party (Optional - auto fills phone & balance)
            </label>
            <select
              value={formData.party_id}
              onChange={(e) => handlePartySelect(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">-- Choose Party or Enter Manually --</option>
              {parties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type}) {p.phone ? `• ${p.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reminder Title / Description *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. March Maintenance invoice collection"
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({currentCompany.currency_symbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Party Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Party / Customer Name
              </label>
              <input
                type="text"
                value={formData.party_name}
                onChange={(e) => setFormData(prev => ({ ...prev, party_name: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Invoice Ref & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice / Reference No
              </label>
              <input
                type="text"
                value={formData.invoice_ref}
                onChange={(e) => setFormData(prev => ({ ...prev, invoice_ref: e.target.value }))}
                placeholder="e.g. INV-2026-084"
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional reminders or terms discussed..."
              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {editingReminder ? 'Save Changes' : 'Create Reminder'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Settle Payment & Record Transaction Entry Modal */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSettlingReminder(null);
        }}
        title={settlingReminder?.reminder_type === 'to_collect' ? 'Record Receipt & Mark as Paid' : 'Record Payment & Mark as Paid'}
      >
        {settlingReminder && (
          <form onSubmit={handleConfirmSettlement} className="space-y-4">
            {/* Reminder Summary Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              settlingReminder.reminder_type === 'to_collect'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
            }`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  settlingReminder.reminder_type === 'to_collect' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {settlingReminder.reminder_type === 'to_collect' ? 'Collection Receipt' : 'Vendor Payment'}
                </span>
                <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                  {settlingReminder.title}
                </p>
                {settlingReminder.party_name && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Party: <span className="font-medium text-slate-700 dark:text-slate-300">{settlingReminder.party_name}</span>
                  </p>
                )}
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">Due Amount</span>
                <span className={`text-base font-bold ${
                  settlingReminder.reminder_type === 'to_collect' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {formatCurrency(settlingReminder.amount, currentCompany.currency)}
                </span>
              </div>
            </div>

            {/* Account Selector (Cash or Bank) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Select Account (Cash / Bank Ledger) *</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-normal">
                  Auto-posts to Cash Book / Bank Book
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                {accounts.map(acc => {
                  const isSelected = settlementData.accountId === acc.id;
                  const isCash = acc.type === 'cash';
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSettlementData(prev => ({ ...prev, accountId: acc.id }))}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 ring-1 ring-blue-600 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isCash ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {isCash ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">{acc.type} account</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fallback Select dropdown if multiple accounts */}
              <select
                required
                value={settlementData.accountId}
                onChange={(e) => setSettlementData(prev => ({ ...prev, accountId: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- Choose Cash or Bank Account --</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type.toUpperCase()}) {a.account_number ? `• ${a.account_number}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Settle Amount & Payment Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Settlement Amount ({currentCompany.currency_symbol}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settlementData.amount}
                  onChange={(e) => setSettlementData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={settlementData.paymentDate}
                  onChange={(e) => setSettlementData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reference No / UTR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Voucher No
                </label>
                <input
                  type="text"
                  value={settlementData.referenceNo}
                  onChange={(e) => setSettlementData(prev => ({ ...prev, referenceNo: e.target.value }))}
                  placeholder="e.g. INV-9912 / REC-01"
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  UTR / Cheque No (If Bank)
                </label>
                <input
                  type="text"
                  value={settlementData.utrNo}
                  onChange={(e) => setSettlementData(prev => ({ ...prev, utrNo: e.target.value }))}
                  placeholder="e.g. CMS290192810"
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Narration / Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transaction Narration
              </label>
              <input
                type="text"
                value={settlementData.narration}
                onChange={(e) => setSettlementData(prev => ({ ...prev, narration: e.target.value }))}
                className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSettlingReminder(null);
                }}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className={`text-xs text-white cursor-pointer ${
                  settlingReminder.reminder_type === 'to_collect'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {settlingReminder.reminder_type === 'to_collect' ? 'Post Receipt & Settle' : 'Post Payment & Settle'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Choose Template & Send WhatsApp Modal (Simplified) */}
      {whatsAppReminder && (
        <Modal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setWhatsAppReminder(null);
          }}
          title="Select WhatsApp Template"
        >
          <form onSubmit={handleSendWhatsApp} className="space-y-4">
            {/* Target Party and Phone Summary */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              whatsAppReminder.reminder_type === 'to_collect'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div>
                <p className="text-xs font-bold">{whatsAppReminder.party_name || whatsAppReminder.title}</p>
                <p className="text-[11px] opacity-80 flex items-center gap-1 mt-0.5 font-mono">
                  <Phone className="w-3 h-3" />
                  <span>{whatsAppPhone || 'No number saved'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold">
                  {formatCurrency(whatsAppReminder.amount, currentCompany.currency)}
                </p>
                <span className="text-[10px] font-semibold opacity-75">
                  Due: {formatDate(whatsAppReminder.due_date)}
                </span>
              </div>
            </div>

            {/* Template Chooser as interactive selectable cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Select Template to Send:</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsWhatsAppModalOpen(false);
                    handleOpenTemplateManager();
                  }}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Manage Templates</span>
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {templates
                  .filter((tpl) => tpl.type === 'all' || tpl.type === whatsAppReminder.reminder_type)
                  .map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/50'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-400 dark:border-slate-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {tpl.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                              {tpl.message.slice(0, 70)}...
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          tpl.type === 'to_collect'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : tpl.type === 'to_pay'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {tpl.type === 'to_collect' ? 'Receivable' : tpl.type === 'to_pay' ? 'Payable' : 'General'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsWhatsAppModalOpen(false);
                  setWhatsAppReminder(null);
                }}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!selectedTemplateId}
                className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* WhatsApp Template Management Modal (Alag Section to Add/Edit/Customize Templates) */}
      <Modal
        isOpen={isTemplateManagerOpen}
        onClose={() => {
          setIsTemplateManagerOpen(false);
          setEditingTemplate(null);
        }}
        title="WhatsApp Reminder Templates Manager"
      >
        <div className="space-y-6">
          {/* Create / Edit Template Form */}
          <form onSubmit={handleSaveTemplate} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5 text-emerald-500" />
                <span>{editingTemplate ? 'Edit Template' : 'Add New Template'}</span>
              </h4>
              {editingTemplate && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateFormData({ name: '', type: 'all', message: '' });
                  }}
                  className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. 7 Days Overdue Notice"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Applies To
                </label>
                <select
                  value={templateFormData.type}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="all">All Reminders (General)</option>
                  <option value="to_collect">To Collect (Receivables / Customers)</option>
                  <option value="to_pay">To Pay (Payables / Vendors)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Template Body *
              </label>
              <textarea
                rows={4}
                required
                value={templateFormData.message}
                onChange={(e) => setTemplateFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Use tags like {party_name}, {amount}, {due_date}, {company_name}, {invoice_ref}..."
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px] leading-relaxed resize-y"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Available Placeholders: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{'{party_name}'}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{'{amount}'}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{'{due_date}'}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{'{company_name}'}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">{'{invoice_ref}'}</code>
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {editingTemplate ? 'Update Template' : 'Add Template'}
              </Button>
            </div>
          </form>

          {/* List of Saved Templates */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
              <span>Saved WhatsApp Templates ({templates.length})</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all templates to system defaults?')) {
                    setTemplates(DEFAULT_TEMPLATES);
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
              >
                Reset to Defaults
              </button>
            </h4>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{tpl.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          tpl.type === 'to_collect'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : tpl.type === 'to_pay'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {tpl.type === 'to_collect' ? 'Receivable' : tpl.type === 'to_pay' ? 'Payable' : 'All Types'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-mono whitespace-pre-wrap">
                        {tpl.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(tpl)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsTemplateManagerOpen(false)}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Template Picker Prompt Modal */}
      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => {
          setIsTemplatePickerOpen(false);
          setTemplatePickerReminder(null);
        }}
        reminder={templatePickerReminder}
        company={currentCompany}
        onSelectTemplate={(templateId, action) => {
          if (templatePickerReminder) {
            handleOpenImageModal(
              templatePickerReminder,
              templateId,
              action === 'customize' ? 'design' : 'templates',
              action === 'whatsapp'
            );
          }
        }}
      />

      {/* Visual Image Template Customizer Studio Modal */}
      <ReminderImageModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImageModalReminder(null);
          setSelectedImageTemplateId(null);
          setAutoSendWhatsAppImage(false);
        }}
        reminder={imageModalReminder}
        company={currentCompany}
        initialTemplateId={selectedImageTemplateId}
        initialTab={imageModalTab}
        autoSendWhatsApp={autoSendWhatsAppImage}
      />
    </div>
  );
}
