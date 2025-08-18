import React, { useState } from 'react';
import testCases from '../../tests/integration_test';

/**
 * A component that provides a UI for running integration tests
 * This can be temporarily added to any page for testing purposes
 */
const IntegrationTestRunner = () => {
  const [expandedTest, setExpandedTest] = useState(null);
  const [testResults, setTestResults] = useState({});

  const toggleTest = (index) => {
    setExpandedTest(expandedTest === index ? null : index);
  };

  const markTestResult = (index, result) => {
    setTestResults(prev => ({
      ...prev,
      [index]: result
    }));
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Integration Test Runner</h2>
      
      <div className="space-y-4">
        {testCases.map((testCase, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${testResults[index] === 'pass' 
              ? 'bg-green-900/20 border-green-500/30' 
              : testResults[index] === 'fail'
                ? 'bg-red-900/20 border-red-500/30'
                : 'bg-slate-700/30 border-slate-600/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {testResults[index] === 'pass' && (
                  <span className="text-green-400 text-xl">✓</span>
                )}
                {testResults[index] === 'fail' && (
                  <span className="text-red-400 text-xl">✗</span>
                )}
                {index + 1}. {testCase.name}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => markTestResult(index, 'pass')}
                  className="px-3 py-1 bg-green-600/30 hover:bg-green-600/50 text-green-400 rounded-lg transition-colors"
                >
                  Pass
                </button>
                <button 
                  onClick={() => markTestResult(index, 'fail')}
                  className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 rounded-lg transition-colors"
                >
                  Fail
                </button>
                <button 
                  onClick={() => toggleTest(index)}
                  className="px-3 py-1 bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                >
                  {expandedTest === index ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            {expandedTest === index && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium text-slate-300 mb-2">Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    {testCase.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step.replace(/^\d+\.\s/, '')}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-300 mb-2">Expected Results:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {testCase.expectedResults.map((result, resultIndex) => (
                      <li key={resultIndex}>{result}</li>
                    ))}
                  </ul>
                </div>
                
                {testResults[index] === 'fail' && (
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">Failure Notes:</h4>
                    <textarea 
                      className="w-full bg-slate-800 border border-red-500/30 rounded-lg p-3 text-slate-300"
                      placeholder="Enter details about the failure here..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <div>
          <span className="text-slate-400">
            {Object.values(testResults).filter(r => r === 'pass').length} passed, {' '}
            {Object.values(testResults).filter(r => r === 'fail').length} failed, {' '}
            {testCases.length - Object.values(testResults).length} pending
          </span>
        </div>
        <button 
          onClick={() => setTestResults({})}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Reset Results
        </button>
      </div>
    </div>
  );
};

export default IntegrationTestRunner;