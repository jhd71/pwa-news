// js/football-api.js
class FootballAPI {
  constructor() {
    this.baseUrl = '/api/football'; // Point d'entrée proxy
  }

  async getLiveMatches() {
  try {
    const response = await fetch(`${this.baseUrl}?endpoint=matches?status=LIVE`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Ajouter des informations sur la compétition française
    if (data.matches && data.matches.length === 0) {
      return {
        matches: [],
        noFrenchMatches: true
      };
    }
    
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs en direct:', error);
    return { matches: [] };
  }
}

  async getUpcomingMatches(limit = 10) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    // Correction du format de l'URL
    const response = await fetch(`${this.baseUrl}?endpoint=matches&dateFrom=${today}&dateTo=${nextWeekStr}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des matchs à venir:', error);
    return { matches: [] };
  }
}

  async getLeagueStandings() {
  try {
    // Récupérer la Ligue 1 (ID 2015)
    const responseLigue1 = await fetch(`${this.baseUrl}?endpoint=competitions/2015/standings`);
    let dataLigue1 = { standings: [] };
    
    if (responseLigue1.ok) {
      dataLigue1 = await responseLigue1.json();
    }
    
    // Récupérer la Ligue 2 (ID 2142)
    const responseLigue2 = await fetch(`${this.baseUrl}?endpoint=competitions/2142/standings`);
    let dataLigue2 = { standings: [] };
    
    if (responseLigue2.ok) {
      dataLigue2 = await responseLigue2.json();
    }
    
    return {
      ligue1: dataLigue1,
      ligue2: dataLigue2
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des classements:', error);
    return { 
      ligue1: { standings: [] },
      ligue2: { standings: [] }
    };
  }
}
}
export default FootballAPI;