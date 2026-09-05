import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '@/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatCard';
import { FormField, TextInput } from '@/components/ui/FormField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createEmptyTransformerInput } from '@/types';
import type { CreateTransformerInput, TransformerSummary } from '@/types';

export function TransformersListPage() {
  const navigate = useNavigate();
  const { getTransformerSummaries, getSubstations, createTransformer } = useAppState();
  const summaries = getTransformerSummaries();
  const substations = getSubstations();

  const [search, setSearch] = useState('');
  const [substationFilter, setSubstationFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateTransformerInput>(createEmptyTransformerInput());

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return summaries.filter(({ transformer: tx }) => {
      const matchesSearch =
        !query ||
        tx.transformerName.toLowerCase().includes(query) ||
        tx.serialNumber.toLowerCase().includes(query) ||
        tx.equipmentId.toLowerCase().includes(query) ||
        tx.substation.toLowerCase().includes(query);
      const matchesSubstation =
        !substationFilter || tx.substation === substationFilter;
      return matchesSearch && matchesSubstation;
    });
  }, [summaries, search, substationFilter]);

  const updateForm = (field: keyof CreateTransformerInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createTransformer(form);
    setForm(createEmptyTransformerInput());
    setShowCreateForm(false);
    navigate(`/transformers/${created.id}`);
  };

  const columns = [
    {
      key: 'name',
      header: 'Transformer',
      render: (row: TransformerSummary) => (
        <span className="font-medium text-gray-900">{row.transformer.transformerName}</span>
      ),
    },
    {
      key: 'substation',
      header: 'Substation',
      render: (row: TransformerSummary) => row.transformer.substation,
    },
    {
      key: 'voltage',
      header: 'Voltage Rating',
      render: (row: TransformerSummary) => row.transformer.voltageRating,
    },
    {
      key: 'mva',
      header: 'MVA Rating',
      render: (row: TransformerSummary) => row.transformer.mvaRating,
    },
    {
      key: 'lastSample',
      header: 'Last Sample Date',
      render: (row: TransformerSummary) => (
        <span className="tabular-nums">{row.lastSampleDate ?? '—'}</span>
      ),
    },
    {
      key: 'lastStatus',
      header: 'Last Status',
      render: (row: TransformerSummary) => <StatusBadge status={row.lastStatus} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transformers"
        description="Registered transformers in the laboratory database."
      />

      <div className="mb-4 flex items-end gap-4 border border-gray-300 bg-gray-50 p-4">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-gray-700">
            Search
          </label>
          <TextInput
            id="search"
            placeholder="Search by name, serial number, equipment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-56">
          <label htmlFor="substation" className="mb-1 block text-xs font-medium text-gray-700">
            Substation
          </label>
          <select
            id="substation"
            value={substationFilter}
            onChange={(e) => setSubstationFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm"
          >
            <option value="">All Substations</option>
            {substations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {(search || substationFilter) && (
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setSubstationFilter('');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
        <span>{filtered.length} transformer{filtered.length !== 1 ? 's' : ''} found</span>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? 'Cancel' : 'Add Transformer'}
          </Button>
          <Link to="/analysis/new">
            <Button variant="secondary">New Analysis</Button>
          </Link>
        </div>
      </div>

      {showCreateForm && (
        <Card title="Register New Transformer" className="mb-4">
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <FormField label="Transformer Name" htmlFor="new-name" required>
                <TextInput
                  id="new-name"
                  value={form.transformerName}
                  onChange={(e) => updateForm('transformerName', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Serial Number" htmlFor="new-serial" required>
                <TextInput
                  id="new-serial"
                  value={form.serialNumber}
                  onChange={(e) => updateForm('serialNumber', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Equipment ID" htmlFor="new-equipment" required>
                <TextInput
                  id="new-equipment"
                  value={form.equipmentId}
                  onChange={(e) => updateForm('equipmentId', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Substation" htmlFor="new-substation" required>
                <TextInput
                  id="new-substation"
                  value={form.substation}
                  onChange={(e) => updateForm('substation', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Manufacturer" htmlFor="new-manufacturer">
                <TextInput
                  id="new-manufacturer"
                  value={form.manufacturer}
                  onChange={(e) => updateForm('manufacturer', e.target.value)}
                />
              </FormField>
              <FormField label="Voltage Rating" htmlFor="new-voltage">
                <TextInput
                  id="new-voltage"
                  value={form.voltageRating}
                  onChange={(e) => updateForm('voltageRating', e.target.value)}
                />
              </FormField>
              <FormField label="MVA Rating" htmlFor="new-mva">
                <TextInput
                  id="new-mva"
                  value={form.mvaRating}
                  onChange={(e) => updateForm('mvaRating', e.target.value)}
                />
              </FormField>
              <FormField label="Commissioning Date" htmlFor="new-commissioning">
                <TextInput
                  id="new-commissioning"
                  type="date"
                  value={form.commissioningDate}
                  onChange={(e) => updateForm('commissioningDate', e.target.value)}
                />
              </FormField>
            </div>
            <div className="mt-4 flex gap-3 border-t border-gray-200 pt-4">
              <Button type="submit">Save Transformer</Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        getRowKey={(row) => row.transformer.id}
        onRowClick={(row) => navigate(`/transformers/${row.transformer.id}`)}
        emptyMessage="No transformers match your search criteria."
      />
    </div>
  );
}
