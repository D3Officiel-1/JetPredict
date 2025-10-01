# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMatchesForTeam*](#getmatchesforteam)
  - [*ListGames*](#listgames)
- [**Mutations**](#mutations)
  - [*CreateNewTeam*](#createnewteam)
  - [*UpdatePredictionNotes*](#updatepredictionnotes)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMatchesForTeam
You can execute the `GetMatchesForTeam` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMatchesForTeam(vars: GetMatchesForTeamVariables): QueryPromise<GetMatchesForTeamData, GetMatchesForTeamVariables>;

interface GetMatchesForTeamRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMatchesForTeamVariables): QueryRef<GetMatchesForTeamData, GetMatchesForTeamVariables>;
}
export const getMatchesForTeamRef: GetMatchesForTeamRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMatchesForTeam(dc: DataConnect, vars: GetMatchesForTeamVariables): QueryPromise<GetMatchesForTeamData, GetMatchesForTeamVariables>;

interface GetMatchesForTeamRef {
  ...
  (dc: DataConnect, vars: GetMatchesForTeamVariables): QueryRef<GetMatchesForTeamData, GetMatchesForTeamVariables>;
}
export const getMatchesForTeamRef: GetMatchesForTeamRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMatchesForTeamRef:
```typescript
const name = getMatchesForTeamRef.operationName;
console.log(name);
```

### Variables
The `GetMatchesForTeam` query requires an argument of type `GetMatchesForTeamVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMatchesForTeamVariables {
  teamId: UUIDString;
}
```
### Return Type
Recall that executing the `GetMatchesForTeam` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMatchesForTeamData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMatchesForTeam`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMatchesForTeam, GetMatchesForTeamVariables } from '@dataconnect/generated';

// The `GetMatchesForTeam` query requires an argument of type `GetMatchesForTeamVariables`:
const getMatchesForTeamVars: GetMatchesForTeamVariables = {
  teamId: ..., 
};

// Call the `getMatchesForTeam()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMatchesForTeam(getMatchesForTeamVars);
// Variables can be defined inline as well.
const { data } = await getMatchesForTeam({ teamId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMatchesForTeam(dataConnect, getMatchesForTeamVars);

console.log(data.matches);

// Or, you can use the `Promise` API.
getMatchesForTeam(getMatchesForTeamVars).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

### Using `GetMatchesForTeam`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMatchesForTeamRef, GetMatchesForTeamVariables } from '@dataconnect/generated';

// The `GetMatchesForTeam` query requires an argument of type `GetMatchesForTeamVariables`:
const getMatchesForTeamVars: GetMatchesForTeamVariables = {
  teamId: ..., 
};

// Call the `getMatchesForTeamRef()` function to get a reference to the query.
const ref = getMatchesForTeamRef(getMatchesForTeamVars);
// Variables can be defined inline as well.
const ref = getMatchesForTeamRef({ teamId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMatchesForTeamRef(dataConnect, getMatchesForTeamVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.matches);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.matches);
});
```

## ListGames
You can execute the `ListGames` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listGames(): QueryPromise<ListGamesData, undefined>;

interface ListGamesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListGamesData, undefined>;
}
export const listGamesRef: ListGamesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listGames(dc: DataConnect): QueryPromise<ListGamesData, undefined>;

interface ListGamesRef {
  ...
  (dc: DataConnect): QueryRef<ListGamesData, undefined>;
}
export const listGamesRef: ListGamesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listGamesRef:
```typescript
const name = listGamesRef.operationName;
console.log(name);
```

### Variables
The `ListGames` query has no variables.
### Return Type
Recall that executing the `ListGames` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListGamesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListGames`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listGames } from '@dataconnect/generated';


// Call the `listGames()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listGames();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listGames(dataConnect);

console.log(data.games);

// Or, you can use the `Promise` API.
listGames().then((response) => {
  const data = response.data;
  console.log(data.games);
});
```

### Using `ListGames`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listGamesRef } from '@dataconnect/generated';


// Call the `listGamesRef()` function to get a reference to the query.
const ref = listGamesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listGamesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.games);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.games);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewTeam
You can execute the `CreateNewTeam` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewTeam(vars: CreateNewTeamVariables): MutationPromise<CreateNewTeamData, CreateNewTeamVariables>;

interface CreateNewTeamRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewTeamVariables): MutationRef<CreateNewTeamData, CreateNewTeamVariables>;
}
export const createNewTeamRef: CreateNewTeamRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewTeam(dc: DataConnect, vars: CreateNewTeamVariables): MutationPromise<CreateNewTeamData, CreateNewTeamVariables>;

interface CreateNewTeamRef {
  ...
  (dc: DataConnect, vars: CreateNewTeamVariables): MutationRef<CreateNewTeamData, CreateNewTeamVariables>;
}
export const createNewTeamRef: CreateNewTeamRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewTeamRef:
```typescript
const name = createNewTeamRef.operationName;
console.log(name);
```

### Variables
The `CreateNewTeam` mutation requires an argument of type `CreateNewTeamVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewTeamVariables {
  name: string;
  sport: string;
}
```
### Return Type
Recall that executing the `CreateNewTeam` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewTeamData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewTeamData {
  team_insert: Team_Key;
}
```
### Using `CreateNewTeam`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewTeam, CreateNewTeamVariables } from '@dataconnect/generated';

// The `CreateNewTeam` mutation requires an argument of type `CreateNewTeamVariables`:
const createNewTeamVars: CreateNewTeamVariables = {
  name: ..., 
  sport: ..., 
};

// Call the `createNewTeam()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewTeam(createNewTeamVars);
// Variables can be defined inline as well.
const { data } = await createNewTeam({ name: ..., sport: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewTeam(dataConnect, createNewTeamVars);

console.log(data.team_insert);

// Or, you can use the `Promise` API.
createNewTeam(createNewTeamVars).then((response) => {
  const data = response.data;
  console.log(data.team_insert);
});
```

### Using `CreateNewTeam`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewTeamRef, CreateNewTeamVariables } from '@dataconnect/generated';

// The `CreateNewTeam` mutation requires an argument of type `CreateNewTeamVariables`:
const createNewTeamVars: CreateNewTeamVariables = {
  name: ..., 
  sport: ..., 
};

// Call the `createNewTeamRef()` function to get a reference to the mutation.
const ref = createNewTeamRef(createNewTeamVars);
// Variables can be defined inline as well.
const ref = createNewTeamRef({ name: ..., sport: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewTeamRef(dataConnect, createNewTeamVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.team_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.team_insert);
});
```

## UpdatePredictionNotes
You can execute the `UpdatePredictionNotes` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePredictionNotes(vars: UpdatePredictionNotesVariables): MutationPromise<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;

interface UpdatePredictionNotesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePredictionNotesVariables): MutationRef<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;
}
export const updatePredictionNotesRef: UpdatePredictionNotesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePredictionNotes(dc: DataConnect, vars: UpdatePredictionNotesVariables): MutationPromise<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;

interface UpdatePredictionNotesRef {
  ...
  (dc: DataConnect, vars: UpdatePredictionNotesVariables): MutationRef<UpdatePredictionNotesData, UpdatePredictionNotesVariables>;
}
export const updatePredictionNotesRef: UpdatePredictionNotesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePredictionNotesRef:
```typescript
const name = updatePredictionNotesRef.operationName;
console.log(name);
```

### Variables
The `UpdatePredictionNotes` mutation requires an argument of type `UpdatePredictionNotesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePredictionNotesVariables {
  id: UUIDString;
  analysisNotes?: string | null;
}
```
### Return Type
Recall that executing the `UpdatePredictionNotes` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePredictionNotesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePredictionNotesData {
  prediction_update?: Prediction_Key | null;
}
```
### Using `UpdatePredictionNotes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePredictionNotes, UpdatePredictionNotesVariables } from '@dataconnect/generated';

// The `UpdatePredictionNotes` mutation requires an argument of type `UpdatePredictionNotesVariables`:
const updatePredictionNotesVars: UpdatePredictionNotesVariables = {
  id: ..., 
  analysisNotes: ..., // optional
};

// Call the `updatePredictionNotes()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePredictionNotes(updatePredictionNotesVars);
// Variables can be defined inline as well.
const { data } = await updatePredictionNotes({ id: ..., analysisNotes: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePredictionNotes(dataConnect, updatePredictionNotesVars);

console.log(data.prediction_update);

// Or, you can use the `Promise` API.
updatePredictionNotes(updatePredictionNotesVars).then((response) => {
  const data = response.data;
  console.log(data.prediction_update);
});
```

### Using `UpdatePredictionNotes`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePredictionNotesRef, UpdatePredictionNotesVariables } from '@dataconnect/generated';

// The `UpdatePredictionNotes` mutation requires an argument of type `UpdatePredictionNotesVariables`:
const updatePredictionNotesVars: UpdatePredictionNotesVariables = {
  id: ..., 
  analysisNotes: ..., // optional
};

// Call the `updatePredictionNotesRef()` function to get a reference to the mutation.
const ref = updatePredictionNotesRef(updatePredictionNotesVars);
// Variables can be defined inline as well.
const ref = updatePredictionNotesRef({ id: ..., analysisNotes: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePredictionNotesRef(dataConnect, updatePredictionNotesVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.prediction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.prediction_update);
});
```

