import { getSettings, saveSchedule, saveTeams } from "./storageService";
import { Team, TBAMatch, ScheduledMatch } from "../types";

const BASE_URL = "https://www.thebluealliance.com/api/v3";

export const fetchMatchSchedule = async (): Promise<TBAMatch[]> => {
  const { tbaApiKey, eventYear, eventCode } = getSettings();
  const eventKey = `${eventYear}${eventCode}`;

  if (!tbaApiKey) {
    console.warn("No TBA API Key found");
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/event/${eventKey}/matches/simple`, {
      headers: {
        'X-TBA-Auth-Key': tbaApiKey
      }
    });
    if (!response.ok) throw new Error("TBA Request failed");
    const data: TBAMatch[] = await response.json();
    
    // Map TBA format to internal ScheduledMatch format
    const scheduledMatches: ScheduledMatch[] = data
      .filter(m => m.comp_level === 'qm') // Filter for qualification matches
      .map(m => {
        const teams = [];
        
        m.alliances.red.team_keys.forEach((key, index) => {
           teams.push({
             teamNumber: parseInt(key.replace('frc', ''), 10),
             station: `Red${index + 1}`,
             surrogate: m.alliances.red.surrogate_team_keys?.includes(key) || false
           });
        });

        m.alliances.blue.team_keys.forEach((key, index) => {
            teams.push({
              teamNumber: parseInt(key.replace('frc', ''), 10),
              station: `Blue${index + 1}`,
              surrogate: m.alliances.blue.surrogate_team_keys?.includes(key) || false
            });
         });

        return {
          description: `${m.comp_level} ${m.match_number}`,
          matchNumber: m.match_number,
          tournamentLevel: 'Qualification',
          teams: teams
        };
      });

    saveSchedule(scheduledMatches);
    return data; 
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchEventTeams = async (): Promise<Team[]> => {
  const { tbaApiKey, eventYear, eventCode } = getSettings();
  const eventKey = `${eventYear}${eventCode}`;

  if (!tbaApiKey) {
    console.warn("No TBA API Key found");
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/event/${eventKey}/teams/simple`, {
      headers: {
        'X-TBA-Auth-Key': tbaApiKey
      }
    });
    if (!response.ok) throw new Error("TBA Request failed");
    const data = await response.json();

    const teams: Team[] = data.map((t: any) => ({
        teamNumber: t.team_number,
        nameShort: t.nickname
    }));
    
    saveTeams(teams);
    return teams;
  } catch (error) {
    console.error(error);
    return [];
  }
};