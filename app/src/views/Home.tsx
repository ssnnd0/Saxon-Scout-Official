import React from 'react';
import { spacing } from '../styles/tokens';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
  navigate: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ navigate: propNavigate }) => {
  const navigate = useNavigate();
  
  const modules = [
    {
      id: 'quick',
      icon: 'fa-bolt',
      title: 'Match Scouting',
      description: 'Rapid match data collection',
      color: 'blue-500',
      bgColor: 'blue-50',
      textColor: 'blue-700',
      hoverBgColor: 'blue-100'
    },
    {
      id: 'pit',
      icon: 'fa-robot',
      title: 'Pit Scouting',
      description: 'Robot capability assessment with photos',
      color: 'purple-500',
      bgColor: 'purple-50',
      textColor: 'purple-700',
      hoverBgColor: 'purple-100'
    },
    {
      id: 'info',
      icon: 'fa-chart-line',
      title: 'Data Analysis',
      description: 'Strategic insights and visualizations',
      color: 'green-500',
      bgColor: 'green-50',
      textColor: 'green-700',
      hoverBgColor: 'green-100'
    },
    {
      id: 'alliance',
      icon: 'fa-users',
      title: 'Alliance Selection',
      description: 'AI-powered team recommendations',
      color: 'yellow-500',
      bgColor: 'yellow-50',
      textColor: 'yellow-700',
      hoverBgColor: 'yellow-100'
    },
    {
      id: 'match-planning',
      icon: 'fa-clipboard-list',
      title: 'Match Planning',
      description: 'Strategy and role assignment',
      color: 'red-500',
      bgColor: 'red-50',
      textColor: 'red-700',
      hoverBgColor: 'red-100'
    },
    {
      id: 'schedule',
      icon: 'fa-calendar',
      title: 'Event Schedule',
      description: 'Match schedules from TBA',
      color: 'indigo-500',
      bgColor: 'indigo-50',
      textColor: 'indigo-700',
      hoverBgColor: 'indigo-100'
    },
    {
      id: 'analytics',
      icon: 'fa-chart-bar',
      title: 'Analytics',
      description: 'Scouter performance metrics',
      color: 'teal-500',
      bgColor: 'teal-50',
      textColor: 'teal-700',
      hoverBgColor: 'teal-100'
    },
    {
      id: 'export',
      icon: 'fa-download',
      title: 'Data Export',
      description: 'Export and share data',
      color: 'gray-500',
      bgColor: 'gray-50',
      textColor: 'gray-700',
      hoverBgColor: 'gray-100'
    }
  ];

  const statusCards = [
    {
      icon: 'fa-wifi',
      title: 'ONLINE',
      description: 'Server Connected',
      iconBg: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      icon: 'fa-database',
      title: 'SECURE',
      description: 'Data Protected',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      icon: 'fa-shield-alt',
      title: 'READY',
      description: 'Competition Mode',
      iconBg: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      icon: 'fa-trophy',
      title: 'VICTORY',
      description: 'Team 611',
      iconBg: 'bg-gray-900',
      textColor: 'text-gray-900'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`max-w-7xl mx-auto px-${spacing.lg} py-${spacing.xl}`}>
        {/* Header Section */}
        <div className={`text-center mb-${spacing.xl}`}>
          <h1 className={`text-4xl font-bold text-gray-900 mb-${spacing.sm}`}>
            SAXON SCOUT
          </h1>
          <p className={`text-lg text-gray-600`}>
            Scouting Data Collection & Analysis
          </p>
        </div>

        {/* Hero Section */}
        <div className={`bg-white shadow-lg rounded-${spacing.sm} overflow-hidden mb-${spacing.xl}`}>
          <div className={`p-${spacing.xl}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className={`bg-yellow-500 p-${spacing.md} rounded-md text-white`}>
                    <i className="fas fa-shield-alt text-2xl"></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">SAXON SCOUT</h1>
                    <div className="flex space-x-4 mt-4">
                      <span className={`inline-flex items-center px-${spacing.md} py-${spacing.xs} rounded-full text-sm font-medium bg-yellow-100 text-yellow-800`}>
                        TEAM 611
                      </span>
                      <span className={`inline-flex items-center px-${spacing.md} py-${spacing.xs} rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300`}>
                        v2.1
                      </span>
                    </div>
                  </div>
                </div>
                <p className={`text-gray-600 text-lg`}>
                  Advanced FRC scouting platform for competitive advantage
                </p>
              </div>
              <div className={`bg-gray-50 p-${spacing.xl} rounded-lg text-center`}>
                <div className={`text-4xl font-bold text-gray-900 mb-${spacing.xs}`}>FRC 2025</div>
                <div className={`text-2xl font-bold text-yellow-600 mb-${spacing.md}`}>REEFSCAPE</div>
                <div className={`inline-flex items-center px-${spacing.md} py-${spacing.xs} rounded-full text-sm font-medium bg-green-100 text-green-800`}>
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Competition Ready
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-${spacing.lg} mb-${spacing.xl}`}>
          {modules.map((module) => (
            <div 
              key={module.id}
              onClick={() => navigate(`/${module.id}`)}
              className={`bg-white overflow-hidden shadow rounded-lg h-full flex flex-col border-l-4 border-${module.color} hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/${module.id}`)}
            >
              <div className={`p-${spacing.lg} flex-1 flex flex-col`}>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 p-${spacing.md} rounded-md bg-${module.bgColor}`}>
                    <i className={`fas ${module.icon} text-${module.color} text-xl`} />
                  </div>
                  <div className={`ml-${spacing.md}`}>
                    <h3 className={`text-lg font-medium text-gray-900`}>
                      {module.title}
                    </h3>
                    <p className={`mt-${spacing.xs} text-sm text-gray-500`}>
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className={`mt-${spacing.md} pt-${spacing.md} border-t border-gray-100`}>
                  <button 
                    className={`w-full inline-flex items-center justify-center px-${spacing.md} py-${spacing.xs} border border-transparent text-sm font-medium rounded-md text-${module.textColor} bg-${module.bgColor} hover:bg-${module.hoverBgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${module.color}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/${module.id}`);
                    }}
                  >
                    LAUNCH MODULE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Panel */}
        <div className={`bg-white shadow-lg rounded-${spacing.sm} overflow-hidden`}>
          <div className={`px-${spacing.xl} py-${spacing.lg} border-b border-gray-200`}>
            <div className="flex items-center">
              <i className={`fas fa-shield-alt text-yellow-500 mr-${spacing.sm}`}></i>
              <h2 className={`text-lg font-medium text-gray-900`}>
                SAXON COMMAND STATUS
              </h2>
            </div>
          </div>
          <div className={`p-${spacing.lg}`}>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-${spacing.lg}`}>
              {statusCards.map((card, index) => (
                <div 
                  key={index}
                  className="text-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className={`w-16 h-16 ${card.iconBg} rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4`}>
                    <i className={`fas ${card.icon}`}></i>
                  </div>
                  <div className={`font-bold text-lg ${card.textColor} mb-1`}>
                    {card.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {card.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
