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
      
      const response = await fetch(`${this.baseUrl}?endpoint=matches?dateFrom=${today}&dateTo=${nextWeekStr}&limit=${limit}`);
      
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
      const response = await fetch(`${this.baseUrl}?endpoint=competitions/${leagueId}/standings`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des classements:', error);
      return { standings: [] };
    }
  }
}

export default FootballAPI;