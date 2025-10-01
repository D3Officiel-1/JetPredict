import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateNewTeamData {
  team_insert: Team_Key;
}

export interface CreateNewTeamVariables {
  name: string;
  sport: string;
}

export interface Game_Key {
  id: UUIDString;
  __typename?: 'Game_Key';
}

export interface GetMatchesForTeamData {
  matches: ({
    id: UUIDString;
    homeTeam: {
      name: string;
    };
      awayTeam: {
        name: string;
      };
        matchDate: DateString;
        scores?: string | null;
  } & Match_Key)[];
}

export interface GetMatchesForTeamVariables {
  teamId: UUIDString;
}

export interface ListGamesData {
  games: ({
    id: UUIDString;
    name: string;
    gameType: string;
    description?: string | null;
    createdAt: TimestampString;
    averageMultiplier?: number | null;
  } & Game_Key)[];
}

export interface Match_Key {
  id: UUIDString;
  __typename?: 'Match_Key';
}

export interface Prediction_Key {
  id: UUIDString;
  __typename?: 'Prediction_Key';
}

export interface Team_Key {
  id: UUIDString;
  __typename?: 'Team_Key';
}

export interface UpdatePredictionNotesData {
  prediction_update?: Prediction_Key | null;
}

export interface UpdatePredictionNotesVariables {
  id: UUIDString;
  analysisNotes?: string | null;
}

export interface UserSavedPrediction_Key {
  userId: UUIDString;
  predictionId: UUIDString;
  __typename?: 'UserSavedPrediction_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewTeamRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewTeamVariables): MutationRef<CreateNewTeamData, CreateNewTeamVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewTeamVariables): MutationRef<CreateNewTeamData, CreateNewTeamVariables>;
  operationName: string;
}
export const createNewTeamRef: CreateNewTeamRef;

export function createNewTeam(vars: CreateNewTeamVariables): MutationPromise<CreateNewTeamData, CreateNewTeamVariables>;
export function createNewTeam(dc: DataConnect, vars: CreateNewTeamVariables): MutationPromise<CreateNewTeamData, CreateNewTeamVariables>;

interface GetMatchesForTeamRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMatchesForTeamVariables): QueryRef<GetMatchesForTeamData, GetMatchesForTeamVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMatchesForTeamVariables): QueryRef<GetMatchesForTeamData, GetMatchesForTeamVariables>;
  operationName: string;
}
export const getMatchesForTeamRef: GetMatchesForTeamRef;

export function getMatchesForTeam(vars: GetMatchesForTeamVariables): QueryPromise<GetMatchesForTeamData, GetMatchesForTeamVariables>;
export function getMatchesForTeam(dc: DataConnect, vars: GetMatchesForTeamVariables): QueryPromise<GetMatchesForTeamData, GetMatchesForTeamVariables>;

interface UpdatePredictionNotesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePredictionNotesVariables): MutationRef<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePredictionNotesVariables): MutationRef<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;
  operationName: string;
}
export const updatePredictionNotesRef: UpdatePredictionNotesRef;

export function updatePredictionNotes(vars: UpdatePredictionNotesVariables): MutationPromise<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;
export function updatePredictionNotes(dc: DataConnect, vars: UpdatePredictionNotesVariables): MutationPromise<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;

interface ListGamesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGamesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListGamesData, undefined>;
  operationName: string;
}
export const listGamesRef: ListGamesRef;

export function listGames(): QueryPromise<ListGamesData, undefined>;
export function listGames(dc: DataConnect): QueryPromise<ListGamesData, undefined>;