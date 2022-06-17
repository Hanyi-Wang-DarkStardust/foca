import React, { ReactNode, FC, useState, useEffect } from 'react';
import { modelStore } from '../store/modelStore';
import { isFunction } from '../utils/isType';

export interface PersistGateProps {
  loading?: ReactNode;
  children?: ReactNode | ((isReady: boolean) => ReactNode);
}

export const PersistGate: FC<PersistGateProps> = (props) => {
  const [isReady, setIsReady] = useState(() => modelStore.isReady);
  const { loading = null, children } = props;

  useEffect(() => {
    isReady ||
      modelStore.onInitialized().then(() => {
        setIsReady(true);
      });
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    if (loading && isFunction(children)) {
      console.error('[PersistGate] 当前children为函数类型，loading属性无效');
    }
  }

  return (
    <>
      {isFunction(children) ? children(isReady) : isReady ? children : loading}
    </>
  );
};
