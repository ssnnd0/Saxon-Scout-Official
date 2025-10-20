// Data synchronization utility for Saxon Scout
// Handles WiFi detection, PostgreSQL sync, and local fallback

/**
 * Check if the device has an active internet connection
 */
export async function isOnline(): Promise<boolean> {
  // Check navigator.onLine first (fast but not always reliable)
  if (!navigator.onLine) {
    return false;
  }

  // Verify with actual server ping
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('/api/health', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Network check failed:', error);
    return false;
  }
}

/**
 * Save match data with server-first approach
 * - If online: Save to PostgreSQL immediately, then local as backup
 * - If offline: Save to local only
 */
export async function saveMatchData(matchData: any, root: any): Promise<{
  success: boolean;
  savedToServer: boolean;
  savedToLocal: boolean;
  error?: string;
}> {
  const online = await isOnline();
  let savedToServer = false;
  let savedToLocal = false;
  let lastError: string | undefined;

  // Try server first if online
  if (online) {
    try {
      const response = await fetch('/api/scouting/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_number: matchData.team,
          match_number: matchData.game,
          alliance: matchData.alliance,
          scouter_name: matchData.scouter,
          auto_scored: matchData.phase?.auto?.scored || 0,
          auto_missed: matchData.phase?.auto?.missed || 0,
          auto_mobility: matchData.phase?.auto?.mobility || false,
          auto_notes: matchData.phase?.auto?.notes || '',
          teleop_cycles: matchData.phase?.teleop?.cycles || 0,
          teleop_scored: matchData.phase?.teleop?.scored || 0,
          teleop_missed: matchData.phase?.teleop?.missed || 0,
          teleop_defense: matchData.phase?.teleop?.defense || '',
          endgame_park: matchData.endgame?.park || false,
          endgame_climb: matchData.endgame?.climb || 'none',
          fouls: matchData.fouls || 0,
          comments: matchData.comments || ''
        })
      });

      if (response.ok) {
        savedToServer = true;
        console.log('✓ Data saved to PostgreSQL server');
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error: any) {
      console.warn('Failed to save to server:', error);
      lastError = error.message;
    }
  }

  // Save to local filesystem as backup (if server succeeded) or primary (if offline/server failed)
  if (root) {
    try {
      const { writeJSON } = await import('./fsStore');
      const filename = `match-${matchData.team}-${matchData.game}-${Date.now()}.json`;
      await writeJSON(root, `matches/${filename}`, matchData);
      savedToLocal = true;
      console.log(`✓ Data saved locally: ${filename}`);
    } catch (error: any) {
      console.error('Failed to save locally:', error);
      if (!lastError) lastError = error.message;
    }
  }

  return {
    success: savedToServer || savedToLocal,
    savedToServer,
    savedToLocal,
    error: (!savedToServer && !savedToLocal) ? lastError : undefined
  };
}

/**
 * Save pit scouting data with server-first approach
 */
export async function savePitData(pitData: any, root: any): Promise<{
  success: boolean;
  savedToServer: boolean;
  savedToLocal: boolean;
  error?: string;
}> {
  const online = await isOnline();
  let savedToServer = false;
  let savedToLocal = false;
  let lastError: string | undefined;

  // Try server first if online
  if (online) {
    try {
      const response = await fetch('/api/scouting/pit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_number: pitData.team,
          scouter_name: pitData.scouter,
          drivetrain: pitData.drivetrain || '',
          auto_paths: pitData.autoPaths || [],
          preferred_zones: pitData.zones || [],
          cycle_time_est: pitData.cycleTime || 0,
          climb: pitData.canClimb || false,
          notes: pitData.notes || ''
        })
      });

      if (response.ok) {
        savedToServer = true;
        console.log('✓ Pit data saved to PostgreSQL server');
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error: any) {
      console.warn('Failed to save pit data to server:', error);
      lastError = error.message;
    }
  }

  // Save to local filesystem as backup or primary
  if (root) {
    try {
      const { writeJSON } = await import('./fsStore');
      const filename = `pit-${pitData.team}-${Date.now()}.json`;
      await writeJSON(root, `pit/${filename}`, pitData);
      savedToLocal = true;
      console.log(`✓ Pit data saved locally: ${filename}`);
    } catch (error: any) {
      console.error('Failed to save pit data locally:', error);
      if (!lastError) lastError = error.message;
    }
  }

  return {
    success: savedToServer || savedToLocal,
    savedToServer,
    savedToLocal,
    error: (!savedToServer && !savedToLocal) ? lastError : undefined
  };
}

/**
 * Fetch all match data from server (PostgreSQL)
 */
export async function fetchMatchDataFromServer(): Promise<any[]> {
  try {
    const response = await fetch('/api/scouting/matches');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch match data from server:', error);
    return [];
  }
}

/**
 * Fetch all pit data from server (PostgreSQL)
 */
export async function fetchPitDataFromServer(): Promise<any[]> {
  try {
    const response = await fetch('/api/scouting/pit');
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch pit data from server:', error);
    return [];
  }
}
