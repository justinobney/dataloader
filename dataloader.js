import { Promise } from 'es6-promise';

const defaultIdFn = x => x.id;

export default function Loader(
  createFn,
  {wait = 5, mapKeyFn = defaultIdFn, limit = -1} = {}
){
  const queuedKeys = [];
  queuedKeys._map = {};

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

  return {
    load(key){
      if(!queuedKeys._map[key]){
        queuedKeys._map[key] = getResolvablePromise();
        queuedKeys.push(key);

        if(limit && queuedKeys.length == limit){
          deferredCall.cancel();
          action();
        } else {
          deferredCall();
        }
      }

      return queuedKeys._map[key];
    },
    clear(key){
      if(key){
        delete queuedKeys._map[key];
      }
      else{
        queuedKeys._map = {};
      }
    },
    flush(){
      deferredCall.cancel();
      action();
    }
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
	let timeout;

  fn.cancel = () => clearTimeout(timeout);
	return fn;

  function fn() {
		let context = this, args = arguments;
		let later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		let callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};