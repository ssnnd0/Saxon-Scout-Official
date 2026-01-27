import { MatchData, PitData } from '../types';

export class DataExporter {
  /**
   * Export matches as CSV
   */
  static exportMatchesAsCSV(matches: MatchData[]): string {
    const headers = [
      'Match #',
      'Team #',
      'Scout',
      'Alliance',
      'Auto Fuel Scored',
      'Auto Fuel Missed',
      'Teleop Fuel Scored',
      'Teleop Fuel Missed',
      'Endgame Tower',
      'Defense Played',
      'Robot Died',
      'Timestamp'
    ];

    const rows = matches.map(m => [
      m.matchNumber,
      m.teamNumber,
      m.scoutName,
      m.alliance,
      m.autoFuelScored,
      m.autoFuelMissed,
      m.teleopFuelScored,
      m.teleopFuelMissed,
      m.endgameTowerLevel,
      m.defensePlayed ? 'Yes' : 'No',
      m.robotDied ? 'Yes' : 'No',
      new Date(m.lastModified || 0).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Export matches as JSON
   */
  static exportMatchesAsJSON(matches: MatchData[]): string {
    return JSON.stringify(matches, null, 2);
  }

  /**
   * Export pit data as CSV
   */
  static exportPitDataAsCSV(pitData: PitData[]): string {
    const headers = [
      'Team #',
      'Scout',
      'Drivetrain',
      'Climb',
      'Archetype',
      'Notes'
    ];

    const rows = pitData.map(p => [
      p.teamNumber,
      p.scouterName,
      p.drivetrain,
      p.climb,
      p.archetype,
      p.notes?.replace(/"/g, '""') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download file
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  /**
   * Download matches as CSV
   */
  static downloadMatchesAsCSV(matches: MatchData[]) {
    const csv = this.exportMatchesAsCSV(matches);
    this.downloadFile(csv, `matches-${Date.now()}.csv`, 'text/csv');
  }

  /**
   * Download matches as JSON
   */
  static downloadMatchesAsJSON(matches: MatchData[]) {
    const json = this.exportMatchesAsJSON(matches);
    this.downloadFile(json, `matches-${Date.now()}.json`, 'application/json');
  }

  /**
   * Download pit data as CSV
   */
  static downloadPitDataAsCSV(pitData: PitData[]) {
    const csv = this.exportPitDataAsCSV(pitData);
    this.downloadFile(csv, `pit-data-${Date.now()}.csv`, 'text/csv');
  }
}
