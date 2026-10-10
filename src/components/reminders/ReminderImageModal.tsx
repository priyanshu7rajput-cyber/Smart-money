'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { PaymentReminder, Company } from '@/types/database';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import {
  Download,
  Copy,
  QrCode,
  Palette,
  Type,
  Check,
  Eye,
  Sliders,
  Move,
  Plus,
  Trash2,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Layers,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Ratio,
  Square,
  RectangleVertical,
  RectangleHorizontal,
  EyeOff,
  CornerDownRight,
  Sun,
  Moon,
  Brush,
  CornerRightDown,
  Lock,
  Unlock,
  ShieldCheck,
  Sticker,
  Landmark,
  Share2,
  MessageCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Percent,
  Receipt
} from 'lucide-react';

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  tax: number;
}

interface ReminderImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: PaymentReminder | null;
  company: Company;
  initialTemplateId?: string | null;
  initialTab?: 'templates' | 'design' | 'elements' | 'presets' | 'invoice';
  autoSendWhatsApp?: boolean;
}

export type CardTheme =
  | 'emerald_gradient'
  | 'midnight_purple'
  | 'royal_blue'
  | 'crimson_sunset'
  | 'cyber_neon'
  | 'luxury_gold'
  | 'sleek_dark'
  | 'clean_minimal'
  | 'frosted_glass'
  | 'corporate_navy'
  | 'neon_matrix'
  | 'sunset_orange'
  | 'rosegold_glam'
  | 'monochrome_bold'
  | 'warm_parchment'
  | 'slate_blueprint';

export type CardFont = 'font-sans' | 'font-serif' | 'font-mono';
export type AspectRatioType = 'portrait' | 'square' | 'story' | 'landscape';
export type CardPattern = 'none' | 'dots' | 'grid' | 'mesh' | 'waves' | 'circuit' | 'diagonal' | 'stars';

export interface CardTemplatePreset {
  id: string;
  name: string;
  category: 'Modern' | 'Corporate' | 'Minimal' | 'Creative' | 'Tech';
  description: string;
  theme: CardTheme;
  accent: string;
  font: CardFont;
  aspectRatio: AspectRatioType;
  borderRadius: number;
  pattern: CardPattern;
  badgeLabel?: string;
  headerTitle?: string;
  previewBg: string;
  elements: CanvasElement[];
}

// Dynamic Draggable & Resizable Canvas Element
export interface CanvasElement {
  id: string;
  type:
    | 'header'
    | 'parties'
    | 'amount'
    | 'qr'
    | 'footer'
    | 'badge_stamp'
    | 'custom_text'
    | 'custom_image'
    | 'divider';
  x: number; // in percentage relative to card width
  y: number; // in percentage relative to card height
  scale?: number; // element size multiplier (0.5 to 2.0)
  text?: string;
  imageUrl?: string;
  fontSize?: number;
  textColor?: string;
  bgColor?: string;
  width?: number; // width override in % or px
  visible: boolean;
  locked?: boolean;
}

// 10 HIGHLY DISTINCT, UNIQUE PROFESSIONAL DESIGN TEMPLATES
export const CARD_TEMPLATES: CardTemplatePreset[] = [
  {
    id: 'tpl_1_executive_fintech',
    name: '1. Executive Emerald Card',
    category: 'Modern',
    description: 'Deep jewel emerald gradient with mesh glow, glowing border and dynamic scan-to-pay QR.',
    theme: 'emerald_gradient',
    accent: '#10b981',
    font: 'font-sans',
    aspectRatio: 'portrait',
    borderRadius: 24,
    pattern: 'mesh',
    headerTitle: 'OFFICIAL PAYMENT REMINDER',
    previewBg: 'from-slate-950 via-emerald-950 to-slate-900',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 64, y: 66, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
    ]
  },
  {
    id: 'tpl_2_qr_first_speedpay',
    name: '2. Rapid UPI Hero Scan',
    category: 'Tech',
    description: 'High-contrast cyan tech layout centered around oversized QR code for instant scan.',
    theme: 'cyber_neon',
    accent: '#06b6d4',
    font: 'font-mono',
    aspectRatio: 'portrait',
    borderRadius: 16,
    pattern: 'circuit',
    headerTitle: 'INSTANT UPI SETTLEMENT',
    previewBg: 'from-slate-950 via-cyan-950 to-slate-900',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 0.95, visible: true },
      { id: 'el-qr', type: 'qr', x: 33, y: 22, scale: 1.25, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 56, scale: 1.05, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 76, scale: 0.9, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 88, scale: 0.85, visible: true }
    ]
  },
  {
    id: 'tpl_3_corporate_invoice_receipt',
    name: '3. Corporate Ledger Navy',
    category: 'Corporate',
    description: 'Structured enterprise statement with serif typography, subtle grid lines and tax details.',
    theme: 'corporate_navy',
    accent: '#38bdf8',
    font: 'font-serif',
    aspectRatio: 'portrait',
    borderRadius: 14,
    pattern: 'grid',
    headerTitle: 'TAX INVOICE STATEMENT',
    previewBg: 'from-slate-950 via-slate-900 to-blue-950',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 20, scale: 1.05, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 42, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 68, scale: 0.95, visible: true },
      { id: 'el-qr', type: 'qr', x: 65, y: 65, scale: 1, visible: true }
    ]
  },
  {
    id: 'tpl_4_royal_gold_luxury',
    name: '4. Royal Amber VIP',
    category: 'Creative',
    description: 'Prestige dark gold background with golden borders and prominent luxury amount display.',
    theme: 'luxury_gold',
    accent: '#f59e0b',
    font: 'font-serif',
    aspectRatio: 'portrait',
    borderRadius: 28,
    pattern: 'stars',
    headerTitle: 'VIP CLIENT STATEMENT',
    previewBg: 'from-amber-950 via-stone-950 to-slate-950',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 22, scale: 1.15, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 48, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 64, y: 67, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 72, scale: 0.95, visible: true }
    ]
  },
  {
    id: 'tpl_5_clean_studio_minimal',
    name: '5. Clean Paper Studio (Light)',
    category: 'Minimal',
    description: 'Minimalist white paper texture with crisp dark typography for WhatsApp & printing.',
    theme: 'clean_minimal',
    accent: '#0284c7',
    font: 'font-sans',
    aspectRatio: 'portrait',
    borderRadius: 16,
    pattern: 'dots',
    headerTitle: 'PAYMENT ADVICE',
    previewBg: 'from-slate-100 via-white to-slate-200 text-slate-900',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 63, y: 66, scale: 1.05, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
    ]
  },
  {
    id: 'tpl_6_midnight_neon_violet',
    name: '6. Cyber Neon Violet',
    category: 'Modern',
    description: 'Electric violet-purple gradient with futuristic glowing accents and bold typography.',
    theme: 'midnight_purple',
    accent: '#c084fc',
    font: 'font-sans',
    aspectRatio: 'portrait',
    borderRadius: 26,
    pattern: 'mesh',
    headerTitle: 'DIGITAL BILLING NOTICE',
    previewBg: 'from-slate-950 via-purple-950 to-indigo-950',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1.05, visible: true },
      { id: 'el-qr', type: 'qr', x: 64, y: 66, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
    ]
  },
  {
    id: 'tpl_7_urgent_crimson_due',
    name: '7. Priority Crimson Notice',
    category: 'Creative',
    description: 'High visibility urgent crimson rose styling with top alert banner for overdue accounts.',
    theme: 'crimson_sunset',
    accent: '#fb7185',
    font: 'font-sans',
    aspectRatio: 'portrait',
    borderRadius: 20,
    pattern: 'diagonal',
    headerTitle: 'URGENT: OVERDUE SETTLEMENT',
    previewBg: 'from-slate-950 via-rose-950 to-amber-950',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 0.95, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 22, scale: 1.1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 48, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 63, y: 68, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 72, scale: 0.95, visible: true }
    ]
  },
  {
    id: 'tpl_8_glassmorphism_frost',
    name: '8. Frosted Translucent Glass',
    category: 'Modern',
    description: 'Ultra-modern frosted glass panels with dynamic ambient waves and glowing glass borders.',
    theme: 'frosted_glass',
    accent: '#818cf8',
    font: 'font-sans',
    aspectRatio: 'portrait',
    borderRadius: 32,
    pattern: 'waves',
    headerTitle: 'ACCOUNTS ADVISORY',
    previewBg: 'from-slate-900 via-indigo-950/80 to-slate-950',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 64, y: 66, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
    ]
  },
  {
    id: 'tpl_9_matrix_tech_terminal',
    name: '9. Cyber Terminal (Dark Tech)',
    category: 'Tech',
    description: 'Matrix terminal dark aesthetic with terminal prompt, neon green accents & mono code fonts.',
    theme: 'neon_matrix',
    accent: '#4ade80',
    font: 'font-mono',
    aspectRatio: 'portrait',
    borderRadius: 10,
    pattern: 'circuit',
    headerTitle: 'PAYMENT_PROTOCOL_V2',
    previewBg: 'from-black via-zinc-950 to-slate-950',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1.05, visible: true },
      { id: 'el-qr', type: 'qr', x: 64, y: 66, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
    ]
  },
  {
    id: 'tpl_10_sunset_warm_gradient',
    name: '10. Sunset Warm Horizon',
    category: 'Creative',
    description: 'Warm fiery orange and golden horizon gradient with vibrant rounded cards.',
    theme: 'sunset_orange',
    accent: '#fb923c',
    font: 'font-sans',
    aspectRatio: 'portrait',
    borderRadius: 24,
    pattern: 'mesh',
    headerTitle: 'SETTLEMENT ADVICE',
    previewBg: 'from-slate-950 via-orange-950 to-stone-900',
    elements: [
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 64, y: 66, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
    ]
  }
];

