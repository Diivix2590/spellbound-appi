import { routerReducer as router } from 'react-router-redux';
import { combineReducers } from "redux";
import { IStoreState } from '../models';
import isAuthenticated from "./authenticationReducer";
import pendingActions from "./pendingActionsReducer";
import spellData from './spellsReducer';

const rootReducer = combineReducers<IStoreState>({
  isAuthenticated,
  pendingActions,
  router,
  spellData
});

export default rootReducer;
