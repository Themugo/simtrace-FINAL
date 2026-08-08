import React, { useState, useEffect } from 'react';

export default function dynamic(loader: () => Promise<any>, _options?: any) {
  return function DynamicComponent(props: any) {
    const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
      let isMounted = true;
      loader().then((mod) => {
        if (isMounted) setComp(() => mod.default || mod);
      }).catch(console.error);
      return () => { isMounted = false; };
    }, []);

    if (!Comp) return null;
    return <Comp {...props} />;
  };
}
