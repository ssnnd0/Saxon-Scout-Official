import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card } from '../../components/UI/Card';
import { Button, ButtonGroup } from '../../components/UI/Button';
import { Input, Textarea } from '../../components/UI/Input';
import { FaArrowLeft, FaSave, FaUndo, FaCheck, FaTimes, FaPlus, FaMinus, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { matchesApi, MatchScoutData as ApiMatchScoutData } from '../../services/api/matches';
import { teamsApi } from '../../services/api/teams';

// Types
type Alliance = 'red' | 'blue';
type MatchType = 'qualification' | 'quarterfinal' | 'semifinal' | 'final';
type GamePiece = 'cone' | 'cube';
type ScoringPosition = 'low' | 'mid' | 'high';

interface ScoringAction {
  id: string;
  time: number;
  piece: GamePiece;
  position: ScoringPosition;
  success: boolean;
  notes: string;
}

interface Penalty {
  id: string;
  time: number;
  type: string;
  card: 'yellow' | 'red' | 'foul' | 'techFoul';
  notes?: string;
}

interface AutoPeriod {
  mobility: boolean;
  autoChargeStation: 'docked' | 'engaged' | 'none';
  gamePieces: {
    top: number;
    mid: number;
    low: number;
  };
  scoring: ScoringAction[];
}

interface TeleopPeriod {
  gamePieces: {
    top: number;
    mid: number;
    low: number;
  };
  linkScores: number;
  scoring: ScoringAction[];
  penalties: Penalty[];
}

interface EndgamePeriod {
  endgameStatus: 'parked' | 'docked' | 'engaged' | 'none';
  endgameTime?: number;
}

interface MatchScoutFormData {
  matchId: string;
  teamId: string;
  scouterId: string;
  auto: AutoPeriod;
  teleop: TeleopPeriod;
  endgame: EndgamePeriod;
  notes: string;
  overallPerformance: 1 | 2 | 3 | 4 | 5;
  defenseRating?: 1 | 2 | 3 | 4 | 5;
  robotSpeed?: 1 | 2 | 3 | 4 | 5;
}

// Initial form data
const initialFormData: MatchScoutFormData = {
  matchId: '',
  teamId: '',
  scouterId: 'scouter-1', // This should come from auth context in a real app
  auto: {
    mobility: false,
    autoChargeStation: 'none',
    gamePieces: {
      top: 0,
      mid: 0,
      low: 0,
    },
    scoring: [],
  },
  teleop: {
    gamePieces: {
      top: 0,
      mid: 0,
      low: 0,
    },
    linkScores: 0,
    scoring: [],
    penalties: [],
  },
  endgame: {
    endgameStatus: 'none',
  },
  notes: '',
  overallPerformance: 3,
};

const MatchScoutForm: React.FC = () => {
  // State for the form
  const [newScoringAction, setNewScoringAction] = useState<ScoringAction>({
    id: '',
    time: 0,
    piece: 'cube',
    position: 'low',
    success: true,
    notes: ''
  });
  
  const [newPenalty, setNewPenalty] = useState<Omit<Penalty, 'id'>>({
    time: 0,
    type: '',
    card: 'yellow',
    notes: ''
  });
  
  const [showScoringModal, setShowScoringModal] = useState<boolean>(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState<boolean>(false);
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<MatchScoutFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState<'auto' | 'teleop' | 'endgame' | 'review'>('auto');
  const [matchTime, setMatchTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [matchInfo, setMatchInfo] = useState<{
    matchNumber: number;
    matchType: 'qualification' | 'quarterfinal' | 'semifinal' | 'final';
    teamNumber: string;
    teamName?: string;
  } | null>(null);

  // Load match and team data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Extract match and team IDs from URL or location state
        const searchParams = new URLSearchParams(location.search);
        const matchId = id || searchParams.get('matchId');
        const teamId = searchParams.get('teamId');

        if (!matchId || !teamId) {
          throw new Error('Match ID and Team ID are required');
        }

        // Set form data with IDs
        setFormData(prev => ({
          ...prev,
          matchId,
          teamId,
          scouterId: 'current-user-id' // Replace with actual user ID from auth context
        }));

        // Fetch match and team data in parallel
        const [matchData, teamData] = await Promise.all([
          matchesApi.getMatchById(matchId),
          teamsApi.getTeamById(teamId)
        ]);

        setMatchInfo({
          matchNumber: matchData.matchNumber,
          matchType: matchData.matchType,
          teamNumber: teamData.number,
          teamName: teamData.name
        });

        // Check for existing scouting data
        try {
          const existingData = await matchesApi.getMatchScoutData(matchId, teamId);
          if (existingData.length > 0) {
            setFormData(prev => ({
              ...prev,
              ...existingData[0]
            }));
          }
        } catch (error) {
          console.log('No existing scouting data found, starting fresh');
        }

      } catch (error) {
        console.error('Error loading match data:', error);
        toast.error('Failed to load match data');
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, location.search, navigate]);

  // Handle scoring action changes
  const handleScoringActionChange = (
    tab: 'auto' | 'teleop',
    id: string,
    updates: Partial<ScoringAction>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        scoring: prev[tab].scoring.map((action) =>
          action.id === id ? { ...action, ...updates } : action
        ),
      },
    }));
  };

  // Add a new scoring action
  const handleAddScoringAction = (tab: 'auto' | 'teleop') => {
    const newAction = {
      ...newScoringAction,
      id: `action-${Date.now()}`,
      time: matchTime,
    };

    setFormData((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        scoring: [...prev[tab].scoring, newAction],
      },
    }));

    setNewScoringAction({
      id: '',
      time: 0,
      piece: 'cube',
      position: 'low',
      success: true,
      notes: '',
    });

    setShowScoringModal(false);
  };

  // Handle penalty changes
  const handlePenaltyChange = (id: string, updates: Partial<Penalty>) => {
    setFormData((prev) => ({
      ...prev,
      teleop: {
        ...prev.teleop,
        penalties: prev.teleop.penalties.map((penalty) =>
          penalty.id === id ? { ...penalty, ...updates } : penalty
        ),
      },
    }));
  };

  // Add a new penalty
  const handleAddPenalty = () => {
    const penalty: Penalty = {
      ...newPenalty,
      id: `penalty-${Date.now()}`,
      time: matchTime,
    };

    setFormData((prev) => ({
      ...prev,
      teleop: {
        ...prev.teleop,
        penalties: [...prev.teleop.penalties, penalty],
      },
    }));

    setNewPenalty({
      time: 0,
      type: '',
      card: 'yellow',
      notes: '',
    });

    setShowPenaltyModal(false);
  };

  // Render the autonomous tab content
  const renderAutoTab = () => (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Autonomous Period</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobility (Left Community)
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.auto.mobility}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  auto: { ...prev.auto, mobility: e.target.checked },
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2">Robot left the community</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Charge Station
          </label>
          <select
            value={formData.auto.autoChargeStation}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                auto: {
                  ...prev.auto,
                  autoChargeStation: e.target.value as 'none' | 'docked' | 'engaged',
                },
              }))
            }
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="none">None</option>
            <option value="docked">Docked</option>
            <option value="engaged">Engaged</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Game Pieces Scored
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowScoringModal(true)}
            >
              <FaPlus className="mr-1" /> Add Scoring Action
            </Button>
          </div>

          {formData.auto.scoring.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No scoring actions recorded</p>
          ) : (
            <div className="space-y-2">
              {formData.auto.scoring.map((action) => (
                <div key={action.id} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">
                        {action.success ? 'Scored' : 'Missed'} {action.piece} at {action.position}
                      </span>
                      {action.notes && (
                        <p className="text-sm text-gray-600 mt-1">{action.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          auto: {
                            ...prev.auto,
                            scoring: prev.auto.scoring.filter((a) => a.id !== action.id),
                          },
                        }))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  // Render the teleoperated tab content
  const renderTeleopTab = () => (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Teleoperated Period</h3>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Game Pieces Scored
            </label>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowScoringModal(true)}
            >
              <FaPlus className="mr-1" /> Add Scoring Action
            </Button>
          </div>

          {formData.teleop.scoring.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No scoring actions recorded</p>
          ) : (
            <div className="space-y-2">
              {formData.teleop.scoring.map((action) => (
                <div key={action.id} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">
                        {action.success ? 'Scored' : 'Missed'} {action.piece} at {action.position}
                      </span>
                      {action.notes && (
                        <p className="text-sm text-gray-600 mt-1">{action.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          teleop: {
                            ...prev.teleop,
                            scoring: prev.teleop.scoring.filter((a) => a.id !== action.id),
                          },
                        }))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Penalties
            </label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setShowPenaltyModal(true)}
            >
              <FaPlus className="mr-1" /> Add Penalty
            </Button>
          </div>

          {formData.teleop.penalties.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No penalties recorded</p>
          ) : (
            <div className="space-y-2">
              {formData.teleop.penalties.map((penalty) => (
                <div key={penalty.id} className="bg-red-50 p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">
                        {penalty.card === 'yellow' ? 'Yellow Card' : penalty.card === 'red' ? 'Red Card' : 'Foul'}
                        {penalty.type && `: ${penalty.type}`}
                      </span>
                      {penalty.notes && (
                        <p className="text-sm text-gray-600 mt-1">{penalty.notes}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          teleop: {
                            ...prev.teleop,
                            penalties: prev.teleop.penalties.filter((p) => p.id !== penalty.id),
                          },
                        }))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  // Render the endgame tab content
  const renderEndgameTab = () => (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Endgame</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endgame Status
          </label>
          <select
            value={formData.endgame.endgameStatus}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                endgame: {
                  ...prev.endgame,
                  endgameStatus: e.target.value as 'none' | 'parked' | 'docked' | 'engaged',
                },
              }))
            }
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="none">None</option>
            <option value="parked">Parked</option>
            <option value="docked">Docked</option>
            <option value="engaged">Engaged</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <Textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            rows={4}
            placeholder="Additional notes about the match..."
          />
        </div>
      </div>
    </Card>
  );

  // Render the review tab content
  const renderReviewTab = () => (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Autonomous</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>
              <span className="font-medium">Mobility:</span> {formData.auto.mobility ? 'Yes' : 'No'}
            </p>
            <p>
              <span className="font-medium">Charge Station:</span> {formData.auto.autoChargeStation}
            </p>
            <p>
              <span className="font-medium">Scoring Actions:</span> {formData.auto.scoring.length}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">Teleoperated</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>
              <span className="font-medium">Scoring Actions:</span> {formData.teleop.scoring.length}
            </p>
            <p>
              <span className="font-medium">Penalties:</span> {formData.teleop.penalties.length}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">Endgame</h4>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>
              <span className="font-medium">Status:</span> {formData.endgame.endgameStatus}
            </p>
            {formData.notes && (
              <div className="mt-2">
                <p className="font-medium">Notes:</p>
                <p className="whitespace-pre-line text-gray-600">{formData.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">Overall Performance</h4>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    overallPerformance: num as 1 | 2 | 3 | 4 | 5,
                  }))
                }
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  formData.overallPerformance >= num
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {num}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.overallPerformance === 1 && 'Poor'}
              {formData.overallPerformance === 2 && 'Below Average'}
              {formData.overallPerformance === 3 && 'Average'}
              {formData.overallPerformance === 4 && 'Good'}
              {formData.overallPerformance === 5 && 'Excellent'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Check if we're updating existing data or creating new
      const existingData = await matchesApi.getMatchScoutData(formData.matchId, formData.teamId);

      if (existingData.length > 0) {
        // Update existing data - using the first match if multiple exist
        const existingId = (existingData[0] as any).id; // Type assertion as we know the API returns an id
        if (existingId) {
          await matchesApi.updateScoutData(existingId, formData);
          toast.success('Scouting data updated successfully!');
        } else {
          throw new Error('Existing data has no ID');
        }
      } else {
        // Create new scouting data
        await matchesApi.submitScoutData(formData);
        toast.success('Scouting data saved successfully!');
      }

      // Navigate back to match list or dashboard
      navigate('/matches');
    } catch (error) {
      console.error('Error saving scouting data:', error);
      toast.error('Failed to save scouting data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (window.confirm('Are you sure you want to reset all form data? This cannot be undone.')) {
      setFormData({
        ...initialFormData,
        matchId: formData.matchId,
        teamId: formData.teamId,
        scouterId: formData.scouterId,
      });
      setMatchTime(0);
      setIsTimerRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (!matchInfo) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>Error: Could not load match information.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 text-blue-600 hover:underline"
          >
            &larr; Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Match Scouting</h1>
          {matchInfo && (
            <p className="text-gray-600">
              Match {matchInfo.matchNumber} • {matchInfo.matchType.charAt(0).toUpperCase() + matchInfo.matchType.slice(1)} •
              Team {matchInfo.teamNumber} {matchInfo.teamName ? `(${matchInfo.teamName})` : ''}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={activeTab === 'auto' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('auto')}
            className="whitespace-nowrap"
          >
            Autonomous
          </Button>
          <Button
            variant={activeTab === 'teleop' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('teleop')}
            className="whitespace-nowrap"
          >
            Teleoperated
          </Button>
          <Button
            variant={activeTab === 'endgame' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('endgame')}
            className="whitespace-nowrap"
          >
            Endgame
          </Button>
          <Button
            variant={activeTab === 'review' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('review')}
            className="whitespace-nowrap"
          >
            Review & Submit
          </Button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {activeTab === 'auto' && renderAutoTab()}
          {activeTab === 'teleop' && renderTeleopTab()}
          {activeTab === 'endgame' && renderEndgameTab()}
          {activeTab === 'review' && renderReviewTab()}
        </div>

        {/* Form Actions */}
        <div className="mt-8 pt-6 border-t flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            <FaArrowLeft className="mr-2" /> Cancel
          </Button>

          <div className="space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              disabled={isSubmitting}
            >
              <FaUndo className="mr-2" /> Reset Form
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="min-w-[180px]"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Scouting Data
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Scoring Action Modal */}
      {showScoringModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Scoring Action
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Game Piece
                    </label>
                    <select
                      value={newScoringAction.piece}
                      onChange={(e) =>
                        setNewScoringAction((prev) => ({
                          ...prev,
                          piece: e.target.value as GamePiece,
                        }))
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="cone">Cone</option>
                      <option value="cube">Cube</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={newScoringAction.position}
                      onChange={(e) =>
                        setNewScoringAction((prev) => ({
                          ...prev,
                          position: e.target.value as ScoringPosition,
                        }))
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="low">Low</option>
                      <option value="mid">Mid</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Success
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newScoringAction.success}
                        onChange={(e) =>
                          setNewScoringAction((prev) => ({
                            ...prev,
                            success: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2">Successful scoring</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <Textarea
                      value={newScoringAction.notes}
                      onChange={(e) =>
                        setNewScoringAction((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="Additional notes about this scoring action"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowScoringModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => handleAddScoringAction(activeTab as 'auto' | 'teleop')}
                    >
                      Add Action
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Modal */}
      {showPenaltyModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add Penalty
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Penalty Type
                    </label>
                    <Input
                      type="text"
                      value={newPenalty.type}
                      onChange={(e) =>
                        setNewPenalty((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      placeholder="e.g., Foul, Technical Foul, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Type
                    </label>
                    <select
                      value={newPenalty.card}
                      onChange={(e) =>
                        setNewPenalty((prev) => ({
                          ...prev,
                          card: e.target.value as 'yellow' | 'red' | 'foul' | 'techFoul',
                        }))
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="yellow">Yellow Card</option>
                      <option value="red">Red Card</option>
                      <option value="foul">Foul</option>
                      <option value="techFoul">Technical Foul</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <Textarea
                      value={newPenalty.notes}
                      onChange={(e) =>
                        setNewPenalty((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Additional details about the penalty"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowPenaltyModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddPenalty}
                    >
                      Add Penalty
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchScoutForm;
