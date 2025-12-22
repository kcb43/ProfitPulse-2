/**
 * Sign Up Page
 * Allows users to create an account with email/password, first name, last name, and username
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  Mail, 
  Lock,
  User,
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'First name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Last name is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.username.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Username is required',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.username.length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Username must be at least 3 characters',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Password is required',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken (we'll store this in user_metadata)
      // Note: Supabase doesn't have built-in username uniqueness, so we'll check via a custom table or metadata
      // For now, we'll store username in metadata and handle uniqueness in the app layer
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            username: formData.username,
            name: `${formData.firstName} ${formData.lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast({
            title: 'Sign Up Failed',
            description: 'An account with this email already exists. Please sign in instead.',
            variant: 'destructive',
          });
        } else if (error.message.includes('username') || error.message.includes('unique')) {
          toast({
            title: 'Sign Up Failed',
            description: 'This username is already taken. Please choose a different username.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign Up Failed',
            description: error.message || 'Failed to create account. Please try again.',
            variant: 'destructive',
          });
        }
        setLoading(false);
        return;
      }

      // Success - user created
      // Create user profile (in case trigger didn't fire)
      if (data?.user) {
        try {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              username: formData.username,
              first_name: formData.firstName,
              last_name: formData.lastName,
            })
            .select()
            .single();

          // If profile creation fails due to uniqueness, try with a fallback username
          if (profileError && profileError.code === '23505') {
            // Username already taken, try with email prefix + random suffix
            const fallbackUsername = formData.email.split('@')[0] + '_' + data.user.id.substring(0, 8);
            await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                username: fallbackUsername,
                first_name: formData.firstName,
                last_name: formData.lastName,
              });
            
            toast({
              title: 'Account Created',
              description: `Your account has been created! Username set to: ${fallbackUsername}`,
            });
          } else if (profileError && profileError.code !== '23505') {
            // Other error (not uniqueness)
            console.error('Profile creation error:', profileError);
            // Continue anyway - trigger might create it
          }
        } catch (profileErr) {
          console.error('Error creating profile:', profileErr);
          // Continue - trigger might handle it
        }
      }

      toast({
        title: 'Account Created',
        description: 'Your account has been created successfully! Please check your email to verify your account.',
      });

      // Redirect to login page
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: 'Sign Up Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Orben
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Account
            </h2>
            <p className="text-gray-600">
              Sign up to start managing your resale business
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="text-gray-700">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="mt-1"
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="text-gray-700">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="mt-1"
                placeholder="Doe"
              />
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-gray-700">
                Username
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  minLength={3}
                  className="pl-10"
                  placeholder="johndoe"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 3 characters</p>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="pl-10"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="pl-10 pr-10"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirm Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="pl-10"
                  placeholder="••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-500">
              By signing up, you agree to our{' '}
              <Link to="/PrivacyPolicy" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

