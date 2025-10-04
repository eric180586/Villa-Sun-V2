import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setIsLoading(true);
    try {
      await login(userEmail, 'password');
    } catch (error) {
      console.error('Quick login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Villa Sun</CardTitle>
          <CardDescription>
            Staff Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre.email@villasun.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ihr Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Oder schnell anmelden als
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleQuickLogin('admin@villasun.com')}
              disabled={isLoading}
            >
              👨‍💼 Administrator
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleQuickLogin('maria@villasun.com')}
              disabled={isLoading}
            >
              👩‍💼 Maria Schmidt (Staff)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleQuickLogin('john@villasun.com')}
              disabled={isLoading}
            >
              👨‍💼 John Miller (Staff)
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleQuickLogin('anna@villasun.com')}
              disabled={isLoading}
            >
              👩‍💼 Anna Weber (Staff)
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Demo-Anmeldedaten:</p>
            <p className="font-mono text-xs">
              admin@villasun.com<br />
              maria@villasun.com<br />
              john@villasun.com<br />
              anna@villasun.com
            </p>
            <p className="mt-2 text-xs">Passwort: beliebig</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;