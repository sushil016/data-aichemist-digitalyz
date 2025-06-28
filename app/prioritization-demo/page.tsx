/**
 * @fileoverview Prioritization & Weights Demo Page
 * @description Showcases the advanced prioritization and weighting system
 */

import AdvancedPrioritizationBuilder from '@/components/AdvancedPrioritizationBuilder';

export default function PrioritizationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            ⚖️ Advanced Prioritization & Weights
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Configure sophisticated priority profiles and weighting criteria for intelligent resource allocation
          </p>
        </div>

        {/* Main Component */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
          <AdvancedPrioritizationBuilder />
        </div>
      </div>
    </div>
  );
}
