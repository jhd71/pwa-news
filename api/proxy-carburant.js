// api/proxy-carburant.js
export default async function handler(req, res) {
    const url = 'https://prix-carburants.opendatasoft.com/api/records/1.0/search/?dataset=prix_des_carburants_j_7&rows=20&refine.com_arm_name=Montceau-les-Mines';
    const response = await fetch(url);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
}
