import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Shield, Lock } from 'lucide-react';

// Admin Translation Hook
function useAdminTranslation() {
  const [adminLanguage] = useState(() => 
    localStorage.getItem('admin-language') || 'de'
  );

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      de: {
        title: 'Excalibur Cuba Admin',
        subtitle: 'Sicherer Zugang zum Verwaltungsbereich',
        username: 'Benutzername',
        password: 'Passwort',
        loginButton: 'Anmelden',
        loginSuccess: 'Anmeldung erfolgreich',
        loginSuccessDesc: 'Sie werden zum Admin-Panel weitergeleitet',
        loginFailed: 'Anmeldung fehlgeschlagen',
        loginFailedDesc: 'Benutzername oder Passwort ist falsch',
        usernameRequired: 'Benutzername ist erforderlich',
        passwordRequired: 'Passwort ist erforderlich',
        usernamePlaceholder: 'Ihr Benutzername',
        passwordPlaceholder: 'Ihr Passwort',
        securityNotice: 'Sichere Anmeldung erforderlich',
        securityDesc: 'Dieser Bereich ist nur für autorisierte Benutzer zugänglich'
      },
      es: {
        title: 'Admin Excalibur Cuba',
        subtitle: 'Acceso seguro al área de administración',
        username: 'Usuario',
        password: 'Contraseña',
        loginButton: 'Iniciar Sesión',
        loginSuccess: 'Inicio de sesión exitoso',
        loginSuccessDesc: 'Será redirigido al panel de administración',
        loginFailed: 'Inicio de sesión fallido',
        loginFailedDesc: 'Usuario o contraseña incorrectos',
        usernameRequired: 'El usuario es requerido',
        passwordRequired: 'La contraseña es requerida',
        usernamePlaceholder: 'Su nombre de usuario',
        passwordPlaceholder: 'Su contraseña',
        securityNotice: 'Inicio de sesión seguro requerido',
        securityDesc: 'Esta área es solo para usuarios autorizados'
      }
    };
    
    return translations[adminLanguage]?.[key] || translations.de[key] || key;
  };

  return { t, currentLanguage: adminLanguage };
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useAdminTranslation();

  const loginSchema = z.object({
    username: z.string().min(1, t('usernameRequired')),
    password: z.string().min(1, t('passwordRequired')),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('loginSuccess'),
        description: t('loginSuccessDesc'),
      });
      setLocation('/admin/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: t('loginFailed'),
        description: t('loginFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Security Notice */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('securityNotice')}</h1>
          <p className="text-gray-600">{t('securityDesc')}</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <Lock className="w-6 h-6" />
              {t('title')}
            </CardTitle>
            <CardDescription className="text-blue-100">
              {t('subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">{t('username')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text" 
                          placeholder={t('usernamePlaceholder')}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">{t('password')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder={t('passwordPlaceholder')}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-lg shadow-lg transition-all duration-200"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('loginButton')}...
                    </div>
                  ) : (
                    t('loginButton')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 Excalibur Cuba - Secure Admin Access
          </p>
        </div>
      </div>
    </div>
  );
}