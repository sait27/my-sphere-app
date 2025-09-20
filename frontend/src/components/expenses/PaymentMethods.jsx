import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { Card } from '../ui/Card';

const PaymentMethods = ({ paymentMethodBreakdown, summary }) => {
  if (!paymentMethodBreakdown.length || !summary?.total_amount) return null;

  return (
    <Card>
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <CreditCard className="mr-2" size={20} />
        Payment Methods
      </h3>
      <div className="space-y-4">
        {paymentMethodBreakdown.map((method, index) => (
          <div key={method.payment_method || `method-${index}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/30 transition-all duration-300 group border border-transparent hover:border-slate-500/30">
            <span className="text-slate-300 capitalize group-hover:text-white transition-colors duration-300">{(method.payment_method || 'N/A').replace('_', ' ')}</span>
            <div className="flex items-center space-x-4">
              <div className="w-36 bg-slate-600/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 group-hover:shadow-lg"
                  style={{
                    width: `${((method.total || 0) / summary.total_amount) * 100}%`,
                    boxShadow: '0 0 8px rgba(6, 182, 212, 0.4)'
                  }}
                ></div>
              </div>
              <span className="text-white font-semibold w-24 text-right group-hover:text-white/90 transition-colors duration-300">
                ₹{(method.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PaymentMethods;