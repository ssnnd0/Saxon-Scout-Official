import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardGrid, StatCard } from '../../components/UI/Card';
import { Button, ButtonGroup } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { FaPlus, FaUpload, FaSearch, FaRobot, FaTrophy, FaUsers, FaChartLine, FaCalendarAlt } from 'react-icons/fa';

// Mock data - replace with real data from your API
const mockData = {
  teamStats: {
    totalMatches: 42,
    winRate: 68,
    avgScore: 125.5,
    highScore: 210,
  },
  upcomingMatches: [
    { id: 1, team: '254', time: '10:30 AM', field: '1' },
    { id: 2, team: '1678', time: '11:15 AM', field: '2' },
    { id: 3, team: '118', time: '2:00 PM', field: '1' },
  ],
  recentActivity: [
    { id: 1, type: 'match', team: '254', result: 'W', score: '145-132', time: '2h ago' },
    { id: 2, type: 'match', team: '973', result: 'L', score: '98-112', time: '4h ago' },
    { id: 3, type: 'note', team: '1678', note: 'Strong autonomous routine', time: '5h ago' },
  ],
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'newMatch':
        navigate('/quick');
        break;
      case 'importData':
        // Handle import data
        break;
      case 'viewAnalytics':
        navigate('/analytics');
        break;
      case 'schedule':
        navigate('/schedule');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-md">
          <Input
            type="search"
            placeholder="Search teams, matches, or events..."
            startIcon={<FaSearch className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ButtonGroup align="end" className="w-full sm:w-auto">
          <Button 
            variant="primary" 
            icon={<FaPlus />}
            onClick={() => handleQuickAction('newMatch')}
            className="w-full sm:w-auto"
          >
            New Match
          </Button>
          <Button 
            variant="outline" 
            icon={<FaUpload />}
            onClick={() => handleQuickAction('importData')}
            className="w-full sm:w-auto"
          >
            Import Data
          </Button>
        </ButtonGroup>
      </div>

      {/* Stats Overview */}
      <Card title="Team Overview" className="mt-6">
        <CardGrid cols={2} className="sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Matches"
            value={mockData.teamStats.totalMatches.toString()}
            icon={<FaRobot className="text-yellow-500" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Win Rate"
            value={`${mockData.teamStats.winRate}%`}
            trend={{ value: '+5%', type: 'increase' }}
            icon={<FaTrophy className="text-yellow-500" />}
            isLoading={isLoading}
          />
          <StatCard
            title="Avg. Score"
            value={mockData.teamStats.avgScore.toString()}
            trend={{ value: '+12.5', type: 'increase' }}
            icon={<FaChartLine className="text-yellow-500" />}
            isLoading={isLoading}
          />
          <StatCard
            title="High Score"
            value={mockData.teamStats.highScore.toString()}
            icon={<FaTrophy className="text-yellow-500" />}
            isLoading={isLoading}
          />
        </CardGrid>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Matches */}
        <Card 
          title="Upcoming Matches" 
          actions={
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleQuickAction('schedule')}
            >
              View All
            </Button>
          }
        >
          <div className="space-y-4">
            {mockData.upcomingMatches.map((match) => (
              <div 
                key={match.id} 
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate(`/teams/${match.team}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FaRobot className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Team {match.team}</h4>
                    <p className="text-xs text-gray-500">Field {match.field} • {match.time}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Scout
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="space-y-4">
            {mockData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  activity.type === 'match' 
                    ? activity.result === 'W' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {activity.type === 'match' ? (
                    <span className="font-medium text-xs">{activity.result}</span>
                  ) : (
                    <FaUsers className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.type === 'match' 
                      ? `Match vs Team ${activity.team}: ${activity.score}`
                      : `Note added for Team ${activity.team}`}
                  </p>
                  {activity.type === 'note' && (
                    <p className="text-sm text-gray-500">{activity.note}</p>
                  )}
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleQuickAction('newMatch')}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
              <FaPlus className="h-5 w-5 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">New Match</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('importData')}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <FaUpload className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">Import Data</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('viewAnalytics')}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <FaChartLine className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">View Analytics</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('schedule')}
            className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <FaCalendarAlt className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">View Schedule</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
