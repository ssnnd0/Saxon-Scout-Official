import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardGrid, StatCard } from '../../components/UI/Card';
import { Button, ButtonGroup } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { FaArrowLeft, FaEdit, FaPlus, FaChartLine, FaRobot, FaTrophy, FaHistory, FaClipboardList } from 'react-icons/fa';

// Mock data - replace with API calls
const fetchTeamData = (teamNumber: string) => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        teamNumber: teamNumber,
        name: `Team ${teamNumber}`,
        nickname: 'The Spartans',
        location: 'San Jose, CA',
        website: `https://www.team${teamNumber}.com`,
        rookieYear: 1999,
        stats: {
          matchesPlayed: 42,
          winRate: 0.68,
          avgScore: 125.5,
          highScore: 210,
          ranking: 12,
        },
        recentMatches: [
          { id: 1, event: 'Silicon Valley Regional', match: 'Quals 12', alliance: 'red', score: 145, opponentScore: 132, result: 'W' },
          { id: 2, event: 'Silicon Valley Regional', match: 'Quals 8', alliance: 'blue', score: 98, opponentScore: 112, result: 'L' },
          { id: 3, event: 'Silicon Valley Regional', match: 'Quals 3', alliance: 'red', score: 167, opponentScore: 142, result: 'W' },
        ],
        notes: [
          { id: 1, author: 'John D.', date: '2025-03-15', content: 'Strong autonomous routine, consistently scores 2-3 game pieces', category: 'strength' },
          { id: 2, author: 'Sarah K.', date: '2025-03-10', content: 'Struggles with defense, can be pressured into mistakes', category: 'weakness' },
        ],
        robot: {
          drivetrain: 'Swerve',
          autoRoutine: '3 game pieces + mobility',
          teleopScoring: 'High + Mid',
          endgame: 'Charge Station Balance',
          capabilities: ['Auto Mobility', 'Auto Scoring', 'Climbing', 'Defense'],
        },
      });
    }, 500);
  });
};

export const TeamDetail: React.FC = () => {
  const { teamNumber } = useParams<{ teamNumber: string }>();
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('general');

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTeamData(teamNumber || '');
        setTeamData(data);
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (teamNumber) {
      loadTeamData();
    }
  }, [teamNumber]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    const newNote = {
      id: Date.now(),
      author: 'Current User', // Replace with actual user
      date: new Date().toISOString().split('T')[0],
      content: noteContent,
      category: noteCategory,
    };
    
    setTeamData((prev: any) => ({
      ...prev,
      notes: [newNote, ...(prev?.notes || [])],
    }));
    
    setNoteContent('');
    setNoteCategory('general');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Team not found</h3>
        <p className="mt-2 text-gray-500">Could not find team {teamNumber}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => navigate(-1)}
          icon={<FaArrowLeft />}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-2 -ml-2"
          >
            <FaArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {teamData.teamNumber} - {teamData.nickname}
            </h1>
            <p className="text-sm text-gray-500">{teamData.location} • Rookie Year: {teamData.rookieYear}</p>
          </div>
        </div>
        <ButtonGroup>
          <Button 
            variant="outline" 
            icon={<FaEdit />}
            onClick={() => navigate(`/teams/${teamNumber}/edit`)}
          >
            Edit
          </Button>
          <Button 
            variant="primary"
            onClick={() => navigate(`/teams/${teamNumber}/scout`)}
          >
            Scout This Team
          </Button>
        </ButtonGroup>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'matches', 'robot', 'notes', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="py-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <CardGrid cols={2} className="sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Win Rate"
                value={`${(teamData.stats.winRate * 100).toFixed(0)}%`}
                icon={<FaTrophy className="text-yellow-500" />}
              />
              <StatCard
                title="Avg. Score"
                value={teamData.stats.avgScore.toFixed(1)}
                icon={<FaChartLine className="text-yellow-500" />}
              />
              <StatCard
                title="High Score"
                value={teamData.stats.highScore.toString()}
                icon={<FaTrophy className="text-yellow-500" />}
              />
              <StatCard
                title="Ranking"
                value={`#${teamData.stats.ranking}`}
                icon={<FaChartLine className="text-yellow-500" />}
              />
            </CardGrid>

            {/* Recent Matches */}
            <Card title="Recent Matches">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alliance
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamData.recentMatches.map((match: any) => (
                      <tr 
                        key={match.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/matches/${match.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {match.match}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            match.alliance === 'red' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {match.alliance.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {match.score}-{match.opponentScore}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            match.result === 'W' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {match.result === 'W' ? 'Win' : 'Loss'}
                          </span>
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
                  View All Matches
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'robot' && (
          <Card title="Robot Specifications">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Capabilities</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Drivetrain</dt>
                    <dd className="mt-1 text-sm text-gray-900">{teamData.robot.drivetrain}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Auto Routine</dt>
                    <dd className="mt-1 text-sm text-gray-900">{teamData.robot.autoRoutine}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Teleop Scoring</dt>
                    <dd className="mt-1 text-sm text-gray-900">{teamData.robot.teleopScoring}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Endgame</dt>
                    <dd className="mt-1 text-sm text-gray-900">{teamData.robot.endgame}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Capabilities</h3>
                <div className="flex flex-wrap gap-2">
                  {teamData.robot.capabilities.map((capability: string, index: number) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            <Card title="Add Note">
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label htmlFor="note-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="note-category"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                  >
                    <option value="general">General Note</option>
                    <option value="strength">Strength</option>
                    <option value="weakness">Weakness</option>
                    <option value="strategy">Strategy</option>
                    <option value="pit">Pit Observation</option>
                  </select>
                </div>
                <div>
                  <Input
                    as="textarea"
                    rows={3}
                    placeholder="Add your note here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={!noteContent.trim()}
                  >
                    Add Note
                  </Button>
                </div>
              </form>
            </Card>

            <Card title="Previous Notes">
              {teamData.notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notes yet. Add your first note above.
                </div>
              ) : (
                <div className="space-y-4">
                  {teamData.notes.map((note: any) => (
                    <div 
                      key={note.id} 
                      className="border-l-4 pl-4 py-2"
                      style={{
                        borderLeftColor: 
                          note.category === 'strength' 
                            ? '#10B981' // green
                            : note.category === 'weakness'
                            ? '#EF4444' // red
                            : '#F59E0B' // yellow
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-900">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {note.author} • {new Date(note.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {note.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'matches' && (
          <Card title="Match History">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alliance
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamData.recentMatches.map((match: any) => (
                    <tr 
                      key={match.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/matches/${match.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {match.event}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {match.match}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          match.alliance === 'red' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {match.alliance.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.score}-{match.opponentScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          match.result === 'W' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {match.result === 'W' ? 'Win' : 'Loss'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card title="Team Analytics">
            <div className="text-center py-12 text-gray-500">
              <FaChartLine className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics coming soon</h3>
              <p className="mt-1 text-sm text-gray-500">Detailed team performance analytics will be available in a future update.</p>
              <div className="mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('overview')}
                >
                  Back to Overview
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamDetail;
