import React, { useState } from 'react';
import { Sparkles, Wand2, ArrowRight } from 'lucide-react';
import apiClient from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const SmartSubscriptionInput = ({ onParsedData, formData, setFormData }) => {
  const [nlpInput, setNlpInput] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleSmartParse = async () => {
    if (!nlpInput.trim()) return;
    
    setParsing(true);
    try {
      const response = await apiClient.post('/subscriptions/subscriptions/parse_nlp/', {
        query: nlpInput
      });
      
      const parsed = response.data.parsed_data;
      
      if (parsed.confidence > 0.7) {
        // Auto-fill form with high confidence
        setFormData(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          provider: parsed.provider || prev.provider,
          amount: parsed.amount || prev.amount,
          billing_cycle: parsed.billing_cycle || prev.billing_cycle,
          payment_method: parsed.payment_method || prev.payment_method,
          description: parsed.description || prev.description,
        }));
        
        toast.success('Subscription details parsed successfully!');
        setNlpInput('');
      } else {
        toast.error('Could not parse subscription details. Please try a different format.');
      }
    } catch (error) {
      toast.error('Failed to parse subscription details');
    } finally {
      setParsing(false);
    }
  };

  const examples = [
    "Netflix 15.99 monthly starting today",
    "Spotify premium 9.99 per month via credit card",
    "Adobe Creative Suite 52.99 monthly subscription",
    "YouTube Premium 129 yearly plan"
  ];

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-white">Smart Input</h3>
        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">AI Powered</span>
      </div>
      
      <p className="text-slate-400 text-sm mb-3">
        Describe your subscription in natural language, and we'll fill the form automatically.
      </p>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={nlpInput}
          onChange={(e) => setNlpInput(e.target.value)}
          placeholder="e.g., Netflix 15.99 monthly starting today"
          className="flex-1 p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          onKeyPress={(e) => e.key === 'Enter' && handleSmartParse()}
        />
        <button
          onClick={handleSmartParse}
          disabled={parsing || !nlpInput.trim()}
          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
        >
          {parsing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Parsing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Parse
            </>
          )}
        </button>
      </div>
      
      <div className="space-y-1">
        <p className="text-xs text-slate-500 mb-2">Try these examples:</p>
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => setNlpInput(example)}
            className="block w-full text-left text-xs text-slate-400 hover:text-purple-300 transition-colors p-1 rounded hover:bg-purple-500/10"
          >
            "{example}"
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartSubscriptionInput;