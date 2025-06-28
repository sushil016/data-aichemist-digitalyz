import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Main Title */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-6">
                Data Alchemist
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Transform raw data into powerful insights with our cutting-edge validation and management platform
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/datatabs-demo" className="group">
                <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
                  Live Demo
                </button>
              </Link>
              <Link href="#features" className="group">
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                  View Features
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Cards Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Experience the Power
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Explore our interactive demos and see how Data Alchemist transforms your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Complete Platform Demo */}
          <Link href="/datatabs-demo" className="group">
            <div className="relative bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 hover:border-blue-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                Complete Platform
              </h3>
              <p className="text-slate-300 mb-4">
                Full dashboard with tabs, validation, file upload, and AI features
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Tabbed Interface</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Real-time Validation</span>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">AI Rules</span>
              </div>
            </div>
          </Link>

          {/* Business Rules Demo */}
          <Link href="/business-rules-demo" className="group">
            <div className="relative bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                AI Business Rules
              </h3>
              <p className="text-slate-300 mb-4">
                Natural language rule creation with AI recommendations
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Natural Language</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">AI Powered</span>
              </div>
            </div>
          </Link>

          {/* Data Grid Demo */}
          <Link href="/datagrid-demo" className="group">
            <div className="relative bg-gradient-to-br from-emerald-900/50 to-teal-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-8 hover:border-emerald-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                Data Grid
              </h3>
              <p className="text-slate-300 mb-4">
                Interactive table with inline editing and sorting
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">AG-Grid</span>
                <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Inline Editing</span>
              </div>
            </div>
          </Link>

          {/* File Upload Demo */}
          <Link href="/upload-demo" className="group">
            <div className="relative bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-8 hover:border-orange-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors">
                File Upload
              </h3>
              <p className="text-slate-300 mb-4">
                Drag & drop CSV/XLSX with auto-parsing
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Drag & Drop</span>
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">Progress Tracking</span>
              </div>
            </div>
          </Link>

          {/* Validation Panel Demo */}
          <Link href="/validation-demo" className="group">
            <div className="relative bg-gradient-to-br from-pink-900/50 to-rose-900/50 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-8 hover:border-pink-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-pink-300 transition-colors">
                Validation Engine
              </h3>
              <p className="text-slate-300 mb-4">
                Smart error detection with clickable navigation
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">Error Grouping</span>
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-sm">Smart Detection</span>
              </div>
            </div>
          </Link>

          {/* Prioritization Demo */}
          <Link href="/prioritization-demo" className="group">
            <div className="relative bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-8 hover:border-purple-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚖️</div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                Prioritization & Weights
              </h3>
              <p className="text-slate-300 mb-4">
                Advanced weighting system with multiple input methods
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">AHP Matrix</span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">Preset Profiles</span>
              </div>
            </div>
          </Link>

          {/* AI Features Demo - NEW */}
          <Link href="/ai-features-demo" className="group">
            <div className="relative bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-8 hover:border-violet-400/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-violet-300 transition-colors">
                AI Features Showcase
              </h3>
              <p className="text-slate-300 mb-4">
                Milestone 3: Advanced AI capabilities with Anthropic Claude
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm">NL Modification</span>
                <span className="px-3 py-1 bg-fuchsia-500/20 text-fuchsia-300 rounded-full text-sm">AI Error Fix</span>
                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-sm">Smart Rules</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ⚡ Powerful Features
          </h2>
          <p className="text-slate-300 text-lg">
            Everything you need for professional data management
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: "⚡",
              title: "Real-time Validation",
              description: "Instant feedback with smart error detection",
              gradient: "from-yellow-400 to-orange-500"
            },
            {
              icon: "🔄",
              title: "Live Updates",
              description: "Zustand-powered reactive state management",
              gradient: "from-green-400 to-blue-500"
            },
            {
              icon: "📝",
              title: "Inline Editing",
              description: "Edit data directly with validation",
              gradient: "from-purple-400 to-pink-500"
            },
            {
              icon: "📁",
              title: "File Processing",
              description: "CSV/XLSX upload with auto-parsing",
              gradient: "from-blue-400 to-cyan-500"
            },
            {
              icon: "🎯",
              title: "Error Navigation",
              description: "Click errors to jump to problematic data",
              gradient: "from-red-400 to-pink-500"
            },
            {
              icon: "📊",
              title: "Rich Data Grid",
              description: "AG-Grid with sorting and filtering",
              gradient: "from-indigo-400 to-purple-500"
            },
            {
              icon: "🤖",
              title: "AI Business Rules",
              description: "Natural language rule creation and management",
              gradient: "from-cyan-400 to-blue-500"
            },
            {
              icon: "💡",
              title: "Smart Recommendations",
              description: "AI-powered insights and optimization suggestions",
              gradient: "from-amber-400 to-orange-500"
            },
            {
              icon: "⚖️",
              title: "Prioritization Engine",
              description: "Advanced weighting and priority management",
              gradient: "from-pink-400 to-rose-500"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-3`}>
                  {feature.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            🛠️ Built With Modern Tech
          </h2>
          <p className="text-slate-300 text-lg">
            Powered by the latest and greatest technologies
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: 'Next.js 15', color: 'from-gray-600 to-gray-800' },
            { name: 'TypeScript', color: 'from-blue-600 to-blue-800' },
            { name: 'Zustand', color: 'from-purple-600 to-purple-800' },
            { name: 'AG-Grid', color: 'from-green-600 to-green-800' },
            { name: 'Tailwind CSS', color: 'from-cyan-600 to-cyan-800' },
            { name: 'React Dropzone', color: 'from-orange-600 to-orange-800' }
          ].map((tech) => (
            <span
              key={tech.name}
              className={`px-6 py-3 bg-gradient-to-r ${tech.color} text-white rounded-full text-sm font-semibold shadow-lg hover:scale-105 transition-transform duration-200 cursor-default`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 rounded-3xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
            Experience the future of data management with our powerful validation and editing platform
          </p>
          <Link href="/datatabs-demo">
            <button className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300">
              🚀 Start Your Journey
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
