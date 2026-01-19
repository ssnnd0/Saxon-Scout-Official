import { GoogleGenAI } from "@google/genai";
import { MatchData } from "../types";

// Initialize with environment variable as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStrategySummary = async (matches: MatchData[]): Promise<string> => {
  if (matches.length === 0) return "No match data available for analysis.";

  // Simplify data to save tokens
  const summaryData = matches.map(m => ({
    team: m.teamNumber,
    match: m.matchNumber,
    fuel: (m.autoFuelScored || 0) + (m.teleopFuelScored || 0),
    autoTower: m.autoTowerLevel,
    endgameTower: m.endgameTowerLevel,
    died: m.robotDied
  }));

  const prompt = `
    Analyze the following FRC 2026 "REBUILT" scouting data. 
    The game involves scoring Fuel balls into a central Hub and climbing a Tower (Levels 1-3).
    Identify the top 3 scoring robots (high Fuel count), any robots with reliability issues (died), and suggest a defensive strategy against the highest scoring team.
    Data: ${JSON.stringify(summaryData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (e) {
    console.error(e);
    return "Failed to generate analysis. Check API Key or connection.";
  }
};

export const generateTeamProfile = async (teamNumber: string, matches: MatchData[]): Promise<string> => {
    const teamMatches = matches.filter(m => m.teamNumber === teamNumber);
    if (teamMatches.length === 0) return "No data for this team.";

    const prompt = `
      Write a 2-sentence qualitative profile for FRC Team ${teamNumber} in the 2026 "REBUILT" game based on this data:
      ${JSON.stringify(teamMatches.map(m => ({
          match: m.matchNumber,
          fuel: (m.autoFuelScored || 0) + (m.teleopFuelScored || 0),
          climb: m.endgameTowerLevel
      })))}. 
      Focus on their Fuel scoring volume and Tower climbing consistency.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "No profile.";
    } catch (e) {
        return "Error generating profile.";
    }
}