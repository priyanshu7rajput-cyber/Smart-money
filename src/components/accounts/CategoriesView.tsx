'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Tags, CheckCircle2, AlertCircle } from 'lucide-react';
import { CategoryType } from '@/types/database';

export function CategoriesView() {
  const { categories, addCategory } = useApp();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    const res = addCategory({
      name: name.trim(),
      type,
      description: description.trim(),
      status: 'active',
    });

    if (res.success) {
      setSuccess(`Category "${name}" created.`);
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    } else {
      setError(res.error || 'Failed to create category.');
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Income & Expense Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize transactions into analytical chart of accounts
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 text-xs">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income */}
        <Card>
          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40">
            <CardTitle className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Income Categories ({incomeCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {incomeCategories.map(cat => (
              <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</p>
                  <p className="text-slate-400 text-[11px]">{cat.description || 'No description'}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  ACTIVE
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expense */}
        <Card>
          <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40">
            <CardTitle className="text-rose-800 dark:text-rose-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Expense Categories ({expenseCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</p>
                  <p className="text-slate-400 text-[11px]">{cat.description || 'No description'}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                  ACTIVE
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Category"
        description="Create classification for financial transactions"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            required
            placeholder="e.g. Consulting Revenue / Office Supplies"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Category Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CategoryType)}
              className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="income">Income / Inflow</option>
              <option value="expense">Expense / Outflow</option>
            </select>
          </div>

          <Input
            label="Description"
            placeholder="Optional details"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
