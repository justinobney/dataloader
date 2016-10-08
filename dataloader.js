import { Promise } from 'es6-promise';

const defaultIdFn = x => x.id;

export default function Loader(createFn, {wait, mapKeyFn, limit} = {}){
  wait = wait || 5;
  mapKeyFn = mapKeyFn || defaultIdFn;
  limit = limit || -1;

  const action = () => {
    const args = [...queuedKeys];
    const map = queuedKeys._map;

    queuedKeys.length = 0;

    return createFn(args).then(resp => {
      resp.forEach(
        x => map[mapKeyFn(x)].resolve(x)
      );
    });
  };

  const deferredCall = debounce(action, wait);
  const queuedKeys = [];
  queuedKeys._map = {};
  return {
    load(key){
      if(!queuedKeys._map[key]){
        queuedKeys.push(key);
        queuedKeys._map[key] = getResolvablePromise();

        limit && queuedKeys.length == limit
          ? action()
          : deferredCall();
      }

      return queuedKeys._map[key];
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