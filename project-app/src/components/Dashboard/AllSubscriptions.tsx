import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import type { Subscription } from '../../data/types';
import { SubscriptionCard } from '../Subscriptions/SubscriptionCard';
import { SubscriptionForm } from '../Subscriptions/SubscriptionForm';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export const AllSubscriptions: React.FC = () => {
  const user = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllSubscriptions();
  }, []);

  const fetchAllSubscriptions = async () => {
    try {
      const res = await fetch('https://subscription-manager-website.onrender.com/subscriptions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
        });

      const data = await res.json();
      setSubscriptions(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch subscriptions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
       await fetch('https://subscription-manager-website.onrender.com/subscriptions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            id: id
          })
        });
        
      toast.success('Subscription deleted successfully!');
      fetchAllSubscriptions();
    } catch (error: any) {
      toast.error('Failed to delete subscription');
      console.error(error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowForm(true);
  };

  const handleToggleVisibility = async (id: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'private' ? 'shared' : 'private';
    console.log("Works?")
    
    try {
      await fetch('https://subscription-manager-website.onrender.com/subscriptions/visibility', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            id: id,
            visibility: newVisibility
          })
        });

      toast.success(`Subscription visibility changed to ${newVisibility}`);
      fetchAllSubscriptions();
    } catch (error: any) {
      toast.error('Failed to update visibility');
      console.error(error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingSubscription) {
        formData['id']=editingSubscription.id;
        await fetch('https://subscription-manager-website.onrender.com/subscriptions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            formdata: formData
          })
        });
      
        toast.success('Subscription updated successfully!');
      } else {

        await fetch('https://subscription-manager-website.onrender.com/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            formdata: formData
          })
        });
        
        toast.success('Subscription added successfully!');
      }

      setShowForm(false);
      setEditingSubscription(null);
      fetchAllSubscriptions();
    } catch (error) {
      toast.error('Failed to save subscription');
      console.error(error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6" />
            All Subscriptions
          </h2>
          <p className="text-gray-600">Manage all user subscriptions and visibility settings</p>
        </div>
      </div>

      <div className="mb-6">
        <input
          placeholder="Search by service name or user email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No subscriptions found matching your search.' : 'No subscriptions found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </div>
      )}

      {showForm && (
        <SubscriptionForm
          subscription={editingSubscription || undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSubscription(null);
          }}
          isAdmin
        />
      )}
    </div>
  );
};