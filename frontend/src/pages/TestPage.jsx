import React from 'react';
import IntegrationTestRunner from '../components/tests/IntegrationTestRunner';

/**
 * A test page that can be accessed to run integration tests
 * This page can be temporarily added to the router for testing purposes
 */
const TestPage = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Integration Testing</h1>
      
      <div className="mb-8">
        <p className="text-slate-300 mb-4">
          This page allows you to run integration tests for the enhanced list functionality.
          Follow the steps for each test case and mark them as passed or failed.
        </p>
        <p className="text-slate-400 mb-4">
          These tests verify the integration between the frontend components and the enhanced backend functionality.
        </p>
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300">
            <strong>Note:</strong> This page is for development and testing purposes only.
            It should not be accessible in production.
          </p>
        </div>
      </div>
      
      <IntegrationTestRunner />
    </div>
  );
};

export default TestPage;