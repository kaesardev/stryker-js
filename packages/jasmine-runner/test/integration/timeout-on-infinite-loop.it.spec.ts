import { testInjector, factory, assertions } from '@stryker-mutator/test-helpers';
import { expect } from 'chai';

import { createJasmineTestRunnerFactory, JasmineTestRunner } from '../../src';
import { resolveFromRoot, resolveTestResource } from '../helpers/resolve-test-resource';

describe('Infinite loop', () => {
  let sut: JasmineTestRunner;

  beforeEach(async () => {
    process.chdir(resolveTestResource('infinite-loop-instrumented'));
    sut = testInjector.injector.injectFunction(createJasmineTestRunnerFactory('__stryker2__'));
  });
  afterEach(async () => {
    process.chdir(resolveFromRoot());
    await sut.dispose();
  });

  it('should be able to recover using a hit counter', async () => {
    // Arrange
    const options = factory.mutantRunOptions({
      activeMutant: factory.mutant({ id: '19' }),
      testFilter: ['spec2'],
      hitLimit: 10,
    });

    // Act
    const result = await sut.mutantRun(options);

    // Assert
    assertions.expectTimeout(result);
    expect(result.reason).contains('Hit limit reached');
  });

  it('should reset hit counter state correctly between runs', async () => {
    const firstResult = await sut.mutantRun(
      factory.mutantRunOptions({
        activeMutant: factory.mutant({ id: '19' }),
        testFilter: ['spec2'],
        hitLimit: 10,
      })
    );
    const secondResult = await sut.mutantRun(
      factory.mutantRunOptions({
        // 22 is a 'normal' mutant that should be killed
        activeMutant: factory.mutant({ id: '22' }),
        testFilter: ['spec2'],
        hitLimit: 10,
      })
    );

    // Assert
    assertions.expectTimeout(firstResult);
    assertions.expectKilled(secondResult);
  });
});
