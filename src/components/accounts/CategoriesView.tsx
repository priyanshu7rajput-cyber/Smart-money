'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Tags, CheckCircle2, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { Category, CategoryType } from '@/types/database';

export function CategoriesView() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  
  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [description, setDescription] = useState('');

  // Edit Modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CategoryType>('expense');
  const [editDescription, setEditDescription] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
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
      setSuccess(`Category "${name}" created successfully.`);
      setIsCreateOpen(false);
      setName('');
      setDescription('');
    } else {
      setError(res.error || 'Failed to create category.');
    }
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditType(cat.type);
    setEditDescription(cat.description || '');
    setError(null);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setError(null);
    setSuccess(null);

    if (!editName.trim()) {
      setError('Category name is required.');
      return;
    }

    const res = updateCategory(editingCategory.id, {
      name: editName.trim(),
      type: editType,
      description: editDescription.trim(),
    });

    if (res.success) {
      setSuccess(`Category "${editName}" updated successfully.`);
      setEditingCategory(null);
    } else {
      setError(res.error || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    setError(null);
    setSuccess(null);
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      const res = deleteCategory(cat.id);
      if (res.success) {
        setSuccess(`Category "${cat.name}" deleted.`);
      } else {
        setError(res.error || 'Cannot delete category.');
      }
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-500" />
            Income & Expense Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize transactions into analytical chart of accounts and manage classifications
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5 text-xs shadow-sm">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40">
            <CardTitle className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Income Categories ({incomeCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {incomeCategories.map(cat => (
              <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{cat.name}</p>
                  <p className="text-slate-400 text-[11px] truncate">{cat.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ACTIVE
                  </span>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Edit Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {incomeCategories.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No income categories created yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40">
            <CardTitle className="text-rose-800 dark:text-rose-300 flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Expense Categories ({expenseCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{cat.name}</p>
                  <p className="text-slate-400 text-[11px] truncate">{cat.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                    ACTIVE
                  </span>
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Edit Category"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {expenseCategories.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-xs italic">
                No expense categories created yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Category"
        description="Create classification for financial transactions"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
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
              className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
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
            <Button type="submit" size="sm" variant="primary">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        description="Modify classification name, type, and description"
      >
        {editingCategory && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Input
              label="Category Name"
              required
              placeholder="e.g. Consulting Revenue"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category Type
              </label>
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as CategoryType)}
                className="flex h-9.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="income">Income / Inflow</option>
                <option value="expense">Expense / Outflow</option>
              </select>
            </div>

            <Input
              label="Description"
              placeholder="Optional details"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Update Category
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
