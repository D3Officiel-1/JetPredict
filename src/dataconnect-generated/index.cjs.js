const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'studio',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createNewTeamRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewTeam', inputVars);
}
createNewTeamRef.operationName = 'CreateNewTeam';
exports.createNewTeamRef = createNewTeamRef;

exports.createNewTeam = function createNewTeam(dcOrVars, vars) {
  return executeMutation(createNewTeamRef(dcOrVars, vars));
};

const getMatchesForTeamRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMatchesForTeam', inputVars);
}
getMatchesForTeamRef.operationName = 'GetMatchesForTeam';
exports.getMatchesForTeamRef = getMatchesForTeamRef;

exports.getMatchesForTeam = function getMatchesForTeam(dcOrVars, vars) {
  return executeQuery(getMatchesForTeamRef(dcOrVars, vars));
};

const updatePredictionNotesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePredictionNotes', inputVars);
}
updatePredictionNotesRef.operationName = 'UpdatePredictionNotes';
exports.updatePredictionNotesRef = updatePredictionNotesRef;

exports.updatePredictionNotes = function updatePredictionNotes(dcOrVars, vars) {
  return executeMutation(updatePredictionNotesRef(dcOrVars, vars));
};

const listGamesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGames');
}
listGamesRef.operationName = 'ListGames';
exports.listGamesRef = listGamesRef;

exports.listGames = function listGames(dc) {
  return executeQuery(listGamesRef(dc));
};