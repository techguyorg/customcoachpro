import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SelectedRole = 'client' | 'coach';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<SelectedRole>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const roleLabel = (r: SelectedRole) => (r === 'client' ? 'Client' : 'Coach');
  const placeholder = selectedRole === 'coach' ? 'coach@fitcoach.com' : 'client1@fitcoach.com';

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      const user = await login(data.email, data.password);

      // Admin is allowed to login without explicit selector.
      if (user.role === 'admin') {
        navigate('/admin');
        return;
      }

      // Block mismatch: logout immediately to clear token + storage
      if (user.role !== selectedRole) {
        await logout();

        toast({
          title: 'Login blocked',
          description: `You selected ${roleLabel(selectedRole)} login, but this account is ${user.role.toUpperCase()}. Please switch role and try again.`,
          variant: 'destructive',
        });

        return;
      }

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground">Sign in to your account to continue</p>
      </div>

      {/* Role selector (Admin intentionally hidden) */}
      <div className="grid grid-cols-2 gap-2">
        {(['client', 'coach'] as const).map((r) => (
          <Button
            key={r}
            type="button"
            variant={selectedRole === r ? 'default' : 'outline'}
            onClick={() => setSelectedRole(r)}
          >
            {roleLabel(r)}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder={placeholder}
            {...register('email')}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full shadow-energy" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default LoginPage;
