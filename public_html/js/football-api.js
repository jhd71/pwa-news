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

  async getLeagueStandings(leagueId = 2015) { // 2015 est l'ID pour la Ligue 1
  try {
    // Récupérer la Ligue 1
    const response1 = await fetch(`${this.baseUrl}?endpoint=competitions/${leagueId}/standings`);
    
    if (!response1.ok) {
      throw new Error(`Erreur HTTP: ${response1.status}`);
    }
    
    const data1 = await response1.json();
    
    // Récupérer aussi la Ligue 2 (ID 2142)
    const response2 = await fetch(`${this.baseUrl}?endpoint=competitions/2142/standings`);
    let data2 = { standings: [] };
    
    if (response2.ok) {
      data2 = await response2.json();
    }
    
    // Combiner les deux résultats
    return {
      competitions: [
        data1.competition || { name: 'Ligue 1' },
        data2.competition || { name: 'Ligue 2' }
      ],
      standings: [
        ...(data1.standings || []),
        ...(data2.standings || [])
      ]
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des classements:', error);
    return { standings: [] };
  }
}
}

export default FootballAPI;