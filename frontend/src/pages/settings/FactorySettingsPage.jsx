import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { factorySettingsApi } from '../../api/services';
import { usePermission } from '../../hooks/usePermission';
import { useUIStore } from '../../store/uiStore';
import { PageHeader, Button, Card } from '../../components/common/Shared';
import { Input } from '../../components/common/FormFields';

export default function FactorySettingsPage() {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    factorySettingsApi.get().then((res) => {
      const s = res.data;
      reset({
        factoryName: s.factory_name, legalName: s.legal_name || '', gstNumber: s.gst_number || '',
        panNumber: s.pan_number || '', addressLine1: s.address_line1 || '', city: s.city || '',
        state: s.state || '', postalCode: s.postal_code || '', phone: s.phone || '', email: s.email || '',
        electricityRatePerUnit: s.electricity_rate_per_unit, waterRatePerUnit: s.water_rate_per_unit,
      });
      setLoading(false);
    });
  }, [reset]);

  async function onSubmit(values) {
    try {
      await factorySettingsApi.update(values);
      toast.success('Factory settings updated');
      useUIStore.getState().fetchPublicSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update settings');
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-steel-200 dark:bg-steel-800" />;

  return (
    <div>
      <PageHeader title="Factory Settings" description="Organization-wide configuration" />
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Factory Name" register={register} name="factoryName" disabled={!can('factorySettings', 'manage')} />
            <Input label="Legal Name" register={register} name="legalName" disabled={!can('factorySettings', 'manage')} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="GST Number" register={register} name="gstNumber" disabled={!can('factorySettings', 'manage')} />
            <Input label="PAN Number" register={register} name="panNumber" disabled={!can('factorySettings', 'manage')} />
          </div>
          <Input label="Address" register={register} name="addressLine1" disabled={!can('factorySettings', 'manage')} />
          <div className="grid grid-cols-3 gap-x-3">
            <Input label="City" register={register} name="city" disabled={!can('factorySettings', 'manage')} />
            <Input label="State" register={register} name="state" disabled={!can('factorySettings', 'manage')} />
            <Input label="Postal Code" register={register} name="postalCode" disabled={!can('factorySettings', 'manage')} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Phone" register={register} name="phone" disabled={!can('factorySettings', 'manage')} />
            <Input label="Email" register={register} name="email" disabled={!can('factorySettings', 'manage')} />
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Input label="Electricity Rate (₹/unit)" type="number" step="0.01" register={register} name="electricityRatePerUnit" disabled={!can('factorySettings', 'manage')} />
            <Input label="Water Rate (₹/unit)" type="number" step="0.01" register={register} name="waterRatePerUnit" disabled={!can('factorySettings', 'manage')} />
          </div>
          {can('factorySettings', 'manage') && (
            <div className="mt-4 flex justify-end">
              <Button type="submit">Save Settings</Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
