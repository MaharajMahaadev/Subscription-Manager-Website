import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import type { Subscription } from '../../data/types';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../UI/GlassCard';
import { formatCurrency, calculateMonthlyCost, categorizeSubscription } from '../../utils/helper';

interface InsightsProps {
  isGlobal?: boolean;
}

export const Insights: React.FC<InsightsProps> = ({ isGlobal = false }) => {
  const user = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [ necessarySubscriptions, setNecessarySubscriptions ] = useState<Subscription[]>([]);
  const [ optionalSubscriptions, setOptionalSubscriptions ] = useState<Subscription[]>([]);
  const [ improvementText, setImprovementsText] = useState<String>("");

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    try {
      const res = await fetch('https://subscription-manager-website.onrender.com/subscriptions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.user}`
          }
        });

        const data = await res.json();
        console.log(data);

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    callAI();
  }, [subscriptions]);

  async function callAI(){

    let val = "";
    subscriptions.map((state) => {
      val += state.id + " ," + state.service_name + ", " + state.cost.toString() + ", " + state.billing_cycle + ". ";
    });

    const res = await fetch('https://subscription-manager-website.onrender.com/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.user}`
      },
      body: JSON.stringify(
        { val:  val}),
    });

    const data = await res.json();

    console.log(data.candidates[0].content.parts[0].text);

    const dataReal = data.candidates[0].content.parts[0].text;
    
    const necessaryMatch = dataReal.match(/necessary: \((.*?)\)/);
    const optionalMatch = dataReal.match(/optional: \((.*?)\)/);
    const improvementMatch = dataReal.match(/Optional improvements: (.*)/);
    

    const necessaryIds = necessaryMatch && necessaryMatch[1].trim() !== "" 
  ? necessaryMatch[1].split(",").map((id:String) => Number(id.trim())) 
  : [];

    const optionalIds = optionalMatch && optionalMatch[1].trim() !== "" 
      ? optionalMatch[1].split(",").map((id:String) => Number(id.trim())) 
      : [];

      console.log(typeof(necessaryIds));
      console.log(typeof(subscriptions[0].id));

    const necessaryMatches = subscriptions.filter(item => necessaryIds.includes(item.id));
    const optionalMatches = subscriptions.filter(item => optionalIds.includes(item.id));

    console.log(necessaryMatches.length)
    setNecessarySubscriptions(necessaryMatches);
    setOptionalSubscriptions(optionalMatches);
    setImprovementsText(improvementMatch[1].trim());

    
  }

  const analyzeSubscriptions = () => {
    const necessary = subscriptions.filter(sub => 
      categorizeSubscription(sub.service_name) === 'necessary'
    );
    const optional = subscriptions.filter(sub => 
      categorizeSubscription(sub.service_name) === 'optional'
    );

    const totalMonthlyCost = subscriptions.reduce((total, sub) => 
      total + calculateMonthlyCost(sub.cost, sub.billing_cycle), 0
    );

    const necessaryMonthlyCost = necessary.reduce((total, sub) => 
      total + calculateMonthlyCost(sub.cost, sub.billing_cycle), 0
    );

    const optionalMonthlyCost = optional.reduce((total, sub) => 
      total + calculateMonthlyCost(sub.cost, sub.billing_cycle), 0
    );

    const potentialSavings = optionalMonthlyCost * 0.3; // 30% of optional subscriptions

    return {
      total: subscriptions.length,
      necessary: necessary.length,
      optional: optional.length,
      totalMonthlyCost,
      necessaryMonthlyCost,
      optionalMonthlyCost,
      potentialSavings
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const insights = analyzeSubscriptions();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          {isGlobal ? 'Global Insights' : 'Your Subscription Insights'}
        </h2>
        <p className="text-gray-600">
          AI-powered analysis of your subscription spending
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Subscriptions</p>
              <p className="text-3xl font-bold text-gray-800">{insights.total}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Monthly Cost</p>
              <p className="text-3xl font-bold text-gray-800">
                {formatCurrency(insights.totalMonthlyCost)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Essential Services</p>
              <p className="text-3xl font-bold text-green-600">{insights.necessary}</p>
            </div>
            <Target className="w-8 h-8 text-green-500" />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Potential Savings</p>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(insights.potentialSavings)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </GlassCard>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-medium">Essential Services</span>
              <span className="font-semibold">{formatCurrency(insights.necessaryMonthlyCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-orange-600 font-medium">Optional Services</span>
              <span className="font-semibold">{formatCurrency(insights.optionalMonthlyCost)}</span>
            </div>
            <hr className="border-white/30" />
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total Monthly</span>
              <span className="font-bold">{formatCurrency(insights.totalMonthlyCost)}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimization Suggestions</h3>
            {improvementText}
        </GlassCard>
      </div>

      {/* Categorized Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard>
              <h3 className={`text-lg font-semibold mb-4`}>
                Necessary Subscriptions ({necessarySubscriptions.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {necessarySubscriptions.map(sub => (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-lg bg-green-300/30 border border-white/30`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{sub.service_name}</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(calculateMonthlyCost(sub.cost, sub.billing_cycle))}/mo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard>
              <h3 className={`text-lg font-semibold mb-4`}>
                Optional Subscriptions ({optionalSubscriptions.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {optionalSubscriptions.map(sub => (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-lg bg-red-400/30 border border-white/30`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">{sub.service_name}</span>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(calculateMonthlyCost(sub.cost, sub.billing_cycle))}/mo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
      </div>
    </div>
  );
};