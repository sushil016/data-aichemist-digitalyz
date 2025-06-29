import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500/10 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            {/* Main Title */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-6">
                Data Alchemist
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Your AI-powered assistant for transforming messy spreadsheets into clean, validated data. Simply upload your CSV files, let AI detect and fix errors, set rules in plain English, and export ready-to-use datasets.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/datatabs-demo" className="group">
                <button className="px-8 py-4 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-gray-500/25 transform hover:scale-105 transition-all duration-300 border border-gray-600">
                  Live Demo
                </button>
              </Link>
              <Link href="#features" className="group">
                <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-gray-400 hover:bg-white/20 transition-all duration-300">
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
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Explore our interactive demos and see how Data Alchemist transforms your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Complete Platform Demo */}
          <Link href="/datatabs-demo" className="group">
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                Complete Platform
              </h3>
              <p className="text-gray-300 mb-4">
                Full dashboard with tabs, validation, file upload, and AI features
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">Tabbed Interface</span>
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">Real-time Validation</span>
              </div>
            </div>
          </Link>

          {/* Business Rules Demo */}
          <Link href="/business-rules-demo" className="group">
            <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-500/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                AI Business Rules
              </h3>
              <p className="text-gray-300 mb-4">
                Natural language rule creation with AI recommendations
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">Natural Language</span>
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">AI Powered</span>
              </div>
            </div>
          </Link>

          {/* Data Grid Demo */}
          <Link href="/datagrid-demo" className="group">
            <div className="relative bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                Data Grid
              </h3>
              <p className="text-gray-300 mb-4">
                Interactive table with inline editing and sorting
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">AG-Grid</span>
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">Inline Editing</span>
              </div>
            </div>
          </Link>

          {/* File Upload Demo */}
          <Link href="/upload-demo" className="group">
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-500/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                File Upload
              </h3>
              <p className="text-gray-300 mb-4">
                Drag & drop CSV/XLSX with auto-parsing
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">Drag & Drop</span>
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">Progress Tracking</span>
              </div>
            </div>
          </Link>

          {/* Validation Panel Demo */}
          <Link href="/validation-demo" className="group">
            <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                Validation Engine
              </h3>
              <p className="text-gray-300 mb-4">
                Smart error detection with clickable navigation
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">Error Grouping</span>
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">Smart Detection</span>
              </div>
            </div>
          </Link>

          {/* Prioritization Demo */}
          <Link href="/prioritization-demo" className="group">
            <div className="relative bg-gradient-to-br from-black/80 to-gray-800/80 backdrop-blur-sm border border-gray-500/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                Prioritization & Weights
              </h3>
              <p className="text-gray-300 mb-4">
                Advanced weighting system with multiple input methods
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">AHP Matrix</span>
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">Preset Profiles</span>
              </div>
            </div>
          </Link>

          {/* AI Features Demo - NEW */}
          <Link href="/ai-features-demo" className="group">
            <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 hover:border-gray-400/60 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-gray-500/20">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300"></div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors">
                AI Features Showcase
              </h3>
              <p className="text-gray-300 mb-4">
                Advanced AI capabilities with Anthropic Claude
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">NL Modification</span>
                <span className="px-3 py-1 bg-gray-600/50 text-gray-200 rounded-full text-sm">AI Error Fix</span>
                <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm">Smart Rules</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-gray-300 text-lg">
            Everything you need for professional data management
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Real-time Validation",
              description: "Instant feedback with smart error detection",
              gradient: "from-gray-300 to-gray-500"
            },
            {
              title: "Live Updates",
              description: "Zustand-powered reactive state management",
              gradient: "from-gray-400 to-gray-600"
            },
            {
              title: "Inline Editing",
              description: "Edit data directly with validation",
              gradient: "from-gray-200 to-gray-400"
            },
            {
              title: "File Processing",
              description: "CSV/XLSX upload with auto-parsing",
              gradient: "from-gray-300 to-gray-500"
            },
            {
              title: "Error Navigation",
              description: "Click errors to jump to problematic data",
              gradient: "from-gray-400 to-gray-600"
            },
            {
              title: "Rich Data Grid",
              description: "AG-Grid with sorting and filtering",
              gradient: "from-gray-200 to-gray-400"
            },
            {
              title: "AI Business Rules",
              description: "Natural language rule creation and management",
              gradient: "from-gray-300 to-gray-500"
            },
            {
              title: "Smart Recommendations",
              description: "AI-powered insights and optimization suggestions",
              gradient: "from-gray-400 to-gray-600"
            },
            {
              title: "Prioritization Engine",
              description: "Advanced weighting and priority management",
              gradient: "from-gray-200 to-gray-400"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="text-center">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {/* {feature.icon} */}
                </div>
                <h3 className={`text-xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent mb-3`}>
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
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
            Tech stack used
          </h2>
          <p className="text-gray-300 text-lg">
            Powered by the latest and greatest technologies
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: 'Next.js 15', color: 'from-gray-600 to-gray-800' },
            { name: 'TypeScript', color: 'from-gray-500 to-gray-700' },
            { name: 'Zustand', color: 'from-gray-700 to-gray-900' },
            { name: 'Tailwind CSS', color: 'from-gray-600 to-gray-800' },

          ].map((tech) => (
            <span
              key={tech.name}
              className={`px-6 py-3 bg-gradient-to-r ${tech.color} text-white rounded-full text-sm font-semibold shadow-lg hover:scale-105 transition-transform duration-200 cursor-default border border-gray-500/30`}
            >
              {tech.name}
            </span>
          ))}
        </div>
      </div>

      {/* Deployment Architecture */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Enterprise Deployment Architecture
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Production-ready deployment on Microsoft Azure with Kubernetes orchestration, 
            Application Gateway for Containers, and automated CI/CD pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Infrastructure Components */}
          <div className="bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-sm border border-gray-500/40 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center">
              <span className="bg-gray-600/30 text-gray-200 px-3 py-1 rounded-lg text-sm mr-3">INFRA</span>
              Azure Infrastructure
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold mt-1">AKS</span>
                <div>
                  <h4 className="text-white font-semibold">Azure Kubernetes Service</h4>
                  <p className="text-gray-300 text-sm">Container orchestration with auto-scaling</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold mt-1">AGW</span>
                <div>
                  <h4 className="text-white font-semibold">Application Gateway for Containers</h4>
                  <p className="text-gray-300 text-sm">Layer 7 load balancing with SSL termination</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-bold mt-1">ALB</span>
                <div>
                  <h4 className="text-white font-semibold">External Load Balancer</h4>
                  <p className="text-gray-300 text-sm">High availability traffic distribution</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-bold mt-1">ACR</span>
                <div>
                  <h4 className="text-white font-semibold">Azure Container Registry</h4>
                  <p className="text-gray-300 text-sm">Private Docker image repository</p>
                </div>
              </div>
            </div>
          </div>

          {/* DevOps Pipeline */}
          <div className="bg-gradient-to-br from-black/60 to-gray-900/60 backdrop-blur-sm border border-gray-600/40 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center">
              <span className="bg-gray-700/30 text-gray-200 px-3 py-1 rounded-lg text-sm mr-3">CICD</span>
              DevOps Pipeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold mt-1">GHA</span>
                <div>
                  <h4 className="text-white font-semibold">GitHub Actions</h4>
                  <p className="text-gray-300 text-sm">Automated build, test, and deployment</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold mt-1">DOC</span>
                <div>
                  <h4 className="text-white font-semibold">Docker Containerization</h4>
                  <p className="text-gray-300 text-sm">Multi-stage builds with optimization</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-bold mt-1">SSL</span>
                <div>
                  <h4 className="text-white font-semibold">Let's Encrypt SSL</h4>
                  <p className="text-gray-300 text-sm">Automated certificate management</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <span className="bg-gray-800 text-white px-2 py-1 rounded text-xs font-bold mt-1">K8S</span>
                <div>
                  <h4 className="text-white font-semibold">Kubernetes Manifests</h4>
                  <p className="text-gray-300 text-sm">Declarative deployment configuration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deployment Steps */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Deployment Process
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Containerization",
                description: "Created optimized Dockerfile with multi-stage builds for Next.js standalone deployment",
                color: "from-gray-500 to-gray-600"
              },
              {
                step: "02",
                title: "Registry Push",
                description: "Built and pushed Docker images to Azure Container Registry with automated versioning",
                color: "from-gray-600 to-gray-700"
              },
              {
                step: "03",
                title: "Infrastructure Setup",
                description: "Provisioned AKS cluster, Application Gateway, and external load balancer with Azure CLI",
                color: "from-gray-400 to-gray-500"
              },
              {
                step: "04",
                title: "CI/CD Pipeline",
                description: "Implemented GitHub Actions workflow for automated testing, building, and deployment",
                color: "from-gray-700 to-gray-800"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <h4 className="text-white font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
