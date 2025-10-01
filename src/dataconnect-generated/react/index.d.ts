import { CreateNewTeamData, CreateNewTeamVariables, GetMatchesForTeamData, GetMatchesForTeamVariables, UpdatePredictionNotesData, UpdatePredictionNotesVariables, ListGamesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateNewTeam(options?: useDataConnectMutationOptions<CreateNewTeamData, FirebaseError, CreateNewTeamVariables>): UseDataConnectMutationResult<CreateNewTeamData, CreateNewTeamVariables>;
export function useCreateNewTeam(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewTeamData, FirebaseError, CreateNewTeamVariables>): UseDataConnectMutationResult<CreateNewTeamData, CreateNewTeamVariables>;

export function useGetMatchesForTeam(vars: GetMatchesForTeamVariables, options?: useDataConnectQueryOptions<GetMatchesForTeamData>): UseDataConnectQueryResult<GetMatchesForTeamData, GetMatchesForTeamVariables>;
export function useGetMatchesForTeam(dc: DataConnect, vars: GetMatchesForTeamVariables, options?: useDataConnectQueryOptions<GetMatchesForTeamData>): UseDataConnectQueryResult<GetMatchesForTeamData, GetMatchesForTeamVariables>;

export function useUpdatePredictionNotes(options?: useDataConnectMutationOptions<UpdatePredictionNotesData, FirebaseError, UpdatePredictionNotesVariables>): UseDataConnectMutationResult<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;
export function useUpdatePredictionNotes(dc: DataConnect, options?: useDataConnectMutationOptions<UpdatePredictionNotesData, FirebaseError, UpdatePredictionNotesVariables>): UseDataConnectMutationResult<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;

export function useListGames(options?: useDataConnectQueryOptions<ListGamesData>): UseDataConnectQueryResult<ListGamesData, undefined>;
export function useListGames(dc: DataConnect, options?: useDataConnectQueryOptions<ListGamesData>): UseDataConnectQueryResult<ListGamesData, undefined>;
