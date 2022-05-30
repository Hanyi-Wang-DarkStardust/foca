import { store } from '../src';
import { DestroyLodingAction, DESTROY_LOADING } from '../src/actions/loading';
import { loadingStore } from '../src/store/loadingStore';
import { basicModel } from './models/basicModel';
import { complexModel } from './models/complexModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('dispatch the same state should be intercepted', () => {
  const fn = vitest.fn();
  const unsubscribe = store.subscribe(fn);

  expect(fn).toHaveBeenCalledTimes(0);
  basicModel.set(100);
  expect(fn).toHaveBeenCalledTimes(1);
  basicModel.set(100);
  basicModel.set(100);
  expect(fn).toHaveBeenCalledTimes(1);
  basicModel.set(101);
  expect(fn).toHaveBeenCalledTimes(2);

  complexModel.deleteUser(30);
  complexModel.deleteUser(34);
  expect(fn).toHaveBeenCalledTimes(2);

  complexModel.addUser(5, 'L');
  expect(fn).toHaveBeenCalledTimes(3);
  complexModel.addUser(5, 'L');
  expect(fn).toHaveBeenCalledTimes(3);
  complexModel.addUser(5, 'LT');
  expect(fn).toHaveBeenCalledTimes(4);

  unsubscribe();
  fn.mockRestore();
});

test('dispatch the same loading should be intercepted', async () => {
  const fn = vitest.fn();
  const unsubscribe = loadingStore.subscribe(fn);

  loadingStore.inactivate(basicModel.name, 'pureAsync');

  expect(fn).toHaveBeenCalledTimes(0);
  await basicModel.pureAsync();
  await basicModel.pureAsync();
  expect(fn).toHaveBeenCalledTimes(0);

  loadingStore.activate(basicModel.name, 'pureAsync');

  await basicModel.pureAsync();
  expect(fn).toHaveBeenCalledTimes(2);
  await basicModel.pureAsync();
  await basicModel.pureAsync();
  expect(fn).toHaveBeenCalledTimes(6);
  await Promise.all([basicModel.pureAsync(), basicModel.pureAsync()]);
  expect(fn).toHaveBeenCalledTimes(8);

  unsubscribe();
  fn.mockRestore();
});

test('destroy model will not trigger reducer without effect called', () => {
  const spy = vitest.fn();
  loadingStore.subscribe(spy);
  loadingStore.dispatch<DestroyLodingAction>({
    type: DESTROY_LOADING,
    model: basicModel.name,
  });
  expect(spy).toBeCalledTimes(0);
  spy.mockRestore();
});

test('destroy model will trigger reducer with effect called', async () => {
  await basicModel.pureAsync();
  const spy = vitest.fn();
  loadingStore.subscribe(spy);
  loadingStore.dispatch<DestroyLodingAction>({
    type: DESTROY_LOADING,
    model: basicModel.name,
  });
  expect(spy).toBeCalledTimes(1);
  spy.mockRestore();
});
