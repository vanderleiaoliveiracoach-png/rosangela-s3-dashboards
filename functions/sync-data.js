// Netlify Function: sync-data
// Handles data synchronization between Rosângela's and Van's dashboards

const fs = require('fs');
const path = require('path');

// Data store path (Netlify Functions have /tmp writable)
const DATA_FILE = path.join('/tmp', 'rosangela-s3-data.json');

// Initialize data structure
function initializeData() {
    return {
          session: 'S3',
          date: '2026-09-09',
          client: 'Rosângela Longo',
          lastUpdated: new Date().toISOString(),
          rosangela: {
                  combinados: [],
                  autoavaliacao: {},
                  obsGerais: ''
          },
          van: {
                  scores: {
                            g: '', o: '', v: '', e: '', r: '', n: '', a: ''
                  },
                  observations: {},
                  notasDoMentor: '',
                  perguntasEscolhidas: []
          }
    };
}

// Load data from persistent storage
function loadData() {
    try {
          if (fs.existsSync(DATA_FILE)) {
                  const content = fs.readFileSync(DATA_FILE, 'utf-8');
                  return JSON.parse(content);
          }
    } catch (err) {
          console.error('Error loading data:', err);
    }
    return initializeData();
}

// Save data to persistent storage
function saveData(data) {
    try {
          data.lastUpdated = new Date().toISOString();
          fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
          return true;
    } catch (err) {
          console.error('Error saving data:', err);
          return false;
    }
}

// Main handler
exports.handler = async (event, context) => {
    const headers = {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
          return {
                  statusCode: 200,
                  headers,
                  body: ''
          };
    }

    try {
          const action = event.queryStringParameters?.action || 'get';
          let data = loadData();

      switch (action) {
                // GET: Fetch current data
        case 'get':
                  return {
                              statusCode: 200,
                              headers,
                              body: JSON.stringify({
                                            success: true,
                                            data: data,
                                            timestamp: new Date().toISOString()
                              })
                  };

            // POST: Update Rosângela's data
        case 'update-rosangela':
                  if (event.httpMethod !== 'POST') {
                              return { statusCode: 405, headers, body: 'Method not allowed' };
                  }
                  const rosangelaData = JSON.parse(event.body);
                  data.rosangela = rosangelaData;
                  saveData(data);
                  return {
                              statusCode: 200,
                              headers,
                              body: JSON.stringify({
                                            success: true,
                                            message: 'Dados de Rosângela salvos',
                                            data: data
                              })
                  };

            // POST: Update Van's scores and notes
        case 'update-van':
                  if (event.httpMethod !== 'POST') {
                              return { statusCode: 405, headers, body: 'Method not allowed' };
                  }
                  const vanData = JSON.parse(event.body);
                  data.van = {
                              ...data.van,
                              ...vanData
                  };
                  saveData(data);
                  return {
                              statusCode: 200,
                              headers,
                              body: JSON.stringify({
                                            success: true,
                                            message: 'Dados de Van salvos',
                                            data: data
                              })
                  };

            // GET: Fetch Van's feedback for Rosângela
        case 'get-feedback':
                  return {
                              statusCode: 200,
                              headers,
                              body: JSON.stringify({
                                            success: true,
                                            feedback: data.van,
                                            timestamp: data.lastUpdated
                              })
                  };

            // POST: Clear all data (session reset)
        case 'reset':
                  if (event.httpMethod !== 'POST') {
                              return { statusCode: 405, headers, body: 'Method not allowed' };
                  }
                  saveData(initializeData());
                  return {
                              statusCode: 200,
                              headers,
                              body: JSON.stringify({
                                            success: true,
                                            message: 'Dados resetados'
                              })
                  };

        default:
                  return {
                              statusCode: 400,
                              headers,
                              body: JSON.stringify({
                                            success: false,
                                            error: 'Ação não reconhecida'
                              })
                  };
      }

    } catch (err) {
          console.error('Function error:', err);
          return {
                  statusCode: 500,
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                            success: false,
                            error: err.message
                  })
          };
    }
};
