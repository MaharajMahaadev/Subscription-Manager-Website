import React, { createContext, useContext,  useState } from 'react';
import type { AuthContextType } from '../data/types';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<String | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const res = await fetch('https://subscription-manager-website.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        })
      });
      const data = await res.json();
      console.log(data);
      setUser(data.accesstoken);

      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
      throw error;
    }
    finally{
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);

      const res = await fetch('localhost:5000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
        })
      });
      const data = await res.json();
      console.log(data);
      setUser(data);
        
      toast.success('Account created successfully!');
    }
    catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message);
      setLoading(false);
      throw error;
    } finally {
      // Only set loading to false if we're not setting a user (admin case)

        setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};