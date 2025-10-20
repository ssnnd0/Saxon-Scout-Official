import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardGrid, StatCard } from '../../components/UI/Card';
import { Button, ButtonGroup } from '../../components/UI/Button';
import { Input, Select } from '../../components/UI/Input';
import { 
  FaChartLine, 
  FaRobot, 
  FaTrophy, 
  FaFilter, 
  FaDownload, 
  FaSearch, 
  FaArrowRight, 
  FaArrowLeft,
  FaTable,
  FaChartBar,
  FaChartPie,
  FaChartArea,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle
} from 'react-icons/fa';

// Mock data - replace with real data from your API
const mockTeams = [
  { number: '254', name: 'Cheesy Poofs', location: 'San Jose, CA', stats: {
    matchesPlayed: 42,
    winRate: 0.85,
    avgScore: 145.3,
    highScore: 210,
    avgAuto: 32.5,
    avgTeleop: 85.2,
    avgEndgame: 27.6,
    reliability: 0.92,
    ranking: 1,
  }},
  { number: '1678', name: 'Citrus Circuits', location: 'Davis, CA', stats: {
    matchesPlayed: 45,
    winRate: 0.82,
    avgScore: 138.7,
    highScore: 205,
    avgAuto: 30.1,
    avgTeleop: 81.5,
    avgEndgame: 27.1,
    reliability: 0.89,
    ranking: 2,
  }},
  { number: '118', name: 'The Robonauts', location: 'Pasadena, CA', stats: {
    matchesPlayed: 40,
    winRate: 0.78,
    avgScore: 132.4,
    highScore: 198,
    avgAuto: 28.7,
    avgTeleop: 77.6,
    avgEndgame: 26.1,
    reliability: 0.85,
    ranking: 3,
  }},
  { number: '973', name: 'Greybots', location: 'Atascadero, CA', stats: {
    matchesPlayed: 43,
    winRate: 0.76,
    avgScore: 128.9,
    highScore: 192,
    avgAuto: 27.3,
    avgTeleop: 75.8,
    avgEndgame: 25.8,
    reliability: 0.84,
    ranking: 4,
  }},
  { number: '1671', name: 'Citrus Circuits', location: 'Davis, CA', stats: {
    matchesPlayed: 41,
    winRate: 0.75,
    avgScore: 125.6,
    highScore: 188,
    avgAuto: 26.8,
    avgTeleop: 73.2,
    avgEndgame: 25.6,
    reliability: 0.83,
    ranking: 5,
  }},
];

const mockMatches = [
  { id: 'qm1', number: 1, redAlliance: ['254', '118', '973'], blueAlliance: ['1678', '1671', '1'], scores: { red: 145, blue: 132 }, winner: 'red' },
  { id: 'qm2', number: 2, redAlliance: ['1678', '973', '1'], blueAlliance: ['254', '118', '1671'], scores: { red: 128, blue: 142 }, winner: 'blue' },
  { id: 'qm3', number: 3, redAlliance: ['254', '1671', '1'], blueAlliance: ['1678', '118', '973'], scores: { red: 138, blue: 135 }, winner: 'red' },
  { id: 'qm4', number: 4, redAlliance: ['118', '973', '1'], blueAlliance: ['254', '1678', '1671'], scores: { red: 122, blue: 156 }, winner: 'blue' },
  { id: 'qm5', number: 5, redAlliance: ['254', '1678', '1'], blueAlliance: ['118', '973', '1671'], scores: { red: 162, blue: 128 }, winner: 'red' },
];

const mockEvents = [
  { id: '2023cafr', name: 'FIRST Championship - Houston', date: '2023-04-19', location: 'Houston, TX' },
  { id: '2023cada', name: 'Central Valley Regional', date: '2023-03-15', location: 'Fresno, CA' },
  { id: '2023casj', name: 'Silicon Valley Regional', date: '2023-03-01', location: 'San Jose, CA' },
];

