const defaultIdFn = x => x.id;

export default function Loader(createFn, {wait, mapKeyFn} = {}){
  wait = wait || 5;
  mapKeyFn = mapKeyFn || defaultIdFn;

  const deferredCall = debounce(() => {
    const args = [...queuedKeys];
    const map = queuedKeys._map;

    queuedKeys.length = 0;
    queuedKeys._map = {};

    console.log('api call', args);

    return createFn(args).then(resp => {
      resp.forEach(
        x => map[mapKeyFn(x)].resolve(x)
      );
    });

  }, wait);

  const queuedKeys = [];
  queuedKeys._map = {};
  return {
    load(key){
      if(!queuedKeys._map[key]){
        queuedKeys.push(key);
        queuedKeys._map[key] = getResolvablePromise();
      }

      const result = queuedKeys._map[key];

      deferredCall();

      return result;
    },
    clear(key){}
  }
}

function getResolvablePromise(){
  let resolve;
  let reject;

  const p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  p.resolve = (val) => resolve(val);
  p.reject = (val) => reject(val);

  return p;
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};
