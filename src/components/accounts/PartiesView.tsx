'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Plus, 
  Search, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Settings2, 
  Tag,
  X
} from 'lucide-react';
import { Party } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

export function PartiesView() {
  const { 
    parties, 
    currentCompany, 
    addParty, 
    updateParty, 
    deleteParty, 
    customPartyRoles, 
    addPartyRole, 
    updatePartyRole, 
    deletePartyRole 
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  
  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('Customer');
  const [isCustomRoleInput, setIsCustomRoleInput] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');

  // Edit Party Modal state
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<string>('Customer');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editOpeningBalance, setEditOpeningBalance] = useState('0');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');

  // Manage Roles Modal state
  const [isManageRolesOpen, setIsManageRolesOpen] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [editingRoleOldName, setEditingRoleOldName] = useState<string | null>(null);
  const [editingRoleNewName, setEditingRoleNewName] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = parties.filter(p => {
    if (selectedRoleFilter !== 'all') {
      if (p.type.toLowerCase() !== selectedRoleFilter.toLowerCase()) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) || 
      (p.phone && p.phone.includes(q)) || 
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!name.trim()) {
      setErrorMessage('Party name is required.');
      return;
    }

    const res = addParty({
      name: name.trim(),
      type,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      opening_balance: parseFloat(openingBalance) || 0,
      status: 'active',
    });

    if (res.success) {
      setSuccessMessage(`Party "${name}" added successfully.`);
      setIsCreateOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setOpeningBalance('0');
    } else {
      setErrorMessage(res.error || 'Failed to create party.');
    }
  };

  const handleOpenEdit = (p: Party) => {
    setEditingParty(p);
    setEditName(p.name);
    setEditType(p.type);
    setEditPhone(p.phone || '');
    setEditEmail(p.email || '');
    setEditAddress(p.address || '');
    setEditOpeningBalance(String(p.opening_balance || 0));
    setEditStatus(p.status);
    setErrorMessage(null);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParty) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!editName.trim()) {
      setErrorMessage('Party name is required.');
      return;
    }

    const res = updateParty(editingParty.id, {
      name: editName.trim(),
      type: editType,
      phone: editPhone.trim() || undefined,
      email: editEmail.trim() || undefined,
      address: editAddress.trim() || undefined,
      opening_balance: parseFloat(editOpeningBalance) || 0,
      status: editStatus,
    });

    if (res.success) {
      setSuccessMessage(`Party "${editName}" updated successfully.`);
      setEditingParty(null);
    } else {
      setErrorMessage(res.error || 'Failed to update party.');
    }
  };

  const handleDeleteParty = (p: Party) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (window.confirm(`Are you sure you want to delete "${p.name}"?`)) {
      const res = deleteParty(p.id);
      if (res.success) {
        setSuccessMessage(`Party "${p.name}" deleted.`);
      } else {
        setErrorMessage(res.error || 'Cannot delete party.');
      }
    }
  };

  const handleAddNewRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleInput.trim()) return;
    addPartyRole(newRoleInput.trim());
    setNewRoleInput('');
    setSuccessMessage(`Role "${newRoleInput.trim()}" added.`);
  };

  const handleSaveRoleEdit = (oldRole: string) => {
    if (!editingRoleNewName.trim() || editingRoleNewName.trim() === oldRole) {
      setEditingRoleOldName(null);
      return;
    }
    updatePartyRole(oldRole, editingRoleNewName.trim());
    setEditingRoleOldName(null);
    setSuccessMessage(`Role renamed to "${editingRoleNewName.trim()}".`);
  };

  const handleDeleteRole = (roleToDelete: string) => {
    if (customPartyRoles.length <= 1) {
      setErrorMessage('You must keep at least one party role.');
      return;
    }
    if (window.confirm(`Delete role "${roleToDelete}"? Note: Existing parties with this role will keep their text.`)) {
      deletePartyRole(roleToDelete);
      setSuccessMessage(`Role "${roleToDelete}" removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Party Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Customers, Suppliers, Vendors, and Custom Entity Roles
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsManageRolesOpen(true)} 
            className="gap-1.5 text-xs border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Settings2 className="w-4 h-4 text-slate-500" />
            Manage Roles
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 text-xs shadow-sm">
            <Plus className="w-4 h-4" />
            Add New Party
          </Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Role Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedRoleFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({parties.length})
          </button>
          {customPartyRoles.map(role => {
            const count = parties.filter(p => p.type.toLowerCase() === role.toLowerCase()).length;
            const isSelected = selectedRoleFilter.toLowerCase() === role.toLowerCase();
            return (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {role} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-all duration-200 flex flex-col justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate" title={p.name}>
                    {p.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                      {p.type}
                    </span>
                    {p.status === 'inactive' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Opening Bal</span>
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(p.opening_balance, currentCompany.currency, currentCompany.currency_symbol)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-3 text-xs space-y-2">
              {p.phone && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px]">{p.phone}</span>
                </div>
              )}
              {p.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{p.email}</span>
                </div>
              )}
              {p.address && (
                <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="truncate" title={p.address}>{p.address}</span>
                </div>
              )}
              {!p.phone && !p.email && !p.address && (
                <p className="text-[11px] text-slate-400 italic py-1">No contact details provided</p>
              )}
            </CardContent>
            
            {/* Card Action Footer */}
            <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px] font-mono">
                ID: {p.id.slice(0, 8)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Edit Party Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteParty(p)}
                  className="p-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Delete Party"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No parties found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting the role filter or search term.</p>
        </div>
      )}

      {/* Add New Party Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Party"
        description="Register a new customer, supplier, or party entity"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Party Name"
            required
            placeholder="e.g. Acme Corp Ltd / Rajesh Singh"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Party Role <span className="text-red-500">*</span>
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
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
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
              step="any"
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
            <Button type="submit" size="sm" variant="primary">
              Save Party
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Party Modal */}
      <Modal
        isOpen={Boolean(editingParty)}
        onClose={() => setEditingParty(null)}
        title="Edit Party"
        description="Update party entity profile, role, and contact information"
        maxWidth="md"
      >
        {editingParty && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Input
              label="Party Name"
              required
              placeholder="e.g. Acme Corp Ltd"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Party Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {customPartyRoles.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')}
                  className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="contact@entity.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>

            <Input
              label="Registered Address"
              placeholder="Street address, city, state"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />

            <Input
              label="Opening Balance"
              type="number"
              min="0"
              step="any"
              value={editOpeningBalance}
              onChange={(e) => setEditOpeningBalance(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingParty(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Update Party
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manage Party Roles Modal */}
      <Modal
        isOpen={isManageRolesOpen}
        onClose={() => {
          setIsManageRolesOpen(false);
          setEditingRoleOldName(null);
        }}
        title="Manage Party Roles"
        description="Create, rename, or delete party classifications (e.g. Customer, Supplier, Vendor, Agent)"
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Add Role Input */}
          <form onSubmit={handleAddNewRole} className="flex gap-2">
            <input
              type="text"
              placeholder="Add new role name (e.g. Distributor, Client)..."
              value={newRoleInput}
              onChange={(e) => setNewRoleInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <Button type="submit" size="sm" className="gap-1 text-xs shrink-0">
              <Plus className="w-3.5 h-3.5" />
              Add Role
            </Button>
          </form>

          {/* Existing Roles List */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Configured Roles ({customPartyRoles.length})
            </label>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
              {customPartyRoles.map((role) => {
                const partiesWithRole = parties.filter(p => p.type.toLowerCase() === role.toLowerCase()).length;
                const isEditing = editingRoleOldName === role;

                return (
                  <div key={role} className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingRoleNewName}
                          onChange={(e) => setEditingRoleNewName(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                          autoFocus
                        />
                        <Button 
                          type="button" 
                          size="sm" 
                          onClick={() => handleSaveRoleEdit(role)}
                          className="text-xs px-2.5 py-1 h-7"
                        >
                          Save
                        </Button>
                        <button
                          type="button"
                          onClick={() => setEditingRoleOldName(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                            {role}
                          </span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            {partiesWithRole} {partiesWithRole === 1 ? 'party' : 'parties'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoleOldName(role);
                              setEditingRoleNewName(role);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Rename Role"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsManageRolesOpen(false);
                setEditingRoleOldName(null);
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