// Mock chart data
const generateChartData = (type: string) => {
  switch (type) {
    case 'line':
      return {
        labels: ['Match 1', 'Match 2', 'Match 3', 'Match 4', 'Match 5', 'Match 6', 'Match 7', 'Match 8', 'Match 9', 'Match 10'],
        datasets: [
          {
            label: 'Team 254',
            data: [125, 132, 145, 138, 142, 150, 148, 155, 160, 158],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
          },
          {
            label: 'Team 1678',
            data: [118, 125, 130, 135, 140, 138, 145, 142, 148, 152],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            fill: true,
          },
        ],
      };
    case 'bar':
      return {
        labels: ['Auto', 'Teleop', 'Endgame'],
        datasets: [
          {
            label: 'Team 254',
            data: [32.5, 85.2, 27.6],
            backgroundColor: ['#F59E0B', '#F59E0B', '#F59E0B'],
            borderColor: ['#D97706', '#D97706', '#D97706'],
            borderWidth: 1,
          },
          {
            label: 'Team 1678',
            data: [30.1, 81.5, 27.1],
            backgroundColor: ['#3B82F6', '#3B82F6', '#3B82F6'],
            borderColor: ['#2563EB', '#2563EB', '#2563EB'],
            borderWidth: 1,
          },
        ],
      };
    case 'pie':
      return {
        labels: ['Auto', 'Teleop', 'Endgame'],
        datasets: [
          {
            data: [32.5, 85.2, 27.6],
            backgroundColor: ['#F59E0B', '#3B82F6', '#10B981'],
            borderColor: ['#D97706', '#2563EB', '#059669'],
            borderWidth: 1,
          },
        ],
      };
    default:
      return { labels: [], datasets: [] };
  }
};

