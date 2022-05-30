import { act, render } from '@testing-library/react';
import React from 'react';
import { useEffect, useState } from 'react';
import sleep from 'sleep-promise';
import {
  cloneModel,
  defineModel,
  FocaProvider,
  store,
  useLoading,
  useDefinedModel,
  useModel,
  Model,
  HookModel,
} from '../src';
import { loadingStore } from '../src/store/loadingStore';
import { renderHook } from './helpers/renderHook';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

['development', 'production'].forEach((env) => {
  describe(`[${env} mode]`, () => {
    beforeEach(() => {
      process.env.NODE_ENV = env;
    });

    afterEach(() => {
      process.env.NODE_ENV = 'testing';
    });

    test('can register to modelStore and remove from modelStore', async () => {
      const { result, unmount } = renderHook(
        () => useDefinedModel(basicModel),
        {
          wrapper: FocaProvider,
        },
      );

      expect(result.current).not.toBe(basicModel);
      expect(store.getState()).toHaveProperty(
        result.current.name,
        result.current.state,
      );

      unmount();
      await sleep(1);
      expect(store.getState()).not.toHaveProperty(result.current.name);
    });

    test('can register to loadingStore and remove from loadingStore', async () => {
      const { result, unmount } = renderHook(
        () => {
          const model = useDefinedModel(basicModel);
          useLoading(basicModel.pureAsync);
          useLoading(model.pureAsync);

          return model;
        },
        {
          wrapper: FocaProvider,
        },
      );

      const key1 = `${result.current.name}.pureAsync`;
      const key2 = `${basicModel.name}.pureAsync`;
      expect(loadingStore.getState()).not.toHaveProperty(key1);

      await act(async () => {
        const promise1 = result.current.pureAsync();
        const promise2 = basicModel.pureAsync();

        expect(loadingStore.getState()).toHaveProperty(key1);
        expect(loadingStore.getState()).toHaveProperty(key2);

        await promise1;
        await promise2;
      });

      expect(loadingStore.getState()).toHaveProperty(key1);
      expect(loadingStore.getState()).toHaveProperty(key2);

      unmount();
      await sleep(1);
      expect(loadingStore.getState()).not.toHaveProperty(key1);
      expect(loadingStore.getState()).toHaveProperty(key2);
    });

    test('call onDestroy event when local model is destroyed', async () => {
      const spy = vitest.fn();
      const globalModel = defineModel('local-demo-1', {
        initialState: {},
        events: {
          onDestroy: spy,
        },
      });

      const { unmount } = renderHook(() => useDefinedModel(globalModel), {
        wrapper: FocaProvider,
      });

      expect(spy).toBeCalledTimes(0);
      unmount();
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
      basicModel.plus(1);
      expect(spy).toBeCalledTimes(1);
    });

    test('recreate hook model when global model changed', async () => {
      const globalModel = defineModel('hook-demo-2', {
        initialState: {},
      });

      const { result } = renderHook(
        () => {
          const [state, setState] = useState<Model>(basicModel);

          const model = useDefinedModel(state);

          useEffect(() => {
            setTimeout(() => {
              setState(globalModel);
            }, 20);
          }, []);

          return model;
        },
        {
          wrapper: FocaProvider,
        },
      );

      const name1 = result.current.name;
      expect(name1).toMatch(basicModel.name);
      expect(store.getState()).toHaveProperty(name1);

      await act(async () => {
        await sleep(30);
      });

      await sleep(10);

      expect(result.current.name).not.toBe('hook-demo-2');
      expect(result.current.name).toMatch('hook-demo-2');
      expect(store.getState()).not.toHaveProperty(name1);
    });
  });
});

test('Can get component name in dev mode', () => {
  let model!: HookModel;
  function MyApp() {
    model = useDefinedModel(basicModel);
    return null;
  }

  render(
    <FocaProvider>
      <MyApp />
    </FocaProvider>,
  );

  expect(model.name).toMatch('MyApp:');
});

test.skip('Type checking', () => {
  const hookModel = useDefinedModel(basicModel);

  useModel(hookModel);
  useModel(hookModel, (state) => state.count);
  useLoading(hookModel.pureAsync);
  useLoading(hookModel.pureAsync.room);

  // @ts-expect-error
  useModel(basicModel, hookModel);
  // @ts-expect-error
  useModel(hookModel, basicModel);
  // @ts-expect-error
  useModel(hookModel, basicModel, () => {});

  // @ts-expect-error
  useDefinedModel(hookModel);
  // @ts-expect-error
  cloneModel(hookModel);

  defineModel('local-demo-1', {
    initialState: {},
    events: {
      onDestroy() {
        // @ts-expect-error
        this.anything;
      },
    },
  });
});
