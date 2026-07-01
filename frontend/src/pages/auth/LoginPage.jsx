import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const publicSettings = useUIStore((s) => s.publicSettings);
  const factoryName = publicSettings?.factoryName || 'Shivay Textiles';
  const initialLetter = factoryName.trim()[0]?.toUpperCase() || 'S';

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setLoading(true);
    try {
      const res = await authApi.login(values);
      setSession(res.data);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-steel-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-steel-950 text-base">{initialLetter}</div>
          <h1 className="mt-3 text-lg font-semibold text-white">{factoryName}</h1>
          <p className="text-sm text-steel-400">Factory ERP</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg bg-steel-900 border border-steel-700 p-6">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-steel-200">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white placeholder:text-steel-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="you@company.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium text-steel-200">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded-md border border-steel-600 bg-steel-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-steel-950 hover:bg-amber-400 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
