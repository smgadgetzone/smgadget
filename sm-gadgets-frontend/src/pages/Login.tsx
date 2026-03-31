import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useApp();

  const isSignup = location.pathname === '/signup';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive'
      });
      return false;
    }

    if (isSignup) {
      if (!formData.name) {
        toast({
          title: 'Error',
          description: 'Please enter your name.',
          variant: 'destructive'
        });
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match.',
          variant: 'destructive'
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: isSignup ? formData.name : undefined,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      const { token, ...userData } = data;

      dispatch({
        type: 'SET_USER',
        payload: { ...userData, id: userData._id, token }
      });

      toast({
        title: isSignup ? 'Account Created!' : 'Welcome Back!',
        description: isSignup
          ? 'Your account has been created successfully.'
          : `Welcome back, ${userData.name}!`
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: typeof error.message === 'string' ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser = {
      id: 'guest',
      email: 'guest@example.com',
      name: 'Guest User',
      isAdmin: false
    };

    dispatch({ type: 'SET_USER', payload: guestUser });
    toast({
      title: 'Logged in as Guest',
      description: 'You can browse and add items to cart.'
    });
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="glass border-white/20 shadow-medium">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-playfair font-bold gradient-text mb-2">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <p className="text-muted-foreground">
              {isSignup
                ? 'Join the SM Gadgets family today'
                : 'Sign in to your account to continue'
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 glass border-white/20"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 glass border-white/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 glass border-white/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 glass border-white/20"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full shadow-soft"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isSignup ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  isSignup ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGuestLogin}
              >
                Continue as Guest
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link
                  to={isSignup ? '/login' : '/signup'}
                  className="text-primary hover:underline font-medium"
                >
                  {isSignup ? 'Sign In' : 'Sign Up'}
                </Link>
              </p>
            </div>

            {!isSignup && (
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;