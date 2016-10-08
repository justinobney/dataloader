# dataloader clone

* inspired from facebook/dataloader.
* intended for use in browser applications.

## Ex

```
// fake api call accepting [...keys]
function getData(keys) {
  return Promise.resolve(
    keys.map(x => ({ id:x, prop: `foo prop ${x}`}))
  );
}

// creation
const loader = new Loader(keys => getData(keys), opts?);

// use
loader.load(1)

// later in code...
loader.load(2)

// ex: React rendering a list of containers passing in only id's.
// containers then call load in cwm
// resulting in batched/cached api calls


// calls within ~5ms get batched
// resulting in getData([1,2])
```

each call to `loader.load(key)` returns a promise that will resolve
with the single object loading.

## creation options

* `wait`: the number `ms` to collect for batchning (default: 5)
* `mapKeyFn`: fn to get key for caching (default: `x=>x.id`)
* `limit`: max queue size before flushing batch (default: infinite)