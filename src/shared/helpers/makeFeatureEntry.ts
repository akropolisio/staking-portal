import { IReduxEntry } from '../types/app';
import { ActionCreator, Action } from 'redux';

type Containers<C> = Record<keyof C, React.ComponentType<any>>;
type ActionCreators<A> = Record<keyof A, ActionCreator<Action>>;
type Selectors<S> = Record<keyof S, (state: any, ...args: any[]) => any>;

interface ICPart<C> { containers: C; }
interface IAPart<A> { actions: A; }
interface ISPart<S> { selectors: S; }

type ResultEntry<C, A, S> = C & A & S & IReduxEntry;

function makeFeatureEntry<C extends Containers<C>, A extends ActionCreators<A>, S extends Selectors<S>>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<ICPart<C>, IAPart<A>, ISPart<S>>;

function makeFeatureEntry<C extends Containers<C>, A extends ActionCreators<A>, S extends null>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<ICPart<C>, IAPart<A>, {}>;

function makeFeatureEntry<C extends Containers<C>, A extends null, S extends Selectors<S>>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<ICPart<C>, {}, ISPart<S>>;

function makeFeatureEntry<C extends Containers<C>, A extends null, S extends null>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<ICPart<C>, {}, {}>;

function makeFeatureEntry<C extends null, A extends ActionCreators<A>, S extends Selectors<S>>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<{}, IAPart<A>, ISPart<S>>;

function makeFeatureEntry<C extends null, A extends ActionCreators<A>, S extends null>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<{}, IAPart<A>, {}>;

function makeFeatureEntry<C extends null, A extends null, S extends Selectors<S>>(
  containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<{}, {}, ISPart<S>>;

// function getFeatureEntry<C extends null, A extends null, S extends null>(
//   containers: C, actions: A, selectors: S, redux?: IReduxEntry): ResultEntry<{}, {}, {}>;

function makeFeatureEntry(
  containers: Containers<any> | null,
  actions: ActionCreators<any> | null,
  selectors: Selectors<any> | null,
  redux?: IReduxEntry,
) {
  return { actions, selectors, containers, ...redux };
}

export default makeFeatureEntry;
