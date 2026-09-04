'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, CheckCircle2 } from 'lucide-react';

export function CompanyProfileView() {
  const { currentCompany } = useApp();
  const [name, setName] = useState(currentCompany.name);
  const [taxId, setTaxId] = useState(currentCompany.tax_id || '');
  const [currency, setCurrency] = useState(currentCompany.currency);
  const [symbol, setSymbol] = useState(currentCompany.currency_symbol);
  const [fyStart, setFyStart] = useState(currentCompany.financial_year_start);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Company & Entity Profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure financial year, statutory tax numbers, and reporting currencies
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Company profile updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Entity Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <Input
              label="Legal Company Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tax Identification / GSTIN"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
              <Input
                label="Financial Year Starting Date"
                type="date"
                required
                value={fyStart}
                onChange={(e) => setFyStart(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Currency Code"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
              <Input
                label="Currency Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" size="sm">
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
