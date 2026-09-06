'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Users, Phone, Mail, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { PartyType } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

export function PartiesView() {
  const { parties, currentCompany, addParty, updateParty, customPartyRoles, addPartyRole } = useApp();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('Customer');
  const [isCustomRoleInput, setIsCustomRoleInput] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = parties.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q)) || (p.email && p.email.toLowerCase().includes(q));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addParty({
      name: name.trim(),
      type,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      opening_balance: parseFloat(openingBalance) || 0,
      status: 'active',
    });

    setSuccessMessage(`Party "${name}" added successfully.`);
    setIsCreateOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningBalance('0');
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Party Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Customers, Suppliers, and Third-Party Entities
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          Add New Party
        </Button>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search party by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">Total: {filtered.length} parties</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {p.type}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatCurrency(p.opening_balance, currentCompany.currency, currentCompany.currency_symbol)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="py-3 text-xs space-y-2">
              {p.phone && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.phone}</span>
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.email}</span>
                </div>
              )}
              {p.address && (
                <div className="flex items-start gap-2 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="truncate">{p.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Party"
        description="Register a new customer or vendor"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Party Name"
            required
            placeholder="e.g. Acme Corp Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Party Role
                </label>
                {!isCustomRoleInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomRoleInput(true);
                      setCustomRoleText('');
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Role</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCustomRoleInput(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isCustomRoleInput ? (
                <select
                  value={type}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsCustomRoleInput(true);
                      setCustomRoleText('');
                    } else {
                      setType(e.target.value);
                    }
                  }}
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  {customPartyRoles.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="__add_new__">+ Add New Custom Role...</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Distributor, Agent"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    className="flex h-9.5 w-full rounded-lg border border-blue-500 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (customRoleText.trim()) {
                        addPartyRole(customRoleText.trim());
                        setType(customRoleText.trim());
                        setIsCustomRoleInput(false);
                      }
                    }}
                    className="text-xs px-2.5"
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            <Input
              label="Opening Balance"
              type="number"
              min="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="contact@entity.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Input
            label="Registered Address"
            placeholder="Street address, city, state"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Party
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
