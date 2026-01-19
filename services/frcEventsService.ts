import { getSettings, saveSchedule, saveTeams } from "./storageService";
import { Team, ScheduledMatch } from "../types";

const BASE_URL = "https://frc-events.firstinspires.org/v3.0";

const getAuthHeaders = (username: string, token: string) => {
  return {
    'Authorization': 'Basic ' + btoa(username + ':' + token),
    'Accept': 'application/json'
  };
};

export const fetchMatchSchedule = async (): Promise<ScheduledMatch[]> => {
  const { frcApiUsername, frcApiToken, eventYear, eventCode } = getSettings();
  
  if (!frcApiUsername || !frcApiToken) {
    console.warn("No FRC API Credentials found");
    throw new Error("Missing API Credentials");
  }

  try {
    const response = await fetch(`${BASE_URL}/${eventYear}/schedule/${eventCode}?tournamentLevel=Qualification`, {
      headers: getAuthHeaders(frcApiUsername, frcApiToken)
    });
    
    if (!response.ok) throw new Error(`FRC API Request failed: ${response.statusText}`);
    
    const json = await response.json();
    const schedule: ScheduledMatch[] = json.Schedule;
    
    saveSchedule(schedule);
    return schedule; 
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchEventTeams = async (): Promise<Team[]> => {
  const { frcApiUsername, frcApiToken, eventYear, eventCode } = getSettings();
  
  if (!frcApiUsername || !frcApiToken) {
    console.warn("No FRC API Credentials found");
    throw new Error("Missing API Credentials");
  }

  try {
    // Note: If event has many teams, this endpoint might require pagination, 
    // but typically FRC events have <100 teams which fits in one page.
    const response = await fetch(`${BASE_URL}/${eventYear}/teams?eventCode=${eventCode}`, {
      headers: getAuthHeaders(frcApiUsername, frcApiToken)
    });

    if (!response.ok) throw new Error(`FRC API Request failed: ${response.statusText}`);
    
    const json = await response.json();
    const teams: Team[] = json.teams;
    
    saveTeams(teams);
    return teams;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