export function ReminderImageModal({
  isOpen,
  onClose,
  reminder,
  company,
  initialTemplateId,
  initialTab = 'templates',
  autoSendWhatsApp = false
}: ReminderImageModalProps) {
  const { accounts } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter bank accounts with configured UPI IDs
  const bankAccountsWithUpi = accounts.filter(
    (a) => a.type === 'bank' && a.upi_id && a.upi_id.trim().length > 0 && a.status === 'active'
  );

  // Customization Options
  const [theme, setTheme] = useState<CardTheme>('emerald_gradient');
  const [fontFamily, setFontFamily] = useState<CardFont>('font-sans');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('portrait');
  const [cardBorderRadius, setCardBorderRadius] = useState<number>(24);
  const [cardPadding, setCardPadding] = useState<number>(24);
  const [cardPattern, setCardPattern] = useState<CardPattern>('mesh');
  const [showQrCode, setShowQrCode] = useState(true);
  const [customUpiId, setCustomUpiId] = useState('');
  const [customFooterNote, setCustomFooterNote] = useState('Thank you for your business!');
  const [customHeaderTitle, setCustomHeaderTitle] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [bgAccent, setBgAccent] = useState('#10b981'); // Customizable Accent Color
  const [showWatermark, setShowWatermark] = useState(true);
  const [activeTab, setActiveTab] = useState<'templates' | 'design' | 'elements' | 'presets' | 'invoice'>(initialTab);

  // Structured Invoice & Itemized Breakdown State (As requested by user screenshot)
  const [useItemizedInvoice, setUseItemizedInvoice] = useState(false);
  const [billToName, setBillToName] = useState('');
  const [billToEmail, setBillToEmail] = useState('');
  const [billToAddress, setBillToAddress] = useState('');
  const [billFromAddress, setBillFromAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState(company.currency || 'USD');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: 'item-1', description: 'Design & Consultation Services', qty: 1, rate: 0, tax: 0 }
  ]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  // Advanced Canvas Studio State: Freeform Drag & Drop & Element Sizing
  const [dragMode, setDragMode] = useState<boolean>(false);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Apply Template Preset
  const handleApplyTemplate = (tpl: CardTemplatePreset) => {
    setTheme(tpl.theme);
    setBgAccent(tpl.accent);
    setFontFamily(tpl.font);
    setAspectRatio(tpl.aspectRatio);
    setCardBorderRadius(tpl.borderRadius);
    setCardPattern(tpl.pattern || 'none');
    if (tpl.headerTitle) setCustomHeaderTitle(tpl.headerTitle);
    setElements(JSON.parse(JSON.stringify(tpl.elements)));
  };

  // Initialize Elements when modal opens / reminder changes
  useEffect(() => {
    if (reminder) {
      const isCol = reminder.reminder_type === 'to_collect';
      setCustomHeaderTitle(isCol ? 'OFFICIAL PAYMENT REMINDER' : 'PAYMENT ADVICE / RECEIPT');
      setCustomFooterNote(
        isCol
          ? 'Please scan UPI QR to pay or contact accounts department.'
          : 'This is an official payment confirmation advice.'
      );
      const firstBankUpi = accounts.find((a) => a.type === 'bank' && a.upi_id && a.upi_id.trim().length > 0)?.upi_id;
      setCustomUpiId(firstBankUpi || company.tax_id || 'business@upi');

      // Populate structured invoice fields from reminder & company
      setBillToName(reminder.party_name || '');
      setBillToEmail('');
      setBillToAddress(reminder.phone ? `Phone: ${reminder.phone}` : '');
      setBillFromAddress(`${company.name}, Head Office`);
      setInvoiceNumber(reminder.invoice_ref || `#INV-${reminder.id.slice(0, 5).toUpperCase()}`);
      setIssueDate(formatDate(reminder.created_at || new Date().toISOString()));
      setDueDate(formatDate(reminder.due_date));
      setCurrencySymbol(company.currency || 'USD');
      setLineItems([
        {
          id: 'item-1',
          description: reminder.title || 'Professional Services',
          qty: 1,
          rate: Number(reminder.amount) || 0,
          tax: 0
        }
      ]);

      // If a specific template was requested, apply it
      if (initialTemplateId) {
        const found = CARD_TEMPLATES.find((t) => t.id === initialTemplateId);
        if (found) {
          handleApplyTemplate(found);
          return;
        }
      }

      setTheme(isCol ? 'emerald_gradient' : 'midnight_purple');
      setBgAccent(isCol ? '#10b981' : '#8b5cf6');
      setCardPattern(isCol ? 'mesh' : 'waves');

      // Setup initial customizable blocks with clean non-overlapping layout (no badge stamp by default)
      setElements([
        { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
        { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
        { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1, visible: true },
        { id: 'el-qr', type: 'qr', x: 64, y: 66, scale: 1, visible: true },
        { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true }
      ]);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [reminder, company, initialTemplateId, initialTab]);

  // Global mouse up event listener to release any active dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDraggingElementId(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Generate UPI QR Code
  useEffect(() => {
    if (!reminder || !showQrCode) return;

    const upiTarget = customUpiId.trim() || 'business@upi';
    const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiTarget)}&pn=${encodeURIComponent(
      company.name
    )}&am=${reminder.amount}&cu=INR&tn=${encodeURIComponent(reminder.invoice_ref || reminder.title)}`;

    QRCode.toDataURL(upiPayUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [reminder, showQrCode, customUpiId, company.name]);

  const isCollect = reminder?.reminder_type === 'to_collect';
  const formattedAmt = reminder ? formatCurrency(reminder.amount, company.currency) : '';

  // Aspect Ratio Dimensions helper
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'portrait':
        return 'w-full max-w-[460px] min-h-[520px] sm:min-h-[580px] h-[540px] sm:h-[580px]';
      case 'square':
        return 'w-full max-w-[460px] min-h-[420px] sm:min-h-[480px] h-[440px] sm:h-[480px]';
      case 'story':
        return 'w-full max-w-[380px] min-h-[580px] sm:min-h-[640px] h-[600px] sm:h-[640px]';
      case 'landscape':
        return 'w-full max-w-[540px] min-h-[380px] sm:min-h-[420px] h-[400px] sm:h-[420px]';
    }
  };

  // Theme Styles Definition (All 14 Themes)
  const getThemeStyles = () => {
    switch (theme) {
      case 'emerald_gradient':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white border-emerald-500/40',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          accentText: 'text-emerald-400',
          amountBg: 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-950/40',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-emerald-950/50 border border-emerald-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'midnight_purple':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white border-purple-500/40',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          accentText: 'text-purple-400',
          amountBg: 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-950/40',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-purple-950/50 border border-purple-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'royal_blue':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 text-white border-blue-500/40',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          accentText: 'text-blue-400',
          amountBg: 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-950/40',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-blue-950/50 border border-blue-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'crimson_sunset':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-rose-950 to-amber-950 text-white border-rose-500/40',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accentText: 'text-rose-400',
          amountBg: 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-950/40',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-rose-950/50 border border-rose-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'cyber_neon':
        return {
          container: 'bg-slate-950 text-cyan-50 border-cyan-400/50 shadow-cyan-900/50 shadow-2xl',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          accentText: 'text-cyan-400',
          amountBg: 'bg-cyan-950/40 border-cyan-400/40 shadow-xl shadow-cyan-950/50',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-cyan-950/50 border border-cyan-400',
          cardBlock: 'bg-cyan-950/20 border border-cyan-500/20'
        };
      case 'corporate_navy':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 border-blue-400/30 shadow-2xl',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
          accentText: 'text-sky-400',
          amountBg: 'bg-blue-950/30 border-blue-400/25',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl border border-blue-400/30',
          cardBlock: 'bg-slate-900/60 border border-slate-800'
        };
      case 'neon_matrix':
        return {
          container: 'bg-black text-emerald-100 border-emerald-500/50 shadow-2xl shadow-emerald-950/80 font-mono',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          accentText: 'text-emerald-400',
          amountBg: 'bg-emerald-950/30 border-emerald-500/40',
          qrWrapper: 'bg-white p-2 rounded-xl shadow-lg border border-emerald-400',
          cardBlock: 'bg-emerald-950/15 border border-emerald-500/20'
        };
      case 'sunset_orange':
        return {
          container: 'bg-gradient-to-br from-slate-950 via-orange-950 to-stone-900 text-white border-orange-500/40',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          accentText: 'text-orange-400',
          amountBg: 'bg-orange-500/10 border-orange-500/30 shadow-lg',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl border border-orange-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'rosegold_glam':
        return {
          container: 'bg-gradient-to-br from-stone-950 via-pink-950 to-rose-950 text-pink-50 border-pink-400/40',
          badge: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
          accentText: 'text-pink-400',
          amountBg: 'bg-pink-500/10 border-pink-400/30',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl border border-pink-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'monochrome_bold':
        return {
          container: 'bg-black text-white border-white/30 shadow-2xl',
          badge: 'bg-white/15 text-white border-white/30',
          accentText: 'text-white',
          amountBg: 'bg-white/10 border-white/20',
          qrWrapper: 'bg-white p-2 rounded-xl shadow-xl border border-white/50',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'frosted_glass':
        return {
          container: 'bg-slate-900/90 backdrop-blur-xl text-slate-100 border-white/20 shadow-2xl',
          badge: 'bg-white/10 text-white border-white/20',
          accentText: 'text-emerald-400',
          amountBg: 'bg-white/10 backdrop-blur-md border-white/15',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl border border-white/30',
          cardBlock: 'bg-white/5 backdrop-blur-sm border border-white/10'
        };
      case 'luxury_gold':
        return {
          container: 'bg-gradient-to-br from-amber-950 via-slate-950 to-stone-950 text-amber-50 border-amber-500/50',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accentText: 'text-amber-400',
          amountBg: 'bg-amber-500/10 border-amber-500/30',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-amber-950/50 border border-amber-400/30',
          cardBlock: 'bg-white/5 border border-white/10'
        };
      case 'sleek_dark':
        return {
          container: 'bg-slate-950 text-slate-100 border-slate-700/80',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          accentText: 'text-slate-300',
          amountBg: 'bg-slate-900 border-slate-800',
          qrWrapper: 'bg-white p-2 rounded-2xl shadow-xl shadow-black/60 border border-slate-300',
          cardBlock: 'bg-slate-900/80 border border-slate-800'
        };
      case 'clean_minimal':
      default:
        return {
          container: 'bg-white text-slate-900 border-slate-300 shadow-2xl',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          accentText: 'text-blue-600',
          amountBg: 'bg-slate-50 border-slate-200',
          qrWrapper: 'bg-slate-50 p-2 rounded-2xl shadow-md border border-slate-200',
          cardBlock: 'bg-slate-50 border border-slate-200'
        };
    }
  };

  const currentTheme = getThemeStyles();

  // Drag Handlers for Freeform Canvas
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveElementId(id);

    if (!dragMode || !cardRef.current) return;
    const targetEl = elements.find((el) => el.id === id);
    if (targetEl?.locked) return;

    setDraggingElementId(id);

    const rect = cardRef.current.getBoundingClientRect();
    if (!targetEl) return;

    const currentPxX = (targetEl.x / 100) * rect.width;
    const currentPxY = (targetEl.y / 100) * rect.height;

    setDragOffset({
      x: e.clientX - rect.left - currentPxX,
      y: e.clientY - rect.top - currentPxY
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragMode || !draggingElementId || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    let newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    let newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    // Boundary constraints (0% to 92%)
    newX = Math.max(1, Math.min(88, newX));
    newY = Math.max(1, Math.min(88, newY));

    setElements((prev) =>
      prev.map((el) => (el.id === draggingElementId ? { ...el, x: Math.round(newX), y: Math.round(newY) } : el))
    );
  };

  const handleMouseUp = () => {
    setDraggingElementId(null);
  };

  // Element Scaling / Size Customization
  const handleScaleElement = (id: string, delta: number) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id === id) {
          const currentScale = el.scale || 1;
          const newScale = Math.max(0.6, Math.min(2.0, parseFloat((currentScale + delta).toFixed(1))));
          return { ...el, scale: newScale };
        }
        return el;
      })
    );
  };

  // Toggle Visibility of any element
  const handleToggleVisibility = (id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el))
    );
  };

  // Delete an element completely
  const handleDeleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };

  // Toggle Lock position
  const handleToggleLock = (id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el))
    );
  };

  // Add Custom User Text Box
  const handleAddCustomText = () => {
    const newEl: CanvasElement = {
      id: `custom-text-${Date.now()}`,
      type: 'custom_text',
      x: 10,
      y: 58,
      scale: 1,
      text: 'Note: Please share transaction reference after paying.',
      fontSize: 11,
      textColor: bgAccent,
      visible: true
    };
    setElements((prev) => [...prev, newEl]);
    setActiveElementId(newEl.id);
  };

  // Add Decorative Stamp Badge (Paid / Verified / Overdue)
  const handleAddStampBadge = (label: string, color: string) => {
    const newEl: CanvasElement = {
      id: `stamp-${Date.now()}`,
      type: 'custom_text',
      x: 65,
      y: 12,
      scale: 1.1,
      text: label,
      textColor: color,
      bgColor: `${color}20`,
      fontSize: 10,
      visible: true
    };
    setElements((prev) => [...prev, newEl]);
    setActiveElementId(newEl.id);
  };

  // Upload & Add Custom Logo / Sticker / Stamp Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newEl: CanvasElement = {
          id: `custom-img-${Date.now()}`,
          type: 'custom_image',
          x: 72,
          y: 6,
          scale: 1,
          imageUrl: url,
          width: 70,
          visible: true
        };
        setElements((prev) => [...prev, newEl]);
        setActiveElementId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset Positions to Standard Layout
  const handleResetLayout = () => {
    setElements([
      { id: 'el-header', type: 'header', x: 5, y: 4, scale: 1, visible: true },
      { id: 'el-parties', type: 'parties', x: 5, y: 22, scale: 1, visible: true },
      { id: 'el-amount', type: 'amount', x: 5, y: 44, scale: 1, visible: true },
      { id: 'el-qr', type: 'qr', x: 62, y: 67, scale: 1, visible: true },
      { id: 'el-footer', type: 'footer', x: 5, y: 70, scale: 1, visible: true },
      { id: 'el-stamp', type: 'badge_stamp', x: 74, y: 5, scale: 1, visible: true }
    ]);
  };

  // Download Image Handler
  const handleDownloadImage = async () => {
    if (!cardRef.current || !reminder) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        quality: 0.95
      });
      const link = document.createElement('a');
      link.download = `Reminder_${reminder.party_name || 'party'}_${reminder.due_date}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('Failed to generate template image.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const blob = await toPng(cardRef.current, {
        pixelRatio: 2,
        quality: 0.95
      }).then((res) => fetch(res).then((r) => r.blob()));

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image', err);
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Send / Share to WhatsApp with Image
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const handleShareToWhatsApp = async () => {
    if (!cardRef.current || !reminder) return;
    try {
      setIsSharingWhatsApp(true);
      setIsGenerating(true);

      const blob = await toPng(cardRef.current, {
        pixelRatio: 2,
        quality: 0.95
      }).then((res) => fetch(res).then((r) => r.blob()));

      const fileName = `Reminder_${reminder.party_name || 'Bill'}_${reminder.due_date}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      const shareText = `*${isCollect ? 'Payment Reminder' : 'Payment Advice'} from ${company.name}*\nDear ${reminder.party_name || 'Valued Client'},\nAmount: *${formattedAmt}*\nDue Date: *${formatDate(reminder.due_date)}*${reminder.invoice_ref ? `\nRef: ${reminder.invoice_ref}` : ''}${customUpiId ? `\nUPI: ${customUpiId}` : ''}\n\n${customFooterNote}`;

      // Check if Web Share API with files is supported (works on Android / iOS / modern desktops)
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${company.name} Payment Reminder`,
          text: shareText
        });
        return;
      }

      // If Web Share files is not supported (e.g. desktop browsers without OS share handler),
      // Automatically copy image to clipboard and trigger WhatsApp web with pre-filled message
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
        setIsCopied(true);
      } catch (clipErr) {
        console.warn('Clipboard write failed, downloading image as fallback', clipErr);
        // Fallback: download file so user has it immediately
        const link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
      }

      let phoneDigits = reminder.phone ? reminder.phone.replace(/[^0-9]/g, '') : '';
      if (phoneDigits && phoneDigits.length === 10) {
        phoneDigits = `91${phoneDigits}`;
      }

      const waUrl = phoneDigits
        ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(shareText)}`
        : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

      window.open(waUrl, '_blank');
      alert('Card image copied to your clipboard! Paste (Ctrl+V) directly into the opened WhatsApp chat window.');
    } catch (err) {
      console.error('Failed to share to WhatsApp', err);
      // Fallback to opening whatsapp
      let phoneDigits = reminder.phone ? reminder.phone.replace(/[^0-9]/g, '') : '';
      if (phoneDigits && phoneDigits.length === 10) {
        phoneDigits = `91${phoneDigits}`;
      }
      const waText = `*Payment Reminder from ${company.name}*\nAmount: *${formattedAmt}*`;
      window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(waText)}`, '_blank');
    } finally {
      setIsGenerating(false);
      setIsSharingWhatsApp(false);
    }
  };

  // Auto trigger WhatsApp share if autoSendWhatsApp flag was requested from TemplatePicker
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (isOpen && autoSendWhatsApp && reminder && !autoSentRef.current) {
      autoSentRef.current = true;
      const timer = setTimeout(() => {
        handleShareToWhatsApp();
      }, 500);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      autoSentRef.current = false;
    }
  }, [isOpen, autoSendWhatsApp, reminder]);

  const activeElement = elements.find((el) => el.id === activeElementId);

  return (
    <Modal
      isOpen={isOpen && !!reminder}
      onClose={onClose}
      title="Advanced Visual Reminder Studio (Drag & Drop Canvas & Styling)"
      maxWidth="5xl"
    >
      {!reminder ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Visual Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center select-none w-full min-w-0">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Live Studio Canvas</span>
              </span>
              <button
                type="button"
                onClick={() => setDragMode(!dragMode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  dragMode
                    ? 'bg-amber-500 text-white shadow-md animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Move className="w-3 h-3" />
                <span>{dragMode ? 'Drag Mode: ON' : 'Drag & Move: OFF'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleResetLayout}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Layout</span>
            </button>
          </div>

          {/* THE DRAGGABLE CANVAS CARD CONTAINER WRAPPER */}
          <div className="w-full flex justify-center overflow-x-auto py-1">
            <div
              ref={cardRef}
              onClick={() => setActiveElementId(null)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`${getAspectRatioClasses()} rounded-3xl p-6 border shadow-2xl relative overflow-hidden transition-all shrink-0 ${
                currentTheme.container
              } ${fontFamily} ${dragMode ? 'cursor-crosshair ring-2 ring-amber-500/50' : ''}`}
              style={{
                borderRadius: `${cardBorderRadius}px`,
                padding: `${cardPadding}px`,
                boxShadow: `0 20px 40px -15px ${bgAccent}25`
              }}
            >
            {/* Background Aesthetic Ambient Glow & Textures */}
            <div
              className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{ backgroundColor: bgAccent }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-30"
              style={{ backgroundColor: bgAccent }}
            />

            {/* Dynamic Card Background Pattern Texture */}
            {cardPattern === 'dots' && (
              <div 
                className="absolute inset-0 opacity-[0.12] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(${bgAccent} 1.5px, transparent 1.5px)`,
                  backgroundSize: '18px 18px'
                }}
              />
            )}
            {cardPattern === 'grid' && (
              <div 
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(to right, ${bgAccent} 1px, transparent 1px), linear-gradient(to bottom, ${bgAccent} 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }}
              />
            )}
            {cardPattern === 'circuit' && (
              <div 
                className="absolute inset-0 opacity-[0.15] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle, ${bgAccent} 10%, transparent 11%), radial-gradient(circle at bottom left, ${bgAccent} 5%, transparent 6%)`,
                  backgroundSize: '32px 32px'
                }}
              />
            )}
            {cardPattern === 'diagonal' && (
              <div 
                className="absolute inset-0 opacity-[0.10] pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, ${bgAccent}, ${bgAccent} 1.5px, transparent 0, transparent 16px)`
                }}
              />
            )}
            {cardPattern === 'mesh' && (
              <div 
                className="absolute inset-0 opacity-[0.18] pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${bgAccent}35 0%, transparent 40%), radial-gradient(circle at 10% 90%, ${bgAccent}25 0%, transparent 50%)`
                }}
              />
            )}
            {cardPattern === 'waves' && (
              <div 
                className="absolute inset-0 opacity-[0.12] pointer-events-none"
                style={{
                  backgroundImage: `repeating-radial-gradient(circle at 0 0, transparent 0, ${bgAccent} 2px, transparent 4px, transparent 20px)`
                }}
              />
            )}
            {cardPattern === 'stars' && (
              <div 
                className="absolute inset-0 opacity-[0.15] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(${bgAccent} 1px, transparent 1px), radial-gradient(circle at 50% 50%, ${bgAccent} 1.5px, transparent 1.5px)`,
                  backgroundSize: '28px 28px, 44px 44px'
                }}
              />
            )}

            {/* CONDITIONAL: Render either Clean Itemized Invoice Card (User Screenshot) or Freeform Studio Canvas */}
            {useItemizedInvoice ? (
              <div className="w-full h-full flex flex-col justify-between text-slate-800 dark:text-slate-100 font-sans z-10 relative">
                {/* Invoice Top Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm"
                      style={{ backgroundColor: bgAccent }}
                    >
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                        {company.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {company.tax_id ? `GST / Tax: ${company.tax_id}` : 'Commercial District, HQ'}
                  </span>
                </div>

                {/* Subheader: App Icon / Logo + Invoice Meta */}
                <div className="pt-3 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-lg border border-white/20">
                        <FileText className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          Invoice from {company.name}
                        </h4>
                        <p className="text-[11px] font-mono font-semibold text-slate-400">
                          ID: {invoiceNumber || '#0045'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] space-y-0.5">
                      <div className="text-slate-400">
                        Issue Date:{' '}
                        <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                          {issueDate || '01 Mar, 2025'}
                        </strong>
                      </div>
                      <div className="text-slate-400">
                        Due Date:{' '}
                        <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                          {dueDate || '31 Mar, 2025'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill from & Bill to Columns */}
                <div className="grid grid-cols-2 gap-6 py-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Bill from:</span>
                    <strong className="font-bold text-slate-900 dark:text-white block text-xs">
                      {company.name}
                    </strong>
                    <p className="text-slate-500 dark:text-slate-400 leading-snug">
                      {billFromAddress || `${company.name}, Head Office`}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Bill to:</span>
                    <strong className="font-bold text-slate-900 dark:text-white block text-xs">
                      {billToName || reminder.party_name || 'Client Name'}
                    </strong>
                    <p className="text-slate-500 dark:text-slate-400 leading-snug">
                      {billToAddress || (billToEmail ? billToEmail : 'Client Address')}
                    </p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="my-2 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3">
                  <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 pb-2 border-b border-slate-200/60 dark:border-slate-800 uppercase tracking-wider">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-2 text-right">Rate</span>
                    <span className="col-span-2 text-right">Amount</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-36 overflow-y-auto pr-1">
                    {lineItems.map((item, idx) => {
                      const itemAmt = (item.qty || 1) * (item.rate || 0);
                      return (
                        <div key={item.id || idx} className="grid grid-cols-12 text-xs py-2 items-center">
                          <span className="col-span-6 font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {item.description || 'Service/Product'}
                          </span>
                          <span className="col-span-2 text-center font-bold text-slate-600 dark:text-slate-400 font-mono">
                            {item.qty || 1}
                          </span>
                          <span className="col-span-2 text-right text-slate-600 dark:text-slate-400 font-mono">
                            {currencySymbol === 'INR' ? '₹' : '$'}
                            {(item.rate || 0).toLocaleString()}
                          </span>
                          <span className="col-span-2 text-right font-bold text-slate-900 dark:text-white font-mono">
                            {currencySymbol === 'INR' ? '₹' : '$'}
                            {itemAmt.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Calculation Summary & UPI Badge */}
                <div className="pt-2 flex items-end justify-between">
                  {/* Left Bottom UPI & QR if enabled */}
                  <div className="flex items-center gap-2">
                    {showQrCode && qrDataUrl && (
                      <div className="w-16 h-16 p-1 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
                        <img src={qrDataUrl} alt="UPI QR" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="text-[10px] space-y-0.5 text-slate-400">
                      {customUpiId && (
                        <div>
                          <span>Scan to Pay UPI:</span>
                          <span className="font-mono font-bold block text-slate-700 dark:text-slate-200">
                            {customUpiId}
                          </span>
                        </div>
                      )}
                      <p className="italic text-[9px] line-clamp-1">{customFooterNote}</p>
                    </div>
                  </div>

                  {/* Right Bottom Financial Totals */}
                  <div className="w-48 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-mono font-semibold">
                        {currencySymbol === 'INR' ? '₹' : '$'}
                        {lineItems
                          .reduce((acc, it) => acc + (it.qty || 1) * (it.rate || 0), 0)
                          .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Discount</span>
                      <span className="font-mono">
                        {discountAmount > 0
                          ? `-${currencySymbol === 'INR' ? '₹' : '$'}${discountAmount.toLocaleString()}`
                          : '0%'}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Tax</span>
                      <span className="font-mono">
                        {currencySymbol === 'INR' ? '₹' : '$'}
                        {(() => {
                          const sub = lineItems.reduce((acc, it) => acc + (it.qty || 1) * (it.rate || 0), 0);
                          const afterDisc = Math.max(0, sub - (discountAmount || 0));
                          const itemTax = lineItems.reduce(
                            (acc, it) => acc + ((it.qty || 1) * (it.rate || 0) * (it.tax || 0)) / 100,
                            0
                          );
                          const extraTax = (afterDisc * (taxPercent || 0)) / 100;
                          return (itemTax + extraTax).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                        })()}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-900 dark:text-white text-sm">
                      <span>Total</span>
                      <span className="font-mono" style={{ color: bgAccent }}>
                        {currencySymbol === 'INR' ? '₹' : '$'}
                        {(() => {
                          const sub = lineItems.reduce((acc, it) => acc + (it.qty || 1) * (it.rate || 0), 0);
                          const afterDisc = Math.max(0, sub - (discountAmount || 0));
                          const itemTax = lineItems.reduce(
                            (acc, it) => acc + ((it.qty || 1) * (it.rate || 0) * (it.tax || 0)) / 100,
                            0
                          );
                          const extraTax = (afterDisc * (taxPercent || 0)) / 100;
                          return (afterDisc + itemTax + extraTax).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          });
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* Render Canvas Elements with dynamic scaling & position */}
            {elements.map((el) => {
              if (!el.visible) return null;
              const isSelected = activeElementId === el.id;
              const elScale = el.scale || 1;

              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveElementId(el.id);
                  }}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  style={{
                    position: 'absolute',
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    transform: `scale(${elScale})`,
                    transformOrigin: 'top left',
                    width: el.type === 'header' ? '90%' : undefined,
                    maxWidth: el.type === 'amount' || el.type === 'parties' ? '90%' : undefined,
                    zIndex: isSelected ? 40 : 20
                  }}
                  className={`transition-shadow ${
                    dragMode
                      ? `cursor-move border border-dashed rounded-xl p-1.5 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400'
                            : 'border-white/20 hover:border-white/50'
                        }`
                      : isSelected
                        ? 'ring-2 ring-blue-400 rounded-xl p-1'
                        : 'hover:ring-1 hover:ring-white/30 rounded-xl'
                  }`}
                >
                  {/* HEADER BLOCK */}
                  {el.type === 'header' && (
                    <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg shrink-0"
                          style={{ backgroundColor: bgAccent }}
                        >
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm tracking-tight leading-snug">
                            {company.name}
                          </h3>
                          <p className="text-[10px] opacity-75">
                            {company.tax_id ? `GSTIN / Tax ID: ${company.tax_id}` : 'Financial & Accounts Statement'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${currentTheme.badge}`}
                      >
                        {customHeaderTitle}
                      </span>
                    </div>
                  )}

                  {/* PARTIES & DUE DATE BLOCK */}
                  {el.type === 'parties' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-2xl ${currentTheme.cardBlock}`}>
                        <span className="text-[10px] opacity-65 block uppercase tracking-wider font-semibold">
                          {isCollect ? 'Billed To (Customer)' : 'Payable To (Vendor)'}
                        </span>
                        <p className="font-bold text-sm truncate mt-0.5">
                          {reminder.party_name || 'Valued Client'}
                        </p>
                        {reminder.phone && (
                          <p className="text-[11px] opacity-75 font-mono mt-0.5">
                            📱 {reminder.phone}
                          </p>
                        )}
                      </div>

                      <div className={`p-3 rounded-2xl ${currentTheme.cardBlock}`}>
                        <span className="text-[10px] opacity-65 block uppercase tracking-wider font-semibold">
                          Due Date
                        </span>
                        <p className="font-bold text-sm mt-0.5">
                          {formatDate(reminder.due_date)}
                        </p>
                        {reminder.invoice_ref && (
                          <p className="text-[10px] opacity-75 font-mono mt-0.5 truncate">
                            Ref: {reminder.invoice_ref}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AMOUNT BOX BLOCK */}
                  {el.type === 'amount' && (
                    <div
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${currentTheme.amountBg}`}
                    >
                      <span className="text-[11px] uppercase tracking-widest font-bold opacity-80">
                        {isCollect ? 'Total Amount Outstanding' : 'Total Scheduled Payment'}
                      </span>
                      <span
                        className="text-3xl font-black tracking-tight mt-1 font-mono"
                        style={{ color: bgAccent }}
                      >
                        {formattedAmt}
                      </span>
                      <p className="text-[10px] opacity-75 mt-1 font-medium">
                        {reminder.title}
                      </p>
                    </div>
                  )}

                  {/* QR CODE BLOCK */}
                  {el.type === 'qr' && showQrCode && qrDataUrl && (
                    <div className="flex flex-col items-center text-center">
                      <div className={currentTheme.qrWrapper}>
                        <img
                          src={qrDataUrl}
                          alt="UPI QR Code"
                          className="w-20 h-20 rounded-lg object-contain pointer-events-none"
                        />
                      </div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider mt-1 opacity-90">
                        Scan To Pay
                      </span>
                      {customUpiId && (
                        <span 
                          className="text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/10 mt-0.5 max-w-[130px] truncate"
                          style={{ color: bgAccent }}
                          title={customUpiId}
                        >
                          {customUpiId}
                        </span>
                      )}
                    </div>
                  )}

                  {/* FOOTER NOTE BLOCK */}
                  {el.type === 'footer' && (
                    <div className="max-w-[240px] text-left space-y-1">
                      <p className="text-xs font-semibold leading-relaxed">
                        {customFooterNote}
                      </p>
                      {showQrCode && (
                        <div className="text-[10px] opacity-75 flex items-center gap-1 font-mono">
                          <span>UPI:</span>
                          <span className="font-bold" style={{ color: bgAccent }}>
                            {customUpiId || 'Instant UPI'}
                          </span>
                        </div>
                      )}
                      {reminder.notes && (
                        <p className="text-[10px] italic opacity-60 line-clamp-1 pt-0.5">
                          "{reminder.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* DECORATIVE STAMP BADGE */}
                  {el.type === 'badge_stamp' && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{isCollect ? 'VERIFIED INVOICE' : 'PAYMENT APPROVED'}</span>
                    </div>
                  )}

                  {/* CUSTOM USER TEXT ELEMENT */}
                  {el.type === 'custom_text' && (
                    <div
                      className="p-2 rounded-xl backdrop-blur-md border max-w-[280px]"
                      style={{
                        backgroundColor: el.bgColor || 'rgba(0,0,0,0.5)',
                        borderColor: `${el.textColor || bgAccent}40`,
                        color: el.textColor || bgAccent,
                        fontSize: `${el.fontSize || 11}px`
                      }}
                    >
                      <p className="font-semibold leading-tight">{el.text}</p>
                    </div>
                  )}

                  {/* CUSTOM USER UPLOADED IMAGE / STICKER / LOGO */}
                  {el.type === 'custom_image' && el.imageUrl && (
                    <div className="relative group">
                      <img
                        src={el.imageUrl}
                        alt="Custom Stamp"
                        style={{ width: `${el.width || 70}px` }}
                        className="rounded-xl object-contain drop-shadow-lg"
                      />
                    </div>
                  )}
                </div>
              );
            })}
              </>
            )}

            {/* Sub-footer bottom brand banner */}
            {showWatermark && (
              <div className="absolute bottom-3 left-6 right-6 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] opacity-40 pointer-events-none">
                <span>SmartMoney Verified Statement</span>
                <span>{formatDate(new Date().toISOString().split('T')[0])}</span>
              </div>
            )}
          </div>
          </div>

          {/* Action Buttons under Canvas */}
          <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 w-full max-w-[480px]">
            <Button
              onClick={handleShareToWhatsApp}
              disabled={isGenerating || isSharingWhatsApp}
              className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs shadow-md cursor-pointer shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{isSharingWhatsApp ? 'Opening WhatsApp...' : 'Send Card via WhatsApp'}</span>
            </Button>
            <div className="flex items-center gap-2 w-full sm:flex-1">
              <Button
                variant="outline"
                onClick={handleDownloadImage}
                disabled={isGenerating}
                className="flex-1 gap-1 text-xs cursor-pointer px-2"
                title="Download High-Res PNG"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="truncate">Download PNG</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="flex-1 gap-1 text-xs cursor-pointer px-2"
                title="Copy Image to Clipboard"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span className="truncate">{isCopied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Studio Tools, Design, Drag & Drop Layers */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 max-h-[640px] overflow-y-auto pr-1">
          {/* Top Navigation Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setActiveTab('invoice');
                setUseItemizedInvoice(true);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'invoice'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoice Form</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('templates');
                setUseItemizedInvoice(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'templates'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>10 Templates</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('design');
                setUseItemizedInvoice(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'design'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Styles
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('elements');
                setUseItemizedInvoice(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'elements'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Layers ({elements.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('presets');
                setUseItemizedInvoice(false);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Stickers
            </button>
          </div>

          {/* TAB: STRUCTURED INVOICE CUSTOMIZER (Matches User Screenshot) */}
          {activeTab === 'invoice' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-amber-500" />
                    <span>Invoice Details</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Customize client, itemized line items, rates, taxes & invoice meta
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseItemizedInvoice(!useItemizedInvoice)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                    useItemizedInvoice
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {useItemizedInvoice ? '✓ Invoice Card Mode' : 'Standard Card Mode'}
                </button>
              </div>

              {/* Bill To & Client */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Bill To (Client / Customer)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={billToName}
                    onChange={(e) => setBillToName(e.target.value)}
                    placeholder="e.g. Johnathon Doe"
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Client Email / Contact
                </label>
                <input
                  type="text"
                  value={billToEmail}
                  onChange={(e) => setBillToEmail(e.target.value)}
                  placeholder="e.g. john_doe@gmail.com"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Address
                </label>
                <input
                  type="text"
                  value={billToAddress}
                  onChange={(e) => setBillToAddress(e.target.value)}
                  placeholder="e.g. 16/345 Palatial Avenue, South Mascot, 2026"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Invoice Number & Currency */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="#0045"
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Currency
                  </label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                  >
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="INR">🇮🇳 INR (₹)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                    <option value="AED">🇦🇪 AED (AED)</option>
                  </select>
                </div>
              </div>

              {/* Issue Date & Due Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Issue Date
                  </label>
                  <input
                    type="text"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    placeholder="28 March, 2025"
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="28 March, 2025"
                    className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Items ({lineItems.length})
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `item-${Date.now()}`;
                      setLineItems((prev) => [
                        ...prev,
                        { id: newId, description: '', qty: 1, rate: 0, tax: 0 }
                      ]);
                    }}
                    className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-500">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setLineItems((prev) => prev.filter((i) => i.id !== item.id));
                            }}
                            className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Item Description */}
                      <div>
                        <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLineItems((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, description: val } : i))
                            );
                          }}
                          placeholder="e.g. UI/UX review of all web products"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Rate, QTY, Tax */}
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                            Rate
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                              {currencySymbol === 'INR' ? '₹' : '$'}
                            </span>
                            <input
                              type="number"
                              value={item.rate || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setLineItems((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, rate: val } : i))
                                );
                              }}
                              placeholder="120.00"
                              className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl pl-6 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold font-mono"
                            />
                          </div>
                        </div>

                        <div className="col-span-3">
                          <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                            QTY
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.qty || 1}
                            onChange={(e) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setLineItems((prev) =>
                                prev.map((i) => (i.id === item.id ? { ...i, qty: val } : i))
                              );
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-center font-bold"
                          />
                        </div>

                        <div className="col-span-4">
                          <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                            Tax %
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={item.tax || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setLineItems((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, tax: val } : i))
                                );
                              }}
                              placeholder="10"
                              className="w-full bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 text-xs rounded-xl pr-6 pl-2 py-1.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right font-semibold"
                            />
                            <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-bold">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newId = `item-${Date.now()}`;
                    setLineItems((prev) => [
                      ...prev,
                      { id: newId, description: '', qty: 1, rate: 0, tax: 0 }
                    ]);
                  }}
                  className="w-full py-2 border-2 border-dashed border-amber-300 dark:border-amber-800/60 rounded-xl text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Item</span>
                </button>
              </div>

              {/* Financial Calculation Summary Pill */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span className="font-semibold font-mono">
                    {currencySymbol === 'INR' ? '₹' : '$'}
                    {lineItems
                      .reduce((acc, it) => acc + (it.qty || 1) * (it.rate || 0), 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                  <span>Discount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">{currencySymbol === 'INR' ? '₹' : '$'}</span>
                    <input
                      type="number"
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-16 bg-white dark:bg-slate-900 border rounded px-1.5 py-0.5 text-right text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                  <span>Tax Percent (%)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={taxPercent || ''}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-16 bg-white dark:bg-slate-900 border rounded px-1.5 py-0.5 text-right text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-400">%</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-amber-200 dark:border-amber-900/50 flex justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                    {currencySymbol === 'INR' ? '₹' : '$'}
                    {(() => {
                      const sub = lineItems.reduce((acc, it) => acc + (it.qty || 1) * (it.rate || 0), 0);
                      const afterDisc = Math.max(0, sub - (discountAmount || 0));
                      const itemTax = lineItems.reduce(
                        (acc, it) => acc + ((it.qty || 1) * (it.rate || 0) * (it.tax || 0)) / 100,
                        0
                      );
                      const extraTax = (afterDisc * (taxPercent || 0)) / 100;
                      return (afterDisc + itemTax + extraTax).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      });
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 0: 10 DESIGN TEMPLATES GALLERY */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Ready-Made Design Templates
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Choose from 10 professionally curated statement & receipt layouts
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  10 Designs
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {CARD_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl)}
                    className="group p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {tpl.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {tpl.description}
                        </p>
                      </div>

                      {/* Mini Visual Gradient Preview Pill */}
                      <div
                        className={`w-12 h-12 rounded-xl shrink-0 bg-gradient-to-br ${tpl.previewBg} border border-white/20 shadow-inner flex flex-col items-center justify-center p-1 relative`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full mb-0.5"
                          style={{ backgroundColor: tpl.accent }}
                        />
                        <span className="text-[7px] font-mono font-bold opacity-80 uppercase text-white">
                          QR
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">
                        Font: {tpl.font.replace('font-', '')} | Ratio: {tpl.aspectRatio}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                        <span>Apply Design</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: DESIGN & THEMES */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              {/* Aspect Ratio Sizer */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Ratio className="w-3.5 h-3.5 text-blue-500" />
                  <span>Card Size & Aspect Ratio</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'portrait', label: 'Portrait', icon: RectangleVertical },
                    { id: 'square', label: 'Square (1:1)', icon: Square },
                    { id: 'story', label: 'Story (9:16)', icon: Maximize2 },
                    { id: 'landscape', label: 'Wide', icon: RectangleHorizontal }
                  ].map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setAspectRatio(r.id as AspectRatioType)}
                        className={`p-2 rounded-xl text-center border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          aspectRatio === r.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Preset Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Color Themes & Gradients</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'emerald_gradient', label: 'Emerald Jade', color: '#10b981' },
                    { id: 'midnight_purple', label: 'Midnight Violet', color: '#8b5cf6' },
                    { id: 'royal_blue', label: 'Sapphire Blue', color: '#3b82f6' },
                    { id: 'corporate_navy', label: 'Corporate Navy', color: '#38bdf8' },
                    { id: 'neon_matrix', label: 'Neon Matrix', color: '#22c55e' },
                    { id: 'sunset_orange', label: 'Sunset Horizon', color: '#f97316' },
                    { id: 'crimson_sunset', label: 'Crimson Sunset', color: '#f43f5e' },
                    { id: 'cyber_neon', label: 'Cyber Neon', color: '#06b6d4' },
                    { id: 'frosted_glass', label: 'Frosted Glass', color: '#6366f1' },
                    { id: 'luxury_gold', label: 'Royal Amber', color: '#f59e0b' },
                    { id: 'rosegold_glam', label: 'Rose Glamour', color: '#ec4899' },
                    { id: 'monochrome_bold', label: 'Monochrome', color: '#ffffff' },
                    { id: 'sleek_dark', label: 'Obsidian Dark', color: '#64748b' },
                    { id: 'clean_minimal', label: 'Clean Studio', color: '#0284c7' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTheme(t.id as CardTheme);
                        setBgAccent(t.color);
                      }}
                      className={`p-2 rounded-xl text-left border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        theme === t.id
                          ? 'border-emerald-500 bg-white dark:bg-slate-850 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="truncate text-[11px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color & Corner Radius */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Accent Glow Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgAccent}
                      onChange={(e) => setBgAccent(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-600 p-0.5 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      value={bgAccent}
                      onChange={(e) => setBgAccent(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[11px] rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corner Radius ({cardBorderRadius}px)
                  </label>
                  <input
                    type="range"
                    min={8}
                    max={40}
                    value={cardBorderRadius}
                    onChange={(e) => setCardBorderRadius(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer mt-1.5"
                  />
                </div>
              </div>

              {/* Background Patterns & Textures */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Background Texture & Pattern</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'mesh', label: 'Mesh Glow' },
                    { id: 'dots', label: 'Dot Matrix' },
                    { id: 'grid', label: 'Grid Lines' },
                    { id: 'circuit', label: 'Circuit' },
                    { id: 'waves', label: 'Waves' },
                    { id: 'stars', label: 'Starlight' },
                    { id: 'diagonal', label: 'Stripes' },
                    { id: 'none', label: 'Clean Solid' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setCardPattern(p.id as CardPattern)}
                      className={`p-1.5 rounded-xl text-center border text-[10px] font-semibold transition-all cursor-pointer ${
                        cardPattern === p.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography / Font Family */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-500" />
                  <span>Typography Font Family</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'font-sans', label: 'Modern Sans' },
                    { id: 'font-serif', label: 'Classic Serif' },
                    { id: 'font-mono', label: 'Tech Mono' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id as CardFont)}
                      className={`py-1.5 px-2 rounded-lg text-center border text-xs font-semibold transition-colors cursor-pointer ${
                        fontFamily === f.id
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header Title Text */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Top Badge Header
                </label>
                <input
                  type="text"
                  value={customHeaderTitle}
                  onChange={(e) => setCustomHeaderTitle(e.target.value)}
                  placeholder="e.g. PAYMENT REMINDER"
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* QR Code Toggle & UPI ID */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Instant Dynamic UPI QR Code</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {showQrCode && (
                  <div className="space-y-2">
                    {/* Bank Account UPI Selector Dropdown */}
                    {bankAccountsWithUpi.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
                        <label className="text-[10px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-blue-600" />
                          <span>Select Bank UPI Account:</span>
                        </label>
                        <select
                          value={bankAccountsWithUpi.some(a => a.upi_id === customUpiId) ? customUpiId : ''}
                          onChange={(e) => {
                            if (e.target.value) setCustomUpiId(e.target.value);
                          }}
                          className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-blue-300 dark:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="">-- Choose Registered Bank UPI --</option>
                          {bankAccountsWithUpi.map((acc) => (
                            <option key={acc.id} value={acc.upi_id}>
                              🏦 {acc.name} ({acc.bank_name || 'Bank'}) — {acc.upi_id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                        Active UPI VPA / ID (used for QR code):
                      </label>
                      <input
                        type="text"
                        value={customUpiId}
                        onChange={(e) => setCustomUpiId(e.target.value)}
                        placeholder="e.g. yourbusiness@okaxis or mobile@upi"
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Quick UPI Handles / Suggestions */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[9px] text-slate-400">Quick suffix:</span>
                      {['@okaxis', '@okhdfcbank', '@oksbi', '@paytm', '@ybl', '@ibl'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const base = customUpiId.includes('@') ? customUpiId.split('@')[0] : (customUpiId || 'merchant');
                            setCustomUpiId(`${base}${handle}`);
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Footer Note */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Footer Note / Instructions
                </label>
                <textarea
                  rows={2}
                  value={customFooterNote}
                  onChange={(e) => setCustomFooterNote(e.target.value)}
                  placeholder="e.g. Kindly scan to pay or contact accounts."
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none text-[11px]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LAYERS, SIZES & DELETION */}
          {activeTab === 'elements' && (
            <div className="space-y-4">
              {/* Selected Element Quick Size & Delete Bar */}
              {activeElement && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 capitalize">
                      Active: {activeElement.type.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleLock(activeElement.id)}
                        className={`p-1 rounded-md text-xs cursor-pointer ${
                          activeElement.locked ? 'text-amber-600 bg-amber-100' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={activeElement.locked ? 'Unlock Position' : 'Lock Position'}
                      >
                        {activeElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteElement(activeElement.id)}
                        className="p-1 rounded-md text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer"
                        title="Delete Element from Canvas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Size Scaler */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                      Scale Size: {Math.round((activeElement.scale || 1) * 100)}%
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScaleElement(activeElement.id, -0.1)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-xs font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScaleElement(activeElement.id, 0.1)}
                        className="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-xs font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Text editor if custom_text */}
                  {activeElement.type === 'custom_text' && (
                    <div className="pt-1">
                      <label className="text-[10px] text-slate-500 block mb-1">Edit Text:</label>
                      <input
                        type="text"
                        value={activeElement.text || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setElements((prev) =>
                            prev.map((el) => (el.id === activeElement.id ? { ...el, text: val } : el))
                          );
                        }}
                        className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* All Canvas Elements List with Size Controls & Delete */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Canvas Layers ({elements.length})</span>
                  <span className="text-[10px] font-normal text-slate-400">Click layer to select & resize</span>
                </label>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {elements.map((el) => {
                    const isSelected = activeElementId === el.id;

                    return (
                      <div
                        key={el.id}
                        onClick={() => setActiveElementId(el.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500/50'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-bold capitalize text-slate-800 dark:text-slate-200 truncate">
                            {el.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {Math.round((el.scale || 1) * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Scale down */}
                          <button
                            type="button"
                            onClick={() => handleScaleElement(el.id, -0.1)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Decrease Size"
                          >
                            <ZoomOut className="w-3 h-3" />
                          </button>

                          {/* Scale up */}
                          <button
                            type="button"
                            onClick={() => handleScaleElement(el.id, 0.1)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Increase Size"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>

                          {/* Toggle Visibility */}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(el.id)}
                            className={`p-1 rounded cursor-pointer ${
                              el.visible ? 'text-slate-400 hover:text-slate-700' : 'text-amber-500'
                            }`}
                            title={el.visible ? 'Hide Element' : 'Show Element'}
                          >
                            {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteElement(el.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Delete Element"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STICKERS, ADDONS & CUSTOM UPLOADS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              {/* Quick Add Elements: Text & Images */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Add New Custom Content:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomText}
                    className="text-xs gap-1.5 justify-center border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-300 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Custom Text</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs gap-1.5 justify-center border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-300 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Upload Logo/Stamp</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Ready Badge Stamps */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sticker className="w-3.5 h-3.5 text-amber-500" />
                  <span>Add Pre-styled Statement Stamps:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'VERIFIED INVOICE', color: '#10b981' },
                    { label: 'PAYMENT OVERDUE', color: '#f43f5e' },
                    { label: 'OFFICIAL ADVICE', color: '#3b82f6' },
                    { label: 'PRIORITY NOTICE', color: '#f59e0b' }
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => handleAddStampBadge(s.label, s.color)}
                      className="p-2 rounded-xl text-left border text-xs font-bold flex items-center gap-2 hover:border-slate-400 bg-white dark:bg-slate-900 cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] truncate" style={{ color: s.color }}>
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Toggle */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Include SmartMoney Security Verification Banner
                </label>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Close Studio
            </Button>
          </div>
        </div>
      </div>
      )}
    </Modal>
  );
}
