import { Promise } from 'es6-promise';

const DEFAULT_MAP_ID = x => x.id;

export default function Loader(
  batchCall,
  {wait = 5, mapKeyFn = DEFAULT_MAP_ID, limit = -1} = {}
) {
  let cache = {};
  const queuedKeys = [];

  const processBatch = () => {
    const args = [...queuedKeys];

    queuedKeys.length = 0;

    return batchCall(args).then(
      resp => resp.forEach(x =>
        cache[mapKeyFn(x)].resolve(x)
      ),
      error => args.forEach(x =>
        cache[x].reject(new Error('batch call failed'))
      )
    );
  };

  const debouncedProcessBatch = debounce(processBatch, wait);

  return {
    load(key) {
      if (!cache[key]) {
        cache[key] = getResolvablePromise();
        queuedKeys.push(key);

        if(limit && queuedKeys.length == limit) {
          debouncedProcessBatch.cancel();
          processBatch();
        } else {
          debouncedProcessBatch();
        }
      }

      return cache[key];
    },
    clear(key) {
      if (key) {
        delete cache[key];
      } else {
        cache = {};
      }
    },
    flush() {
      debouncedProcessBatch.cancel();
      processBatch();
    }
  }
}

function getResolvablePromise() {
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
		let callNow = immediate && !timeout;

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) {
      func.apply(context, args);
    }

    function later() {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    }
	};
};