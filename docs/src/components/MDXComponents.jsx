import React from 'react';
import { AlertCircle, Info, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

// Initialize mermaid
mermaid.initialize({ 
  startOnLoad: true,
  theme: 'default',
  themeVariables: {
    primaryColor: '#667eea',
    primaryTextColor: '#fff',
    primaryBorderColor: '#764ba2',
    lineColor: '#5c7cfa',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#e5e7eb'
  }
});

// Callout Components
export const Note = ({ children, title = 'Note' }) => (
  <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
    <div className="flex items-start">
      <Info className="mr-2 h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold text-blue-900 mb-1">{title}</div>}
        <div className="text-blue-800">{children}</div>
      </div>
    </div>
  </div>
);

export const Warning = ({ children, title = 'Warning' }) => (
  <div className="my-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
    <div className="flex items-start">
      <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold text-yellow-900 mb-1">{title}</div>}
        <div className="text-yellow-800">{children}</div>
      </div>
    </div>
  </div>
);

export const Tip = ({ children, title = 'Tip' }) => (
  <div className="my-4 rounded-lg border border-green-200 bg-green-50 p-4">
    <div className="flex items-start">
      <CheckCircle className="mr-2 h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold text-green-900 mb-1">{title}</div>}
        <div className="text-green-800">{children}</div>
      </div>
    </div>
  </div>
);

export const Alert = ({ children, title = 'Alert', type = 'error' }) => (
  <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
    <div className="flex items-start">
      <AlertCircle className="mr-2 h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <div className="font-semibold text-red-900 mb-1">{title}</div>}
        <div className="text-red-800">{children}</div>
      </div>
    </div>
  </div>
);

// KPI Component
export const Kpi = ({ label, _value, delta, trend, format = _'number', prefix = '', suffix = '' }) => {
  const formatValue = (_val) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(val);
    } else if (format === 'percent') {
      return `${val}%`;
    } else if (format === 'number') {
      return new Intl.NumberFormat('en-GB').format(val);
    }
    return val;
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const deltaColor = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="inline-block bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-w-[200px]">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        {format === 'currency' && <DollarSign className="h-5 w-5 text-gray-400" />}
        <span className="text-2xl font-bold text-gray-900">
          {prefix}{formatValue(value)}{suffix}
        </span>
      </div>
      {(delta !== undefined || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {delta !== undefined && (
            <span className={`text-sm font-medium ${deltaColor}`}>
              {delta > 0 ? '+' : ''}{delta}%
            </span>
          )}
          {TrendIcon && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
        </div>
      )}
    </div>
  );
};

// Role Badge Component
export const RoleBadge = ({ role }) => {
  const colors = {
    CFO: 'bg-purple-100 text-purple-800 border-purple-200',
    Manager: 'bg-blue-100 text-blue-800 border-blue-200',
    Operator: 'bg-green-100 text-green-800 border-green-200',
    Admin: 'bg-red-100 text-red-800 border-red-200',
    Developer: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const colorClass = colors[role] || colors.Developer;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {role}
    </span>
  );
};

// Tabs Component
export const Tabs = ({ children, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const tabs = React.Children.toArray(children);

  return (
    <div className="my-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, _index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.props.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {tabs[activeTab]}
      </div>
    </div>
  );
};

export const Tab = ({ children, label }) => <div>{children}</div>;

// Mermaid Diagram Component
export const Mermaid = ({ chart }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      mermaid.render('mermaid-' + Math.random().toString(36).substr(2, 9), chart)
        .then(({ svg }) => {
          containerRef.current.innerHTML = svg;
        })
        .catch(err => {
          console.error('Mermaid rendering failed:', err);
          containerRef.current.innerHTML = `<pre>${chart}</pre>`;
        });
    }
  }, [chart]);

  return (
    <div className="my-6 p-4 bg-gray-50 rounded-lg overflow-x-auto">
      <div ref={containerRef} className="mermaid" />
    </div>
  );
};

// Code Block with Copy
export const CodeBlock = ({ children, language = _'javascript', title }) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = () => {
    const code = typeof children === 'string' ? children : children.props.children;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-lg bg-gray-900 overflow-hidden">
      {title && (
        <div className="bg-gray-800 px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
          {title}
        </div>
      )}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm">
          <code className={`language-${language}`}>{children}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

// Feature Card Component
export const FeatureCard = ({ title, description, icon: Icon, href }) => {
  const content = (
    <div className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
      {Icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block no-underline">
        {content}
      </a>
    );
  }

  return content;
};

// Board Ready Badge
export const BoardReady = ({ status = true }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      status 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
    }`}>
      <CheckCircle className="w-4 h-4" />
      {status ? 'Board Ready' : 'In Progress'}
    </div>
  );
};

// Compliance Badge
export const ComplianceBadge = ({ region }) => {
  const badges = {
    EU: { text: 'GDPR Compliant', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    US: { text: 'SOX Compliant', color: 'bg-red-100 text-red-800 border-red-200' },
    UK: { text: 'UK GDPR', color: 'bg-purple-100 text-purple-800 border-purple-200' }
  };

  const badge = badges[region] || { text: region, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
      {badge.text}
    </span>
  );
};

// API Endpoint Component
export const ApiEndpoint = ({ _method, _path, description }) => {
  const methodColors = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500'
  };

  return (
    <div className="my-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 text-xs font-bold text-white rounded ${methodColors[method] || 'bg-gray-500'}`}>
          {method}
        </span>
        <code className="flex-1 text-sm font-mono text-gray-900">{path}</code>
      </div>
      {description && (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      )}
    </div>
  );
};

// Screenshot Component with Caption
export const Screenshot = ({ _src, _alt, caption }) => {
  return (
    <figure className="my-6">
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <img src={src} alt={alt} className="w-full" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-gray-600">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// Video Embed Component
export const Video = ({ _src, title, poster }) => {
  return (
    <div className="my-6 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <video
        controls
        className="w-full"
        poster={poster}
        title={title}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

// Export all components for MDX provider
const MDXComponents = {
  Note,
  Warning,
  Tip,
  Alert,
  Kpi,
  RoleBadge,
  Tabs,
  Tab,
  Mermaid,
  CodeBlock,
  FeatureCard,
  BoardReady,
  ComplianceBadge,
  ApiEndpoint,
  Screenshot,
  Video
};

export default MDXComponents;