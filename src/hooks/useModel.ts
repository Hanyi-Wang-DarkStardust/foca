import isEqual from 'lodash.isequal';
import { shallowEqual } from 'react-redux';
import { Model } from '../model/defineModel';
import { useCustomSelector } from './useCustomSelector';

/**
 * hooks新旧数据的对比方式：
 *
 * - `deepEqual`     深度对比，对比所有层级的内容。传递selector时默认使用。
 * - `shallowEqual`  浅对比，只比较对象第一层。传递多个模型但没有selector时默认使用。
 * - `strictEqual`   全等（===）对比。只传一个模型但没有selector时默认使用。
 */
export type CompareType = 'strictEqual' | 'shallowEqual' | 'deepEqual';

/**
 * * 获取模型的状态数据。
 * * 传入一个模型时，将返回该模型的状态。
 * * 传入多个模型时，则返回一个以模型名称为key、状态为value的大对象。
 * * 最后一个参数如果是**函数**，则为状态过滤函数，过滤函数的结果视为最终返回值。
 */
export function useModel<State extends object>(
  model: Model<string, State>,
  compare?: CompareType,
): State;
export function useModel<State extends object, T>(
  model: Model<any, State>,
  selector: (state: State) => T,
  compare?: CompareType,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  compare?: CompareType,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
};
export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  T,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  selector: (state1: State1, state2: State2) => T,
  compare?: CompareType,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  compare?: CompareType,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
};
export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  T,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  selector: (state1: State1, state2: State2, state3: State3) => T,
  compare?: CompareType,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  model4: Model<Name4, State4>,
  compare?: CompareType,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
} & {
  [K in Name4]: State4;
};
export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
  T,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  model4: Model<Name4, State4>,
  selector: (
    state1: State1,
    state2: State2,
    state3: State3,
    state4: State4,
  ) => T,
  compare?: CompareType,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
  Name5 extends string,
  State5 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  model4: Model<Name4, State4>,
  model5: Model<Name5, State5>,
  compare?: CompareType,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
} & {
  [K in Name4]: State4;
} & {
  [K in Name5]: State5;
};
export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
  Name5 extends string,
  State5 extends object,
  T,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  model4: Model<Name4, State4>,
  model5: Model<Name5, State5>,
  selector: (
    state1: State1,
    state2: State2,
    state3: State3,
    state4: State4,
    state5: State5,
  ) => T,
  compare?: CompareType,
): T;

export function useModel(): any {
  const args = slice.call(arguments);
  let compareType: CompareType | false =
    getLastElementType(args) === 'string' && args.pop();
  const selector: Function | false =
    getLastElementType(args) === 'function' && args.pop();
  const models: Model<any, any>[] = args;

  if (!compareType) {
    if (selector) {
      // 返回子集或者计算过的内容，数据量相对较少。
      compareType = 'deepEqual';
    } else if (models.length > 1) {
      // { key => model } 集合。
      compareType = 'shallowEqual';
    } else {
      // 一个model属于一个reducer，reducer已经使用了深对比来判断是否变化，
      // 所以使用时只需要全等判断。
      compareType = 'strictEqual';
    }
  }

  return useCustomSelector((state: Record<string, object>) => {
    if (selector) {
      const result: object[] = [];
      for (let i = 0; i < models.length; ++i) {
        result.push(state[models[i]!.name]!);
      }
      return selector.apply(null, result);
    }

    if (models.length === 1) {
      return state[models[0]!.name];
    }

    const result: typeof state = {};
    for (let i = 0; i < models.length; ++i) {
      const reducerName = models[i]!.name;
      result[reducerName] = state[reducerName]!;
    }
    return result;
  }, compareFn[compareType]);
}

const compareFn: Record<
  CompareType,
  undefined | ((previous: any, next: any) => boolean)
> = {
  deepEqual: isEqual,
  shallowEqual: shallowEqual,
  strictEqual: void 0,
};

const slice = Array.prototype.slice;

const getLastElementType = (args: any[]) => {
  return args.length > 1 && typeof args[args.length - 1];
};
