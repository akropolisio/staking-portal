import React from 'react';
import { renderToString } from 'react-dom/server';
import { Observable, from, fromEventPattern, defer, ReplaySubject, combineLatest } from 'rxjs';
import { switchMap, retry, map } from 'rxjs/operators';
import BN from 'bn.js';
import { identity } from 'ramda';
import { ApiRx } from '@polkadot/api';
import { DerivedSessionInfo, DerivedFees, DerivedBalances, DerivedRecentlyOffline } from '@polkadot/api-derive/types';
import { web3Enable, web3AccountsSubscribe } from '@polkadot/extension-dapp';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import Link from '@material-ui/core/Link';

import { SUBSTRATE_CHROME_EXTENSION_URL, SUBSTRATE_FIREFOX_EXTENSION_URL } from 'core/constants';
import { ITranslateKey, tKeys } from 'services/i18n';
import { memoize, delay } from 'shared/helpers';
import { TranslatableError } from 'shared/errors';

import { callPolkaApi } from './callPolkaApi';
import { IStakingLedger, IDerivedStaking, IChainProperties } from './callPolkaApi/types';
import { ExtrinsicApi, ISubmittedExtrinsic, Payee } from './ExtrinsicApi';

export class Api {
  private _extrinsicApi = new ExtrinsicApi(this._substrateApi);
  constructor(private _substrateApi: Observable<ApiRx>) {}

  public getExtrinsic$(): Observable<ISubmittedExtrinsic> {
    return this._extrinsicApi.getExtrinsic$();
  }

  public async createStake(fromAddress: string, value: BN): Promise<void> {
    await this._extrinsicApi.handleExtrinsicSending(fromAddress, 'staking.bond', {
      controller: fromAddress,
      payee: Payee.staked,
      value,
    });
  }

  public async depositToStake(fromAddress: string, maxAdditionalValue: BN): Promise<void> {
    await this._extrinsicApi.handleExtrinsicSending(fromAddress, 'staking.bondExtra', {
      maxAdditionalValue,
    });
  }

  public async withdrawFromStake(fromAddress: string, amount: BN): Promise<void> {
    await this._extrinsicApi.handleExtrinsicSending(fromAddress, 'staking.unbond', {
      value: amount,
    });
  }

  public async editNominees(fromAddress: string, nextNominees: string[]): Promise<void> {
    await this._extrinsicApi.handleExtrinsicSending(fromAddress, 'staking.nominate', {
      nextNominees,
    });
  }

  public async stopNominating(fromAddress: string): Promise<void> {
    await this._extrinsicApi.handleExtrinsicSending(fromAddress, 'staking.chill');
  }

  public async redeem(fromAddress: string): Promise<void> {
    await this._extrinsicApi.handleExtrinsicSending(fromAddress, 'staking.withdrawUnbonded');
  }

  // TODO need to update stream after stopNominating
  @memoize()
  public getValidators$(): Observable<string[]> {
    // TODO Need to rewrite this after migrating to Substrate v2.
    // In Substrate v2, `query.session.validators` returns an array of stash addresses
    return callPolkaApi(this._substrateApi, 'query.session.validators').pipe(
      switchMap(validatorControllers =>
        combineLatest(validatorControllers.map(controller => this.getStakingLedger$(controller))),
      ),
      map(ledgers => ledgers.filter((ledger): ledger is IStakingLedger => !!ledger).map(ledger => ledger.stash)),
    );
  }

  @memoize()
  public checkStakeExisting$(controllerAddress: string): Observable<boolean> {
    return this.getStakingLedger$(controllerAddress).pipe(map(ledger => !!ledger));
  }

  @memoize(identity)
  public getStakingLedger$(controllerAddress: string): Observable<IStakingLedger | null> {
    return callPolkaApi(this._substrateApi, 'query.staking.ledger', controllerAddress);
  }