// Mock Chart component
const Chart = ({ type = 'line', data, title, className = '' }: { type?: string; data: any; title?: string; className?: string }) => {
  // In a real app, you would use a charting library like Chart.js or Recharts
  return (
    <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
      {title && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center text-gray-500">
          <p className="text-sm">Chart: {type}</p>
          <p className="text-xs mt-2">This is a mock chart. In a real app, this would display {type} data.</p>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'matches' | 'compare'>('overview');
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['254', '1678']);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minMatches: 0,
    minWinRate: 0,
    minAvgScore: 0,
  });

  // Filter teams based on search and filters
  const filteredTeams = mockTeams
    .filter(team => 
      team.number.includes(searchQuery) || 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(team => team.stats.matchesPlayed >= filters.minMatches)
    .filter(team => team.stats.winRate * 100 >= filters.minWinRate)
    .filter(team => team.stats.avgScore >= filters.minAvgScore);

  // Get top performers for overview
  const topTeams = [...mockTeams]
    .sort((a, b) => b.stats.ranking - a.stats.ranking)
    .slice(0, 3);

  const handleTeamSelect = (teamNumber: string) => {
    if (selectedTeams.includes(teamNumber)) {
      setSelectedTeams(selectedTeams.filter(t => t !== teamNumber));
    } else if (selectedTeams.length < 4) {
      setSelectedTeams([...selectedTeams, teamNumber]);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Teams"
          value={mockTeams.length.toString()}
          icon={<FaRobot className="text-yellow-500" />}
          trend={{ value: '+12%', type: 'increase' }}
        />
        <StatCard
          title="Total Matches"
          value={mockMatches.length.toString()}
          icon={<FaChartLine className="text-yellow-500" />}
        />
        <StatCard
          title="Top Team"
          value={`#${topTeams[0]?.number} ${topTeams[0]?.name}`}
          icon={<FaTrophy className="text-yellow-500" />}
          className="truncate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Performing Teams">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topTeams.map((team) => (
                  <tr 
                    key={team.number}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/teams/${team.number}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{team.stats.ranking}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <FaRobot className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{team.number}</div>
                          <div className="text-sm text-gray-500">{team.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(team.stats.winRate * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(team.stats.matchesPlayed * team.stats.winRate)}W - {Math.round(team.stats.matchesPlayed * (1 - team.stats.winRate))}L
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.stats.avgScore.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTab('teams')}
            >
              View All Teams <FaArrowRight className="ml-1" />
            </Button>
          </div>
        </Card>

        <Card title="Recent Matches">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Red Alliance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blue Alliance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockMatches.slice(0, 3).map((match) => (
                  <tr 
                    key={match.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/matches/${match.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Q{match.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {match.redAlliance.map(team => (
                          <div key={team} className="flex items-center">
                            <span className={`inline-block h-3 w-3 rounded-full mr-2 ${team === '254' ? 'bg-red-600' : 'bg-red-300'}`}></span>
                            <span className={team === '254' ? 'font-medium text-gray-900' : ''}>
                              {team}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        {match.blueAlliance.map(team => (
                          <div key={team} className="flex items-center">
                            <span className={`inline-block h-3 w-3 rounded-full mr-2 ${team === '254' ? 'bg-blue-600' : 'bg-blue-300'}`}></span>
                            <span className={team === '254' ? 'font-medium text-gray-900' : ''}>
                              {team}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        match.winner === 'red' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {match.scores.red} - {match.scores.blue}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.winner === 'red' ? 'Red' : 'Blue'} wins by {Math.abs(match.scores.red - match.scores.blue)} pts
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTab('matches')}
            >
              View All Matches <FaArrowRight className="ml-1" />
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Team Performance Over Time">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Match Scores</h4>
            <Chart 
              type="line" 
              data={generateChartData('line')} 
              className="h-64"
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Scoring Distribution</h4>
            <Chart 
              type="bar" 
              data={generateChartData('bar')} 
              className="h-64"
            />
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTeamsTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-md">
          <Input
            type="search"
            placeholder="Search teams..."
            startIcon={<FaSearch className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button 
            variant={showFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            icon={<FaFilter />}
            className="w-full sm:w-auto"
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </Button>
          <Button 
            variant="outline"
            icon={<FaDownload />}
            className="w-full sm:w-auto"
          >
            Export
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card title="Filters" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Matches Played</label>
              <Input
                type="number"
                name="minMatches"
                value={filters.minMatches}
                onChange={handleFilterChange}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Win Rate (%)</label>
              <Input
                type="number"
                name="minWinRate"
                value={filters.minWinRate}
                onChange={handleFilterChange}
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Avg. Score</label>
              <Input
                type="number"
                name="minAvgScore"
                value={filters.minAvgScore}
                onChange={handleFilterChange}
                min="0"
              />
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Matches
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  High Score
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeams.map((team) => (
                <tr 
                  key={team.number}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{team.stats.ranking}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <FaRobot className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{team.number}</div>
                        <div className="text-sm text-gray-500">{team.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {team.stats.matchesPlayed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className="bg-yellow-500 h-2.5 rounded-full" 
                          style={{ width: `${team.stats.winRate * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700">
                        {(team.stats.winRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.stats.avgScore.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {team.stats.highScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/teams/${team.number}`);
                      }}
                    >
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!selectedTeams.includes(team.number)) {
                          setSelectedTeams(prev => [...prev, team.number].slice(-4));
                        }
                        setActiveTab('compare');
                      }}
                    >
                      Compare
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTeams.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No teams match your filters. Try adjusting your search criteria.
          </div>
        )}
      </Card>
    </div>
  );

  const renderMatchesTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:max-w-md">
          <Input
            type="search"
            placeholder="Search matches..."
            startIcon={<FaSearch className="text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">All Events</option>
            {mockEvents.map(event => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </Select>
          <Button 
            variant="outline"
            icon={<FaDownload />}
            className="w-full sm:w-auto"
          >
            Export
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Red Alliance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blue Alliance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockMatches.map((match) => (
                <tr 
                  key={match.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Q{match.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mockEvents[0].name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {match.redAlliance.map(team => (
                        <div key={team} className="flex items-center">
                          <span className={`inline-block h-3 w-3 rounded-full mr-2 ${team === '254' ? 'bg-red-600' : 'bg-red-300'}`}></span>
                          <span className={team === '254' ? 'font-medium text-gray-900' : ''}>
                            {team}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {match.blueAlliance.map(team => (
                        <div key={team} className="flex items-center">
                          <span className={`inline-block h-3 w-3 rounded-full mr-2 ${team === '254' ? 'bg-blue-600' : 'bg-blue-300'}`}></span>
                          <span className={team === '254' ? 'font-medium text-gray-900' : ''}>
                            {team}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      match.winner === 'red' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {match.scores.red} - {match.scores.blue}
                    </div>
                    <div className="text-xs text-gray-500">
                      {match.winner === 'red' ? 'Red' : 'Blue'} wins by {Math.abs(match.scores.red - match.scores.blue)} pts
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/matches/${match.id}`);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderCompareTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Team Comparison</h2>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={() => setActiveTab('teams')}
            icon={<FaArrowLeft className="mr-1" />}
          >
            Back to Teams
          </Button>
          <Button 
            variant="outline"
            icon={<FaDownload />}
          >
            Export
          </Button>
        </div>
      </div>

      {selectedTeams.length === 0 ? (
        <Card className="text-center py-12">
          <FaInfoCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams selected</h3>
          <p className="mt-1 text-sm text-gray-500">Select teams to compare from the Teams tab.</p>
          <div className="mt-6">
            <Button 
              variant="primary"
              onClick={() => setActiveTab('teams')}
            >
              Browse Teams
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedTeams.map(teamNumber => {
              const team = mockTeams.find(t => t.number === teamNumber);
              if (!team) return null;
              
              return (
                <Card key={team.number} className="relative">
                  <button
                    onClick={() => setSelectedTeams(selectedTeams.filter(t => t !== teamNumber))}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
                    title="Remove from comparison"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                  <div className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
                      <FaRobot className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Team {team.number}</h3>
                    <p className="text-sm text-gray-500 truncate">{team.name}</p>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Win Rate:</span>
                      <span className="font-medium">{(team.stats.winRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg. Score:</span>
                      <span className="font-medium">{team.stats.avgScore.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">High Score:</span>
                      <span className="font-medium">{team.stats.highScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reliability:</span>
                      <span className="font-medium">{(team.stats.reliability * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </Card>
              );
            })}
            
            {selectedTeams.length < 4 && (
              <Card 
                className="border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center cursor-pointer transition-colors"
                onClick={() => setActiveTab('teams')}
              >
                <div className="text-center p-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <FaPlus className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">Add Team</p>
                </div>
              </Card>
            )}
          </div>

          {selectedTeams.length > 0 && (
            <div className="space-y-6">
              <Card title="Performance Comparison">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Average Scores</h4>
                    <Chart 
                      type="bar" 
                      data={generateChartData('bar')} 
                      className="h-64"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Scoring Distribution</h4>
                    <Chart 
                      type="pie" 
                      data={generateChartData('pie')} 
                      className="h-64"
                    />
                  </div>
                </div>
              </Card>

              <Card title="Detailed Statistics">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Metric
                        </th>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <th key={team.number} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {team.number}
                            </th>
                          ) : null;
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Matches Played
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.stats.matchesPlayed}
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Win Rate
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(team.stats.winRate * 100).toFixed(1)}%
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Average Score
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.stats.avgScore.toFixed(1)}
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          High Score
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.stats.highScore}
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Average Auto
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.stats.avgAuto.toFixed(1)}
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Average Teleop
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.stats.avgTeleop.toFixed(1)}
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Average Endgame
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {team.stats.avgEndgame.toFixed(1)}
                            </td>
                          ) : null;
                        })}
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Reliability
                        </td>
                        {selectedTeams.map(teamNumber => {
                          const team = mockTeams.find(t => t.number === teamNumber);
                          return team ? (
                            <td key={team.number} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(team.stats.reliability * 100).toFixed(1)}%
                            </td>
                          ) : null;
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Head-to-Head Matches">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Match
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teams
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Winner
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mockMatches
                        .filter(match => {
                          const allTeams = [...match.redAlliance, ...match.blueAlliance];
                          return selectedTeams.some(team => allTeams.includes(team));
                        })
                        .map(match => {
                          const redTeams = match.redAlliance.map(t => t.toString());
                          const blueTeams = match.blueAlliance.map(t => t.toString());
                          const isRelevant = selectedTeams.some(t => redTeams.includes(t)) && 
                                           selectedTeams.some(t => blueTeams.includes(t));
                          
                          if (!isRelevant) return null;
                          
                          return (
                            <tr 
                              key={match.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => navigate(`/matches/${match.id}`)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                Q{match.number}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex">
                                  <div className="mr-4">
                                    <div className="font-medium text-red-600">Red Alliance</div>
                                    {match.redAlliance.map(team => (
                                      <div key={team} className={selectedTeams.includes(team) ? 'font-medium' : ''}>
                                        {team}
                                      </div>
                                    ))}
                                  </div>
                                  <div>
                                    <div className="font-medium text-blue-600">Blue Alliance</div>
                                    {match.blueAlliance.map(team => (
                                      <div key={team} className={selectedTeams.includes(team) ? 'font-medium' : ''}>
                                        {team}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className={`font-medium ${
                                  match.winner === 'red' ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {match.scores.red}
                                </div>
                                <div className={`font-medium ${
                                  match.winner === 'blue' ? 'text-blue-600' : 'text-gray-900'
                                }`}>
                                  {match.scores.blue}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  match.winner === 'red' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {match.winner === 'red' ? 'Red Alliance' : 'Blue Alliance'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      
                      {mockMatches.filter(match => {
                        const allTeams = [...match.redAlliance, ...match.blueAlliance];
                        const redTeams = match.redAlliance.map(t => t.toString());
                        const blueTeams = match.blueAlliance.map(t => t.toString());
                        return selectedTeams.some(t => allTeams.includes(t)) && 
                               selectedTeams.some(t => redTeams.includes(t)) && 
                               selectedTeams.some(t => blueTeams.includes(t));
                      }).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No head-to-head matches found between selected teams.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze team performance, compare statistics, and make data-driven decisions.
          </p>
        </div>
        <div className="flex space-x-2">
          <ButtonGroup>
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('overview')}
              icon={<FaChartArea />}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === 'teams' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('teams')}
              icon={<FaRobot />}
            >
              Teams
            </Button>
            <Button
              variant={activeTab === 'matches' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('matches')}
              icon={<FaTable />}
            >
              Matches
            </Button>
            <Button
              variant={activeTab === 'compare' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('compare')}
              icon={<FaChartBar />}
            >
              Compare
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'teams' && renderTeamsTab()}
      {activeTab === 'matches' && renderMatchesTab()}
      {activeTab === 'compare' && renderCompareTab()}
    </div>
  );
};

export default AnalyticsDashboard;
