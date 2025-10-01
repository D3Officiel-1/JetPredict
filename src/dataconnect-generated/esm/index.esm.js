import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'studio',
  location: 'us-central1'
};

export const createNewTeamRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewTeam', inputVars);
}
createNewTeamRef.operationName = 'CreateNewTeam';

export function createNewTeam(dcOrVars, vars) {
  return executeMutation(createNewTeamRef(dcOrVars, vars));
}

export const getMatchesForTeamRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMatchesForTeam', inputVars);
}
getMatchesForTeamRef.operationName = 'GetMatchesForTeam';

export function getMatchesForTeam(dcOrVars, vars) {
  return executeQuery(getMatchesForTeamRef(dcOrVars, vars));
}

export const updatePredictionNotesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePredictionNotes', inputVars);
}
updatePredictionNotesRef.operationName = 'UpdatePredictionNotes';

export function updatePredictionNotes(dcOrVars, vars) {
  return executeMutation(updatePredictionNotesRef(dcOrVars, vars));
}

export const listGamesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListGames');
}
listGamesRef.operationName = 'ListGames';

export function listGames(dc) {
  return executeQuery(listGamesRef(dc));
}