  @memoize(identity)
  public getStakingInfo$(stashAddress: string): Observable<IDerivedStaking> {
    return callPolkaApi(this._substrateApi, 'derive.staking.info', stashAddress);
  }

  @memoize(identity)
  public getStakeNominators$(stashAddress: string): Observable<string[]> {
    return callPolkaApi(this._substrateApi, 'query.staking.nominators', stashAddress);
  }

  @memoize(identity)
  public getFeesInfo$(stashAddress: string): Observable<DerivedFees> {
    return callPolkaApi(this._substrateApi, 'derive.balances.fees', stashAddress);
  }

  @memoize(identity)
  public getBalanceInfo$(stashAddress: string): Observable<DerivedBalances> {
    return callPolkaApi(this._substrateApi, 'derive.balances.all', stashAddress);
  }

  @memoize(identity)
  public getChainProps$(): Observable<IChainProperties> {
    return callPolkaApi(this._substrateApi, 'rpc.system.properties');
  }

  @memoize()
  public getSessionInfo$(): Observable<DerivedSessionInfo> {
    return callPolkaApi(this._substrateApi, 'derive.session.info');
  }

  @memoize()
  public getValidatorOfflineInfo$(): Observable<DerivedRecentlyOffline> {
    return callPolkaApi(this._substrateApi, 'derive.staking.recentlyOffline');
  }

  @memoize()
  public getSubstrateAccounts$(): Observable<InjectedAccountWithMeta[]> {
    const accounts$ = new ReplaySubject<InjectedAccountWithMeta[]>();

    defer(() =>
      from(
        (async () => {
          const injected = await web3Enable('Akropolis Staking Portal');
          if (!injected.length) {
            await delay(1000);
          }
          return injected;
        })(),
      ),
    )
      .pipe(
        switchMap(injectedExtensions =>
          injectedExtensions.length
            ? fromEventPattern<InjectedAccountWithMeta[]>(
                emitter => web3AccountsSubscribe(emitter),
                (_, signal: ReturnType<typeof web3AccountsSubscribe>) => signal.then(unsubscribe => unsubscribe()),
              )
            : new Observable<InjectedAccountWithMeta[]>(subscriber => {
                const error: ITranslateKey = {
                  key: tKeys.shared.notFoundExtension.getKey(),
                  params: {
                    chromeLink: renderToString(
                      <Link target="_blank" rel="noopener noreferrer" href={SUBSTRATE_CHROME_EXTENSION_URL}>
                        Chrome
                      </Link>,
                    ),
                    firefoxLink: renderToString(
                      <Link target="_blank" rel="noopener noreferrer" href={SUBSTRATE_FIREFOX_EXTENSION_URL}>
                        Firefox
                      </Link>,
                    ),
                  },
                };

                subscriber.error(new TranslatableError(error));
              }),
        ),
        retry(3),
      )
      .subscribe(accounts$);

    return accounts$;
  }

  @memoize()
  public getTotalBalanceInfo$(): Observable<{ totalBalance: BN; totalBonded: BN }> {
    return this.getSubstrateAccounts$().pipe(
      switchMap(accounts =>
        combineLatest(
          accounts.map(account => {
            const balanceInfo$ = this.getBalanceInfo$(account.address);
            const stakingInfo$ = this.getStakingInfo$(account.address);

            return combineLatest([balanceInfo$, stakingInfo$]).pipe(
              map(([balanceInfo, stakingInfo]) => ({ balanceInfo, stakingInfo })),
            );
          }),
        ),
      ),
      map(allInfos =>
        allInfos.reduce(
          (acc, { balanceInfo, stakingInfo }) => ({
            totalBalance: acc.totalBalance.add(balanceInfo.availableBalance),
            totalBonded: acc.totalBonded.add(stakingInfo.stakingLedger ? stakingInfo.stakingLedger.active : new BN(0)),
          }),
          {
            totalBalance: new BN(0),
            totalBonded: new BN(0),
          },
        ),
      ),
    );
  }
}
