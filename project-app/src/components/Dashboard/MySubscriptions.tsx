import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Subscription } from '../../data/types';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionCard } from '../Subscriptions/SubscriptionCard';
import { SubscriptionForm } from '../Subscriptions/SubscriptionForm';
import { Button } from '../UI/Button';
import toast from 'react-hot-toast';

export const MySubscriptions: React.FC = () => {
  const user = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log(user.user);
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;
    
    try {
      const res = await fetch('http://localhost:5000/subscriptions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          }
        });

        const data = await res.json();
        console.log(data);
        
        setSubscriptions(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch subscriptions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    console.log(typeof(formData));
    try {
      if (editingSubscription) {
        formData['id']=editingSubscription.id;
        const res = await fetch('http://localhost:5000/subscriptions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            formdata: formData
          })
        });

        const data = await res.json();
        console.log(data);
      
        toast.success('Subscription updated successfully!');
      } else {

        const res = await fetch('http://localhost:5000/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            formdata: formData
          })
        });

        const data = await res.json();
        console.log(data);
        
        toast.success('Subscription added successfully!');
      }

      setShowForm(false);
      setEditingSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to save subscription');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;

    try {
      const res = await fetch('http://localhost:5000/subscriptions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          },
          body: JSON.stringify({
            id: id
          })
        });

        const data = await res.json();
        console.log(data);
        
      toast.success('Subscription deleted successfully!');
      fetchSubscriptions();
    } catch (error: any) {
      toast.error('Failed to delete subscription');
      console.error(error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowForm(true);
  };

  const filteredSubscriptions = subscriptions.filter(sub =>
    sub.service_name.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Subscriptions</h2>
          <p className="text-gray-600">Manage your personal subscriptions</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={Plus}>
          Add Subscription
        </Button>
      </div>

      <div className="mb-6">
        <input
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>)  => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No subscriptions found matching your search.' : 'No subscriptions yet.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowForm(true)} icon={Plus}>
              Add Your First Subscription
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
        />
      )}
    </div>
  );
};